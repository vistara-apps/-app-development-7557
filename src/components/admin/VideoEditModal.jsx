import React, { useState, useEffect, useRef } from 'react';
import { useVideo } from '../../context/VideoContext';
import { 
  X, 
  Save, 
  Image, 
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Play
} from 'lucide-react';

const VideoEditModal = ({ video, onClose, onSuccess }) => {
  const { updateVideo } = useVideo();
  const thumbnailInputRef = useRef(null);
  
  const [saving, setSaving] = useState(false);
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

  // Initialize form data when video prop changes
  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title || '',
        description: video.description || '',
        type: video.type || 'highlight',
        category: video.category || 'mma',
        organization: video.organization || '',
        event: video.event || '',
        weightClass: video.weightClass || '',
        fighters: video.fighters && video.fighters.length > 0 ? video.fighters : [''],
        tags: video.tags && video.tags.length > 0 ? video.tags : [''],
        isPremium: video.isPremium || false,
        duration: video.duration || ''
      });
    }
  }, [video]);

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

    setSaving(true);

    try {
      // Prepare update data
      const updateData = {
        ...formData,
        fighters: formData.fighters.filter(f => f.trim()),
        tags: formData.tags.filter(t => t.trim())
      };

      // Add new thumbnail if selected
      if (thumbnailFile) {
        updateData.previewThumbnail = URL.createObjectURL(thumbnailFile);
      }

      // Update video
      const updatedVideo = await updateVideo(video.id, updateData);
      
      // Success
      onSuccess && onSuccess(updatedVideo);
      onClose();
      
    } catch (error) {
      console.error('Update error:', error);
      setErrors({ submit: 'Failed to update video. Please try again.' });
    } finally {
      setSaving(false);
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
      month: 'long',
      day: 'numeric'
    });
  };

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Video</h2>
            <p className="text-gray-400 text-sm mt-1">
              Uploaded {formatDate(video.uploadDate)} • {video.fileSize ? formatFileSize(video.fileSize) : 'Unknown size'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Video Preview */}
          <div className="bg-dark-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4">Video Preview</h3>
            <div className="flex items-start space-x-4">
              {/* Current Thumbnail */}
              <div className="relative w-32 h-20 bg-dark-600 rounded overflow-hidden flex-shrink-0">
                <img
                  src={video.previewThumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=256&h=160&fit=crop';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{video.title}</h4>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{video.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{video.duration}</span>
                  <span className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{video.views?.toLocaleString() || 0} views</span>
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs text-white ${
                    video.status === 'ready' ? 'bg-green-600' :
                    video.status === 'processing' ? 'bg-yellow-600' :
                    video.status === 'uploading' ? 'bg-blue-600' :
                    'bg-red-600'
                  }`}>
                    {video.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thumbnail Update */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Update Thumbnail (Optional)</label>
            
            {!thumbnailFile ? (
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm mb-2">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="text-red-500 hover:text-red-400 underline"
                  >
                    Upload new thumbnail
                  </button>
                  {' '}or keep current
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
                    alt="New thumbnail preview"
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
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoEditModal;
