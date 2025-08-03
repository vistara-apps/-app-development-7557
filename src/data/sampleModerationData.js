/**
 * Sample Moderation Data
 * Provides realistic sample data for demonstrating the moderation system
 */

import { MODERATION_STATUS, CONTENT_TYPES, MODERATION_ACTIONS, VIOLATION_FLAGS } from './moderationSchema.js';

// Sample video moderation results
export const sampleVideoModerationResults = [
  {
    id: 'mod_video_001',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: '1',
    status: MODERATION_STATUS.APPROVED,
    action: MODERATION_ACTIONS.APPROVE,
    confidence: 0.05,
    flags: [],
    reasoning: 'Clean combat sports content with professional production quality. UFC organization verified.',
    reviewRequired: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    processingTime: 2340,
    metadata: {
      title: 'UFC 300: Jones vs Miocic - Full Fight Highlights',
      category: 'mma',
      duration: '15:32',
      organization: 'UFC',
      combatSportsLegitimacy: 0.95,
      processingStages: {
        metadata: true,
        aiAnalysis: true,
        deepAnalysis: false
      }
    },
    aiAnalysis: {
      model: 'gpt-4-vision-preview',
      version: '1.0',
      rawScores: {
        violence: 0.02,
        inappropriate: 0.01,
        graphic: 0.03
      },
      contextAdjustments: ['legitimate_combat_sports', 'professional_organization']
    }
  },
  {
    id: 'mod_video_002',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: '2',
    status: MODERATION_STATUS.MANUAL_REVIEW,
    action: MODERATION_ACTIONS.MANUAL_REVIEW,
    confidence: 0.65,
    flags: [VIOLATION_FLAGS.GRAPHIC_CONTENT],
    reasoning: 'Contains graphic knockout footage that may require review for sensitive viewers. High impact finish.',
    reviewRequired: true,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    processingTime: 4560,
    metadata: {
      title: 'Canelo vs GGG 3: The Trilogy Conclusion',
      category: 'boxing',
      duration: '45:18',
      organization: 'DAZN',
      combatSportsLegitimacy: 0.88,
      processingStages: {
        metadata: true,
        aiAnalysis: true,
        deepAnalysis: true
      }
    },
    aiAnalysis: {
      model: 'gpt-4-vision-preview',
      version: '1.0',
      rawScores: {
        violence: 0.45,
        inappropriate: 0.12,
        graphic: 0.68
      },
      contextAdjustments: ['professional_boxing', 'legitimate_organization']
    }
  },
  {
    id: 'mod_video_003',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: 'demo_video_bad',
    status: MODERATION_STATUS.REJECTED,
    action: MODERATION_ACTIONS.REJECT,
    confidence: 0.92,
    flags: [VIOLATION_FLAGS.INAPPROPRIATE_VIOLENCE, VIOLATION_FLAGS.MISLEADING_CONTENT],
    reasoning: 'Unsanctioned street fight with sensationalized title. Does not meet platform standards for combat sports content.',
    reviewRequired: false,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    processingTime: 1890,
    metadata: {
      title: 'BRUTAL STREET FIGHT - REAL VIOLENCE!!!',
      category: 'other',
      duration: '3:21',
      organization: 'Unknown',
      combatSportsLegitimacy: 0.05,
      processingStages: {
        metadata: true,
        aiAnalysis: true,
        deepAnalysis: false
      }
    },
    aiAnalysis: {
      model: 'gpt-4-vision-preview',
      version: '1.0',
      rawScores: {
        violence: 0.89,
        inappropriate: 0.94,
        graphic: 0.76
      },
      contextAdjustments: ['unsanctioned_violence', 'sensationalized_content']
    }
  }
];

