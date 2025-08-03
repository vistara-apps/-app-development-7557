/**
 * Video Analysis Utilities for Content Moderation
 * Handles video frame extraction, content analysis, and processing workflows
 */

// Video analysis configuration
export const VIDEO_ANALYSIS_CONFIG = {
  FRAME_EXTRACTION: {
    INTERVAL_SECONDS: 10,     // Extract frame every 10 seconds
    MAX_FRAMES: 20,           // Maximum frames to analyze per video
    QUALITY: 'medium',        // Frame quality for analysis
    FORMAT: 'jpeg'            // Output format
  },
  ANALYSIS_TYPES: {
    VIOLENCE_DETECTION: 'violence',
    INAPPROPRIATE_CONTENT: 'inappropriate',
    GRAPHIC_CONTENT: 'graphic',
    COPYRIGHT_DETECTION: 'copyright',
    SPAM_DETECTION: 'spam'
  },
  PROCESSING_PRIORITY: {
    HIGH: 'high',      // Live streams, premium content
    NORMAL: 'normal',  // Regular uploads
    LOW: 'low'         // Batch processing
  }
};

/**
 * Extract key frames from video for analysis
 * @param {string} videoUrl - URL of the video to analyze
 * @param {Object} options - Extraction options
 * @returns {Promise<Array>} Array of extracted frame data
 */
export async function extractVideoFrames(videoUrl, options = {}) {
  const config = { ...VIDEO_ANALYSIS_CONFIG.FRAME_EXTRACTION, ...options };
  
  try {
    // In a real implementation, this would use FFmpeg or similar
    // For demo purposes, we'll simulate frame extraction
    const mockFrames = generateMockFrames(videoUrl, config);
    
    return {
      success: true,
      frames: mockFrames,
      metadata: {
        totalFrames: mockFrames.length,
        extractionTime: Date.now(),
        videoUrl,
        config
      }
    };
  } catch (error) {
    console.error('Frame extraction failed:', error);
    return {
      success: false,
      error: error.message,
      frames: []
    };
  }
}

/**
 * Analyze video metadata for initial screening
 * @param {Object} videoData - Video metadata
 * @returns {Object} Initial analysis results
 */
export function analyzeVideoMetadata(videoData) {
  const flags = [];
  let riskScore = 0;

  // Title analysis
  const titleFlags = analyzeTitleContent(videoData.title);
  flags.push(...titleFlags);
  riskScore += titleFlags.length * 0.1;

  // Description analysis
  const descriptionFlags = analyzeDescriptionContent(videoData.description);
  flags.push(...descriptionFlags);
  riskScore += descriptionFlags.length * 0.05;

  // Tags analysis
  const tagFlags = analyzeTagContent(videoData.tags || []);
  flags.push(...tagFlags);
  riskScore += tagFlags.length * 0.03;

  // Duration analysis (very long or very short videos might be suspicious)
  const durationFlag = analyzeDuration(videoData.duration);
  if (durationFlag) {
    flags.push(durationFlag);
    riskScore += 0.1;
  }

  // Combat sports context validation
  const combatSportsScore = validateCombatSportsContext(videoData);
  riskScore = Math.max(0, riskScore - combatSportsScore * 0.2);

  return {
    riskScore: Math.min(1, riskScore),
    flags: [...new Set(flags)], // Remove duplicates
    combatSportsLegitimacy: combatSportsScore,
    requiresDeepAnalysis: riskScore > 0.3,
    metadata: {
      titleAnalysis: titleFlags,
      descriptionAnalysis: descriptionFlags,
      tagAnalysis: tagFlags,
      durationAnalysis: durationFlag
    }
  };
}

/**
 * Process video through complete analysis pipeline
 * @param {Object} videoData - Complete video data
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Complete analysis results
 */
export async function processVideoAnalysis(videoData, options = {}) {
  const startTime = Date.now();
  const results = {
    videoId: videoData.id,
    status: 'processing',
    stages: {},
    overallResult: null,
    processingTime: 0
  };

  try {
    // Stage 1: Metadata Analysis
    results.stages.metadata = analyzeVideoMetadata(videoData);
    
    // Stage 2: Frame Extraction (if needed)
    if (results.stages.metadata.requiresDeepAnalysis) {
      results.stages.frameExtraction = await extractVideoFrames(videoData.contentFile);
      
      // Stage 3: AI Content Analysis
      if (results.stages.frameExtraction.success) {
        results.stages.aiAnalysis = await performAIAnalysis(
          results.stages.frameExtraction.frames,
          videoData
        );
      }
    }

    // Stage 4: Aggregate Results
    results.overallResult = aggregateAnalysisResults(results.stages, videoData);
    results.status = 'completed';
    
  } catch (error) {
    console.error('Video analysis pipeline failed:', error);
    results.status = 'failed';
    results.error = error.message;
    results.overallResult = {
      action: 'manual_review',
      confidence: 0.5,
      flags: ['analysis_error'],
      reasoning: 'Analysis pipeline failed - requires manual review'
    };
  }

  results.processingTime = Date.now() - startTime;
  return results;
}

