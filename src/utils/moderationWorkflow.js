/**
 * Moderation Workflow Utilities
 * Handles the complete moderation workflow from content submission to final decision
 */

import { moderationService } from '../services/moderationService.js';
import { videoModerationPipeline } from '../services/videoModerationPipeline.js';
import { moderateComment } from '../utils/commentModeration.js';
import { moderationDB, createModerationResult, createQueueItem, createAdminAction } from '../data/moderationSchema.js';

// Workflow configuration
export const WORKFLOW_CONFIG = {
  AUTO_APPROVAL_THRESHOLD: 0.1,
  AUTO_REJECTION_THRESHOLD: 0.8,
  ESCALATION_THRESHOLD: 0.95,
  MAX_PROCESSING_TIME: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  NOTIFICATION_DELAYS: {
    IMMEDIATE: 0,
    DELAYED: 300000, // 5 minutes
    BATCH: 3600000   // 1 hour
  }
};

/**
 * Complete moderation workflow orchestrator
 */
export class ModerationWorkflow {
  constructor() {
    this.activeWorkflows = new Map();
    this.workflowStats = {
      totalProcessed: 0,
      averageTime: 0,
      successRate: 0
    };
  }

  /**
   * Process content through complete moderation workflow
   * @param {Object} content - Content to moderate
   * @param {Object} options - Workflow options
   * @returns {Promise<Object>} Workflow result
   */
  async processContent(content, options = {}) {
    const workflowId = `workflow_${content.type}_${content.id}_${Date.now()}`;
    const startTime = Date.now();

    try {
      // Initialize workflow tracking
      this.activeWorkflows.set(workflowId, {
        contentType: content.type,
        contentId: content.id,
        status: 'started',
        startTime,
        steps: []
      });

      // Step 1: Content validation and preprocessing
      await this.addWorkflowStep(workflowId, 'validation', 'Validating content');
      const validationResult = await this.validateContent(content);
      
      if (!validationResult.valid) {
        return await this.completeWorkflow(workflowId, 'validation_failed', validationResult);
      }

      // Step 2: Automated moderation analysis
      await this.addWorkflowStep(workflowId, 'analysis', 'Performing AI analysis');
      const moderationResult = await this.performModerationAnalysis(content, options);

      // Step 3: Decision routing
      await this.addWorkflowStep(workflowId, 'routing', 'Determining workflow path');
      const routingDecision = this.determineWorkflowPath(moderationResult, content);

      // Step 4: Execute workflow path
      let finalResult;
      switch (routingDecision.path) {
        case 'auto_approve':
          finalResult = await this.executeAutoApproval(workflowId, moderationResult, content);
          break;
        case 'auto_reject':
          finalResult = await this.executeAutoRejection(workflowId, moderationResult, content);
          break;
        case 'manual_review':
          finalResult = await this.executeManualReview(workflowId, moderationResult, content);
          break;
        case 'escalation':
          finalResult = await this.executeEscalation(workflowId, moderationResult, content);
          break;
        default:
          throw new Error(`Unknown workflow path: ${routingDecision.path}`);
      }

      // Step 5: Post-processing and notifications
      await this.addWorkflowStep(workflowId, 'post_processing', 'Finalizing workflow');
      await this.executePostProcessing(finalResult, content, options);

      return await this.completeWorkflow(workflowId, 'completed', finalResult);

    } catch (error) {
      console.error('Workflow processing failed:', error);
      return await this.completeWorkflow(workflowId, 'failed', { error: error.message });
    }
  }

