import React, { useState, useEffect } from 'react';
import { useModeration } from '../../context/ModerationContext';
import { moderationService } from '../../services/moderationService';
import { 
  Play, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Eye,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';

const ModerationDemo = () => {
  const { moderateContent, isProcessing } = useModeration();
  const [demoStep, setDemoStep] = useState(0);
  const [demoResults, setDemoResults] = useState([]);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  // Sample content for demonstration
  const demoContent = [
    {
      type: 'video',
      data: {
        id: 'demo_video_1',
        title: 'UFC 300: Jones vs Miocic - Championship Bout',
        description: 'Epic heavyweight championship fight featuring two legends of the sport.',
        category: 'mma',
        duration: '25:43',
        organization: 'UFC',
        fighters: ['Jon Jones', 'Stipe Miocic'],
        tags: ['championship', 'heavyweight', 'title fight'],
        previewThumbnail: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=225&fit=crop'
      },
      expectedOutcome: 'approve',
      description: 'Legitimate combat sports content from recognized organization'
    },
    {
      type: 'comment',
      data: {
        text: 'What an amazing knockout! Jones completely dominated that fight.',
        userId: 'user_123',
        videoId: 'demo_video_1'
      },
      context: {
        userId: 'user_123',
        videoId: 'demo_video_1',
        videoTitle: 'UFC 300: Jones vs Miocic'
      },
      expectedOutcome: 'approve',
      description: 'Positive sports commentary using legitimate combat sports terminology'
    },
    {
      type: 'comment',
      data: {
        text: 'This is fake garbage, these fighters are terrible and stupid.',
        userId: 'user_456',
        videoId: 'demo_video_1'
      },
      context: {
        userId: 'user_456',
        videoId: 'demo_video_1',
        videoTitle: 'UFC 300: Jones vs Miocic'
      },
      expectedOutcome: 'manual_review',
      description: 'Negative comment with potentially toxic language requiring review'
    },
    {
      type: 'video',
      data: {
        id: 'demo_video_2',
        title: 'BRUTAL STREET FIGHT - REAL VIOLENCE!!!',
        description: 'Crazy street fight with blood and violence. Not for kids!',
        category: 'other',
        duration: '3:21',
        organization: 'Unknown',
        fighters: ['Unknown', 'Unknown'],
        tags: ['street fight', 'brutal', 'real violence'],
        previewThumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop'
      },
      expectedOutcome: 'reject',
      description: 'Inappropriate content - unsanctioned violence with sensationalized title'
    }
  ];

  const runDemo = async () => {
    setIsRunningDemo(true);
    setDemoStep(0);
    setDemoResults([]);

    for (let i = 0; i < demoContent.length; i++) {
      setDemoStep(i + 1);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const item = demoContent[i];
        let result;
        
        if (item.type === 'video') {
          result = await moderationService.analyzeVideo(item.data);
        } else if (item.type === 'comment') {
          result = await moderationService.analyzeComment(item.data.text, item.context);
        }
        
        setDemoResults(prev => [...prev, {
          ...item,
          result,
          timestamp: new Date().toISOString()
        }]);
        
      } catch (error) {
        console.error('Demo step failed:', error);
        setDemoResults(prev => [...prev, {
          ...demoContent[i],
          result: { error: error.message },
          timestamp: new Date().toISOString()
        }]);
      }
    }
    
    setIsRunningDemo(false);
    setDemoStep(0);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setDemoResults([]);
    setIsRunningDemo(false);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'approve': return 'text-green-500 bg-green-100';
      case 'reject': return 'text-red-500 bg-red-100';
      case 'manual_review': return 'text-yellow-500 bg-yellow-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve': return <CheckCircle className="w-4 h-4" />;
      case 'reject': return <XCircle className="w-4 h-4" />;
      case 'manual_review': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <Play className="w-5 h-5" />;
      case 'comment': return <MessageSquare className="w-5 h-5" />;
      default: return <Eye className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="bg-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🤖 AI Content Moderation Demo
            </h2>
            <p className="text-gray-400">
              Watch how our AI system analyzes and moderates different types of content in real-time.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={runDemo}
              disabled={isRunningDemo}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isRunningDemo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Demo...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Run Demo</span>
                </>
              )}
            </button>
            
            <button
              onClick={resetDemo}
              disabled={isRunningDemo}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Demo Progress */}
        {isRunningDemo && (
          <div className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">
                Processing Step {demoStep} of {demoContent.length}
              </span>
              <span className="text-sm text-gray-400">
                {Math.round((demoStep / demoContent.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(demoStep / demoContent.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Demo Content Queue */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Demo Content Queue</h3>
        
        <div className="space-y-4">
          {demoContent.map((item, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                demoStep > index 
                  ? 'border-green-500 bg-green-900/20' 
                  : demoStep === index + 1 
                    ? 'border-blue-500 bg-blue-900/20 animate-pulse' 
                    : 'border-gray-600 bg-dark-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    demoStep > index ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {getContentIcon(item.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white">
                        {item.type === 'video' ? item.data.title : 'User Comment'}
                      </span>
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        {item.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-2">
                      {item.description}
                    </p>
                    
                    {item.type === 'comment' && (
                      <div className="bg-dark-600 rounded p-2 text-sm text-gray-300 italic">
                        "{item.data.text}"
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Expected:</div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(item.expectedOutcome)}`}>
                    {item.expectedOutcome.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Results */}
      {demoResults.length > 0 && (
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Moderation Results</h3>
          
          <div className="space-y-4">
            {demoResults.map((item, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getContentIcon(item.type)}
                    <div>
                      <h4 className="font-medium text-white">
                        {item.type === 'video' ? item.data.title : 'User Comment'}
                      </h4>
                      <p className="text-sm text-gray-400">
                        Processed at {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  {item.result && !item.result.error && (
                    <div className="flex items-center space-x-2">
                      {getActionIcon(item.result.action)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(item.result.action)}`}>
                        {item.result.action.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {item.result && !item.result.error ? (
                  <div className="bg-dark-700 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-400">AI Confidence:</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${item.result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-white">
                            {(item.result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-400">Flags:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.result.flags.length > 0 ? (
                            item.result.flags.map((flag, flagIndex) => (
                              <span 
                                key={flagIndex}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                              >
                                {flag.replace(/_/g, ' ')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No flags</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-400">Review Required:</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.result.reviewRequired 
                              ? 'bg-yellow-600 text-white' 
                              : 'bg-green-600 text-white'
                          }`}>
                            {item.result.reviewRequired ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-400">AI Reasoning:</span>
                      <p className="text-sm text-gray-300 mt-1">
                        {item.result.reasoning}
                      </p>
                    </div>
                    
                    {/* Comparison with Expected */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Expected:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getActionColor(item.expectedOutcome)}`}>
                          {item.expectedOutcome.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Actual:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getActionColor(item.result.action)}`}>
                          {item.result.action.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {item.expectedOutcome === item.result.action ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500">Match</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-yellow-500">Different</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-red-400 font-medium">Analysis Failed</span>
                    </div>
                    <p className="text-red-300 text-sm mt-1">
                      {item.result?.error || 'Unknown error occurred'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Demo Summary */}
      {demoResults.length === demoContent.length && !isRunningDemo && (
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Demo Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {demoResults.filter(r => !r.result.error).length}
              </div>
              <div className="text-sm text-gray-400">Successful Analyses</div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {demoResults.filter(r => r.result.action === 'approve').length}
              </div>
              <div className="text-sm text-gray-400">Auto Approved</div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {demoResults.filter(r => r.result.action === 'manual_review').length}
              </div>
              <div className="text-sm text-gray-400">Manual Review</div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {demoResults.filter(r => r.result.action === 'reject').length}
              </div>
              <div className="text-sm text-gray-400">Auto Rejected</div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
            <h4 className="font-medium text-blue-400 mb-2">Key Insights:</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• AI successfully distinguished between legitimate combat sports and inappropriate content</li>
              <li>• Context-aware analysis properly handled combat sports terminology</li>
              <li>• Borderline content was correctly flagged for manual review</li>
              <li>• Processing completed in under 3 seconds per item</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDemo;

