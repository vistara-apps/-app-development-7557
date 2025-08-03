/**
 * Moderation Data Schema and Mock Database
 * Defines data structures for moderation results, approval workflows, and analytics
 */

// Moderation result status types
export const MODERATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MANUAL_REVIEW: 'manual_review',
  APPEALED: 'appealed',
  ESCALATED: 'escalated'
};

// Content types that can be moderated
export const CONTENT_TYPES = {
  VIDEO: 'video',
  COMMENT: 'comment',
  USER_PROFILE: 'user_profile',
  THUMBNAIL: 'thumbnail'
};

// Moderation action types
export const MODERATION_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
  HIDE: 'hide',
  SHADOW_BAN: 'shadow_ban',
  MANUAL_REVIEW: 'manual_review',
  APPROVE_WITH_WARNING: 'approve_with_warning',
  RATE_LIMITED: 'rate_limited'
};

// Violation flag types
export const VIOLATION_FLAGS = {
  // Video-specific
  INAPPROPRIATE_VIOLENCE: 'inappropriate_violence',
  GRAPHIC_CONTENT: 'graphic_content',
  COPYRIGHT_VIOLATION: 'copyright_violation',
  MISLEADING_CONTENT: 'misleading_content',
  
  // Comment-specific
  HARASSMENT: 'harassment',
  HATE_SPEECH: 'hate_speech',
  SPAM: 'spam',
  TOXICITY: 'toxicity',
  SELF_HARM: 'self_harm',
  
  // General
  ADULT_CONTENT: 'adult_content',
  VIOLENCE: 'violence',
  TERRORISM: 'terrorism',
  ILLEGAL_ACTIVITY: 'illegal_activity',
  
  // Technical
  ANALYSIS_ERROR: 'analysis_error',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};

/**
 * Base moderation result schema
 */
export const ModerationResultSchema = {
  id: '', // Unique identifier
  contentType: '', // CONTENT_TYPES
  contentId: '', // ID of the content being moderated
  status: '', // MODERATION_STATUS
  action: '', // MODERATION_ACTIONS
  confidence: 0, // 0-1 confidence score
  flags: [], // Array of VIOLATION_FLAGS
  reasoning: '', // AI or human reasoning
  reviewRequired: false, // Boolean
  timestamp: '', // ISO timestamp
  processingTime: 0, // Processing time in milliseconds
  metadata: {}, // Additional context-specific data
  
  // AI Analysis specific
  aiAnalysis: {
    model: '', // AI model used
    version: '', // Model version
    rawScores: {}, // Raw AI scores
    contextAdjustments: [] // Applied adjustments
  },
  
  // Human review specific
  humanReview: {
    reviewerId: '',
    reviewTimestamp: '',
    reviewNotes: '',
    overrideReason: ''
  },
  
  // Appeal information
  appeal: {
    appealId: '',
    appealTimestamp: '',
    appealReason: '',
    appealStatus: '',
    appealDecision: ''
  }
};

/**
 * Video moderation result schema
 */
export const VideoModerationSchema = {
  ...ModerationResultSchema,
  contentType: CONTENT_TYPES.VIDEO,
  
  // Video-specific metadata
  metadata: {
    title: '',
    description: '',
    duration: '',
    category: '',
    organization: '',
    fighters: [],
    tags: [],
    uploaderId: '',
    fileSize: 0,
    resolution: '',
    frameAnalysis: {
      totalFrames: 0,
      analyzedFrames: 0,
      highRiskFrames: [],
      averageRiskScore: 0
    },
    combatSportsContext: {
      legitimacyScore: 0, // 0-1 score for legitimate combat sports
      organization: '',
      sanctioned: false,
      weightClass: '',
      eventType: ''
    }
  }
};

/**
 * Comment moderation result schema
 */
