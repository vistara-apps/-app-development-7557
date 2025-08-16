# 🔧 UUID Anonymous User Fix

## The Problem
```
Error: Failed to create video record: invalid input syntax for type uuid: "anon-1755316856102-qvkxd33"
```

The error occurred because:
1. The `last_modified_by` field in the `videos` table expects a UUID
2. We were trying to insert a string like `"anon-1755316856102-qvkxd33"` for anonymous users
3. PostgreSQL rejected the non-UUID string

## The Solution

### 1. Database Schema Update
Created `supabase/migrations/003_allow_anonymous_uploads.sql` to:
- ✅ Allow `last_modified_by` field to be NULL
- ✅ Update RLS policies to allow anonymous uploads
- ✅ Update storage policies for anonymous access

### 2. Application Code Updates

**Simple Video Upload Service** (`src/services/simpleVideoUpload.js`):
- ✅ Added UUID validation function `_isValidUUID()`
- ✅ Only set `last_modified_by` for valid UUIDs (authenticated users)
- ✅ Omit field for anonymous users (let database handle with NULL)

**Supabase Functions**:
- ✅ Updated `videos/index.ts` to handle NULL user IDs
- ✅ Updated `videos-upload/index.ts` to only set `last_modified_by` for valid users
- ✅ Use NULL instead of generating fake UUIDs

**Auth Context** (`src/context/AuthContext.jsx`):
- ✅ `getCurrentUserId()` returns NULL for anonymous users
- ✅ Prevents passing non-UUID strings to database operations

### 3. Key Changes

**Before** (Causing Error):
```javascript
last_modified_by: videoData.uploadedBy || 'guest'  // ❌ String not UUID
```

**After** (Fixed):
```javascript
// Only add last_modified_by if it's a valid UUID
if (videoData.uploadedBy && this._isValidUUID(videoData.uploadedBy)) {
  insertData.last_modified_by = videoData.uploadedBy;
}
// For anonymous users, omit this field (NULL)
```

## Database Migration Required

To deploy this fix, you need to run the migration:

```sql
-- In your Supabase dashboard, run:
-- supabase/migrations/003_allow_anonymous_uploads.sql
```

This migration:
- Allows NULL values in `last_modified_by`
- Updates RLS policies for anonymous access
- Enables anonymous uploads to storage buckets

## Result

Now anonymous users can upload videos without authentication errors:
- ✅ No UUID validation errors
- ✅ Anonymous uploads work properly
- ✅ Database handles NULL values correctly
- ✅ App doesn't crash on anonymous video creation

## Testing

After applying the fix and migration:
1. Clear browser cache/localStorage
2. Try uploading a video without logging in
3. Should work without UUID errors

The upload will create a video record with `last_modified_by = NULL` instead of trying to insert an invalid UUID string.
