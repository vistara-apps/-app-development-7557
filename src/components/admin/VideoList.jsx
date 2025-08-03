import React, { useState, useEffect } from 'react';
import { useVideo } from '../../context/VideoContext';
import { 
  Play, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Upload,
  Search,
  Filter,
  MoreVertical,
  Download,
  Share2
} from 'lucide-react';

const VideoList = ({ onEditVideo, onUploadClick }) => {
  const { 
    adminVideos, 
    loading, 
    deleteVideo, 
    searchVideos, 
    bulkDeleteVideos,
    uploadProgress 
  } = useVideo();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    type: 'all',
    organization: 'all'
  });
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('uploadDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Update filtered videos when search/filters change
  useEffect(() => {
    let results = searchVideos(searchQuery, filters);
    
    // Sort results
    results.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'uploadDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredVideos(results);
  }, [searchQuery, filters, adminVideos, sortBy, sortOrder]);

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(videoId);
      } catch (error) {
        alert('Error deleting video: ' + error.message);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedVideos.length} selected videos?`)) {
      try {
        await bulkDeleteVideos(selectedVideos);
        setSelectedVideos([]);
      } catch (error) {
        alert('Error deleting videos: ' + error.message);
      }
    }
  };

  const toggleVideoSelection = (videoId) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const selectAllVideos = () => {
    if (selectedVideos.length === filteredVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(filteredVideos.map(v => v.id));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-600';
      case 'processing':
        return 'bg-yellow-600';
      case 'uploading':
        return 'bg-blue-600';
      case 'failed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-2 text-gray-400">Loading videos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          
          {selectedVideos.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedVideos.length})</span>
            </button>
          )}
          
          <button
            onClick={onUploadClick}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-dark-800 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="mma">MMA</option>
                <option value="boxing">Boxing</option>
                <option value="muay-thai">Muay Thai</option>
                <option value="kickboxing">Kickboxing</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="uploading">Uploading</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="full-fight">Full Fight</option>
                <option value="highlight">Highlight</option>
                <option value="training">Training</option>
                <option value="interview">Interview</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="uploadDate-desc">Newest First</option>
                <option value="uploadDate-asc">Oldest First</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
                <option value="views-desc">Most Views</option>
                <option value="views-asc">Least Views</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="bg-dark-800 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-dark-700 px-6 py-3 border-b border-gray-600">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
              onChange={selectAllVideos}
              className="mr-4 rounded border-gray-600 bg-dark-600 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-300">
              {filteredVideos.length} videos
            </span>
          </div>
        </div>

        {/* Video Items */}
        <div className="divide-y divide-gray-700">
          {filteredVideos.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No videos found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || Object.values(filters).some(f => f !== 'all') 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first video to get started'
                }
              </p>
              {!searchQuery && !Object.values(filters).some(f => f !== 'all') && (
                <button
                  onClick={onUploadClick}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Upload Video
                </button>
              )}
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div key={video.id} className="px-6 py-4 hover:bg-dark-700 transition-colors">
                <div className="flex items-center space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedVideos.includes(video.id)}
                    onChange={() => toggleVideoSelection(video.id)}
                    className="rounded border-gray-600 bg-dark-600 text-red-600 focus:ring-red-500"
                  />

                  {/* Thumbnail */}
                  <div className="relative w-20 h-12 bg-dark-600 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={video.previewThumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=160&h=96&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{video.title}</h3>
                        <p className="text-gray-400 text-sm truncate mt-1">{video.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{formatDate(video.uploadDate)}</span>
                          <span>{video.duration}</span>
                          <span>{formatFileSize(video.fileSize)}</span>
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{video.views?.toLocaleString() || 0}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center space-x-3 ml-4">
                        {/* Upload Progress */}
                        {video.status === 'uploading' && uploadProgress[video.id] && (
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-dark-600 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[video.id]}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-blue-400">{uploadProgress[video.id]}%</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(video.status)}
                          <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(video.status)}`}>
                            {video.status}
                          </span>
                        </div>

                        {/* Premium Badge */}
                        {video.isPremium && (
                          <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                            Premium
                          </span>
                        )}

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onEditVideo(video)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors"
                            title="Edit video"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(video.id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-dark-600 rounded transition-colors"
                            title="Delete video"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-600 rounded transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoList;