/**
 * Validate combat sports context legitimacy
 * @param {Object} videoData - Video metadata
 * @returns {number} Legitimacy score (0-1)
 */
function validateCombatSportsContext(videoData) {
  let score = 0;

  // Check for legitimate organizations
  const legitimateOrgs = [
    'UFC', 'Bellator', 'ONE Championship', 'PFL', 'Strikeforce',
    'WBC', 'WBA', 'IBF', 'WBO', 'Golden Boy', 'Top Rank',
    'Glory', 'K-1', 'Rizin', 'Invicta FC'
  ];
  
  if (legitimateOrgs.some(org => 
    videoData.organization?.toLowerCase().includes(org.toLowerCase())
  )) {
    score += 0.4;
  }

  // Check for professional fighter names (simplified check)
  const professionalIndicators = [
    'championship', 'title', 'belt', 'professional', 'pro',
    'main event', 'co-main', 'undercard', 'bout', 'fight night'
  ];
  
  const content = `${videoData.title} ${videoData.description}`.toLowerCase();
  const indicatorMatches = professionalIndicators.filter(indicator => 
    content.includes(indicator)
  ).length;
  
  score += Math.min(0.4, indicatorMatches * 0.1);

  // Check for legitimate weight classes
  const weightClasses = [
    'heavyweight', 'light heavyweight', 'middleweight', 'welterweight',
    'lightweight', 'featherweight', 'bantamweight', 'flyweight',
    'strawweight', 'atomweight'
  ];
  
  if (weightClasses.some(weight => 
    videoData.weightClass?.toLowerCase().includes(weight)
  )) {
    score += 0.2;
  }

  return Math.min(1, score);
}

/**
 * Analyze title content for flags
 * @param {string} title - Video title
 * @returns {Array} Array of flags
 */
function analyzeTitleContent(title) {
  const flags = [];
  const titleLower = title.toLowerCase();

  // Inappropriate violence indicators
  const violenceFlags = [
    'street fight', 'real fight', 'brutal beating', 'knockout compilation',
    'savage', 'destroyed', 'murdered', 'killed'
  ];
  
  if (violenceFlags.some(flag => titleLower.includes(flag))) {
    flags.push('inappropriate_violence');
  }

  // Clickbait indicators
  const clickbaitFlags = [
    'you won\'t believe', 'shocking', 'insane', 'crazy', 'unbelievable',
    'gone wrong', 'gone sexual', 'prank'
  ];
  
  if (clickbaitFlags.some(flag => titleLower.includes(flag))) {
    flags.push('potential_clickbait');
  }

  // Spam indicators
  if (titleLower.includes('free') && titleLower.includes('download')) {
    flags.push('potential_spam');
  }

  return flags;
}

/**
 * Analyze description content for flags
 * @param {string} description - Video description
 * @returns {Array} Array of flags
 */
function analyzeDescriptionContent(description) {
  const flags = [];
  const descLower = description.toLowerCase();

  // Check for external links (potential spam)
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = description.match(urlPattern) || [];
  if (urls.length > 3) {
    flags.push('excessive_links');
  }

  // Check for promotional content
  const promoKeywords = [
    'subscribe', 'like and subscribe', 'hit the bell', 'notification',
    'check out my', 'follow me', 'buy now', 'discount code'
  ];
  
  const promoCount = promoKeywords.filter(keyword => 
    descLower.includes(keyword)
  ).length;
  
  if (promoCount > 2) {
    flags.push('excessive_promotion');
  }

  return flags;
}

/**
 * Analyze tags for inappropriate content
 * @param {Array} tags - Video tags
 * @returns {Array} Array of flags
 */
