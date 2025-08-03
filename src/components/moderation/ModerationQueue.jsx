import React, { useState } from 'react';
import { useModeration } from '../../context/ModerationContext';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Calendar,
  Filter,
  Search,
  ChevronDown,
  Play,
  MessageSquare
} from 'lucide-react';

const ModerationQueue = () => {
  const {
    moderationQueue,
    queueStats,
    filters,
    updateFilters,
    clearFilters,
    setSelectedQueueItem,
    performAdminReview,
    assignQueueItem,
    isProcessing
  } = useModeration();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter queue based on search term
  const filteredQueue = moderationQueue.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.preview.title.toLowerCase().includes(searchLower) ||
      item.preview.snippet.toLowerCase().includes(searchLower) ||
      item.contentId.toLowerCase().includes(searchLower)
    );
  });

  const handleReview = async (queueItemId, decision, reasoning = '') => {
    try {
      await performAdminReview(queueItemId, decision, reasoning);
    } catch (error) {
      alert(`Review failed: ${error.message}`);
    }
  };

  const handleAssign = async (queueItemId, adminId) => {
    try {
      await assignQueueItem(queueItemId, adminId);
    } catch (error) {
      alert(`Assignment failed: ${error.message}`);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-100';
      case 'normal': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getContentTypeIcon = (contentType) => {
    switch (contentType) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'comment': return <MessageSquare className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const formatWaitTime = (queuedAt) => {
    const waitTime = Date.now() - new Date(queuedAt).getTime();
    const minutes = Math.floor(waitTime / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Queue</p>
              <p className="text-2xl font-bold text-white">{queueStats.total}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">High Priority</p>
              <p className="text-2xl font-bold text-white">{queueStats.highPriority}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Unassigned</p>
              <p className="text-2xl font-bold text-white">{queueStats.unassigned}</p>
            </div>
            <User className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Wait Time</p>
              <p className="text-2xl font-bold text-white">{queueStats.averageWaitTime}m</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-dark-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search queue items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-white rounded-lg border border-gray-600 hover:border-red-500 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-600">
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="manual_review">Manual Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.contentType}
              onChange={(e) => updateFilters({ contentType: e.target.value })}
              className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="comment">Comments</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => updateFilters({ priority: e.target.value })}
              className="bg-dark-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Queue Items */}
      <div className="space-y-4">
        {filteredQueue.length === 0 ? (
          <div className="bg-dark-800 rounded-lg p-8 text-center">
            <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Queue is Empty</h3>
            <p className="text-gray-400">No items currently require moderation review.</p>
          </div>
        ) : (
          filteredQueue.map((item) => (
            <div key={item.id} className="bg-dark-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                {/* Content Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getContentTypeIcon(item.contentType)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-sm">
                      Queued {formatWaitTime(item.queuedAt)} ago
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {item.preview.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-3">
                    {item.preview.snippet}
                  </p>

                  {/* Moderation Details */}
                  {item.moderationResult && (
                    <div className="bg-dark-700 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          AI Confidence: {(item.moderationResult.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-400">
                          {item.moderationResult.flags.length} flags
                        </span>
                      </div>
                      
                      {item.moderationResult.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.moderationResult.flags.map((flag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                            >
                              {flag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-300">
                        {item.moderationResult.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Assignment Info */}
                  {item.assignedTo && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Assigned to: {item.assignedTo}</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail */}
                {item.preview.thumbnail && (
                  <div className="ml-4">
                    <img
                      src={item.preview.thumbnail}
                      alt={item.preview.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />
                    {item.preview.duration && (
                      <div className="text-xs text-gray-400 text-center mt-1">
                        {item.preview.duration}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedQueueItem(item)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review</span>
                  </button>
                  
                  <button
                    onClick={() => handleReview(item.id, 'approve', 'Quick approval')}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => handleReview(item.id, 'reject', 'Policy violation')}
                    disabled={isProcessing}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>

                {!item.assignedTo && (
                  <button
                    onClick={() => handleAssign(item.id, 'current_admin')}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Assign to Me
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModerationQueue;

