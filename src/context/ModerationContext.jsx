import React, { createContext, useContext, useState, useEffect } from 'react';
import { moderationService } from '../services/moderationService.js';
import { moderationDB, MODERATION_STATUS, MODERATION_ACTIONS } from '../data/moderationSchema.js';
import { getModerationStats } from '../utils/commentModeration.js';

const ModerationContext = createContext();

export const useModeration = () => {
  const context = useContext(ModerationContext);
  if (!context) {
    throw new Error('useModeration must be used within a ModerationProvider');
  }
  return context;
};

export const ModerationProvider = ({ children }) => {
  // State management
  const [moderationQueue, setModerationQueue] = useState([]);
  const [moderationStats, setModerationStats] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    contentType: 'all',
    priority: 'all',
    assignedTo: 'all'
  });

  // Load initial data
  useEffect(() => {
    loadModerationQueue();
    loadModerationStats();
  }, [filters]);

  /**
   * Load moderation queue with current filters
   */
  const loadModerationQueue = async () => {
    try {
      setIsProcessing(true);
      
      // Apply filters to queue query
      const queueFilters = {};
      if (filters.assignedTo !== 'all') queueFilters.assignedTo = filters.assignedTo;
      if (filters.priority !== 'all') queueFilters.priority = filters.priority;
      if (filters.contentType !== 'all') queueFilters.contentType = filters.contentType;
      
      const queue = moderationDB.getQueue(queueFilters);
      
      // Filter by status if needed
      let filteredQueue = queue;
      if (filters.status !== 'all') {
        filteredQueue = queue.filter(item => 
          item.moderationResult?.status === filters.status
        );
      }
      
      setModerationQueue(filteredQueue);
    } catch (error) {
      console.error('Failed to load moderation queue:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Load moderation statistics
   */
  const loadModerationStats = async () => {
    try {
      const stats = getModerationStats();
      const analyticsData = moderationDB.generateAnalytics(
        'day',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      );
      
      setModerationStats({
        ...stats,
        analytics: analyticsData
      });
    } catch (error) {
      console.error('Failed to load moderation stats:', error);
    }
  };

  /**
   * Moderate content (video or comment)
   */
  const moderateContent = async (contentType, contentData, context = {}) => {
    try {
      setIsProcessing(true);
      
      let result;
      if (contentType === 'video') {
        result = await moderationService.analyzeVideo(contentData);
      } else if (contentType === 'comment') {
        result = await moderationService.analyzeComment(contentData.text, context);
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }
      
      // Save result to database
      moderationDB.saveModerationResult(result);
      
      // Add to queue if manual review required
      if (result.reviewRequired) {
        const queueItem = {
          id: `queue_${result.id}`,
          contentType: result.contentType,
          contentId: result.contentId,
          priority: determinePriority(result),
          moderationResult: result,
          preview: createContentPreview(contentType, contentData)
        };
        
        moderationDB.addToQueue(queueItem);
        await loadModerationQueue(); // Refresh queue
      }
      
      await loadModerationStats(); // Refresh stats
      return result;
      
    } catch (error) {
      console.error('Content moderation failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Batch moderate multiple items
   */
  const batchModerateContent = async (items) => {
    try {
      setIsProcessing(true);
      const results = [];
      
      for (const item of items) {
        try {
          const result = await moderateContent(
            item.contentType, 
            item.contentData, 
            item.context
          );
          results.push({ success: true, result, item });
        } catch (error) {
          results.push({ success: false, error: error.message, item });
        }
      }
      
      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Admin review action
   */
  const performAdminReview = async (queueItemId, decision, reasoning = '') => {
    try {
      setIsProcessing(true);
      
      const queueItem = moderationDB.getQueueItem(queueItemId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }
      
      // Update moderation result
      const updatedResult = {
        ...queueItem.moderationResult,
        status: decision === 'approve' ? MODERATION_STATUS.APPROVED : MODERATION_STATUS.REJECTED,
        action: decision === 'approve' ? MODERATION_ACTIONS.APPROVE : MODERATION_ACTIONS.REJECT,
        humanReview: {
          reviewerId: 'current_admin', // In production, get from auth context
          reviewTimestamp: new Date().toISOString(),
          reviewNotes: reasoning,
          overrideReason: reasoning
        }
      };
      
      moderationDB.saveModerationResult(updatedResult);
      
      // Log admin action
      const adminAction = {
        adminId: 'current_admin',
        action: decision,
        contentType: queueItem.contentType,
        contentId: queueItem.contentId,
        moderationResultId: queueItem.moderationResult.id,
        reasoning,
        previousStatus: queueItem.moderationResult.status,
        newStatus: updatedResult.status
      };
      
      moderationDB.logAdminAction(adminAction);
      
      // Remove from queue
      moderationDB.removeFromQueue(queueItemId);
      
      // Refresh data
      await loadModerationQueue();
      await loadModerationStats();
      
      return updatedResult;
      
    } catch (error) {
      console.error('Admin review failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Assign queue item to admin
   */
  const assignQueueItem = async (queueItemId, adminId) => {
    try {
      const queueItem = moderationDB.getQueueItem(queueItemId);
      if (!queueItem) {
        throw new Error('Queue item not found');
      }
      
      const updatedItem = {
        ...queueItem,
        assignedTo: adminId,
        assignedAt: new Date().toISOString()
      };
      
      moderationDB.addToQueue(updatedItem);
      await loadModerationQueue();
      
      return updatedItem;
    } catch (error) {
      console.error('Failed to assign queue item:', error);
      throw error;
    }
  };

  /**
   * Get moderation history for content
   */
  const getModerationHistory = (contentType, contentId) => {
    return moderationDB.getModerationResultsByContent(contentType, contentId);
  };

  /**
   * Update filters
   */
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setFilters({
      status: 'all',
      contentType: 'all',
      priority: 'all',
      assignedTo: 'all'
    });
  };

  /**
   * Get queue statistics
   */
  const getQueueStats = () => {
    const total = moderationQueue.length;
    const assigned = moderationQueue.filter(item => item.assignedTo).length;
    const unassigned = total - assigned;
    const highPriority = moderationQueue.filter(item => item.priority === 'high').length;
    
    const avgWaitTime = moderationQueue.reduce((sum, item) => {
      const waitTime = Date.now() - new Date(item.queuedAt).getTime();
      return sum + waitTime;
    }, 0) / Math.max(1, total);
    
    return {
      total,
      assigned,
      unassigned,
      highPriority,
      averageWaitTime: Math.round(avgWaitTime / 60000) // Convert to minutes
    };
  };

  // Helper functions
  const determinePriority = (result) => {
    if (result.confidence > 0.8 || result.flags.includes('hate_speech')) {
      return 'high';
    } else if (result.confidence > 0.5) {
      return 'normal';
    } else {
      return 'low';
    }
  };

  const createContentPreview = (contentType, contentData) => {
    if (contentType === 'video') {
      return {
        title: contentData.title || 'Untitled Video',
        thumbnail: contentData.previewThumbnail || '',
        snippet: contentData.description?.substring(0, 100) + '...' || '',
        duration: contentData.duration || '0:00'
      };
    } else if (contentType === 'comment') {
      return {
        title: 'User Comment',
        thumbnail: '',
        snippet: contentData.text?.substring(0, 100) + '...' || '',
        duration: ''
      };
    }
    return {};
  };

  const contextValue = {
    // State
    moderationQueue,
    moderationStats,
    isProcessing,
    selectedQueueItem,
    filters,
    
    // Actions
    moderateContent,
    batchModerateContent,
    performAdminReview,
    assignQueueItem,
    getModerationHistory,
    updateFilters,
    clearFilters,
    loadModerationQueue,
    loadModerationStats,
    
    // Computed values
    queueStats: getQueueStats(),
    
    // Setters
    setSelectedQueueItem
  };

  return (
    <ModerationContext.Provider value={contextValue}>
      {children}
    </ModerationContext.Provider>
  );
};

export default ModerationProvider;

