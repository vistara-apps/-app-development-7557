# Phyght Video Platform - Backend API Documentation

## Overview

This document describes the comprehensive backend API implementation for the Phyght video platform, featuring CRDT (Conflict-free Replicated Data Types) for distributed scalability, real-time synchronization, and secure video management.

## Architecture

### Core Components

1. **Supabase Edge Functions** - Serverless backend API endpoints
2. **PostgreSQL Database** - Video metadata and CRDT state storage
3. **Supabase Storage** - Video and thumbnail file storage
4. **Real-time Subscriptions** - Live updates via Supabase Realtime
5. **CRDT Implementation** - Distributed conflict resolution

### Technology Stack

- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: PostgreSQL with JSONB support
- **Storage**: Supabase Storage (S3-compatible)
- **Real-time**: Supabase Realtime (WebSocket)
- **Authentication**: Supabase Auth with RLS
- **CRDT**: Custom implementation with vector clocks

## Database Schema

### Core Tables

#### `profiles`
Extends Supabase auth.users with role-based access control.

```sql
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user', -- 'admin', 'moderator', 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `videos`
Main video metadata table with CRDT support.

```sql
CREATE TABLE public.videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    thumbnail_path TEXT,
    duration INTEGER, -- seconds
    file_size BIGINT, -- bytes
    mime_type TEXT,
    status video_status DEFAULT 'uploading',
    
    -- CRDT fields
    vector_clock JSONB DEFAULT '{}',
    last_modified_by UUID REFERENCES public.profiles(id),
    version INTEGER DEFAULT 1,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

#### `crdt_operations`
Log of all CRDT operations for conflict resolution.

```sql
CREATE TABLE public.crdt_operations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    operation_data JSONB NOT NULL,
    vector_clock JSONB NOT NULL,
    actor_id UUID REFERENCES public.profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Video Management

#### `GET /videos`
List videos with pagination and filtering.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `search` (string): Search in title/description
- `status` (string): Filter by status ('ready', 'processing', etc.)
- `featured` (boolean): Filter featured videos

**Response:**
```json
{
  "videos": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### `POST /videos`
Create a new video record (metadata only).

**Request Body:**
```json
{
  "title": "Video Title",
  "description": "Video description",
  "category": "Combat Sports",
  "tags": ["mma", "training"],
  "is_featured": false
}
```

#### `GET /videos-update/{id}`
Get a single video by ID with public URLs.

#### `PUT /videos-update/{id}`
Update video metadata with CRDT conflict resolution.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "vector_clock": {"user-id": 5},
  "version": 3
}
```

#### `DELETE /videos-delete/{id}`
Delete video (soft delete by default, hard delete with `?hard=true`).

### Video Upload

#### `POST /videos-upload`
Upload video file and optional thumbnail.

**Request:** Multipart form data
- `videoId`: UUID of the video record
- `video`: Video file
- `thumbnail`: Thumbnail image (optional)

#### `PUT /videos-upload`
Mark video processing as complete.

**Request Body:**
```json
{
  "videoId": "uuid",
  "duration": 120,
  "processingResults": {...}
}
```

### Real-time Synchronization

#### `POST /sync`
Synchronize video state with CRDT conflict resolution.

**Request Body:**
```json
{
  "video_id": "uuid",
  "client_vector_clock": {"user-1": 3, "user-2": 1},
  "client_version": 5,
  "operations": [...]
}
```

**Response:**
```json
{
  "video_id": "uuid",
  "sync_type": "concurrent",
  "action": "merged_concurrent",
  "merged_video": {...},
  "conflicts_resolved": 2,
  "server_vector_clock": {"user-1": 3, "user-2": 1, "user-3": 2},
  "server_version": 6
}
```

#### `GET /sync`
Get current sync state for a video.

**Query Parameters:**
- `video_id`: Video UUID
- `since`: ISO timestamp for incremental sync

## CRDT Implementation

### Vector Clocks

Each video maintains a vector clock to track concurrent modifications:

```typescript
interface VectorClock {
  [actorId: string]: number;
}
```

### Conflict Resolution

1. **Last-Writer-Wins (LWW)**: For simple fields like title, description
2. **G-Set**: For tags (grow-only set)
3. **Vector Clock Ordering**: Determines operation precedence

### Operation Types

- `update_title`: Change video title
- `update_description`: Change description
- `update_category`: Change category
- `add_tag`: Add a tag
- `remove_tag`: Remove a tag
- `set_tags`: Replace all tags
- `update_featured`: Change featured status

### Merge Strategy

```typescript
// Compare vector clocks
const comparison = VideoCRDT.compareVectorClocks(local, remote);

