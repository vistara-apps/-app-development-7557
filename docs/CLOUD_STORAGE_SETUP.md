# Phyght Cloud Storage Setup Guide

## Overview

This guide covers the setup and configuration of the hybrid cloud storage system for the Phyght video platform. The system supports both Supabase Storage and AWS S3 with CloudFront CDN for scalable, global video delivery.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [AWS S3 Setup](#aws-s3-setup)
4. [CloudFront Configuration](#cloudfront-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Database Migration](#database-migration)
7. [Testing the Setup](#testing-the-setup)
8. [Monitoring and Analytics](#monitoring-and-analytics)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Phyght platform uses a hybrid storage architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   AWS S3        │
│   React App     │◄──►│   Edge Functions│◄──►│   + CloudFront  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Video Upload  │    │   Database      │    │   Global CDN    │
│   Management    │    │   Metadata      │    │   Delivery      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Hybrid Storage**: Seamlessly switch between Supabase Storage and AWS S3
- **Global CDN**: CloudFront for fast worldwide video delivery
- **Migration Support**: Gradual migration from Supabase to AWS S3
- **Cost Optimization**: Intelligent storage classes and lifecycle policies
- **Real-time Analytics**: Storage usage and cost monitoring
- **Scalability**: Handle growing video libraries efficiently

## Prerequisites

Before setting up cloud storage, ensure you have:

1. **AWS Account** with appropriate permissions
2. **Supabase Project** already configured
3. **Domain Name** (optional, for custom CloudFront domain)
4. **SSL Certificate** (if using custom domain)

### Required AWS Permissions

Your AWS IAM user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketCORS",
        "s3:PutBucketLifecycleConfiguration"
      ],
      "Resource": [
        "arn:aws:s3:::your-phyght-bucket",
        "arn:aws:s3:::your-phyght-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## AWS S3 Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://phyght-videos-production --region us-east-1

# Or use the AWS Console
```

### 2. Configure Bucket Policy

Create a bucket policy for public read access to videos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::phyght-videos-production/videos/*"
    },
    {
      "Sid": "PublicReadGetThumbnails",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::phyght-videos-production/thumbnails/*"
    }
  ]
}
```

### 3. Configure CORS

Set up CORS for web uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://your-domain.com",
      "https://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4. Set Up Lifecycle Policy

Configure automatic storage class transitions:

```json
{
  "Rules": [
    {
      "ID": "VideoLifecycle",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "videos/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        },
        {
          "Days": 365,
          "StorageClass": "DEEP_ARCHIVE"
        }
      ]
    }
  ]
}
```

## CloudFront Configuration

### 1. Create Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 2. Distribution Configuration

Create `cloudfront-config.json`:

```json
{
  "CallerReference": "phyght-videos-$(date +%s)",
  "Comment": "Phyght Video CDN",
  "DefaultRootObject": "",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-phyght-videos-production",
        "DomainName": "phyght-videos-production.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-phyght-videos-production",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All"
}
```

### 3. Custom Domain (Optional)

If using a custom domain:

1. Add CNAME record: `videos.yourdomain.com` → `d123456789.cloudfront.net`
2. Add SSL certificate in AWS Certificate Manager
3. Update CloudFront distribution with custom domain

## Environment Configuration

### 1. Update .env File

Copy from `.env.example` and configure:

```bash
# AWS S3 Configuration
VITE_AWS_S3_BUCKET=phyght-videos-production
VITE_AWS_S3_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your_access_key_id
VITE_AWS_SECRET_ACCESS_KEY=your_secret_access_key
VITE_AWS_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net

# Storage Configuration
VITE_STORAGE_PROVIDER=hybrid
VITE_ENABLE_S3_MIGRATION=true
VITE_S3_STORAGE_CLASS=STANDARD_IA
VITE_S3_LIFECYCLE_ENABLED=true

# AWS Backend Configuration (for Supabase Edge Functions)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=phyght-videos-production
AWS_CLOUDFRONT_DOMAIN=d123456789.cloudfront.net
```

### 2. Storage Provider Options

- `supabase`: Use only Supabase Storage
- `aws`: Use only AWS S3
- `hybrid`: Use both (new uploads go to AWS, existing stay in Supabase)

## Database Migration

### 1. Run Migration

```bash
# Apply the AWS storage support migration
supabase db push

# Or manually run the migration
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/002_aws_storage_support.sql
```

### 2. Verify Migration

Check that new tables and columns exist:

```sql
-- Check new columns in videos table
\d public.videos

-- Check new tables
\dt public.storage_*

-- Verify functions
\df public.get_storage_statistics
```

## Testing the Setup

### 1. Test AWS Configuration

```javascript
// Test AWS configuration in browser console
import { validateAWSConfig } from './src/config/aws.js';
console.log(validateAWSConfig());
```

### 2. Test Video Upload

1. Go to Admin Dashboard → Video Management
2. Upload a test video
3. Verify it appears in AWS S3 bucket
4. Check CloudFront URL works

### 3. Test Migration

```javascript
// Test video migration
import { storageService } from './src/services/storageService.js';

// Migrate a specific video
const result = await storageService.migrateVideoToAWS(videoObject);
console.log('Migration result:', result);
```

## Monitoring and Analytics

### 1. Storage Analytics Dashboard

Access via Admin Dashboard → Storage Analytics to monitor:

- Storage usage by provider
- Cost breakdown
- Performance metrics
- Migration status

### 2. AWS CloudWatch

Set up CloudWatch alarms for:

- S3 storage costs
- CloudFront bandwidth usage
- Error rates

### 3. Cost Monitoring

```bash
# Get AWS cost estimates
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Troubleshooting

### Common Issues

#### 1. Upload Fails to S3

**Symptoms**: Videos upload to Supabase but not S3

**Solutions**:
- Check AWS credentials in environment variables
- Verify S3 bucket permissions
- Check CORS configuration
- Ensure bucket exists in correct region

#### 2. CloudFront URLs Not Working

**Symptoms**: S3 URLs work but CloudFront URLs return errors

**Solutions**:
- Wait for CloudFront distribution to deploy (15-20 minutes)
- Check origin configuration
- Verify cache behaviors
- Test with CloudFront domain directly

#### 3. Migration Fails

**Symptoms**: Videos don't migrate from Supabase to S3

**Solutions**:
- Check Supabase storage permissions
- Verify AWS credentials have S3 write access
- Check file sizes (ensure within limits)
- Review migration logs in browser console

#### 4. High Costs

**Symptoms**: AWS bills higher than expected

**Solutions**:
- Review storage class configuration
- Check lifecycle policies are active
- Monitor CloudFront usage
- Consider request patterns optimization

### Debug Commands

```bash
# Check S3 bucket contents
aws s3 ls s3://phyght-videos-production --recursive

# Test CloudFront distribution
curl -I https://d123456789.cloudfront.net/videos/test-video.mp4

# Check Supabase Edge Function logs
supabase functions logs videos-upload

# Validate environment configuration
node -e "console.log(process.env)" | grep AWS
```

### Performance Optimization

1. **Enable Gzip Compression** in CloudFront
2. **Use Appropriate Storage Classes** for different access patterns
3. **Implement Intelligent Tiering** for cost optimization
4. **Monitor Cache Hit Ratios** and adjust TTL settings
5. **Use Regional Edge Caches** for better performance

## Security Considerations

1. **IAM Policies**: Use least-privilege access
2. **Signed URLs**: For private content access
3. **CORS Configuration**: Restrict to your domains
4. **Bucket Policies**: Limit public access appropriately
5. **CloudFront Security**: Use security headers and WAF if needed

## Next Steps

After successful setup:

1. **Monitor Performance**: Track upload/download speeds
2. **Optimize Costs**: Review storage classes and lifecycle policies
3. **Plan Migration**: Gradually migrate existing videos
4. **Scale Infrastructure**: Add more regions if needed
5. **Implement Backup**: Set up cross-region replication

For additional help, refer to:
- [AWS Deployment Guide](./AWS_DEPLOYMENT_GUIDE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [User Journeys](./USER_JOURNEYS.md)
