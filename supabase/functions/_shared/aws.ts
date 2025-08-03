/**
 * AWS SDK utilities for Supabase Edge Functions
 * Provides AWS S3 operations for video storage
 */

// AWS SDK v3 imports for Deno
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.0.0';
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.0.0';

// AWS Configuration
const AWS_CONFIG = {
  region: Deno.env.get('AWS_REGION') || 'us-east-1',
  bucket: Deno.env.get('AWS_S3_BUCKET'),
  accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
  secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
  cloudfrontDomain: Deno.env.get('AWS_CLOUDFRONT_DOMAIN'),
};

// Initialize S3 client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    if (!AWS_CONFIG.accessKeyId || !AWS_CONFIG.secretAccessKey || !AWS_CONFIG.bucket) {
      throw new Error('AWS credentials not configured');
    }

    s3Client = new S3Client({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: AWS_CONFIG.accessKeyId,
        secretAccessKey: AWS_CONFIG.secretAccessKey,
      },
    });
  }
  return s3Client;
}

/**
 * Uploads a file to AWS S3
 */
export async function uploadToS3(
  key: string,
  body: Uint8Array | ReadableStream,
  contentType: string,
  metadata: Record<string, string> = {}
): Promise<{
  key: string;
  bucket: string;
  region: string;
  cloudfront_url?: string;
  s3_url: string;
}> {
  const client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
    StorageClass: 'STANDARD_IA', // Cost-optimized storage class
    ServerSideEncryption: 'AES256',
  });

  await client.send(command);

  const s3Url = `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
  const cloudfrontUrl = AWS_CONFIG.cloudfrontDomain 
    ? `https://${AWS_CONFIG.cloudfrontDomain}/${key}`
    : undefined;

  return {
    key,
    bucket: AWS_CONFIG.bucket!,
    region: AWS_CONFIG.region,
    cloudfront_url: cloudfrontUrl,
    s3_url: s3Url,
  };
}

/**
 * Deletes a file from AWS S3
 */
export async function deleteFromS3(key: string): Promise<boolean> {
  try {
    const client = getS3Client();
    
    const command = new DeleteObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error('Failed to delete from S3:', error);
    return false;
  }
}

/**
 * Generates a signed URL for secure access to S3 object
 */
export async function getS3SignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: AWS_CONFIG.bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Checks if an object exists in S3
 */
export async function s3ObjectExists(key: string): Promise<boolean> {
  try {
    const client = getS3Client();
    
    const command = new HeadObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets object metadata from S3
 */
export async function getS3ObjectMetadata(key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  metadata: Record<string, string>;
} | null> {
  try {
    const client = getS3Client();
    
    const command = new HeadObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: key,
    });

    const response = await client.send(command);
    
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified || new Date(),
      contentType: response.ContentType || 'application/octet-stream',
      metadata: response.Metadata || {},
    };
  } catch (error) {
    console.error('Failed to get S3 object metadata:', error);
    return null;
  }
}

/**
 * Generates S3 key for video files
 */
export function generateVideoS3Key(videoId: string, filename: string, quality?: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  const qualitySuffix = quality ? `_${quality}` : '';
  
  return `videos/${videoId}/${timestamp}${qualitySuffix}.${extension}`;
}

/**
 * Generates S3 key for thumbnail files
 */
export function generateThumbnailS3Key(videoId: string, filename: string): string {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  
  return `thumbnails/${videoId}/${timestamp}_thumb.${extension}`;
}

/**
 * Gets CloudFront URL for S3 key
 */
export function getCloudFrontUrl(key: string): string {
  if (AWS_CONFIG.cloudfrontDomain) {
    return `https://${AWS_CONFIG.cloudfrontDomain}/${key}`;
  }
  
  // Fallback to S3 URL
  return `https://${AWS_CONFIG.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
}

/**
 * Validates AWS configuration
 */
export function validateAWSConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!AWS_CONFIG.bucket) {
    errors.push('AWS_S3_BUCKET environment variable is required');
  }

  if (!AWS_CONFIG.accessKeyId) {
    errors.push('AWS_ACCESS_KEY_ID environment variable is required');
  }

  if (!AWS_CONFIG.secretAccessKey) {
    errors.push('AWS_SECRET_ACCESS_KEY environment variable is required');
  }

  if (!AWS_CONFIG.region) {
    errors.push('AWS_REGION environment variable is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets AWS configuration status
 */
export function getAWSConfigStatus() {
  return {
    bucket: AWS_CONFIG.bucket,
    region: AWS_CONFIG.region,
    cloudfrontEnabled: !!AWS_CONFIG.cloudfrontDomain,
    cloudfrontDomain: AWS_CONFIG.cloudfrontDomain,
    isConfigured: validateAWSConfig().isValid,
  };
}

/**
 * Copies object from one S3 key to another
 */
export async function copyS3Object(
  sourceKey: string,
  destinationKey: string,
  metadata?: Record<string, string>
): Promise<boolean> {
  try {
    const client = getS3Client();
    
    // First get the source object
    const getCommand = new GetObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: sourceKey,
    });
    
    const sourceObject = await client.send(getCommand);
    
    if (!sourceObject.Body) {
      throw new Error('Source object has no body');
    }

    // Convert ReadableStream to Uint8Array
    const chunks: Uint8Array[] = [];
    const reader = sourceObject.Body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const body = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }

    // Upload to destination
    const putCommand = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucket,
      Key: destinationKey,
      Body: body,
      ContentType: sourceObject.ContentType,
      Metadata: metadata || sourceObject.Metadata,
      StorageClass: 'STANDARD_IA',
      ServerSideEncryption: 'AES256',
    });

    await client.send(putCommand);
    return true;
  } catch (error) {
    console.error('Failed to copy S3 object:', error);
    return false;
  }
}

export { AWS_CONFIG };
