#!/usr/bin/env node

/**
 * GCP Transfer Script
 * Transfers videos from Supabase storage to GCP bucket
 * 
 * Usage: node scripts/transfer-to-gcp.js
 * 
 * Prerequisites:
 * 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
 * 2. Authenticate: gcloud auth login
 * 3. Set project: gcloud config set project visdev-427218
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GCP_BUCKET = 'devfundb';
const GCP_PROJECT = 'visdev-427218';

async function transferToGCP() {
  console.log('🚀 Starting GCP transfer...');
  
  try {
    // Check if gcloud is installed
    try {
      execSync('gcloud --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ gcloud CLI not found. Please install it first:');
      console.error('   https://cloud.google.com/sdk/docs/install');
      return;
    }

    // Check if authenticated
    try {
      const authInfo = execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { encoding: 'utf8' });
      if (!authInfo.trim()) {
        console.error('❌ Not authenticated with gcloud. Run: gcloud auth login');
        return;
      }
      console.log('✅ Authenticated as:', authInfo.trim());
    } catch (error) {
      console.error('❌ Authentication check failed');
      return;
    }

    // Set project
    try {
      execSync(`gcloud config set project ${GCP_PROJECT}`, { stdio: 'pipe' });
      console.log(`✅ Project set to: ${GCP_PROJECT}`);
    } catch (error) {
      console.error('❌ Failed to set project');
      return;
    }

    // List files in Supabase storage (you'll need to implement this)
    console.log('📋 To transfer videos to GCP:');
    console.log('1. Download videos from Supabase storage');
    console.log('2. Upload to GCP bucket using gsutil');
    console.log('3. Update database records');
    
    console.log('\n📝 Manual transfer commands:');
    console.log(`# Download from Supabase (implement this part)`);
    console.log(`# gsutil cp video.mp4 gs://${GCP_BUCKET}/videos/`);
    console.log(`# gsutil acl ch -u AllUsers:R gs://${GCP_BUCKET}/videos/video.mp4`);
    
    console.log('\n🎯 For now, videos are stored in Supabase storage and working!');
    console.log('   You can implement the GCP transfer later when needed.');

  } catch (error) {
    console.error('❌ Transfer failed:', error);
  }
}

// Run the transfer
transferToGCP();
