import React, { useState, useRef, useEffect } from 'react';
import { useVideo } from '../../context/VideoContext';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  Play, 
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react';

const VideoUpload = ({ onClose, onSuccess }) => {
  const { addVideo } = useVideo();
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'mma',
    tags: []
  });
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const videoTypes = [
    { value: 'full-fight', label: 'Full Fight' },
    { value: 'highlight', label: 'Highlight' },
    { value: 'training', label: 'Training' },
    { value: 'interview', label: 'Interview' },
    { value: 'documentary', label: 'Documentary' }
  ];

  const categories = [
    { value: 'mma', label: 'MMA' },
    { value: 'boxing', label: 'Boxing' },
    { value: 'muay-thai', label: 'Muay Thai' },
    { value: 'kickboxing', label: 'Kickboxing' },
    { value: 'bjj', label: 'Brazilian Jiu-Jitsu' },
    { value: 'wrestling', label: 'Wrestling' }
  ];

  const weightClasses = [
    'Strawweight', 'Flyweight', 'Bantamweight', 'Featherweight', 
    'Lightweight', 'Welterweight', 'Middleweight', 'Light Heavyweight', 
    'Heavyweight', 'Super Heavyweight'
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Please select a valid video file (MP4, AVI, MOV, WMV, WebM)' });
      return;
    }

    // Validate file size (max 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 2GB' });
      return;
    }

    setSelectedFile(file);
    setErrors({});
    
    // Auto-fill title from filename if empty
    if (!formData.title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleThumbnailSelect = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ thumbnail: 'Please select a valid image file (JPEG, PNG, WebP)' });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrors({ thumbnail: 'Thumbnail size must be less than 10MB' });
      return;
    }

    setThumbnailFile(file);
    setErrors(prev => ({ ...prev, thumbnail: null }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Listen for upload progress events
  useEffect(() => {
    const handleUploadProgress = (event) => {
      const { progress, message } = event.detail;
      setUploadProgress(progress);
      setUploadStatus(message);
      
      if (progress === 100) {
        // Upload complete, reset after a delay
        setTimeout(() => {
          setUploadProgress(0);
          setUploadStatus('');
        }, 3000);
      }
    };

    const handleUploadComplete = (event) => {
      console.log('✅ Upload completed:', event.detail);
      setUploadProgress(100);
      setUploadStatus('Upload complete!');
    };

    const handleUploadError = (event) => {
      console.error('❌ Upload error:', event.detail);
      setUploadProgress(0);
      setUploadStatus(`Upload failed: ${event.detail.error}`);
    };

    window.addEventListener('uploadProgress', handleUploadProgress);
    window.addEventListener('uploadComplete', handleUploadComplete);
    window.addEventListener('uploadError', handleUploadError);

    return () => {
      window.removeEventListener('uploadProgress', handleUploadProgress);
      window.removeEventListener('uploadComplete', handleUploadComplete);
      window.removeEventListener('uploadError', handleUploadError);
    };
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateTag = (index, value) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.map((tag, i) => i === index ? value : tag)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Video file is required';
    } else {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(selectedFile.type)) {
        newErrors.file = 'Please select a valid video file (MP4, AVI, MOV, WMV, WebM)';
      }

      // Validate file size (max 50MB for Supabase)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (selectedFile.size > maxSize) {
        newErrors.file = 'File size must be less than 50MB';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setUploading(true);

    try {
      // Prepare video data
      const videoData = {
        ...formData,
        fighters: formData.fighters.filter(f => f.trim()),
        tags: formData.tags.filter(t => t.trim()),
        thumbnail: thumbnailFile ? URL.createObjectURL(thumbnailFile) : null
      };

      // Add video
      const newVideo = await addVideo(videoData, selectedFile);
      
      // Success
      onSuccess && onSuccess(newVideo);
      onClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ submit: 'Failed to upload video. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Upload Video</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Video File *</label>
            
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-red-500 bg-red-500 bg-opacity-10' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 mb-2">
                  Drag and drop your video file here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-red-500 hover:text-red-400 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-gray-500 text-sm">
                  Supports MP4, AVI, MOV, WMV, WebM (max 50MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-dark-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {errors.file && (
              <p className="text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Upload Progress</span>
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              
              {uploadStatus && (
                <p className="text-sm text-gray-400 text-center">{uploadStatus}</p>
              )}
            </div>
          )}

          {/* Optional Video Details (Collapsible) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-sm font-medium">
                {showDetails ? 'Hide' : 'Add'} Video Details (Optional)
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            
            {showDetails && (
              <div className="space-y-4 pl-4 border-l border-gray-600">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter video title (optional)"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter video description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-600 text-white"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1 hover:text-red-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag and press Enter"
                      className="flex-1 px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Premium Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPremium"
              checked={formData.isPremium}
              onChange={(e) => handleInputChange('isPremium', e.target.checked)}
              className="rounded border-gray-600 bg-dark-600 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="isPremium" className="text-gray-300">
              Premium Content (requires subscription to view)
            </label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <p className="text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
            {/* Submit Button */}
            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={uploading || uploadProgress > 0}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                  uploading || uploadProgress > 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {uploading || uploadProgress > 0 ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
                  </span>
                ) : (
                  'Upload Video Instantly'
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                disabled={uploading || uploadProgress > 0}
                className={`py-3 px-6 rounded-lg font-medium transition-colors ${
                  uploading || uploadProgress > 0
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Cancel
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;