// Sample comment moderation results
export const sampleCommentModerationResults = [
  {
    id: 'mod_comment_001',
    contentType: CONTENT_TYPES.COMMENT,
    contentId: 'comment_123',
    status: MODERATION_STATUS.APPROVED,
    action: MODERATION_ACTIONS.APPROVE,
    confidence: 0.15,
    flags: [],
    reasoning: 'Positive sports commentary using legitimate combat sports terminology.',
    reviewRequired: false,
    timestamp: new Date(Date.now() - 2700000).toISOString(),
    processingTime: 450,
    metadata: {
      content: 'What an amazing knockout! Jones completely dominated that fight.',
      userId: 'user_123',
      videoId: '1',
      userHistory: {
        totalComments: 45,
        flaggedComments: 2,
        trustScore: 0.92
      },
      contextAnalysis: {
        combatSportsRelated: true,
        technicalDiscussion: false,
        personalAttack: false,
        contextScore: 0.1
      }
    },
    aiAnalysis: {
      model: 'gpt-3.5-turbo',
      version: '1.0',
      rawScores: {
        toxicity: 0.02,
        harassment: 0.01,
        hate_speech: 0.00
      },
      contextAdjustments: ['combat_sports_terminology', 'positive_sentiment']
    }
  },
  {
    id: 'mod_comment_002',
    contentType: CONTENT_TYPES.COMMENT,
    contentId: 'comment_456',
    status: MODERATION_STATUS.MANUAL_REVIEW,
    action: MODERATION_ACTIONS.MANUAL_REVIEW,
    confidence: 0.58,
    flags: [VIOLATION_FLAGS.TOXICITY],
    reasoning: 'Borderline toxic language detected. Context-sensitive terms used in potentially inappropriate manner.',
    reviewRequired: true,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    processingTime: 680,
    metadata: {
      content: 'This is fake garbage, these fighters are terrible and stupid.',
      userId: 'user_456',
      videoId: '1',
      userHistory: {
        totalComments: 12,
        flaggedComments: 4,
        trustScore: 0.45
      },
      contextAnalysis: {
        combatSportsRelated: true,
        technicalDiscussion: false,
        personalAttack: true,
        contextScore: 0.72
      }
    },
    aiAnalysis: {
      model: 'gpt-3.5-turbo',
      version: '1.0',
      rawScores: {
        toxicity: 0.67,
        harassment: 0.34,
        hate_speech: 0.12
      },
      contextAdjustments: ['negative_sentiment', 'personal_attacks']
    }
  },
  {
    id: 'mod_comment_003',
    contentType: CONTENT_TYPES.COMMENT,
    contentId: 'comment_789',
    status: MODERATION_STATUS.REJECTED,
    action: MODERATION_ACTIONS.REJECT,
    confidence: 0.94,
    flags: [VIOLATION_FLAGS.HATE_SPEECH, VIOLATION_FLAGS.HARASSMENT],
    reasoning: 'Clear hate speech and harassment targeting specific individuals. Immediate rejection required.',
    reviewRequired: false,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    processingTime: 320,
    metadata: {
      content: 'These [REDACTED] fighters should go back to where they came from. Disgusting [REDACTED].',
      userId: 'user_789',
      videoId: '2',
      userHistory: {
        totalComments: 8,
        flaggedComments: 7,
        trustScore: 0.12
      },
      contextAnalysis: {
        combatSportsRelated: false,
        technicalDiscussion: false,
        personalAttack: true,
        contextScore: 0.95
      }
    },
    aiAnalysis: {
      model: 'gpt-3.5-turbo',
      version: '1.0',
      rawScores: {
        toxicity: 0.96,
        harassment: 0.89,
        hate_speech: 0.94
      },
      contextAdjustments: ['hate_speech_detected', 'harassment_confirmed']
    }
  }
];

