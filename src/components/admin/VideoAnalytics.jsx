import React from 'react';
import { useVideo } from '../../context/VideoContext';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Play, 
  Clock, 
  Users,
  Calendar,
  Award,
  Target,
  Activity
} from 'lucide-react';

const VideoAnalytics = () => {
  const { videoStats, adminVideos } = useVideo();

  // Calculate additional analytics
  const getTopPerformingVideos = () => {
    return adminVideos
      .filter(video => video.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const getRecentUploads = () => {
    return adminVideos
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 5);
  };

  const getCategoryBreakdown = () => {
    return videoStats?.categories || {};
  };

  const getOrganizationBreakdown = () => {
    return videoStats?.organizations || {};
  };

  const getUploadTrend = () => {
    // Mock data for upload trend (in real app, this would come from backend)
    return [
      { date: '2024-07-01', uploads: 5 },
      { date: '2024-07-02', uploads: 8 },
      { date: '2024-07-03', uploads: 3 },
      { date: '2024-07-04', uploads: 12 },
      { date: '2024-07-05', uploads: 7 },
      { date: '2024-07-06', uploads: 15 },
      { date: '2024-07-07', uploads: 9 }
    ];
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const topVideos = getTopPerformingVideos();
  const recentUploads = getRecentUploads();
  const categoryBreakdown = getCategoryBreakdown();
  const organizationBreakdown = getOrganizationBreakdown();
  const uploadTrend = getUploadTrend();

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Videos</p>
              <p className="text-2xl font-bold text-white">{videoStats?.total || 0}</p>
              <p className="text-green-400 text-xs mt-1">+12% this month</p>
            </div>
            <Play className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white">{videoStats?.totalViews?.toLocaleString() || 0}</p>
              <p className="text-green-400 text-xs mt-1">+8% this month</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. Views/Video</p>
              <p className="text-2xl font-bold text-white">
                {videoStats?.total > 0 ? Math.round((videoStats?.totalViews || 0) / videoStats.total).toLocaleString() : 0}
              </p>
              <p className="text-yellow-400 text-xs mt-1">-2% this month</p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-dark-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Storage Used</p>
              <p className="text-2xl font-bold text-white">{formatFileSize(videoStats?.totalSize || 0)}</p>
              <p className="text-blue-400 text-xs mt-1">+15% this month</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Videos by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(categoryBreakdown).map(([category, count]) => {
              const percentage = videoStats?.total > 0 ? (count / videoStats.total * 100).toFixed(1) : 0;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300 capitalize">{category.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{count}</span>
                    <span className="text-gray-400 text-sm">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(categoryBreakdown).length === 0 && (
              <p className="text-gray-500 text-center py-4">No videos uploaded yet</p>
            )}
          </div>
        </div>

        {/* Organization Breakdown */}
        <div className="bg-dark-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Videos by Organization
          </h3>
          <div className="space-y-3">
            {Object.entries(organizationBreakdown).map(([org, count]) => {
              const percentage = videoStats?.total > 0 ? (count / videoStats.total * 100).toFixed(1) : 0;
              return (
                <div key={org} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">{org || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{count}</span>
                    <span className="text-gray-400 text-sm">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            {Object.keys(organizationBreakdown).length === 0 && (
              <p className="text-gray-500 text-center py-4">No organizations specified</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Videos */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Top Performing Videos
        </h3>
        <div className="space-y-4">
          {topVideos.map((video, index) => (
            <div key={video.id} className="flex items-center space-x-4 p-4 bg-dark-700 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">#{index + 1}</span>
              </div>
              
              <div className="relative w-16 h-10 bg-dark-600 rounded overflow-hidden flex-shrink-0">
                <img
                  src={video.previewThumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=128&h=80&fit=crop';
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{video.title}</h4>
                <p className="text-gray-400 text-sm">{video.category} • {video.duration}</p>
              </div>
              
              <div className="text-right">
                <p className="text-white font-medium">{video.views.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">views</p>
              </div>
            </div>
          ))}
          {topVideos.length === 0 && (
            <p className="text-gray-500 text-center py-8">No videos with views yet</p>
          )}
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Recent Uploads
        </h3>
        <div className="space-y-4">
          {recentUploads.map((video) => (
            <div key={video.id} className="flex items-center space-x-4 p-4 bg-dark-700 rounded-lg">
              <div className="relative w-16 h-10 bg-dark-600 rounded overflow-hidden flex-shrink-0">
                <img
                  src={video.previewThumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=128&h=80&fit=crop';
                  }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{video.title}</h4>
                <p className="text-gray-400 text-sm">{video.category} • {video.duration}</p>
              </div>
              
              <div className="text-right">
                <p className="text-white font-medium">{formatDate(video.uploadDate)}</p>
                <p className={`text-xs px-2 py-1 rounded-full ${
                  video.status === 'ready' ? 'bg-green-600 text-white' :
                  video.status === 'processing' ? 'bg-yellow-600 text-white' :
                  video.status === 'uploading' ? 'bg-blue-600 text-white' :
                  'bg-red-600 text-white'
                }`}>
                  {video.status}
                </p>
              </div>
            </div>
          ))}
          {recentUploads.length === 0 && (
            <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
          )}
        </div>
      </div>

      {/* Upload Trend */}
      <div className="bg-dark-800 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Upload Trend (Last 7 Days)
        </h3>
        <div className="space-y-2">
          {uploadTrend.map((day, index) => {
            const maxUploads = Math.max(...uploadTrend.map(d => d.uploads));
            const percentage = maxUploads > 0 ? (day.uploads / maxUploads * 100) : 0;
            
            return (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-16 text-gray-400 text-sm">{formatDate(day.date)}</div>
                <div className="flex-1 bg-dark-700 rounded-full h-6 relative">
                  <div 
                    className="bg-red-600 h-6 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{day.uploads}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VideoAnalytics;
