import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || 'demo-key',
  dangerouslyAllowBrowser: true // For demo purposes - in production, use backend
});

// Moderation confidence thresholds
const MODERATION_THRESHOLDS = {
  AUTO_APPROVE: 0.1,    // Below this threshold, auto-approve
  AUTO_REJECT: 0.8,     // Above this threshold, auto-reject
  MANUAL_REVIEW: 0.5    // Between thresholds, flag for manual review
};

// Content categories for combat sports context
const COMBAT_SPORTS_CONTEXT = {
  LEGITIMATE_VIOLENCE: [
    'sanctioned combat sports',
    'professional fighting',
    'martial arts competition',
    'boxing match',
    'MMA bout',
    'wrestling match'
  ],
  INAPPROPRIATE_CONTENT: [
    'unsanctioned violence',
    'street fighting',
    'animal cruelty',
    'graphic injury',
    'hate speech',
    'harassment'
  ]
};

export class ModerationService {
  constructor() {
    this.isDemo = !process.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY === 'demo-key';
  }

  /**
   * Analyze video content for moderation
   * @param {Object} videoData - Video metadata and content
   * @returns {Promise<Object>} Moderation result
   */
  async analyzeVideo(videoData) {
    try {
      if (this.isDemo) {
        return this._generateDemoVideoAnalysis(videoData);
      }

      // Extract key frames for analysis (in production, this would be done server-side)
      const analysisPrompt = this._buildVideoAnalysisPrompt(videoData);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: "You are a content moderator specializing in combat sports content. Analyze content for policy violations while understanding the context of legitimate combat sports."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 500
      });

