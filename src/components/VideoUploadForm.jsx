import React, { useState, useRef } from 'react';
import { Upload, X, Video, Image, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const VideoUploadForm = ({ onUpload, onCancel, isUploading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    is_featured: false,
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [dragActive, setDragActive] = useState(false);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const categories = [
    'Combat Sports',
    'MMA',
    'Boxing',
    'Wrestling',
    'Martial Arts',
    'Training',
    'Highlights',
    'Tutorials',
    'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!videoFile) {
      newErrors.video = 'Video file is required';
    } else {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
      if (!allowedTypes.includes(videoFile.type)) {
        newErrors.video = 'Invalid video format. Supported: MP4, WebM, OGG, AVI, MOV';
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (videoFile.size > maxSize) {
        newErrors.video = 'Video file too large. Maximum size is 50MB';
      }
    }

    if (thumbnailFile) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedImageTypes.includes(thumbnailFile.type)) {
        newErrors.thumbnail = 'Invalid thumbnail format. Supported: JPEG, PNG, WebP';
      }

      const maxImageSize = 5 * 1024 * 1024; // 5MB
      if (thumbnailFile.size > maxImageSize) {
        newErrors.thumbnail = 'Thumbnail too large. Maximum size is 5MB';
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

    try {
      await onUpload({
        metadata: formData,
        videoFile,
        thumbnailFile,
        onProgress: setUploadProgress,
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        tags: [],
        is_featured: false,
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

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

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (videoFile) {
      setVideoFile(videoFile);
      if (errors.video) {
        setErrors(prev => ({ ...prev, video: null }));
      }
    }

    if (imageFile && !thumbnailFile) {
      setThumbnailFile(imageFile);
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
    <div className="bg-dark-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Upload New Video</h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
          disabled={isUploading}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Video File *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-red-500 bg-red-500/10'
                : errors.video
                ? 'border-red-500'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {videoFile ? (
              <div className="space-y-2">
                <Video className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-white font-medium">{videoFile.name}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(videoFile.size)}</p>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="text-red-400 hover:text-red-300 text-sm"
                  disabled={isUploading}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-300">
                  Drag and drop your video here, or{' '}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="text-red-400 hover:text-red-300"
                    disabled={isUploading}
                  >
                    browse
                  </button>
                </p>
                <p className="text-gray-500 text-sm">
                  Supported formats: MP4, WebM, OGG, AVI, MOV (max 50MB)
                </p>
              </div>
            )}
          </div>
          {errors.video && (
            <p className="text-red-400 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.video}
            </p>
          )}
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files[0])}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Thumbnail Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Thumbnail (Optional)
          </label>
          <div className="flex items-center space-x-4">
            {thumbnailFile ? (
              <div className="flex items-center space-x-3">
                <img
                  src={URL.createObjectURL(thumbnailFile)}
                  alt="Thumbnail preview"
                  className="w-16 h-16 object-cover rounded"
                />
                <div>
                  <p className="text-white text-sm">{thumbnailFile.name}</p>
                  <p className="text-gray-400 text-xs">{formatFileSize(thumbnailFile.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setThumbnailFile(null)}
                  className="text-red-400 hover:text-red-300"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors"
                disabled={isUploading}
              >
                <Image className="w-4 h-4" />
                <span>Choose Thumbnail</span>
              </button>
            )}
          </div>
          {errors.thumbnail && (
            <p className="text-red-400 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.thumbnail}
            </p>
          )}
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-2 bg-dark-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.title ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter video title"
            disabled={isUploading}
          />
          {errors.title && (
            <p className="text-red-400 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.title}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Enter video description"
            disabled={isUploading}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={isUploading}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 hover:text-red-200"
                  disabled={isUploading}
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
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Add a tag"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              disabled={isUploading || !tagInput.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Featured */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="featured"
            checked={formData.is_featured}
            onChange={(e) => handleInputChange('is_featured', e.target.checked)}
            className="w-4 h-4 text-red-600 bg-dark-700 border-gray-600 rounded focus:ring-red-500"
            disabled={isUploading}
          />
          <label htmlFor="featured" className="text-gray-300">
            Mark as featured video
          </label>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Uploading...</span>
              <span className="text-gray-300">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isUploading}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
          >
            {isUploading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default VideoUploadForm;
