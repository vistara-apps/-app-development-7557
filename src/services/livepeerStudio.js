/**
 * Livepeer Studio Integration
 * Real video upload and streaming service using Livepeer Studio API
 * 
 * Setup Instructions:
 * 1. Sign up at https://livepeer.studio/
 * 2. Get your API key from dashboard
 * 3. Add VITE_LIVEPEER_API_KEY=your_api_key to your .env file
 */

const LIVEPEER_API_BASE = 'https://livepeer.studio/api';

class LivepeerStudioService {
  constructor() {
    this.apiKey = import.meta.env.VITE_LIVEPEER_API_KEY;
    this.baseURL = LIVEPEER_API_BASE;
    
    if (!this.apiKey) {
      throw new Error('❌ VITE_LIVEPEER_API_KEY is required! Add it to your .env file.');
    }
  }

  /**
   * Upload a video file to Livepeer Studio with progress tracking
   * @param {File} file - Video file to upload
   * @param {Object} metadata - Video metadata (title, description, etc.)
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Upload result with video details
   */
  async uploadVideoWithProgress(file, metadata = {}, onProgress = null) {
    try {
      console.log('🚀 Uploading video to Livepeer Studio:', file.name);
      console.log('📊 File size:', (file.size / (1024 * 1024)).toFixed(2), 'MB');

      if (onProgress) onProgress(10, 'Creating asset...');

      // Step 1: Create asset
      const asset = await this._createAsset(metadata);
      console.log('✅ Asset created:', asset.id);

      if (onProgress) onProgress(20, 'Starting upload...');

      // Step 2: Upload video file
      const uploadResult = await this._uploadFile(file, asset.tusEndpoint);
      console.log('✅ Video uploaded successfully');

      if (onProgress) onProgress(60, 'Processing video...');

      // Step 3: Wait for processing and get playback info
      console.log('⏳ Waiting for video processing...');
      const processedAsset = await this._waitForProcessing(asset.id, 60, onProgress);
      console.log('✅ Video processed and ready:', processedAsset.playbackUrl);

      if (onProgress) onProgress(100, 'Upload complete!');

      return {
        id: processedAsset.id,
        playbackId: processedAsset.playbackId,
        playbackUrl: processedAsset.playbackUrl,
        thumbnailUrl: `https://image.livepeer.studio/${processedAsset.playbackId}/thumbnail.jpg`,
        status: processedAsset.status,
        duration: processedAsset.videoSpec?.duration || 0,
        assetId: processedAsset.id,
        ...metadata
      };

    } catch (error) {
      console.error('❌ Livepeer upload failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (onProgress) onProgress(0, `Upload failed: ${error.message}`);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload a video file to Livepeer Studio
   * @param {File} file - Video file to upload
   * @param {Object} metadata - Video metadata (title, description, etc.)
   * @returns {Promise<Object>} Upload result with video details
   */
  async uploadVideo(file, metadata = {}) {
    return this.uploadVideoWithProgress(file, metadata);
  }

  /**
   * Create a new asset in Livepeer Studio
   * @private
   */
  async _createAsset(metadata) {
    console.log('🔑 Making request with API key:', this.apiKey.substring(0, 10) + '...');
    
    const requestBody = {
      name: metadata.title || 'Combat Video',
      playbackPolicy: {
        type: 'public'  // Public playback for your platform
      },
      storage: {
        ipfs: true  // Store on IPFS for decentralized access
      }
    };

    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseURL}/asset/request-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`Failed to create asset: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const assetData = await response.json();
    console.log('✅ Asset created successfully:', assetData);
    
    // Validate required fields
    if (!assetData.tusEndpoint) {
      throw new Error('No TUS endpoint received from Livepeer Studio');
    }
    
    return assetData;
  }

  /**
   * Upload file using TUS protocol (resumable uploads)
   * @private
   */
  async _uploadFile(file, tusEndpoint) {
    console.log('📤 Starting TUS upload to:', tusEndpoint);
    
    // Step 1: Create TUS upload
    const createResponse = await fetch(tusEndpoint, {
      method: 'POST',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Length': file.size.toString(),
        'Upload-Metadata': `filename ${btoa(file.name)},filetype ${btoa(file.type)}`
      }
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ TUS create failed:', createResponse.status, errorText);
      throw new Error(`TUS create failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    // Get the upload URL from the Location header
    const uploadUrl = createResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL received from TUS create');
    }

    console.log('✅ TUS upload created, uploading to:', uploadUrl);

    // Step 2: Upload the file content
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Content-Type': 'application/offset+octet-stream'
      },
      body: file
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ TUS upload failed:', uploadResponse.status, errorText);
      throw new Error(`TUS upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('✅ TUS upload completed successfully');
    return uploadResponse;
  }

  /**
   * Wait for video processing to complete
   * @private
   */
  async _waitForProcessing(assetId, maxAttempts = 60, onProgress = null) {
    let attempts = 0;
    const checkInterval = 2000; // Check every 2 seconds

    console.log('⏳ Starting to monitor asset processing...');

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const asset = await this._getAsset(assetId);
        console.log(`📊 Asset status (attempt ${attempts}/${maxAttempts}):`, asset.status);
        
        // Calculate progress percentage (60% to 95% during processing)
        const progressPercent = Math.min(60 + (attempts / maxAttempts) * 35, 95);
        
        if (asset.status === 'ready') {
          console.log('✅ Asset processing completed successfully!');
          if (onProgress) onProgress(100, 'Processing complete!');
          return asset;
        }
        
        if (asset.status === 'error') {
          console.error('❌ Asset processing failed:', asset);
          if (onProgress) onProgress(0, 'Processing failed');
          throw new Error('Video processing failed - check Livepeer Studio dashboard for details');
        }

        if (asset.status === 'uploading') {
          console.log('📤 Asset still uploading...');
          if (onProgress) onProgress(progressPercent, 'Uploading...');
        } else if (asset.status === 'processing') {
          console.log('⚙️ Asset being processed...');
          if (onProgress) onProgress(progressPercent, 'Processing video...');
        } else if (asset.status === 'queued') {
          console.log('⏸️ Asset queued for processing...');
          if (onProgress) onProgress(progressPercent, 'Queued for processing...');
        }

        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        
      } catch (error) {
        console.error(`❌ Error checking asset status (attempt ${attempts}):`, error);
        
        // If it's a network error, wait and retry
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          continue;
        } else {
          if (onProgress) onProgress(0, 'Processing timeout');
          throw error;
        }
      }
    }

    if (onProgress) onProgress(0, 'Processing timeout');
    throw new Error(`Video processing timeout after ${maxAttempts} attempts (${(maxAttempts * checkInterval) / 1000} seconds)`);
  }

  /**
   * Get asset details
   * @private
   */
  async _getAsset(assetId) {
    const response = await fetch(`${this.baseURL}/asset/${assetId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get asset: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all uploaded assets (your videos)
   */
  async getAssets() {

    try {
      const response = await fetch(`${this.baseURL}/asset`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get assets: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data.map(asset => ({
        id: asset.id,
        title: asset.name,
        playbackId: asset.playbackId,
        playbackUrl: asset.playbackUrl,
        thumbnailUrl: `https://image.livepeer.studio/${asset.playbackId}/thumbnail.jpg`,
        status: asset.status,
        duration: asset.videoSpec?.duration || 0,
        createdAt: asset.createdAt,
        views: asset.viewCount || 0,
        description: asset.meta?.description || '',
        category: asset.meta?.category || 'mma'
      }));

    } catch (error) {
      console.error('❌ Failed to get assets:', error);
      throw error;
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId) {

    try {
      const response = await fetch(`${this.baseURL}/asset/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return { success: response.ok };
    } catch (error) {
      console.error('❌ Failed to delete asset:', error);
      throw error;
    }
  }

  /**
   * Check upload status and resume if possible
   * @param {string} assetId - The asset ID to check
   * @returns {Promise<Object>} Asset status and details
   */
  async checkUploadStatus(assetId) {
    try {
      const asset = await this._getAsset(assetId);
      console.log('📊 Asset status check:', asset.status);
      
      return {
        id: asset.id,
        status: asset.status,
        playbackId: asset.playbackId,
        playbackUrl: asset.playbackUrl,
        thumbnailUrl: asset.playbackId ? `https://image.livepeer.studio/${asset.playbackId}/thumbnail.jpg` : null,
        duration: asset.videoSpec?.duration || 0,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      };
    } catch (error) {
      console.error('❌ Error checking upload status:', error);
      throw error;
    }
  }

  /**
   * Resume an interrupted upload
   * @param {string} assetId - The asset ID to resume
   * @param {File} file - The video file to upload
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Object>} Upload result
   */
  async resumeUpload(assetId, file, onProgress = null) {
    try {
      console.log('🔄 Resuming upload for asset:', assetId);
      
      // Check current status
      const asset = await this._getAsset(assetId);
      
      if (asset.status === 'ready') {
        console.log('✅ Asset already ready, no need to resume');
        return this.checkUploadStatus(assetId);
      }
      
      if (asset.status === 'error') {
        console.log('❌ Asset has error status, cannot resume');
        throw new Error('Cannot resume failed upload');
      }
      
      // If still uploading or processing, wait for completion
      if (onProgress) onProgress(60, 'Resuming upload...');
      
      const processedAsset = await this._waitForProcessing(assetId, 60, onProgress);
      
      if (onProgress) onProgress(100, 'Upload resumed successfully!');
      
      return {
        id: processedAsset.id,
        playbackId: processedAsset.playbackId,
        playbackUrl: processedAsset.playbackUrl,
        thumbnailUrl: `https://image.livepeer.studio/${processedAsset.playbackId}/thumbnail.jpg`,
        status: processedAsset.status,
        duration: processedAsset.videoSpec?.duration || 0,
        assetId: processedAsset.id
      };
      
    } catch (error) {
      console.error('❌ Error resuming upload:', error);
      if (onProgress) onProgress(0, `Resume failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test Livepeer Studio connection
   * @returns {Promise<boolean>} True if connection is working
   */
  async testConnection() {
    try {
      console.log('🧪 Testing Livepeer Studio connection...');
      
      const response = await fetch(`${this.baseURL}/asset`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        console.log('✅ Livepeer Studio connection successful');
        return true;
      } else {
        console.error('❌ Livepeer Studio connection failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Livepeer Studio connection error:', error);
      return false;
    }
  }

  /**
   * Get API key info (first few characters for debugging)
   * @returns {string} Masked API key
   */
  getApiKeyInfo() {
    if (!this.apiKey) {
      return 'No API key configured';
    }
    return `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 4)}`;
  }
}

// Create and export a single instance
export const livepeerStudio = new LivepeerStudioService();
export default livepeerStudio;