function analyzeTagContent(tags) {
  const flags = [];
  const tagString = tags.join(' ').toLowerCase();

  // Inappropriate tags
  const inappropriateTags = [
    'gore', 'blood', 'death', 'kill', 'murder', 'torture',
    'nsfw', 'adult', 'xxx', 'porn'
  ];
  
  if (inappropriateTags.some(tag => tagString.includes(tag))) {
    flags.push('inappropriate_tags');
  }

  // Spam tags
  if (tags.length > 20) {
    flags.push('tag_spam');
  }

  return flags;
}

/**
 * Analyze video duration for anomalies
 * @param {string} duration - Duration string (e.g., "15:32")
 * @returns {string|null} Duration flag or null
 */
function analyzeDuration(duration) {
  if (!duration) return null;

  const [minutes, seconds] = duration.split(':').map(Number);
  const totalSeconds = minutes * 60 + seconds;

  // Very short videos might be spam or inappropriate
  if (totalSeconds < 10) {
    return 'suspiciously_short';
  }

  // Very long videos might be unedited or inappropriate
  if (totalSeconds > 7200) { // 2 hours
    return 'suspiciously_long';
  }

  return null;
}

/**
 * Generate mock frames for demo purposes
 * @param {string} videoUrl - Video URL
 * @param {Object} config - Extraction config
 * @returns {Array} Mock frame data
 */
function generateMockFrames(videoUrl, config) {
  const frameCount = Math.min(config.MAX_FRAMES, 8);
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    frames.push({
      id: `frame_${i}`,
      timestamp: i * config.INTERVAL_SECONDS,
      url: `${videoUrl}#t=${i * config.INTERVAL_SECONDS}`,
      confidence: Math.random() * 0.3 + 0.1, // Low confidence for demo
      analysis: {
        violence: Math.random() * 0.2,
        inappropriate: Math.random() * 0.1,
        graphic: Math.random() * 0.15
      }
    });
  }

  return frames;
}

/**
 * Perform AI analysis on extracted frames
 * @param {Array} frames - Extracted frames
 * @param {Object} videoData - Video metadata
 * @returns {Promise<Object>} AI analysis results
 */
async function performAIAnalysis(frames, videoData) {
  // In production, this would send frames to AI service
  // For demo, we'll simulate analysis results
  
  const analysisResults = frames.map(frame => ({
    frameId: frame.id,
    timestamp: frame.timestamp,
    confidence: frame.confidence,
    flags: frame.confidence > 0.2 ? ['potential_issue'] : [],
    analysis: frame.analysis
  }));

  const overallConfidence = analysisResults.reduce(
    (sum, result) => sum + result.confidence, 0
  ) / analysisResults.length;

  return {
    frameAnalysis: analysisResults,
    overallConfidence,
    highestRiskFrame: analysisResults.reduce(
      (max, current) => current.confidence > max.confidence ? current : max,
      analysisResults[0]
    ),
    processingTime: Math.random() * 5000 + 1000 // 1-6 seconds
  };
}

/**
 * Aggregate all analysis results into final decision
 * @param {Object} stages - All analysis stages
 * @param {Object} videoData - Original video data
 * @returns {Object} Final moderation decision
 */
function aggregateAnalysisResults(stages, videoData) {
  let finalConfidence = 0;
  const allFlags = [];
  let reasoning = [];

  // Weight metadata analysis
  if (stages.metadata) {
    finalConfidence += stages.metadata.riskScore * 0.3;
    allFlags.push(...stages.metadata.flags);
    reasoning.push(`Metadata analysis: ${stages.metadata.riskScore.toFixed(2)} risk score`);
  }

  // Weight AI analysis if available
  if (stages.aiAnalysis) {
    finalConfidence += stages.aiAnalysis.overallConfidence * 0.7;
    reasoning.push(`AI analysis: ${stages.aiAnalysis.overallConfidence.toFixed(2)} confidence`);
  }

  // Determine final action
  let action = 'approve';
  if (finalConfidence > 0.8) {
    action = 'reject';
  } else if (finalConfidence > 0.3 || allFlags.length > 2) {
    action = 'manual_review';
  }

  return {
    action,
    confidence: Math.min(1, finalConfidence),
    flags: [...new Set(allFlags)],
    reasoning: reasoning.join('; '),
    reviewRequired: action === 'manual_review',
    metadata: {
      analysisStages: Object.keys(stages),
      combatSportsLegitimacy: stages.metadata?.combatSportsLegitimacy || 0,
      processingComplete: true
    }
  };
}

export default {
  extractVideoFrames,
  analyzeVideoMetadata,
  processVideoAnalysis,
  validateCombatSportsContext,
  VIDEO_ANALYSIS_CONFIG
};

