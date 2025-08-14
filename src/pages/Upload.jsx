import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVideo } from '../context/VideoContext';
import VideoUploadForm from '../components/VideoUploadForm';
import { CheckCircle, AlertCircle } from 'lucide-react';

const Upload = () => {
  const { isAuthenticated, getCurrentUserId } = useAuth();
  const { addVideo } = useVideo();
  const navigate = useNavigate();
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (uploadData) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Add user identifier (anonymous or logged in)
      const videoData = {
        ...uploadData.metadata,
        uploadedBy: getCurrentUserId()
      };
      
      // Process upload
      await addVideo({
        ...videoData,
        contentFile: uploadData.videoFile,
        thumbnail: uploadData.thumbnailFile
      }, uploadData.videoFile);
      
      // Show success message
      setUploadSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {uploadSuccess ? (
          <div className="bg-green-900 bg-opacity-20 border border-green-600 rounded-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
            <p className="text-gray-300 mb-6">
              Your video has been uploaded successfully and is now being processed.
            </p>
            <p className="text-gray-400 text-sm">
              You will be redirected to the homepage in a few seconds...
            </p>
          </div>
        ) : uploadError ? (
          <div className="bg-red-900 bg-opacity-20 border border-red-600 rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Upload Failed</h2>
            <p className="text-gray-300 mb-6">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-8 text-center">Upload Your Video</h1>
            <VideoUploadForm 
              onUpload={handleUpload} 
              onCancel={handleCancel}
              isUploading={isUploading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Upload;