// Sample moderation queue items
export const sampleModerationQueue = [
  {
    id: 'queue_001',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: '2',
    priority: 'high',
    queuedAt: new Date(Date.now() - 300000).toISOString(),
    assignedTo: '',
    estimatedReviewTime: 5,
    complexity: 'moderate',
    preview: {
      title: 'Canelo vs GGG 3: The Trilogy Conclusion',
      thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=150&fit=crop',
      snippet: 'The final chapter in one of boxing\'s greatest rivalries. Contains graphic knockout footage...',
      duration: '45:18'
    },
    moderationResult: sampleVideoModerationResults[1],
    userContext: {
      userId: 'uploader_123',
      userTrustScore: 0.78,
      recentViolations: 1,
      accountAge: 365
    }
  },
  {
    id: 'queue_002',
    contentType: CONTENT_TYPES.COMMENT,
    contentId: 'comment_456',
    priority: 'normal',
    queuedAt: new Date(Date.now() - 180000).toISOString(),
    assignedTo: 'admin_1',
    estimatedReviewTime: 2,
    complexity: 'simple',
    preview: {
      title: 'User Comment',
      thumbnail: '',
      snippet: 'This is fake garbage, these fighters are terrible and stupid.',
      duration: ''
    },
    moderationResult: sampleCommentModerationResults[1],
    userContext: {
      userId: 'user_456',
      userTrustScore: 0.45,
      recentViolations: 4,
      accountAge: 90
    }
  },
  {
    id: 'queue_003',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: 'demo_video_new',
    priority: 'low',
    queuedAt: new Date(Date.now() - 120000).toISOString(),
    assignedTo: '',
    estimatedReviewTime: 3,
    complexity: 'simple',
    preview: {
      title: 'ONE Championship: Muay Thai Highlights',
      thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop',
      snippet: 'Professional Muay Thai competition from Singapore featuring world-class strikers...',
      duration: '12:45'
    },
    moderationResult: {
      id: 'mod_video_004',
      confidence: 0.35,
      action: 'manual_review',
      flags: ['potential_graphic_content'],
      reasoning: 'Borderline graphic content in combat sports context requires human review.'
    },
    userContext: {
      userId: 'uploader_456',
      userTrustScore: 0.85,
      recentViolations: 0,
      accountAge: 730
    }
  }
];

// Sample admin actions
export const sampleAdminActions = [
  {
    id: 'action_001',
    adminId: 'admin_1',
    action: 'approve',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: '2',
    moderationResultId: 'mod_video_002',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    reasoning: 'Graphic content is within acceptable limits for combat sports. Added content warning.',
    previousStatus: MODERATION_STATUS.MANUAL_REVIEW,
    newStatus: MODERATION_STATUS.APPROVED,
    metadata: {
      reviewTime: 180, // 3 minutes
      confidence: 8,
      consulted: [],
      precedentCases: ['similar_boxing_knockout_2023']
    }
  },
  {
    id: 'action_002',
    adminId: 'admin_2',
    action: 'reject',
    contentType: CONTENT_TYPES.COMMENT,
    contentId: 'comment_789',
    moderationResultId: 'mod_comment_003',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    reasoning: 'Clear hate speech violation. User suspended for 7 days.',
    previousStatus: MODERATION_STATUS.MANUAL_REVIEW,
    newStatus: MODERATION_STATUS.REJECTED,
    metadata: {
      reviewTime: 45, // 45 seconds
      confidence: 10,
      consulted: ['admin_1'],
      precedentCases: ['hate_speech_policy_2024']
    }
  },
  {
    id: 'action_003',
    adminId: 'admin_1',
    action: 'escalate',
    contentType: CONTENT_TYPES.VIDEO,
    contentId: 'demo_video_complex',
    moderationResultId: 'mod_video_005',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    reasoning: 'Complex case involving potential copyright issues. Escalated to senior review.',
    previousStatus: MODERATION_STATUS.MANUAL_REVIEW,
    newStatus: MODERATION_STATUS.ESCALATED,
    metadata: {
      reviewTime: 420, // 7 minutes
      confidence: 3,
      consulted: ['admin_2', 'legal_team'],
      precedentCases: ['copyright_dispute_2024_q1']
    }
  }
];