export const CommentModerationSchema = {
  ...ModerationResultSchema,
  contentType: CONTENT_TYPES.COMMENT,
  
  // Comment-specific metadata
  metadata: {
    content: '',
    userId: '',
    videoId: '',
    parentCommentId: '', // For replies
    userHistory: {
      totalComments: 0,
      flaggedComments: 0,
      trustScore: 0
    },
    contextAnalysis: {
      combatSportsRelated: false,
      technicalDiscussion: false,
      personalAttack: false,
      contextScore: 0
    },
    rateLimiting: {
      userCommentsLastHour: 0,
      userCommentsLastMinute: 0,
      rateLimited: false
    }
  }
};

/**
 * Moderation queue item schema
 */
export const ModerationQueueSchema = {
  id: '',
  contentType: '',
  contentId: '',
  priority: '', // 'high', 'normal', 'low'
  queuedAt: '',
  assignedTo: '', // Admin user ID
  estimatedReviewTime: 0, // Minutes
  complexity: '', // 'simple', 'moderate', 'complex'
  
  // Content preview
  preview: {
    title: '',
    thumbnail: '',
    snippet: '',
    duration: ''
  },
  
  // Moderation context
  moderationResult: {}, // ModerationResultSchema
  relatedContent: [], // Related content that might be affected
  userContext: {
    userId: '',
    userTrustScore: 0,
    recentViolations: 0,
    accountAge: 0
  }
};

/**
 * Admin action log schema
 */
export const AdminActionSchema = {
  id: '',
  adminId: '',
  action: '', // 'approve', 'reject', 'escalate', 'appeal_review', etc.
  contentType: '',
  contentId: '',
  moderationResultId: '',
  timestamp: '',
  reasoning: '',
  previousStatus: '',
  newStatus: '',
  
  // Additional context
  metadata: {
    reviewTime: 0, // Time spent reviewing in seconds
    confidence: 0, // Admin confidence in decision
    consulted: [], // Other admins consulted
    precedentCases: [] // Similar cases referenced
  }
};

/**
 * Moderation analytics schema
 */
export const ModerationAnalyticsSchema = {
  period: '', // 'hour', 'day', 'week', 'month'
  startDate: '',
  endDate: '',
  
  // Volume metrics
  totalContent: 0,
  totalModerated: 0,
  autoApproved: 0,
  autoRejected: 0,
  manualReview: 0,
  appealed: 0,
  
  // Performance metrics
  averageProcessingTime: 0,
  averageReviewTime: 0,
  throughput: 0, // Items per hour
  
  // Accuracy metrics
  accuracyRate: 0,
  falsePositiveRate: 0,
  falseNegativeRate: 0,
  appealSuccessRate: 0,
  
  // Content breakdown
  contentTypes: {
    videos: 0,
    comments: 0,
    profiles: 0,
    thumbnails: 0
  },
  
  // Violation breakdown
  violationTypes: [], // Array of {type, count, percentage}
  
  // Admin performance
  adminMetrics: {
    totalAdmins: 0,
    averageReviewsPerAdmin: 0,
    topPerformers: [], // Array of {adminId, reviewCount, accuracy}
    workloadDistribution: [] // Array of {adminId, assignedCount, completedCount}
  },
  
  // Trends
  trends: {
    volumeTrend: '', // 'increasing', 'decreasing', 'stable'
    violationTrend: '',
    accuracyTrend: '',
    processingTimeTrend: ''
  }
};

/**
 * Mock database implementation for demo purposes
 */
