/**
 * Upload Debugger Utility
 * Helps troubleshoot upload issues with Livepeer Studio
 */

import livepeerStudio from '../services/livepeerStudio';

export class UploadDebugger {
  constructor() {
    this.debugLog = [];
    this.isDebugging = false;
  }

  /**
   * Start debugging session
   */
  startDebug() {
    this.isDebugging = true;
    this.debugLog = [];
    console.log('🔍 Upload debugging started');
    this.log('Debug session started');
  }

  /**
   * Stop debugging session
   */
  stopDebug() {
    this.isDebugging = false;
    console.log('🔍 Upload debugging stopped');
    this.log('Debug session stopped');
  }

  /**
   * Log debug information
   */
  log(message, data = null) {
    if (!this.isDebugging) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    this.debugLog.push(logEntry);
    console.log(`🔍 [${logEntry.timestamp}] ${message}`, data || '');
  }

  /**
   * Test Livepeer Studio connection
   */
  async testConnection() {
    this.log('Testing Livepeer Studio connection...');
    
    try {
      const isWorking = await livepeerStudio.testConnection();
      const apiKeyInfo = livepeerStudio.getApiKeyInfo();
      
      this.log('Connection test result', { isWorking, apiKeyInfo });
      
      return { isWorking, apiKeyInfo };
    } catch (error) {
      this.log('Connection test failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Test asset creation
   */
  async testAssetCreation() {
    this.log('Testing asset creation...');
    
    try {
      const testMetadata = {
        title: 'Test Asset - Debug',
        description: 'This is a test asset for debugging purposes'
      };
      
      this.log('Creating test asset with metadata', testMetadata);
      
      // This will only create the asset, not upload a file
      const asset = await livepeerStudio._createAsset(testMetadata);
      
      this.log('Test asset created successfully', asset);
      
      // Clean up the test asset
      try {
        await livepeerStudio.deleteAsset(asset.id);
        this.log('Test asset cleaned up');
      } catch (cleanupError) {
        this.log('Failed to clean up test asset', { error: cleanupError.message });
      }
      
      return asset;
    } catch (error) {
      this.log('Asset creation test failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get debug log
   */
  getDebugLog() {
    return this.debugLog;
  }

  /**
   * Export debug log
   */
  exportDebugLog() {
    const logText = this.debugLog
      .map(entry => `[${entry.timestamp}] ${entry.message}${entry.data ? ' - ' + JSON.stringify(entry.data, null, 2) : ''}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-debug-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Run comprehensive debug tests
   */
  async runFullDebug() {
    this.startDebug();
    
    try {
      this.log('Starting comprehensive debug tests...');
      
      // Test 1: Connection
      this.log('=== Test 1: Connection Test ===');
      const connectionResult = await this.testConnection();
      
      if (!connectionResult.isWorking) {
        this.log('❌ Connection test failed - stopping debug');
        return false;
      }
      
      // Test 2: Asset Creation
      this.log('=== Test 2: Asset Creation Test ===');
      await this.testAssetCreation();
      
      this.log('✅ All debug tests passed');
      return true;
      
    } catch (error) {
      this.log('❌ Debug tests failed', { error: error.message });
      return false;
    } finally {
      this.stopDebug();
    }
  }
}

// Create and export a singleton instance
export const uploadDebugger = new UploadDebugger();
export default uploadDebugger;