// Sample moderation analytics data
export const sampleModerationAnalytics = {
  period: 'day',
  startDate: new Date(Date.now() - 86400000).toISOString(),
  endDate: new Date().toISOString(),
  totalContent: 1247,
  totalModerated: 1247,
  autoApproved: 1089,
  autoRejected: 23,
  manualReview: 135,
  appealed: 8,
  averageProcessingTime: 2340, // milliseconds
  averageReviewTime: 180, // seconds
  throughput: 52, // items per hour
  accuracyRate: 94.2,
  falsePositiveRate: 3.1,
  falseNegativeRate: 2.7,
  appealSuccessRate: 25.0,
  contentTypes: {
    videos: 234,
    comments: 1013,
    profiles: 0,
    thumbnails: 0
  },
  violationTypes: [
    { type: 'toxicity', count: 45, percentage: '3.6' },
    { type: 'harassment', count: 23, percentage: '1.8' },
    { type: 'graphic_content', count: 18, percentage: '1.4' },
    { type: 'spam', count: 15, percentage: '1.2' },
    { type: 'inappropriate_violence', count: 12, percentage: '1.0' },
    { type: 'hate_speech', count: 8, percentage: '0.6' },
    { type: 'misleading_content', count: 6, percentage: '0.5' }
  ],
  adminMetrics: {
    totalAdmins: 3,
    averageReviewsPerAdmin: 45,
    topPerformers: [
      { adminId: 'admin_1', reviewCount: 67, accuracy: 96.2 },
      { adminId: 'admin_2', reviewCount: 45, accuracy: 94.7 },
      { adminId: 'admin_3', reviewCount: 23, accuracy: 97.1 }
    ],
    workloadDistribution: [
      { adminId: 'admin_1', assignedCount: 70, completedCount: 67 },
      { adminId: 'admin_2', assignedCount: 48, completedCount: 45 },
      { adminId: 'admin_3', assignedCount: 25, completedCount: 23 }
    ]
  },
  trends: {
    volumeTrend: 'increasing',
    violationTrend: 'stable',
    accuracyTrend: 'improving',
    processingTimeTrend: 'decreasing'
  },
  hourlyBreakdown: [
    { hour: 0, volume: 23, violations: 2 },
    { hour: 1, volume: 18, violations: 1 },
    { hour: 2, volume: 15, violations: 1 },
    { hour: 3, volume: 12, violations: 0 },
    { hour: 4, volume: 19, violations: 1 },
    { hour: 5, volume: 28, violations: 2 },
    { hour: 6, volume: 45, violations: 4 },
    { hour: 7, volume: 67, violations: 6 },
    { hour: 8, volume: 89, violations: 8 },
    { hour: 9, volume: 102, violations: 9 },
    { hour: 10, volume: 98, violations: 7 },
    { hour: 11, volume: 87, violations: 6 },
    { hour: 12, volume: 95, violations: 8 },
    { hour: 13, volume: 91, violations: 7 },
    { hour: 14, volume: 88, violations: 6 },
    { hour: 15, volume: 85, violations: 5 },
    { hour: 16, volume: 82, violations: 4 },
    { hour: 17, volume: 78, violations: 3 },
    { hour: 18, volume: 72, violations: 3 },
    { hour: 19, volume: 65, violations: 2 },
    { hour: 20, volume: 58, violations: 2 },
    { hour: 21, volume: 45, violations: 1 },
    { hour: 22, volume: 35, violations: 1 },
    { hour: 23, volume: 28, violations: 1 }
  ]
};

