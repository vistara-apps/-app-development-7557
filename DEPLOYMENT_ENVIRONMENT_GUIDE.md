# 🚀 Deployment Environment Configuration Guide

## Required Environment Variables

For the app to work in deployment, you need to set these environment variables:

### ✅ Essential (Required for basic functionality)

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### ⚙️ Optional (For enhanced features)

```bash
# Livepeer Studio (for advanced video processing)
VITE_LIVEPEER_API_KEY=lp_your_api_key

# AWS S3 (for additional storage options)
VITE_AWS_S3_REGION=us-east-1
VITE_AWS_S3_BUCKET=your-bucket-name
VITE_AWS_ACCESS_KEY_ID=your-access-key
VITE_AWS_SECRET_ACCESS_KEY=your-secret-key

# Storage Configuration
VITE_STORAGE_PROVIDER=supabase
VITE_MAX_VIDEO_SIZE=52428800
```

## Deployment Platforms

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - Go to your project → Settings → Environment Variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Netlify

1. Connect your GitHub repository to Netlify
2. Add environment variables in Netlify dashboard:
   - Go to Site settings → Environment variables
   - Add the required variables

### Other Platforms

For any deployment platform, ensure you set the environment variables in their dashboard or configuration files.

## Common Deployment Issues

### 1. Video Upload Fails
- **Cause**: Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`
- **Solution**: Add these environment variables to your deployment platform

### 2. CORS Errors
- **Cause**: Domain not added to Supabase allowed origins
- **Solution**: Add your deployment domain to Supabase → Authentication → URL Configuration

### 3. Videos Don't Load
- **Cause**: Storage bucket not configured or RLS policies too restrictive
- **Solution**: Check Supabase storage settings and policies

## Verification Steps

After deployment, verify:

1. ✅ App loads without errors
2. ✅ Can view existing videos
3. ✅ Can upload new videos (test with small file)
4. ✅ Videos play properly
5. ✅ No console errors related to authentication or storage

## Support

If you encounter issues:
1. Check browser console for specific error messages
2. Verify environment variables are set correctly
3. Test with a small video file first (< 10MB)
4. Check Supabase dashboard for any error logs
