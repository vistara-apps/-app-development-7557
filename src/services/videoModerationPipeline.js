/**
 * Video Moderation Pipeline
 * Integrates with Livepeer service and provides automated video content analysis
 */

import { moderationService } from './moderationService.js';
import { processVideoAnalysis } from '../utils/videoAnalysis.js';
import { moderationDB, createModerationResult, createQueueItem } from '../data/moderationSchema.js';
import livepeerService from './livepeer.js';

// Pipeline configuration
const PIPELINE_CONFIG = {
  PROCESSING_TIMEOUT: 300000, // 5 minutes
  MAX_RETRIES: 3,
  BATCH_SIZE: 5,
  PRIORITY_WEIGHTS: {
    LIVE_STREAM: 1.0,
    PREMIUM_CONTENT: 0.8,
    REGULAR_UPLOAD: 0.6,
    BATCH_PROCESSING: 0.4
  }
};

/**
 * Video Moderation Pipeline Class
 */
export class VideoModerationPipeline {
  constructor() {
    this.processingQueue = new Map();
    this.isProcessing = false;
    this.stats = {
      totalProcessed: 0,
      totalApproved: 0,
      totalRejected: 0,
      totalFlagged: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Process a single video through the moderation pipeline
   * @param {Object} videoData - Video metadata and content
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Moderation result
   */
  async processVideo(videoData, options = {}) {
    const startTime = Date.now();
    const processingId = `video_${videoData.id}_${Date.now()}`;
    
    try {
      // Add to processing queue
      this.processingQueue.set(processingId, {
        videoData,
        options,
        startTime,
        status: 'queued'
      });

      // Update status
      this.updateProcessingStatus(processingId, 'analyzing');

      // Stage 1: Quick metadata analysis
      const metadataResult = await this.analyzeMetadata(videoData);
      
      // Stage 2: AI content analysis
      this.updateProcessingStatus(processingId, 'ai_analysis');
      const aiResult = await moderationService.analyzeVideo(videoData);
      
      // Stage 3: Deep video analysis (if needed)
      let deepAnalysisResult = null;
      if (aiResult.reviewRequired || metadataResult.requiresDeepAnalysis) {
        this.updateProcessingStatus(processingId, 'deep_analysis');
        deepAnalysisResult = await processVideoAnalysis(videoData, options);
      }

      // Stage 4: Aggregate results and make final decision
      this.updateProcessingStatus(processingId, 'finalizing');
      const finalResult = this.aggregateResults(
        metadataResult,
        aiResult,
        deepAnalysisResult,
        videoData
      );

      // Stage 5: Save results and handle workflow
      const moderationResult = await this.saveModerationResult(finalResult, videoData);
      await this.handleModerationWorkflow(moderationResult, videoData);

      // Update statistics
      this.updateStats(moderationResult, Date.now() - startTime);

      // Remove from processing queue
      this.processingQueue.delete(processingId);

      return moderationResult;

    } catch (error) {
      console.error('Video moderation pipeline failed:', error);
      
      // Create error result
      const errorResult = this.createErrorResult(videoData, error);
      await this.saveModerationResult(errorResult, videoData);
      
      this.processingQueue.delete(processingId);
      throw error;
    }
  }

  /**
   * Process multiple videos in batch
   * @param {Array} videos - Array of video data objects
   * @param {Object} options - Batch processing options
   * @returns {Promise<Array>} Array of moderation results
   */
  async processBatch(videos, options = {}) {
    const batchSize = options.batchSize || PIPELINE_CONFIG.BATCH_SIZE;
    const results = [];
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      
      const batchPromises = batch.map(video => 
        this.processVideo(video, { ...options, isBatch: true })
          .catch(error => ({ error: error.message, videoId: video.id }))
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ));
      
      // Add delay between batches to prevent rate limiting
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Get processing status for a video
   * @param {string} processingId - Processing ID
   * @returns {Object} Processing status
   */
  getProcessingStatus(processingId) {
    return this.processingQueue.get(processingId) || null;
  }

  /**
   * Get all currently processing videos
   * @returns {Array} Array of processing items
   */
  getCurrentlyProcessing() {
    return Array.from(this.processingQueue.values());
  }

  /**
   * Get pipeline statistics
   * @returns {Object} Pipeline statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentlyProcessing: this.processingQueue.size,
      isProcessing: this.isProcessing
    };
  }

  // Private methods

  /**
   * Analyze video metadata for initial screening
   * @param {Object} videoData - Video metadata
   * @returns {Object} Metadata analysis result
   */
  async analyzeMetadata(videoData) {
    // Import here to avoid circular dependency
    const { analyzeVideoMetadata } = await import('../utils/videoAnalysis.js');
    return analyzeVideoMetadata(videoData);
  }

  /**
   * Update processing status
   * @param {string} processingId - Processing ID
   * @param {string} status - New status
   */
  updateProcessingStatus(processingId, status) {
    const item = this.processingQueue.get(processingId);
    if (item) {
      item.status = status;
      item.lastUpdate = Date.now();
      this.processingQueue.set(processingId, item);
    }
  }

  /**
   * Aggregate all analysis results into final decision
   * @param {Object} metadataResult - Metadata analysis
   * @param {Object} aiResult - AI analysis
   * @param {Object} deepAnalysisResult - Deep analysis (optional)
   * @param {Object} videoData - Original video data
   * @returns {Object} Final moderation result
   */
  aggregateResults(metadataResult, aiResult, deepAnalysisResult, videoData) {
    let finalConfidence = aiResult.confidence;
    const allFlags = [...aiResult.flags];
    const reasoningParts = [aiResult.reasoning];

    // Weight metadata analysis
    if (metadataResult) {
      finalConfidence = (finalConfidence * 0.7) + (metadataResult.riskScore * 0.3);
      allFlags.push(...metadataResult.flags);
      reasoningParts.push(`Metadata risk score: ${metadataResult.riskScore.toFixed(2)}`);
    }

    // Weight deep analysis if available
    if (deepAnalysisResult && deepAnalysisResult.overallResult) {
      finalConfidence = (finalConfidence * 0.6) + (deepAnalysisResult.overallResult.confidence * 0.4);
      allFlags.push(...deepAnalysisResult.overallResult.flags);
      reasoningParts.push(`Deep analysis: ${deepAnalysisResult.overallResult.reasoning}`);
    }

    // Determine final action
    let action = 'approve';
    if (finalConfidence > 0.8 || allFlags.includes('hate_speech') || allFlags.includes('inappropriate_violence')) {
      action = 'reject';
    } else if (finalConfidence > 0.3 || allFlags.length > 2) {
      action = 'manual_review';
    }

    return {
      id: `mod_video_${videoData.id}_${Date.now()}`,
      contentType: 'video',
      contentId: videoData.id,
      confidence: Math.min(1, finalConfidence),
      action,
      flags: [...new Set(allFlags)], // Remove duplicates
      reasoning: reasoningParts.join('; '),
      reviewRequired: action === 'manual_review',
      timestamp: new Date().toISOString(),
      metadata: {
        title: videoData.title,
        category: videoData.category,
        duration: videoData.duration,
        organization: videoData.organization,
        combatSportsLegitimacy: metadataResult?.combatSportsLegitimacy || 0,
        processingStages: {
          metadata: !!metadataResult,
          aiAnalysis: !!aiResult,
          deepAnalysis: !!deepAnalysisResult
        }
      }
    };
  }

  /**
   * Save moderation result to database
   * @param {Object} result - Moderation result
   * @param {Object} videoData - Original video data
   * @returns {Object} Saved moderation result
   */
  async saveModerationResult(result, videoData) {
    const moderationResult = createModerationResult(result);
    return moderationDB.saveModerationResult(moderationResult);
  }

  /**
   * Handle post-moderation workflow
   * @param {Object} moderationResult - Moderation result
   * @param {Object} videoData - Original video data
   */
  async handleModerationWorkflow(moderationResult, videoData) {
    // Add to queue if manual review required
    if (moderationResult.reviewRequired) {
      const queueItem = createQueueItem({
        contentType: 'video',
        contentId: videoData.id,
        priority: this.determinePriority(moderationResult),
        moderationResult,
        preview: {
          title: videoData.title,
          thumbnail: videoData.previewThumbnail,
          snippet: videoData.description?.substring(0, 100) + '...',
          duration: videoData.duration
        }
      });
      
      moderationDB.addToQueue(queueItem);
    }

    // Update video status in Livepeer service
    await this.updateVideoStatus(videoData.id, moderationResult.action);

    // Trigger notifications if needed
    if (moderationResult.action === 'reject') {
      await this.notifyContentRejection(videoData, moderationResult);
    }
  }

  /**
   * Determine queue priority based on moderation result
   * @param {Object} moderationResult - Moderation result
   * @returns {string} Priority level
   */
  determinePriority(moderationResult) {
    if (moderationResult.confidence > 0.8 || moderationResult.flags.includes('hate_speech')) {
      return 'high';
    } else if (moderationResult.confidence > 0.5) {
      return 'normal';
    } else {
      return 'low';
    }
  }

  /**
   * Update video status in content management system
   * @param {string} videoId - Video ID
   * @param {string} action - Moderation action
   */
  async updateVideoStatus(videoId, action) {
    // In production, this would update the video status in the database
    // For demo purposes, we'll just log the action
    console.log(`Video ${videoId} status updated to: ${action}`);
    
    // You could integrate with your video management system here
    // await videoManagementService.updateStatus(videoId, action);
  }

  /**
   * Notify about content rejection
   * @param {Object} videoData - Video data
   * @param {Object} moderationResult - Moderation result
   */
  async notifyContentRejection(videoData, moderationResult) {
    // In production, this would send notifications to content creators
    console.log(`Content rejection notification for video: ${videoData.title}`);
    console.log(`Reason: ${moderationResult.reasoning}`);
    
    // You could integrate with notification service here
    // await notificationService.sendRejectionNotice(videoData.uploaderId, moderationResult);
  }

  /**
   * Create error result for failed processing
   * @param {Object} videoData - Video data
   * @param {Error} error - Error object
   * @returns {Object} Error result
   */
  createErrorResult(videoData, error) {
    return {
      id: `mod_error_${videoData.id}_${Date.now()}`,
      contentType: 'video',
      contentId: videoData.id,
      confidence: 0.5,
      action: 'manual_review',
      flags: ['processing_error'],
      reasoning: `Processing failed: ${error.message}`,
      reviewRequired: true,
      timestamp: new Date().toISOString(),
      error: true,
      metadata: {
        title: videoData.title,
        errorType: error.name,
        errorMessage: error.message
      }
    };
  }

  /**
   * Update pipeline statistics
   * @param {Object} result - Moderation result
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateStats(result, processingTime) {
    this.stats.totalProcessed++;
    
    switch (result.action) {
      case 'approve':
        this.stats.totalApproved++;
        break;
      case 'reject':
        this.stats.totalRejected++;
        break;
      case 'manual_review':
        this.stats.totalFlagged++;
        break;
    }
    
    // Update average processing time
    this.stats.averageProcessingTime = (
      (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1)) + processingTime
    ) / this.stats.totalProcessed;
  }
}

// Export singleton instance
export const videoModerationPipeline = new VideoModerationPipeline();

/**
 * Convenience function to process a video
 * @param {Object} videoData - Video data
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Moderation result
 */
export async function moderateVideo(videoData, options = {}) {
  return videoModerationPipeline.processVideo(videoData, options);
}

/**
 * Convenience function to process multiple videos
 * @param {Array} videos - Array of video data
 * @param {Object} options - Processing options
 * @returns {Promise<Array>} Array of moderation results
 */
export async function moderateVideoBatch(videos, options = {}) {
  return videoModerationPipeline.processBatch(videos, options);
}

export default {
  VideoModerationPipeline,
  videoModerationPipeline,
  moderateVideo,
  moderateVideoBatch,
  PIPELINE_CONFIG
};