  /**
   * Validate content before processing
   * @param {Object} content - Content to validate
   * @returns {Object} Validation result
   */
  async validateContent(content) {
    const errors = [];

    // Check required fields
    if (!content.type) errors.push('Content type is required');
    if (!content.id) errors.push('Content ID is required');

    // Type-specific validation
    if (content.type === 'video') {
      if (!content.title) errors.push('Video title is required');
      if (!content.duration) errors.push('Video duration is required');
    } else if (content.type === 'comment') {
      if (!content.text || content.text.trim().length === 0) {
        errors.push('Comment text is required');
      }
      if (content.text && content.text.length > 5000) {
        errors.push('Comment text exceeds maximum length');
      }
    }

    // Check for duplicate processing
    const existingResult = moderationDB.getModerationResultsByContent(content.type, content.id);
    if (existingResult.length > 0) {
      const latestResult = existingResult[0];
      if (Date.now() - new Date(latestResult.timestamp).getTime() < 300000) { // 5 minutes
        errors.push('Content was recently processed');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform moderation analysis based on content type
   * @param {Object} content - Content to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Moderation result
   */
  async performModerationAnalysis(content, options) {
    switch (content.type) {
      case 'video':
        return await videoModerationPipeline.processVideo(content, options);
      case 'comment':
        return await moderateComment(content.text, content.context || {});
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
  }

  /**
   * Determine which workflow path to take
   * @param {Object} moderationResult - Moderation analysis result
   * @param {Object} content - Original content
   * @returns {Object} Routing decision
   */
  determineWorkflowPath(moderationResult, content) {
    const { confidence, flags, action } = moderationResult;

    // Check for escalation conditions
    if (confidence >= WORKFLOW_CONFIG.ESCALATION_THRESHOLD || 
        flags.includes('hate_speech') || 
        flags.includes('terrorism')) {
      return { path: 'escalation', reason: 'High-risk content requires escalation' };
    }

    // Check for auto-rejection
    if (confidence >= WORKFLOW_CONFIG.AUTO_REJECTION_THRESHOLD || 
        action === 'reject') {
      return { path: 'auto_reject', reason: 'High confidence violation detected' };
    }

    // Check for auto-approval
    if (confidence <= WORKFLOW_CONFIG.AUTO_APPROVAL_THRESHOLD && 
        flags.length === 0 && 
        action === 'approve') {
      return { path: 'auto_approve', reason: 'Low risk content with no flags' };
    }

    // Default to manual review
    return { path: 'manual_review', reason: 'Requires human judgment' };
  }

  /**
   * Execute auto-approval workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} moderationResult - Moderation result
   * @param {Object} content - Content
   * @returns {Promise<Object>} Final result
   */
  async executeAutoApproval(workflowId, moderationResult, content) {
    await this.addWorkflowStep(workflowId, 'auto_approval', 'Auto-approving content');

    const finalResult = {
      ...moderationResult,
      status: 'approved',
      workflowPath: 'auto_approval',
      approvedAt: new Date().toISOString(),
      approvedBy: 'system'
    };

    // Save result
    moderationDB.saveModerationResult(finalResult);

    // Update content status
    await this.updateContentStatus(content, 'approved');

    return finalResult;
  }

  /**
   * Execute auto-rejection workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} moderationResult - Moderation result
   * @param {Object} content - Content
   * @returns {Promise<Object>} Final result
   */
  async executeAutoRejection(workflowId, moderationResult, content) {
    await this.addWorkflowStep(workflowId, 'auto_rejection', 'Auto-rejecting content');

    const finalResult = {
      ...moderationResult,
      status: 'rejected',
      workflowPath: 'auto_rejection',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'system'
    };

    // Save result
    moderationDB.saveModerationResult(finalResult);

    // Update content status
    await this.updateContentStatus(content, 'rejected');

    // Schedule user notification
    await this.scheduleNotification(content, 'rejection', finalResult);

    return finalResult;
  }

  /**
   * Execute manual review workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} moderationResult - Moderation result
   * @param {Object} content - Content
   * @returns {Promise<Object>} Final result
   */
  async executeManualReview(workflowId, moderationResult, content) {
    await this.addWorkflowStep(workflowId, 'manual_review', 'Queuing for manual review');

    // Create queue item
    const queueItem = createQueueItem({
      contentType: content.type,
      contentId: content.id,
      priority: this.determinePriority(moderationResult),
      moderationResult,
      preview: this.createContentPreview(content)
    });

    moderationDB.addToQueue(queueItem);

    const finalResult = {
      ...moderationResult,
      status: 'manual_review',
      workflowPath: 'manual_review',
      queuedAt: new Date().toISOString(),
      queueItemId: queueItem.id
    };

    // Save result
    moderationDB.saveModerationResult(finalResult);

    // Update content status
    await this.updateContentStatus(content, 'pending_review');

    return finalResult;
  }

  /**
   * Execute escalation workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} moderationResult - Moderation result
   * @param {Object} content - Content
   * @returns {Promise<Object>} Final result
   */
  async executeEscalation(workflowId, moderationResult, content) {
    await this.addWorkflowStep(workflowId, 'escalation', 'Escalating to senior review');

    // Create high-priority queue item
    const queueItem = createQueueItem({
      contentType: content.type,
      contentId: content.id,
      priority: 'high',
      moderationResult,
      preview: this.createContentPreview(content),
      escalated: true,
      escalationReason: 'High-risk content requiring senior review'
    });

    moderationDB.addToQueue(queueItem);

    const finalResult = {
      ...moderationResult,
      status: 'escalated',
      workflowPath: 'escalation',
      escalatedAt: new Date().toISOString(),
      queueItemId: queueItem.id
    };

    // Save result
    moderationDB.saveModerationResult(finalResult);

    // Update content status
    await this.updateContentStatus(content, 'escalated');

    // Immediate notification to senior staff
    await this.scheduleNotification(content, 'escalation', finalResult, 'immediate');

    return finalResult;
  }

  /**
   * Execute post-processing tasks
   * @param {Object} result - Final moderation result
   * @param {Object} content - Original content
   * @param {Object} options - Processing options
   */
  async executePostProcessing(result, content, options) {
    // Update analytics
    await this.updateAnalytics(result, content);

    // Trigger webhooks if configured
    if (options.webhooks) {
      await this.triggerWebhooks(result, content, options.webhooks);
    }

    // Update user trust scores
    if (content.userId) {
      await this.updateUserTrustScore(content.userId, result);
    }

    // Log audit trail
    await this.logAuditTrail(result, content);
  }

  /**
   * Add a step to workflow tracking
   * @param {string} workflowId - Workflow ID
   * @param {string} stepName - Step name
   * @param {string} description - Step description
   */
  async addWorkflowStep(workflowId, stepName, description) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      workflow.steps.push({
        name: stepName,
        description,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      workflow.status = stepName;
      this.activeWorkflows.set(workflowId, workflow);
    }
  }

  /**
   * Complete workflow and cleanup
   * @param {string} workflowId - Workflow ID
   * @param {string} status - Final status
   * @param {Object} result - Final result
   * @returns {Object} Workflow summary
   */
  async completeWorkflow(workflowId, status, result) {
    const workflow = this.activeWorkflows.get(workflowId);
    if (workflow) {
      const endTime = Date.now();
      const processingTime = endTime - workflow.startTime;

      const workflowSummary = {
        workflowId,
        status,
        processingTime,
        steps: workflow.steps,
        result,
        completedAt: new Date().toISOString()
      };

      // Update stats
      this.updateWorkflowStats(processingTime, status === 'completed');

      // Cleanup
      this.activeWorkflows.delete(workflowId);

      return workflowSummary;
    }

    return { workflowId, status, result };
  }

  /**
   * Determine queue priority based on moderation result
   * @param {Object} moderationResult - Moderation result
   * @returns {string} Priority level
   */
  determinePriority(moderationResult) {
    if (moderationResult.confidence > 0.8 || 
        moderationResult.flags.includes('hate_speech') ||
        moderationResult.flags.includes('harassment')) {
      return 'high';
    } else if (moderationResult.confidence > 0.5) {
      return 'normal';
    } else {
      return 'low';
    }
  }

  /**
   * Create content preview for queue display
   * @param {Object} content - Content object
   * @returns {Object} Preview object
   */
  createContentPreview(content) {
    if (content.type === 'video') {
      return {
        title: content.title || 'Untitled Video',
        thumbnail: content.previewThumbnail || '',
        snippet: content.description?.substring(0, 100) + '...' || '',
        duration: content.duration || '0:00'
      };
    } else if (content.type === 'comment') {
      return {
        title: 'User Comment',
        thumbnail: '',
        snippet: content.text?.substring(0, 100) + '...' || '',
        duration: ''
      };
    }
    return {};
  }

  /**
   * Update content status in content management system
   * @param {Object} content - Content object
   * @param {string} status - New status
   */
  async updateContentStatus(content, status) {
    // In production, this would update the content status in your CMS
    console.log(`Content ${content.id} status updated to: ${status}`);
  }

  /**
   * Schedule notification to user
   * @param {Object} content - Content object
   * @param {string} type - Notification type
   * @param {Object} result - Moderation result
   * @param {string} timing - Notification timing
   */
  async scheduleNotification(content, type, result, timing = 'delayed') {
    const delay = WORKFLOW_CONFIG.NOTIFICATION_DELAYS[timing.toUpperCase()] || 0;
    
    // In production, this would integrate with your notification service
    setTimeout(() => {
      console.log(`Notification scheduled for ${content.userId}: ${type}`, {
        contentId: content.id,
        result: result.action,
        timing
      });
    }, delay);
  }

  /**
   * Trigger configured webhooks
   * @param {Object} result - Moderation result
   * @param {Object} content - Content object
   * @param {Array} webhooks - Webhook configurations
   */
  async triggerWebhooks(result, content, webhooks) {
    for (const webhook of webhooks) {
      try {
        // In production, this would make HTTP requests to webhook URLs
        console.log(`Webhook triggered: ${webhook.url}`, {
          event: 'moderation_completed',
          content: content.id,
          result: result.action
        });
      } catch (error) {
        console.error(`Webhook failed: ${webhook.url}`, error);
      }
    }
  }

  /**
   * Update user trust score based on moderation result
   * @param {string} userId - User ID
   * @param {Object} result - Moderation result
   */
  async updateUserTrustScore(userId, result) {
    // In production, this would update user trust scores in your user management system
    const adjustment = result.action === 'approve' ? 0.01 : 
                      result.action === 'reject' ? -0.05 : 0;
    
    console.log(`User ${userId} trust score adjustment: ${adjustment}`);
  }

  /**
   * Update analytics data
   * @param {Object} result - Moderation result
   * @param {Object} content - Content object
   */
  async updateAnalytics(result, content) {
    // In production, this would update your analytics database
    console.log('Analytics updated:', {
      contentType: content.type,
      action: result.action,
      confidence: result.confidence,
      flags: result.flags.length
    });
  }

  /**
   * Log audit trail
   * @param {Object} result - Moderation result
   * @param {Object} content - Content object
   */
  async logAuditTrail(result, content) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      contentType: content.type,
      contentId: content.id,
      action: result.action,
      confidence: result.confidence,
      flags: result.flags,
      workflowPath: result.workflowPath
    };

    // In production, this would log to your audit system
    console.log('Audit trail logged:', auditEntry);
  }

  /**
   * Update workflow statistics
   * @param {number} processingTime - Processing time in milliseconds
   * @param {boolean} success - Whether workflow succeeded
   */
  updateWorkflowStats(processingTime, success) {
    this.workflowStats.totalProcessed++;
    
    // Update average processing time
    this.workflowStats.averageTime = (
      (this.workflowStats.averageTime * (this.workflowStats.totalProcessed - 1)) + processingTime
    ) / this.workflowStats.totalProcessed;
    
    // Update success rate
    const successCount = success ? 1 : 0;
    this.workflowStats.successRate = (
      (this.workflowStats.successRate * (this.workflowStats.totalProcessed - 1)) + successCount
    ) / this.workflowStats.totalProcessed;
  }

  /**
   * Get workflow statistics
   * @returns {Object} Workflow statistics
   */
  getWorkflowStats() {
    return {
      ...this.workflowStats,
      activeWorkflows: this.activeWorkflows.size
    };
  }

  /**
   * Get active workflows
   * @returns {Array} Active workflows
   */
  getActiveWorkflows() {
    return Array.from(this.activeWorkflows.values());
  }
}

// Export singleton instance
export const moderationWorkflow = new ModerationWorkflow();

/**
 * Convenience function to process content through workflow
 * @param {Object} content - Content to process
 * @param {Object} options - Workflow options
 * @returns {Promise<Object>} Workflow result
 */
export async function processContentWorkflow(content, options = {}) {
  return moderationWorkflow.processContent(content, options);
}

export default {
  ModerationWorkflow,
  moderationWorkflow,
  processContentWorkflow,
  WORKFLOW_CONFIG
};

