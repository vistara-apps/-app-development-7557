import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useVideoManagement } from '../hooks/useVideoManagement';
import { ADMIN_CONFIG, FEATURE_FLAGS } from '../config/features';
import VideoUploadForm from '../components/VideoUploadForm';
import { 
  Crown, 
  Coins, 
  Users, 
  Eye, 
  Settings, 
  BarChart3, 
  Shield, 
  Zap,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Video,
  Upload,
  Edit,
  Trash2,
  Play,
  Pause,
  MoreVertical,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { getMintingInfo, getOwnerBalance, getTokenSupply, transferTokens } = useToken();
  const { isAdmin, toggleFeature, FEATURE_FLAGS: currentFlags } = useFeatureFlags();
  const {
    videos,
    loading: videosLoading,
    error: videosError,
    pagination,
    loadVideos,
    createVideo,
    uploadVideo,
    updateVideo,
    deleteVideo,
    goToPage,
    clearError
  } = useVideoManagement();

  const [activeTab, setActiveTab] = useState('overview');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [stealthMode, setStealthMode] = useState(FEATURE_FLAGS.STEALTH_MODE);
  
  // Video management state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoFilters, setVideoFilters] = useState({
    search: '',
    category: '',
    status: 'ready',
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/';
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const mintingInfo = getMintingInfo();
  const ownerBalance = getOwnerBalance();
  const totalSupply = getTokenSupply();

  const handleTransferTokens = () => {
    if (!transferAmount || !transferAddress) return;
    
    const amount = parseInt(transferAmount);
    if (transferTokens(transferAddress, amount, 'Admin transfer')) {
      setTransferAmount('');
      setTransferAddress('');
      alert(`Successfully transferred ${amount} tokens to ${transferAddress}`);
    } else {
      alert('Transfer failed. Check balance and try again.');
    }
  };

  const toggleStealthMode = () => {
    const newMode = !stealthMode;
    setStealthMode(newMode);
    // In a real app, this would update the backend
    localStorage.setItem('admin_stealth_mode', newMode.toString());
    alert(`Stealth mode ${newMode ? 'enabled' : 'disabled'}. Refresh the page to see changes.`);
  };

  // Video management handlers
  const handleVideoUpload = async ({ metadata, videoFile, thumbnailFile, onProgress }) => {
    setIsUploading(true);
    try {
      // First create the video record
      const newVideo = await createVideo(metadata);
      
      // Then upload the files
      await uploadVideo(newVideo.id, videoFile, thumbnailFile, onProgress);
      
      setShowUploadForm(false);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoDelete = async (videoId, hardDelete = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'delete'} this video?`)) {
      return;
    }

    try {
      await deleteVideo(videoId, hardDelete);
      alert(`Video ${hardDelete ? 'permanently deleted' : 'deleted'} successfully!`);
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleVideoUpdate = async (videoId, updateData) => {
    try {
      await updateVideo(videoId, updateData);
      alert('Video updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert(`Update failed: ${error.message}`);
    }
  };

  const handleFilterChange = (filters) => {
    setVideoFilters(prev => ({ ...prev, ...filters }));
    loadVideos(filters);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const mockAnalytics = {
    totalUsers: 15420,
    activeUsers: 8930,
    totalViews: 2450000,
    revenue: 125000,
    growthRate: 23.5
  };

  return (
    <div className="min-h-screen bg-dark-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🔒 Phyght Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, {user?.username}. Manage your combat video platform.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-dark-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'videos', label: 'Video Management', icon: Video },
            { id: 'tokens', label: 'Token Management', icon: Coins },
            { id: 'features', label: 'Feature Control', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white">{mockAnalytics.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-white">{mockAnalytics.activeUsers.toLocaleString()}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-white">{mockAnalytics.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Growth Rate</p>
                    <p className="text-2xl font-bold text-white">+{mockAnalytics.growthRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Platform Status */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Platform Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <span className="text-gray-300">Stealth Mode</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    stealthMode ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {stealthMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <span className="text-gray-300">Token System</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    mintingInfo?.isMinted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {mintingInfo?.isMinted ? 'Minted' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Management Tab */}
        {activeTab === 'videos' && (
          <div className="space-y-6">
            {showUploadForm ? (
              <VideoUploadForm
                onUpload={handleVideoUpload}
                onCancel={() => setShowUploadForm(false)}
                isUploading={isUploading}
              />
            ) : (
              <>
                {/* Video Management Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Video Management</h3>
                  <button
                    onClick={() => setShowUploadForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Video</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="bg-dark-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={videoFilters.search}
                          onChange={(e) => handleFilterChange({ search: e.target.value })}
                          placeholder="Search videos..."
                          className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={videoFilters.status}
                        onChange={(e) => handleFilterChange({ status: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="ready">Ready</option>
                        <option value="processing">Processing</option>
                        <option value="uploading">Uploading</option>
                        <option value="failed">Failed</option>
                        <option value="deleted">Deleted</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <select
                        value={videoFilters.category}
                        onChange={(e) => handleFilterChange({ category: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Categories</option>
                        <option value="Combat Sports">Combat Sports</option>
                        <option value="MMA">MMA</option>
                        <option value="Boxing">Boxing</option>
                        <option value="Wrestling">Wrestling</option>
                        <option value="Martial Arts">Martial Arts</option>
                        <option value="Training">Training</option>
                        <option value="Highlights">Highlights</option>
                        <option value="Tutorials">Tutorials</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => loadVideos(videoFilters)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {videosError && (
                  <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-red-400 font-medium">Error</span>
                    </div>
                    <p className="text-red-300 text-sm mt-1">{videosError}</p>
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-300 text-sm mt-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Videos List */}
                <div className="bg-dark-800 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700">
                    <h4 className="text-lg font-medium text-white">
                      Videos ({pagination.total})
                    </h4>
                  </div>

                  {videosLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                      <span className="text-gray-400 ml-3">Loading videos...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-12">
                      <Video className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No videos found</p>
                      <button
                        onClick={() => setShowUploadForm(true)}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Upload Your First Video
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-700">
                      {videos.map((video) => (
                        <div key={video.id} className="px-6 py-4 hover:bg-dark-700 transition-colors">
                          <div className="flex items-center space-x-4">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-20 h-12 bg-gray-600 rounded flex items-center justify-center">
                                  <Video className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Video Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h5 className="text-white font-medium truncate">
                                  {video.title}
                                </h5>
                                {video.is_featured && (
                                  <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded">
                                    Featured
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs rounded ${
                                  video.status === 'ready' ? 'bg-green-600 text-green-100' :
                                  video.status === 'processing' ? 'bg-blue-600 text-blue-100' :
                                  video.status === 'uploading' ? 'bg-yellow-600 text-yellow-100' :
                                  video.status === 'failed' ? 'bg-red-600 text-red-100' :
                                  'bg-gray-600 text-gray-100'
                                }`}>
                                  {video.status}
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm truncate mt-1">
                                {video.description || 'No description'}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                <span>Duration: {formatDuration(video.duration)}</span>
                                <span>Size: {formatFileSize(video.file_size)}</span>
                                <span>Views: {video.view_count || 0}</span>
                                {video.category && <span>Category: {video.category}</span>}
                              </div>
                              {video.tags && video.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {video.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                                  {video.tags.length > 3 && (
                                    <span className="text-gray-500 text-xs">
                                      +{video.tags.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              {video.video_url && (
                                <a
                                  href={video.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-white transition-colors"
                                  title="View Video"
                                >
                                  <Play className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => setSelectedVideo(video)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Edit Video"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleVideoDelete(video.id, false)}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                title="Delete Video"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleVideoDelete(video.id, true)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                title="Permanently Delete"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                          {pagination.total} videos
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded transition-colors"
                          >
                            Previous
                          </button>
                          <span className="px-3 py-1 bg-red-600 text-white rounded">
                            {pagination.page}
                          </span>
                          <button
                            onClick={() => goToPage(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Token Management Tab */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            {/* Token Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Supply</p>
                    <p className="text-2xl font-bold text-white">{totalSupply.toLocaleString()}</p>
                  </div>
                  <Coins className="w-8 h-8 text-yellow-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Owner Balance</p>
                    <p className="text-2xl font-bold text-white">{ownerBalance.toLocaleString()}</p>
                  </div>
                  <Crown className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Circulating</p>
                    <p className="text-2xl font-bold text-white">{(totalSupply - ownerBalance).toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Token Transfer */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Transfer Tokens</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Recipient Address"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="bg-dark-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-dark-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                />
                <button
                  onClick={handleTransferTokens}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Transfer
                </button>
              </div>
            </div>

            {/* Minting Info */}
            {mintingInfo && (
              <div className="bg-dark-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Minting Information</h3>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Status:</strong> {mintingInfo.isMinted ? 'Minted' : 'Not Minted'}</p>
                  <p><strong>Mint Date:</strong> {mintingInfo.mintTimestamp ? new Date(mintingInfo.mintTimestamp).toLocaleString() : 'N/A'}</p>
                  <p><strong>Contract:</strong> {mintingInfo.contractAddress}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Control Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Stealth Mode Control */}
            <div className="bg-dark-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Stealth Mode</h3>
                  <p className="text-gray-400">Hide all premium features from users</p>
                </div>
                <button
                  onClick={toggleStealthMode}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    stealthMode 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {stealthMode ? 'Disable' : 'Enable'}
                </button>
              </div>
              
              {stealthMode && (
                <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="text-green-400 font-medium">Stealth Mode Active</span>
                  </div>
                  <p className="text-green-300 text-sm mt-1">
                    All premium features, token displays, and subscription prompts are hidden from users.
                  </p>
                </div>
              )}
            </div>

            {/* Feature Flags */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Feature Flags</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(currentFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <span className="text-gray-300 text-sm">{key.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      value ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      {value ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Platform Analytics</h3>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Analytics dashboard coming soon...</p>
                <p className="text-gray-500 text-sm">Integration with analytics services in development</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
