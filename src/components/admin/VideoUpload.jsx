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
    <div className="min-h-screen bg-gradient-to-br from-phyght-black via-phyght-gray to-phyght-black text-phyght-white py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-6 font-phyght tracking-wider">
            <span className="text-phyght-white drop-shadow-2xl">PHYGHT</span>
            <br />
            <span className="text-phyght-red drop-shadow-2xl">TV</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Upload Your Fight Videos Instantly with Professional Quality
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-to-r from-phyght-gray to-phyght-gray-light rounded-2xl p-8 border border-phyght-gray-light shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Upload */}
            <div>
              <label className="block text-phyght-white font-bold mb-4 text-lg">
                🎬 Video File *
              </label>
              <div
                className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-500 cursor-pointer group ${
                  dragActive 
                    ? 'border-phyght-red bg-gradient-to-r from-phyght-red bg-opacity-10 to-transparent scale-105' 
                    : 'border-phyght-gray-light hover:border-phyght-red hover:scale-105'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="space-y-6">
                  <div className="text-8xl group-hover:scale-110 transition-transform duration-300">🎬</div>
                  <div>
                    <p className="text-phyght-white font-bold text-xl mb-2">
                      {selectedFile ? selectedFile.name : 'Drop your video here or click to browse'}
                    </p>
                    <p className="text-gray-400 text-lg">
                      Supports MP4, AVI, MOV, WMV, WebM (Max 50MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="space-y-4 bg-phyght-black rounded-2xl p-6 border border-phyght-gray-light">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-phyght-white">Upload Progress</span>
                  <span className="text-phyght-red">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-phyght-gray-light rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-phyght-red to-phyght-red-dark h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-lg text-gray-300 text-center">
                  {uploadStatus === 'uploading' && '🚀 Uploading video...'}
                  {uploadStatus === 'processing' && '⚙️ Processing video...'}
                  {uploadStatus === 'complete' && '✅ Upload complete!'}
                </p>
              </div>
            )}

            {/* Optional Details Section */}
            <details className="group">
              <summary className="cursor-pointer text-phyght-white font-bold text-xl hover:text-phyght-red transition-colors duration-300 flex items-center space-x-3">
                <span className="text-2xl">📝</span>
                <span>Add Video Details (Optional)</span>
                <span className="text-phyght-red group-open:rotate-180 transition-transform duration-300">▼</span>
              </summary>
              <div className="mt-6 space-y-6 pl-8 border-l-4 border-phyght-red">
                {/* Title */}
                <div>
                  <label className="block text-phyght-white font-semibold mb-3 text-lg">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter an engaging video title"
                    className="w-full px-4 py-3 bg-phyght-black border-2 border-phyght-gray-light rounded-xl text-phyght-white placeholder-gray-500 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-phyght-white font-semibold mb-3 text-lg">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your video content"
                    rows={4}
                    className="w-full px-4 py-3 bg-phyght-black border-2 border-phyght-gray-light rounded-xl text-phyght-white placeholder-gray-500 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-phyght-white font-semibold mb-3 text-lg">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-phyght-black border-2 border-phyght-gray-light rounded-xl text-phyght-white focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
                  >
                    <option value="">Select a category</option>
                    <option value="mma">🥊 MMA</option>
                    <option value="boxing">🥊 Boxing</option>
                    <option value="wrestling">🤼 Wrestling</option>
                    <option value="jiu-jitsu">🥋 Jiu-Jitsu</option>
                    <option value="kickboxing">🥊 Kickboxing</option>
                    <option value="karate">🥋 Karate</option>
                    <option value="taekwondo">🥋 Taekwondo</option>
                    <option value="muay-thai">🥊 Muay Thai</option>
                    <option value="combat-sports">⚔️ Combat Sports</option>
                    <option value="tutorials">📚 Tutorials</option>
                    <option value="highlights">🔥 Highlights</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-phyght-white font-semibold mb-3 text-lg">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                      setFormData({ ...formData, tags });
                    }}
                    placeholder="Enter tags separated by commas (e.g., knockout, technique, champion)"
                    className="w-full px-4 py-3 bg-phyght-black border-2 border-phyght-gray-light rounded-xl text-phyght-white placeholder-gray-500 focus:outline-none focus:border-phyght-red focus:ring-2 focus:ring-phyght-red focus:ring-opacity-50 transition-all duration-300"
                  />
                </div>
              </div>
            </details>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || uploadProgress > 0}
              className={`w-full py-4 px-8 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 ${
                !selectedFile || uploadProgress > 0
                  ? 'bg-phyght-gray-light text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-phyght-red to-phyght-red-dark hover:from-phyght-red-dark hover:to-phyght-red text-phyght-white shadow-phyght-red hover:shadow-phyght-red-lg hover:-translate-y-1'
              }`}
            >
              {uploadProgress === 0 && '🚀 Upload Video Instantly'}
              {uploadProgress > 0 && uploadProgress < 100 && `Uploading... ${uploadProgress}%`}
              {uploadProgress === 100 && '⚙️ Processing...'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VideoUpload;
