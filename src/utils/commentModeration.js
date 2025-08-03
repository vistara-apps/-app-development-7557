/**
 * Comment Moderation Utilities
 * Handles real-time comment analysis, filtering, and automated actions
 */

import { moderationService } from '../services/moderationService.js';

// Comment moderation configuration
export const COMMENT_MODERATION_CONFIG = {
  THRESHOLDS: {
    AUTO_APPROVE: 0.1,
    AUTO_HIDE: 0.8,
    MANUAL_REVIEW: 0.5,
    SHADOW_BAN: 0.9
  },
  RATE_LIMITS: {
    COMMENTS_PER_MINUTE: 10,
    COMMENTS_PER_HOUR: 100,
    FLAGGED_COMMENTS_THRESHOLD: 5
  },
  ANALYSIS_TYPES: {
    TOXICITY: 'toxicity',
    HARASSMENT: 'harassment',
    SPAM: 'spam',
    HATE_SPEECH: 'hate_speech',
    SELF_HARM: 'self_harm',
    VIOLENCE: 'violence'
  },
  COMBAT_SPORTS_KEYWORDS: {
    LEGITIMATE: [
      'knockout', 'submission', 'takedown', 'ground and pound',
      'striking', 'grappling', 'technique', 'training', 'sparring',
      'fight', 'bout', 'match', 'competition', 'tournament',
      'jab', 'cross', 'hook', 'uppercut', 'kick', 'punch'
    ],
    CONTEXT_SENSITIVE: [
      'destroy', 'kill', 'murder', 'savage', 'brutal', 'demolish',
      'annihilate', 'crush', 'dominate', 'finish', 'end'
    ]
  }
};

/**
 * Real-time comment moderation
 * @param {string} comment - Comment text
 * @param {Object} context - Comment context (user, video, etc.)
 * @returns {Promise<Object>} Moderation result with action
 */
export async function moderateComment(comment, context = {}) {
  try {
    // Pre-screening checks
    const preScreenResult = preScreenComment(comment, context);
    if (preScreenResult.action !== 'continue') {
      return preScreenResult;
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(context.userId);
    if (rateLimitResult.limited) {
      return {
        action: 'rate_limited',
        confidence: 1.0,
        flags: ['rate_limit_exceeded'],
        reasoning: 'User exceeded comment rate limit',
        metadata: rateLimitResult
      };
    }

    // AI-powered analysis
    const analysisResult = await moderationService.analyzeComment(comment, context);
    
    // Apply combat sports context adjustments
    const contextAdjustedResult = applyCombatSportsContext(analysisResult, comment, context);
    
    // Determine final action
    const finalAction = determineFinalAction(contextAdjustedResult, context);
    
    // Log moderation decision
    logModerationDecision(finalAction, context);
    
    return finalAction;
    
  } catch (error) {
    console.error('Comment moderation failed:', error);
    return {
      action: 'manual_review',
      confidence: 0.5,
      flags: ['moderation_error'],
      reasoning: 'Moderation system error - requires manual review',
      error: error.message
    };
  }
}

/**
 * Batch moderate multiple comments
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<Array>} Array of moderation results
 */
export async function batchModerateComments(comments) {
  const batchSize = 10; // Process in batches to avoid rate limits
  const results = [];
  
  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(comment => moderateComment(comment.text, comment.context))
    );
    
    results.push(...batchResults.map((result, index) => ({
      commentId: batch[index].id,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    })));
  }
  
  return results;
}

/**
 * Pre-screen comment for obvious violations
 * @param {string} comment - Comment text
 * @param {Object} context - Comment context
 * @returns {Object} Pre-screening result
 */
