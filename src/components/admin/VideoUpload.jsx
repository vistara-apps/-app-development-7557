import React, { useState, useRef } from 'react';
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
  Trash2
} from 'lucide-react';

const VideoUpload = ({ onClose, onSuccess }) => {
  const { addVideo } = useVideo();
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'highlight',
    category: 'mma',
    organization: '',
    event: '',
    weightClass: '',
    fighters: [''],
    tags: [''],
    isPremium: false,
    duration: ''
  });
  const [errors, setErrors] = useState({});

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

  const addFighter = () => {
    setFormData(prev => ({
      ...prev,
      fighters: [...prev.fighters, '']
    }));
  };

  const removeFighter = (index) => {
    setFormData(prev => ({
      ...prev,
      fighters: prev.fighters.filter((_, i) => i !== index)
    }));
  };

  const updateFighter = (index, value) => {
    setFormData(prev => ({
      ...prev,
      fighters: prev.fighters.map((fighter, i) => i === index ? value : fighter)
    }));
  };

  const addTag = () => {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, '']
    }));
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
      newErrors.file = 'Please select a video file';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.fighters.filter(f => f.trim()).length === 0) {
      newErrors.fighters = 'At least one fighter is required';
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
                  Supports MP4, AVI, MOV, WMV, WebM (max 2GB)
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

          {/* Thumbnail Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Custom Thumbnail (Optional)</label>
            
            {!thumbnailFile ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-2">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="text-red-500 hover:text-red-400 underline"
                  >
                    Upload thumbnail
                  </button>
                  {' '}or use auto-generated
                </p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleThumbnailSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="bg-dark-700 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={URL.createObjectURL(thumbnailFile)}
                    alt="Thumbnail preview"
                    className="w-16 h-10 object-cover rounded"
                  />
                  <div>
                    <p className="text-white font-medium">{thumbnailFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(thumbnailFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setThumbnailFile(null)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {errors.thumbnail && (
              <p className="text-red-400 text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.thumbnail}
              </p>
            )}
          </div>

          {/* Video Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                placeholder="Enter video title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                placeholder="Enter video description"
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                {videoTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                placeholder="e.g., UFC, Bellator, ONE"
              />
            </div>

            {/* Event */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
              <input
                type="text"
                value={formData.event}
                onChange={(e) => handleInputChange('event', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                placeholder="e.g., UFC 300, Bellator 290"
              />
            </div>

            {/* Weight Class */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Weight Class</label>
              <select
                value={formData.weightClass}
                onChange={(e) => handleInputChange('weightClass', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
              >
                <option value="">Select weight class</option>
                {weightClasses.map(weightClass => (
                  <option key={weightClass} value={weightClass}>{weightClass}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                className="w-full bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                placeholder="e.g., 15:32, 1:23:45"
              />
            </div>
          </div>

          {/* Fighters */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fighters *</label>
            <div className="space-y-2">
              {formData.fighters.map((fighter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fighter}
                    onChange={(e) => updateFighter(index, e.target.value)}
                    className="flex-1 bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                    placeholder={`Fighter ${index + 1}`}
                  />
                  {formData.fighters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFighter(index)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFighter}
                className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fighter</span>
              </button>
            </div>
            {errors.fighters && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.fighters}
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="space-y-2">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    className="flex-1 bg-dark-700 text-white rounded-lg border border-gray-600 px-3 py-2 focus:border-red-500 focus:outline-none"
                    placeholder={`Tag ${index + 1}`}
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTag}
                className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tag</span>
              </button>
            </div>
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
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;