      return this._parseVideoAnalysisResponse(response.choices[0].message.content, videoData);
    } catch (error) {
      console.error('Video analysis error:', error);
      return this._generateErrorResponse(videoData, 'video_analysis_failed');
    }
  }

  /**
   * Analyze comment for moderation
   * @param {string} comment - Comment text
   * @param {Object} context - Additional context (user, video, etc.)
   * @returns {Promise<Object>} Moderation result
   */
  async analyzeComment(comment, context = {}) {
    try {
      if (this.isDemo) {
        return this._generateDemoCommentAnalysis(comment, context);
      }

      const response = await openai.moderations.create({
        input: comment,
      });

      const openaiResult = response.results[0];
      
      // Enhanced analysis with combat sports context
      const contextualAnalysis = await this._analyzeCommentContext(comment, context);
      
      return this._buildCommentModerationResult(comment, openaiResult, contextualAnalysis, context);
    } catch (error) {
      console.error('Comment analysis error:', error);
      return this._generateErrorResponse({ comment, context }, 'comment_analysis_failed');
    }
  }

  /**
   * Batch analyze multiple comments
   * @param {Array} comments - Array of comment objects
   * @returns {Promise<Array>} Array of moderation results
   */
  async batchAnalyzeComments(comments) {
    const results = await Promise.allSettled(
      comments.map(comment => this.analyzeComment(comment.text, comment.context))
    );

    return results.map((result, index) => ({
      commentId: comments[index].id,
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * Get moderation statistics
   * @param {Object} filters - Date range and other filters
   * @returns {Object} Moderation statistics
   */
  getModerationStats(filters = {}) {
    // In production, this would query a database
    return {
      totalAnalyzed: 15420,
      autoApproved: 12336,
      autoRejected: 1542,
      manualReview: 1542,
      averageProcessingTime: 2.3, // seconds
      accuracyRate: 94.2, // percentage
      falsePositiveRate: 3.1,
      falseNegativeRate: 2.7,
      topViolationTypes: [
        { type: 'harassment', count: 423 },
        { type: 'spam', count: 312 },
        { type: 'inappropriate_violence', count: 156 },
        { type: 'hate_speech', count: 89 }
      ]
    };
  }

  // Private helper methods

  _buildVideoAnalysisPrompt(videoData) {
    return `
Analyze this combat sports video for content policy violations:

Title: ${videoData.title}
Description: ${videoData.description}
Category: ${videoData.category}
Organization: ${videoData.organization}
Fighters: ${videoData.fighters?.join(', ') || 'Unknown'}
Tags: ${videoData.tags?.join(', ') || 'None'}

Context: This is a combat sports platform featuring legitimate martial arts, boxing, MMA, and other sanctioned combat sports.

Please evaluate for:
1. Inappropriate violence (non-sanctioned, street fights, etc.)
2. Graphic content beyond normal combat sports
3. Hate speech or discriminatory content
4. Spam or misleading information
5. Copyright violations

Provide a confidence score (0-1) and specific reasoning for any flags.
`;
  }

  _parseVideoAnalysisResponse(response, videoData) {
    // Parse AI response and extract moderation decision
    const confidenceMatch = response.match(/confidence[:\s]*([0-9.]+)/i);
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    
    const flags = this._extractFlags(response);
    const action = this._determineAction(confidence, flags);
    
    return {
      id: `video_${videoData.id}_${Date.now()}`,
      contentType: 'video',
      contentId: videoData.id,
      confidence,
      action,
      flags,
      reasoning: response,
      timestamp: new Date().toISOString(),
      reviewRequired: action === 'manual_review',
      metadata: {
        title: videoData.title,
        category: videoData.category,
        duration: videoData.duration
      }
    };
  }

  async _analyzeCommentContext(comment, context) {
    if (this.isDemo) {
      return { contextScore: 0.2, combatSportsRelated: true };
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Analyze this comment in the context of combat sports discussions. Determine if language that might seem aggressive is actually normal sports commentary."
          },
          {
            role: "user",
            content: `Comment: "${comment}"\nVideo context: ${context.videoTitle || 'Combat sports video'}`
          }
        ],
        max_tokens: 200
      });

      return {
        contextScore: 0.3,
        combatSportsRelated: true,
        analysis: response.choices[0].message.content
      };
    } catch (error) {
      return { contextScore: 0.5, combatSportsRelated: false };
    }
  }

  _buildCommentModerationResult(comment, openaiResult, contextualAnalysis, context) {
    const baseConfidence = Math.max(...Object.values(openaiResult.category_scores));
    
    // Adjust confidence based on combat sports context
    const adjustedConfidence = contextualAnalysis.combatSportsRelated 
      ? baseConfidence * 0.7  // Reduce confidence for sports-related aggressive language
      : baseConfidence;

    const flags = this._extractCommentFlags(openaiResult, contextualAnalysis);
    const action = this._determineAction(adjustedConfidence, flags);

    return {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentType: 'comment',
      content: comment,
      confidence: adjustedConfidence,
      action,
      flags,
      reasoning: `OpenAI moderation + contextual analysis. Combat sports context: ${contextualAnalysis.combatSportsRelated}`,
      timestamp: new Date().toISOString(),
      reviewRequired: action === 'manual_review',
      metadata: {
        userId: context.userId,
        videoId: context.videoId,
        originalScores: openaiResult.category_scores
      }
    };
  }

  _extractFlags(response) {
    const flags = [];
    const flagKeywords = {
      'inappropriate_violence': ['inappropriate', 'unsanctioned', 'street fight'],
      'graphic_content': ['graphic', 'excessive', 'disturbing'],
      'hate_speech': ['hate', 'discriminatory', 'racist'],
      'spam': ['spam', 'misleading', 'fake'],
      'copyright': ['copyright', 'unauthorized', 'stolen']
    };

    Object.entries(flagKeywords).forEach(([flag, keywords]) => {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        flags.push(flag);
      }
    });

    return flags;
  }

  _extractCommentFlags(openaiResult, contextualAnalysis) {
    const flags = [];
    
    Object.entries(openaiResult.categories).forEach(([category, flagged]) => {
      if (flagged) {
        flags.push(category);
      }
    });

    if (contextualAnalysis.contextScore > 0.7) {
      flags.push('context_inappropriate');
    }

    return flags;
  }

  _determineAction(confidence, flags) {
    if (confidence < MODERATION_THRESHOLDS.AUTO_APPROVE && flags.length === 0) {
      return 'approve';
    } else if (confidence > MODERATION_THRESHOLDS.AUTO_REJECT || flags.includes('hate_speech')) {
      return 'reject';
    } else {
      return 'manual_review';
    }
  }

  _generateDemoVideoAnalysis(videoData) {
    // Generate realistic demo data based on video content
    const demoScenarios = [
      {
        confidence: 0.05,
        action: 'approve',
        flags: [],
        reasoning: 'Clean combat sports content with professional production quality.'
      },
      {
        confidence: 0.65,
        action: 'manual_review',
        flags: ['graphic_content'],
        reasoning: 'Contains graphic knockout footage that may require review for sensitive viewers.'
      },
      {
        confidence: 0.15,
        action: 'approve',
        flags: [],
        reasoning: 'Standard highlight reel with appropriate combat sports content.'
      }
    ];

    const scenario = demoScenarios[Math.floor(Math.random() * demoScenarios.length)];
    
    return {
      id: `demo_video_${videoData.id}_${Date.now()}`,
      contentType: 'video',
      contentId: videoData.id,
      confidence: scenario.confidence,
      action: scenario.action,
      flags: scenario.flags,
      reasoning: scenario.reasoning,
      timestamp: new Date().toISOString(),
      reviewRequired: scenario.action === 'manual_review',
      metadata: {
        title: videoData.title,
        category: videoData.category,
        duration: videoData.duration,
        isDemo: true
      }
    };
  }

  _generateDemoCommentAnalysis(comment, context) {
    // Generate demo analysis based on comment content
    const toxicKeywords = ['hate', 'stupid', 'terrible', 'worst', 'sucks'];
    const hasToxicContent = toxicKeywords.some(keyword => 
      comment.toLowerCase().includes(keyword)
    );

    const confidence = hasToxicContent ? 0.7 : 0.1;
    const flags = hasToxicContent ? ['harassment'] : [];
    const action = this._determineAction(confidence, flags);

    return {
      id: `demo_comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentType: 'comment',
      content: comment,
      confidence,
      action,
      flags,
      reasoning: `Demo analysis: ${hasToxicContent ? 'Detected potentially toxic language' : 'Clean comment content'}`,
      timestamp: new Date().toISOString(),
      reviewRequired: action === 'manual_review',
      metadata: {
        userId: context.userId,
        videoId: context.videoId,
        isDemo: true
      }
    };
  }

  _generateErrorResponse(data, errorType) {
    return {
      id: `error_${Date.now()}`,
      contentType: data.comment ? 'comment' : 'video',
      error: true,
      errorType,
      action: 'manual_review', // Default to manual review on errors
      confidence: 0.5,
      flags: ['analysis_error'],
      reasoning: 'Analysis failed - requires manual review',
      timestamp: new Date().toISOString(),
      reviewRequired: true,
      metadata: { originalData: data }
    };
  }
}

// Export singleton instance
export const moderationService = new ModerationService();
export default moderationService;