function preScreenComment(comment, context) {
  // Empty or very short comments
  if (!comment || comment.trim().length < 2) {
    return {
      action: 'reject',
      confidence: 1.0,
      flags: ['empty_comment'],
      reasoning: 'Comment is empty or too short'
    };
  }

  // Excessive length (potential spam)
  if (comment.length > 2000) {
    return {
      action: 'manual_review',
      confidence: 0.8,
      flags: ['excessive_length'],
      reasoning: 'Comment exceeds maximum length'
    };
  }

  // Excessive caps (shouting)
  const capsRatio = (comment.match(/[A-Z]/g) || []).length / comment.length;
  if (capsRatio > 0.7 && comment.length > 20) {
    return {
      action: 'manual_review',
      confidence: 0.6,
      flags: ['excessive_caps'],
      reasoning: 'Comment contains excessive capital letters'
    };
  }

  // Repeated characters (spam pattern)
  const repeatedPattern = /(.)\1{4,}/g;
  if (repeatedPattern.test(comment)) {
    return {
      action: 'manual_review',
      confidence: 0.7,
      flags: ['repeated_characters'],
      reasoning: 'Comment contains repeated character patterns'
    };
  }

  // URL spam detection
  const urlCount = (comment.match(/https?:\/\/[^\s]+/g) || []).length;
  if (urlCount > 2) {
    return {
      action: 'manual_review',
      confidence: 0.8,
      flags: ['url_spam'],
      reasoning: 'Comment contains multiple URLs'
    };
  }

  return { action: 'continue' };
}

/**
 * Check user rate limits
 * @param {string} userId - User ID
 * @returns {Object} Rate limit status
 */
function checkRateLimit(userId) {
  if (!userId) return { limited: false };

  // In production, this would check against a database or cache
  // For demo, we'll simulate rate limiting
  const userActivity = getUserActivity(userId);
  
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const oneHourAgo = now - 3600000;
  
  const recentComments = userActivity.filter(timestamp => timestamp > oneMinuteAgo);
  const hourlyComments = userActivity.filter(timestamp => timestamp > oneHourAgo);
  
  if (recentComments.length >= COMMENT_MODERATION_CONFIG.RATE_LIMITS.COMMENTS_PER_MINUTE) {
    return {
      limited: true,
      reason: 'minute_limit_exceeded',
      resetTime: oneMinuteAgo + 60000,
      currentCount: recentComments.length,
      limit: COMMENT_MODERATION_CONFIG.RATE_LIMITS.COMMENTS_PER_MINUTE
    };
  }
  
  if (hourlyComments.length >= COMMENT_MODERATION_CONFIG.RATE_LIMITS.COMMENTS_PER_HOUR) {
    return {
      limited: true,
      reason: 'hourly_limit_exceeded',
      resetTime: oneHourAgo + 3600000,
      currentCount: hourlyComments.length,
      limit: COMMENT_MODERATION_CONFIG.RATE_LIMITS.COMMENTS_PER_HOUR
    };
  }
  
  return { limited: false };
}

/**
 * Apply combat sports context to moderation results
 * @param {Object} analysisResult - Original analysis result
 * @param {string} comment - Comment text
 * @param {Object} context - Comment context
 * @returns {Object} Context-adjusted result
 */
