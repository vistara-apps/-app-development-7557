import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToken } from '../context/TokenContext';
import { useVideo } from '../context/VideoContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { ADMIN_CONFIG, FEATURE_FLAGS } from '../config/features';
import VideoList from '../components/admin/VideoList';
import VideoUpload from '../components/admin/VideoUpload';
import VideoEditModal from '../components/admin/VideoEditModal';
import VideoAnalytics from '../components/admin/VideoAnalytics';
import ModerationProvider from '../context/ModerationContext';
import ModerationQueue from '../components/moderation/ModerationQueue';
import ModerationDemo from '../components/moderation/ModerationDemo';
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
  Play,
  Clock,
  CheckCircle,
  HardDrive,
  Bot,
  FileCheck
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { getMintingInfo, getOwnerBalance, getTokenSupply, transferTokens } = useToken();
  const { videoStats, loading: videoLoading } = useVideo();
  const { isAdmin, toggleFeature, FEATURE_FLAGS: currentFlags } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState('overview');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [stealthMode, setStealthMode] = useState(FEATURE_FLAGS.STEALTH_MODE);
  
  // Video management state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

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

  const mockAnalytics = {
    totalUsers: 15420,
    activeUsers: 8930,
    totalViews: 2450000,
    revenue: 125000,
    growthRate: 23.5
  };

  // Video management handlers
  const handleEditVideo = (video) => {
    setSelectedVideo(video);
    setShowEditModal(true);
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedVideo(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            { id: 'moderation', label: 'Content Moderation', icon: Bot },
            { id: 'demo', label: 'Moderation Demo', icon: FileCheck },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                    <p className="text-gray-400 text-sm">Total Videos</p>
                    <p className="text-2xl font-bold text-white">{videoStats?.total || 0}</p>
                  </div>
                  <Video className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-dark-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Video Views</p>
                    <p className="text-2xl font-bold text-white">{videoStats?.totalViews?.toLocaleString() || 0}</p>
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
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Video Statistics */}
            <div className="bg-dark-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Video Library Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-gray-300 text-sm">Ready</p>
                      <p className="text-white font-medium">{videoStats?.ready || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="text-gray-300 text-sm">Processing</p>
                      <p className="text-white font-medium">{videoStats?.processing || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Upload className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-gray-300 text-sm">Uploading</p>
                      <p className="text-white font-medium">{videoStats?.uploading || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <HardDrive className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="text-gray-300 text-sm">Storage Used</p>
                      <p className="text-white font-medium">{formatFileSize(videoStats?.totalSize || 0)}</p>
                    </div>
                  </div>
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
            <VideoList 
              onEditVideo={handleEditVideo}
              onUploadClick={() => setShowUploadModal(true)}
            />
          </div>
        )}

        {/* Content Moderation Tab */}
        {activeTab === 'moderation' && (
          <ModerationProvider>
            <ModerationQueue />
          </ModerationProvider>
        )}

        {/* Moderation Demo Tab */}
        {activeTab === 'demo' && (
          <ModerationProvider>
            <ModerationDemo />
          </ModerationProvider>
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
            <VideoAnalytics />
          </div>
        )}
      </div>

      {/* Video Upload Modal */}
      {showUploadModal && (
        <VideoUpload
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Video Edit Modal */}
      {showEditModal && selectedVideo && (
        <VideoEditModal
          video={selectedVideo}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVideo(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