class MockModerationDatabase {
  constructor() {
    this.moderationResults = new Map();
    this.queueItems = new Map();
    this.adminActions = new Map();
    this.analytics = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // Moderation Results CRUD
  saveModerationResult(result) {
    this.moderationResults.set(result.id, {
      ...result,
      updatedAt: new Date().toISOString()
    });
    return result;
  }

  getModerationResult(id) {
    return this.moderationResults.get(id);
  }

  getModerationResultsByContent(contentType, contentId) {
    return Array.from(this.moderationResults.values())
      .filter(result => result.contentType === contentType && result.contentId === contentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getModerationResultsByStatus(status) {
    return Array.from(this.moderationResults.values())
      .filter(result => result.status === status);
  }

  // Queue Management
  addToQueue(queueItem) {
    this.queueItems.set(queueItem.id, {
      ...queueItem,
      createdAt: new Date().toISOString()
    });
    return queueItem;
  }

  getQueueItem(id) {
    return this.queueItems.get(id);
  }

  getQueue(filters = {}) {
    let items = Array.from(this.queueItems.values());
    
    if (filters.assignedTo) {
      items = items.filter(item => item.assignedTo === filters.assignedTo);
    }
    
    if (filters.priority) {
      items = items.filter(item => item.priority === filters.priority);
    }
    
    if (filters.contentType) {
      items = items.filter(item => item.contentType === filters.contentType);
    }
    
    return items.sort((a, b) => {
      // Sort by priority, then by queue time
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return new Date(a.queuedAt) - new Date(b.queuedAt);
    });
  }

  removeFromQueue(id) {
    return this.queueItems.delete(id);
  }

  // Admin Actions
  logAdminAction(action) {
    this.adminActions.set(action.id, {
      ...action,
      createdAt: new Date().toISOString()
    });
    return action;
  }

  getAdminActions(filters = {}) {
    let actions = Array.from(this.adminActions.values());
    
    if (filters.adminId) {
      actions = actions.filter(action => action.adminId === filters.adminId);
    }
    
    if (filters.startDate) {
      actions = actions.filter(action => 
        new Date(action.timestamp) >= new Date(filters.startDate)
      );
    }
    
    if (filters.endDate) {
      actions = actions.filter(action => 
        new Date(action.timestamp) <= new Date(filters.endDate)
      );
    }
    
    return actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Analytics
  generateAnalytics(period, startDate, endDate) {
    const results = Array.from(this.moderationResults.values())
      .filter(result => {
        const resultDate = new Date(result.timestamp);
        return resultDate >= new Date(startDate) && resultDate <= new Date(endDate);
      });

    const actions = Array.from(this.adminActions.values())
      .filter(action => {
        const actionDate = new Date(action.timestamp);
        return actionDate >= new Date(startDate) && actionDate <= new Date(endDate);
      });

    return this.calculateAnalytics(results, actions, period, startDate, endDate);
  }

  calculateAnalytics(results, actions, period, startDate, endDate) {
    const total = results.length;
    const autoApproved = results.filter(r => r.action === MODERATION_ACTIONS.APPROVE).length;
    const autoRejected = results.filter(r => r.action === MODERATION_ACTIONS.REJECT).length;
    const manualReview = results.filter(r => r.action === MODERATION_ACTIONS.MANUAL_REVIEW).length;
    
    const violationCounts = {};
    results.forEach(result => {
      result.flags.forEach(flag => {
        violationCounts[flag] = (violationCounts[flag] || 0) + 1;
      });
    });

    const violationTypes = Object.entries(violationCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      period,
      startDate,
      endDate,
      totalContent: total,
      totalModerated: total,
      autoApproved,
      autoRejected,
      manualReview,
      appealed: 0, // Would be calculated from appeals
      averageProcessingTime: total > 0 
        ? results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / total 
        : 0,
      averageReviewTime: 0, // Would be calculated from admin actions
      throughput: total / Math.max(1, (new Date(endDate) - new Date(startDate)) / 3600000),
      accuracyRate: 95.2, // Mock value
      falsePositiveRate: 2.8,
      falseNegativeRate: 2.0,
      appealSuccessRate: 15.3,
      contentTypes: {
        videos: results.filter(r => r.contentType === CONTENT_TYPES.VIDEO).length,
        comments: results.filter(r => r.contentType === CONTENT_TYPES.COMMENT).length,
        profiles: 0,
        thumbnails: 0
      },
      violationTypes,
      adminMetrics: {
        totalAdmins: 3,
        averageReviewsPerAdmin: actions.length / 3,
        topPerformers: [
          { adminId: 'admin1', reviewCount: 45, accuracy: 96.2 },
          { adminId: 'admin2', reviewCount: 38, accuracy: 94.7 },
          { adminId: 'admin3', reviewCount: 29, accuracy: 97.1 }
        ],
        workloadDistribution: [
          { adminId: 'admin1', assignedCount: 50, completedCount: 45 },
          { adminId: 'admin2', assignedCount: 42, completedCount: 38 },
          { adminId: 'admin3', assignedCount: 35, completedCount: 29 }
        ]
      },
      trends: {
        volumeTrend: 'increasing',
        violationTrend: 'stable',
        accuracyTrend: 'improving',
        processingTimeTrend: 'decreasing'
      }
    };
  }

  initializeSampleData() {
    // Add sample moderation results
    const sampleResults = [
      {
        id: 'mod_video_001',
        contentType: CONTENT_TYPES.VIDEO,
        contentId: '1',
        status: MODERATION_STATUS.APPROVED,
        action: MODERATION_ACTIONS.APPROVE,
        confidence: 0.05,
        flags: [],
        reasoning: 'Clean combat sports content with professional production quality.',
        reviewRequired: false,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        processingTime: 2340,
        metadata: {
          title: 'UFC 300: Jones vs Miocic - Full Fight Highlights',
          category: 'mma',
          duration: '15:32'
        }
      },
      {
        id: 'mod_comment_001',
        contentType: CONTENT_TYPES.COMMENT,
        contentId: 'comment_123',
        status: MODERATION_STATUS.MANUAL_REVIEW,
        action: MODERATION_ACTIONS.MANUAL_REVIEW,
        confidence: 0.65,
        flags: [VIOLATION_FLAGS.TOXICITY],
        reasoning: 'Borderline toxic language detected in combat sports context',
        reviewRequired: true,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        processingTime: 450,
        metadata: {
          content: 'That fighter got destroyed, what a savage beatdown!',
          userId: 'user_456',
          videoId: '1'
        }
      }
    ];

    sampleResults.forEach(result => this.saveModerationResult(result));

    // Add sample queue items
    const sampleQueueItems = [
      {
        id: 'queue_001',
        contentType: CONTENT_TYPES.VIDEO,
        contentId: '2',
        priority: 'high',
        queuedAt: new Date().toISOString(),
        assignedTo: '',
        estimatedReviewTime: 5,
        complexity: 'moderate',
        preview: {
          title: 'Canelo vs GGG 3: The Trilogy Conclusion',
          thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=150&fit=crop',
          snippet: 'The final chapter in one of boxing\'s greatest rivalries...',
          duration: '45:18'
        },
        moderationResult: sampleResults[0]
      }
    ];

    sampleQueueItems.forEach(item => this.addToQueue(item));
  }
}

// Export singleton instance
export const moderationDB = new MockModerationDatabase();

// Export utility functions
export function createModerationResult(data) {
  return {
    ...ModerationResultSchema,
    ...data,
    id: data.id || `mod_${data.contentType}_${Date.now()}`,
    timestamp: data.timestamp || new Date().toISOString()
  };
}

export function createQueueItem(data) {
  return {
    ...ModerationQueueSchema,
    ...data,
    id: data.id || `queue_${Date.now()}`,
    queuedAt: data.queuedAt || new Date().toISOString()
  };
}

export function createAdminAction(data) {
  return {
    ...AdminActionSchema,
    ...data,
    id: data.id || `action_${Date.now()}`,
    timestamp: data.timestamp || new Date().toISOString()
  };
}

export default {
  moderationDB,
  MODERATION_STATUS,
  CONTENT_TYPES,
  MODERATION_ACTIONS,
  VIOLATION_FLAGS,
  createModerationResult,
  createQueueItem,
  createAdminAction
};