function applyCombatSportsContext(analysisResult, comment, context) {
  const commentLower = comment.toLowerCase();
  
  // Check for legitimate combat sports terminology
  const legitimateTerms = COMMENT_MODERATION_CONFIG.COMBAT_SPORTS_KEYWORDS.LEGITIMATE;
  const hasLegitimateTerms = legitimateTerms.some(term => commentLower.includes(term));
  
  // Check for context-sensitive terms that might be acceptable in combat sports
  const contextSensitiveTerms = COMMENT_MODERATION_CONFIG.COMBAT_SPORTS_KEYWORDS.CONTEXT_SENSITIVE;
  const hasContextSensitiveTerms = contextSensitiveTerms.some(term => commentLower.includes(term));
  
  let adjustedConfidence = analysisResult.confidence;
  const adjustmentReasons = [];
  
  // Reduce confidence for legitimate combat sports discussion
  if (hasLegitimateTerms) {
    adjustedConfidence *= 0.7;
    adjustmentReasons.push('Contains legitimate combat sports terminology');
  }
  
  // Moderate adjustment for context-sensitive terms
  if (hasContextSensitiveTerms && hasLegitimateTerms) {
    adjustedConfidence *= 0.8;
    adjustmentReasons.push('Context-sensitive terms used in sports context');
  }
  
  // Check if comment is about technique or analysis (usually safe)
  const technicalTerms = ['technique', 'strategy', 'analysis', 'breakdown', 'form', 'stance'];
  const hasTechnicalTerms = technicalTerms.some(term => commentLower.includes(term));
  
  if (hasTechnicalTerms) {
    adjustedConfidence *= 0.6;
    adjustmentReasons.push('Contains technical analysis terminology');
  }
  
  // Increase confidence for personal attacks (not acceptable even in sports context)
  const personalAttacks = ['you suck', 'you\'re stupid', 'idiot', 'moron', 'loser'];
  const hasPersonalAttacks = personalAttacks.some(attack => commentLower.includes(attack));
  
  if (hasPersonalAttacks) {
    adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.3);
    adjustmentReasons.push('Contains personal attacks');
  }
  
  return {
    ...analysisResult,
    confidence: adjustedConfidence,
    originalConfidence: analysisResult.confidence,
    contextAdjustments: adjustmentReasons,
    combatSportsContext: {
      hasLegitimateTerms,
      hasContextSensitiveTerms,
      hasTechnicalTerms,
      hasPersonalAttacks
    }
  };
}

/**
 * Determine final moderation action
 * @param {Object} analysisResult - Analysis result
 * @param {Object} context - Comment context
 * @returns {Object} Final action decision
 */
function determineFinalAction(analysisResult, context) {
  const { confidence, flags } = analysisResult;
  const thresholds = COMMENT_MODERATION_CONFIG.THRESHOLDS;
  
  let action = 'approve';
  let actionReason = 'Comment passed moderation checks';
  
  // Check for immediate rejection criteria
  if (confidence >= thresholds.SHADOW_BAN || flags.includes('hate_speech')) {
    action = 'shadow_ban';
    actionReason = 'High confidence violation or hate speech detected';
  } else if (confidence >= thresholds.AUTO_HIDE || flags.includes('harassment')) {
    action = 'hide';
    actionReason = 'Moderate confidence violation detected';
  } else if (confidence >= thresholds.MANUAL_REVIEW) {
    action = 'manual_review';
    actionReason = 'Requires human review';
  } else if (confidence <= thresholds.AUTO_APPROVE) {
    action = 'approve';
    actionReason = 'Low risk content';
  } else {
    action = 'approve_with_warning';
    actionReason = 'Borderline content - approved with monitoring';
  }
  
  // Check user history for escalation
  const userHistory = getUserModerationHistory(context.userId);
  if (userHistory.recentViolations > 3) {
    if (action === 'approve_with_warning') {
      action = 'manual_review';
      actionReason += ' (escalated due to user history)';
    } else if (action === 'hide') {
      action = 'shadow_ban';
      actionReason += ' (escalated due to user history)';
    }
  }
  
  return {
    ...analysisResult,
    action,
    actionReason,
    finalConfidence: confidence,
    userHistory,
    timestamp: new Date().toISOString()
  };
}

/**
 * Log moderation decision for analytics
 * @param {Object} decision - Moderation decision
 * @param {Object} context - Comment context
 */
function logModerationDecision(decision, context) {
  // In production, this would log to analytics service
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: decision.action,
    confidence: decision.finalConfidence,
    flags: decision.flags,
    userId: context.userId,
    videoId: context.videoId,
    automated: true
  };
  
  // Store in local storage for demo purposes
  const existingLogs = JSON.parse(localStorage.getItem('moderation_logs') || '[]');
  existingLogs.push(logEntry);
  
  // Keep only last 1000 entries
  if (existingLogs.length > 1000) {
    existingLogs.splice(0, existingLogs.length - 1000);
  }
  
  localStorage.setItem('moderation_logs', JSON.stringify(existingLogs));
}