// Workflow demonstration scenarios
export const moderationWorkflowScenarios = [
  {
    id: 'scenario_1',
    title: 'Legitimate Combat Sports Content',
    description: 'Professional UFC fight highlights with clean content',
    steps: [
      {
        step: 1,
        title: 'Content Upload',
        description: 'User uploads UFC fight highlights',
        status: 'completed',
        timestamp: '2024-01-15T10:00:00Z',
        details: 'Video uploaded with proper metadata and UFC organization tag'
      },
      {
        step: 2,
        title: 'Automated Analysis',
        description: 'AI analyzes video content and metadata',
        status: 'completed',
        timestamp: '2024-01-15T10:00:15Z',
        details: 'Low confidence score (0.05), no flags detected, legitimate organization verified'
      },
      {
        step: 3,
        title: 'Auto-Approval',
        description: 'Content automatically approved for publication',
        status: 'completed',
        timestamp: '2024-01-15T10:00:18Z',
        details: 'Content published immediately, no manual review required'
      }
    ],
    outcome: 'approved',
    processingTime: '18 seconds',
    confidence: 0.05
  },
  {
    id: 'scenario_2',
    title: 'Borderline Content Requiring Review',
    description: 'Boxing match with graphic knockout footage',
    steps: [
      {
        step: 1,
        title: 'Content Upload',
        description: 'User uploads boxing match with knockout',
        status: 'completed',
        timestamp: '2024-01-15T11:00:00Z',
        details: 'Professional boxing match from legitimate organization'
      },
      {
        step: 2,
        title: 'Automated Analysis',
        description: 'AI detects graphic content but recognizes sports context',
        status: 'completed',
        timestamp: '2024-01-15T11:00:25Z',
        details: 'Moderate confidence (0.65), graphic content flag, legitimate sports context'
      },
      {
        step: 3,
        title: 'Queue for Review',
        description: 'Content flagged for manual review',
        status: 'completed',
        timestamp: '2024-01-15T11:00:28Z',
        details: 'Added to high-priority queue due to graphic content flag'
      },
      {
        step: 4,
        title: 'Admin Review',
        description: 'Human moderator reviews content',
        status: 'completed',
        timestamp: '2024-01-15T11:15:00Z',
        details: 'Admin determines content is acceptable with content warning'
      },
      {
        step: 5,
        title: 'Approval with Warning',
        description: 'Content approved with age restriction',
        status: 'completed',
        timestamp: '2024-01-15T11:15:30Z',
        details: 'Published with 18+ age restriction and graphic content warning'
      }
    ],
    outcome: 'approved_with_warning',
    processingTime: '15 minutes 30 seconds',
    confidence: 0.65
  },
  {
    id: 'scenario_3',
    title: 'Policy Violation - Inappropriate Content',
    description: 'Unsanctioned street fight with sensationalized title',
    steps: [
      {
        step: 1,
        title: 'Content Upload',
        description: 'User uploads street fight video',
        status: 'completed',
        timestamp: '2024-01-15T12:00:00Z',
        details: 'Video with sensationalized title and no legitimate organization'
      },
      {
        step: 2,
        title: 'Automated Analysis',
        description: 'AI detects policy violations',
        status: 'completed',
        timestamp: '2024-01-15T12:00:12Z',
        details: 'High confidence (0.92), multiple flags: inappropriate violence, misleading content'
      },
      {
        step: 3,
        title: 'Auto-Rejection',
        description: 'Content automatically rejected',
        status: 'completed',
        timestamp: '2024-01-15T12:00:15Z',
        details: 'Immediate rejection due to policy violations'
      },
      {
        step: 4,
        title: 'User Notification',
        description: 'Uploader notified of rejection',
        status: 'completed',
        timestamp: '2024-01-15T12:00:20Z',
        details: 'Automated email sent with policy explanation and appeal process'
      }
    ],
    outcome: 'rejected',
    processingTime: '20 seconds',
    confidence: 0.92
  }
];

export default {
  sampleVideoModerationResults,
  sampleCommentModerationResults,
  sampleModerationQueue,
  sampleAdminActions,
  sampleModerationAnalytics,
  moderationWorkflowScenarios
};