switch (comparison) {
  case 'before': // Local is older, apply remote
  case 'after':  // Local is newer, keep local
  case 'concurrent': // Merge using LWW + vector clocks
}
```

## Authentication & Authorization

### Role-Based Access Control

- **Admin**: Full access (create, read, update, delete)
- **Moderator**: Content management (create, read, update)
- **User**: Read-only access

### Row Level Security (RLS)

All tables use Supabase RLS policies:

```sql
-- Example: Only admins and moderators can update videos
CREATE POLICY "Only admins and moderators can update videos" 
ON public.videos FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);
```

## File Storage

### Storage Buckets

- `videos`: Video files (public read, admin/moderator write)
- `thumbnails`: Thumbnail images (public read, admin/moderator write)

### File Organization

```
videos/
  {video-id}/
    {timestamp}.{extension}
    
thumbnails/
  {video-id}/
    {timestamp}_thumb.{extension}
```

### Supported Formats

**Videos:**
- MP4, WebM, OGG, AVI, MOV
- Max size: 50MB

**Thumbnails:**
- JPEG, PNG, WebP
- Max size: 5MB

## Real-time Features

### Supabase Realtime Integration

```typescript
// Subscribe to video changes
const channel = supabase
  .channel(`video-${videoId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'videos',
    filter: `id=eq.${videoId}`
  }, handleVideoChange)
  .subscribe();
```

### Conflict Resolution Flow

1. Client makes local changes
2. Client attempts to sync with server
3. Server detects conflicts using vector clocks
4. Server merges changes using CRDT rules
5. Server broadcasts updates to all clients
6. Clients apply merged state

## Error Handling

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (CRDT conflict detected)
- `500`: Internal Server Error

### CRDT Conflict Response

```json
{
  "error": "Conflict detected: Server has newer changes. Please refresh and try again.",
  "conflict_type": "vector_clock_mismatch",
  "server_vector_clock": {...},
  "server_version": 10
}
```

## Performance Considerations

### Database Optimization

- **Indexes**: On frequently queried fields (status, category, created_at)
- **JSONB**: Efficient storage and querying of vector clocks
- **Pagination**: Limit result sets to prevent memory issues

### Caching Strategy

- **CDN**: Video files served via Supabase Storage CDN
- **Metadata**: Cached at application level
- **Real-time**: Efficient WebSocket connections

### Scalability

- **Horizontal**: Supabase Edge Functions auto-scale
- **Database**: PostgreSQL with read replicas
- **Storage**: Distributed object storage
- **CRDT**: Enables offline-first, distributed editing

## Security

### Input Validation

- File type validation
- File size limits
- SQL injection prevention
- XSS protection

### Access Control

- JWT-based authentication
- Role-based permissions
- Row-level security
- API rate limiting

### Data Protection

- Encrypted storage
- Secure file uploads
- Audit logging via CRDT operations

## Deployment

### Environment Variables

```bash
# Supabase
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage
VITE_MAX_VIDEO_SIZE=52428800
VITE_MAX_THUMBNAIL_SIZE=5242880
```

### Database Migration

```bash
# Apply initial schema
supabase db push

# Run migrations
supabase migration up
```

### Edge Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy videos
```

## Monitoring & Analytics

### Logging

- Structured logging in Edge Functions
- CRDT operation audit trail
- Error tracking and alerting

### Metrics

- API response times
- Video upload success rates
- CRDT conflict frequency
- Storage usage

### Health Checks

- Database connectivity
- Storage availability
- Real-time connection status

## Future Enhancements

### Video Processing

- Automatic transcoding
- Multiple quality levels
- Thumbnail generation
- Video compression

### Advanced CRDT Features

- Operational transforms
- Causal consistency
- Conflict-free deletion
- Collaborative editing UI

### Performance Optimizations

- Edge caching
- Lazy loading
- Progressive uploads
- Background sync

## Troubleshooting

### Common Issues

1. **CRDT Conflicts**: Check vector clock synchronization
2. **Upload Failures**: Verify file size and format
3. **Permission Errors**: Check user roles and RLS policies
4. **Real-time Issues**: Verify WebSocket connections

### Debug Tools

- Supabase Dashboard
- Edge Function logs
- Database query analyzer
- Real-time connection monitor

## API Testing

### Example Requests

```bash
# Create video
curl -X POST /videos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Video", "category": "Training"}'

# Upload video file
curl -X POST /videos-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "videoId=uuid" \
  -F "video=@video.mp4"

# Sync video state
curl -X POST /sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "uuid", "client_vector_clock": {"user1": 3}}'
```

This backend API provides a robust, scalable foundation for the Phyght video platform with distributed conflict resolution, real-time synchronization, and production-ready security features.