/**
 * Get user activity for rate limiting (mock implementation)
 * @param {string} userId - User ID
 * @returns {Array} Array of timestamps
 */
function getUserActivity(userId) {
  // In production, this would query a database
  const key = `user_activity_${userId}`;
  const activity = JSON.parse(localStorage.getItem(key) || '[]');
  
  // Add current timestamp
  activity.push(Date.now());
  
  // Keep only last 24 hours
  const oneDayAgo = Date.now() - 86400000;
  const recentActivity = activity.filter(timestamp => timestamp > oneDayAgo);
  
  localStorage.setItem(key, JSON.stringify(recentActivity));
  return recentActivity;
}

/**
 * Get user moderation history (mock implementation)
 * @param {string} userId - User ID
 * @returns {Object} User moderation history
 */
function getUserModerationHistory(userId) {
  // In production, this would query a database
  const key = `user_moderation_${userId}`;
  const defaultHistory = {
    totalComments: 0,
    approvedComments: 0,
    flaggedComments: 0,
    recentViolations: 0,
    lastViolation: null,
    trustScore: 1.0
  };
  
  return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultHistory));
}

/**
 * Update user moderation history
 * @param {string} userId - User ID
 * @param {Object} decision - Moderation decision
 */
export function updateUserModerationHistory(userId, decision) {
  const history = getUserModerationHistory(userId);
  
  history.totalComments++;
  
  if (decision.action === 'approve' || decision.action === 'approve_with_warning') {
    history.approvedComments++;
  } else {
    history.flaggedComments++;
    
    // Count as recent violation if action is hide or shadow_ban
    if (decision.action === 'hide' || decision.action === 'shadow_ban') {
      history.recentViolations++;
      history.lastViolation = new Date().toISOString();
    }
  }
  
  // Calculate trust score
  history.trustScore = history.totalComments > 0 
    ? history.approvedComments / history.totalComments 
    : 1.0;
  
  const key = `user_moderation_${userId}`;
  localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Get moderation statistics
 * @param {Object} filters - Date range and other filters
 * @returns {Object} Moderation statistics
 */
export function getModerationStats(filters = {}) {
  const logs = JSON.parse(localStorage.getItem('moderation_logs') || '[]');
  
  // Apply date filters
  let filteredLogs = logs;
  if (filters.startDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= new Date(filters.startDate)
    );
  }
  if (filters.endDate) {
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= new Date(filters.endDate)
    );
  }
  
  const total = filteredLogs.length;
  const approved = filteredLogs.filter(log => log.action === 'approve').length;
  const hidden = filteredLogs.filter(log => log.action === 'hide').length;
  const shadowBanned = filteredLogs.filter(log => log.action === 'shadow_ban').length;
  const manualReview = filteredLogs.filter(log => log.action === 'manual_review').length;
  
  return {
    total,
    approved,
    hidden,
    shadowBanned,
    manualReview,
    approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : 0,
    flagRate: total > 0 ? ((hidden + shadowBanned) / total * 100).toFixed(1) : 0,
    averageConfidence: total > 0 
      ? (filteredLogs.reduce((sum, log) => sum + log.confidence, 0) / total).toFixed(3)
      : 0,
    topFlags: getTopFlags(filteredLogs)
  };
}

/**
 * Get top violation flags from logs
 * @param {Array} logs - Moderation logs
 * @returns {Array} Top flags with counts
 */
function getTopFlags(logs) {
  const flagCounts = {};
  
  logs.forEach(log => {
    if (log.flags && Array.isArray(log.flags)) {
      log.flags.forEach(flag => {
        flagCounts[flag] = (flagCounts[flag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(flagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([flag, count]) => ({ flag, count }));
}

export default {
  moderateComment,
  batchModerateComments,
  updateUserModerationHistory,
  getModerationStats,
  COMMENT_MODERATION_CONFIG
};

