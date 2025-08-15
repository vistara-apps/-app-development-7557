# 🎬 Livepeer Studio Setup Guide

Your app is now configured to use **Livepeer Studio** for real video uploads instead of localStorage. Here's how to set it up:

## 🚀 Quick Setup (5 minutes)

### 1. Create Livepeer Studio Account
- Go to [https://livepeer.studio/](https://livepeer.studio/)
- Sign up for a free account
- You get **1000 minutes free** to test

### 2. Get Your API Key
- Log into your dashboard
- Go to **Developers > API Keys**
- Create a new API key
- Copy the key (starts with `lp_`)

### 3. Configure Your App
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your API key:
VITE_LIVEPEER_API_KEY=lp_your_actual_api_key_here
```

### 4. Test Upload
```bash
# Start your app
npm run dev

# Go to http://localhost:5173
# Click "Upload" button
# Upload a video file
# It will now save to Livepeer cloud storage!
```

## 💰 Pricing (Super Affordable)

- **Free Tier**: 1000 minutes of transcoding/month
- **Pay-as-you-use**: ~$0.0017/minute for transcoding
- **No monthly minimums** for testing
- **80% cheaper** than traditional cloud providers

## 🎯 What Happens When You Upload

1. **File Upload**: Video uploaded to Livepeer Studio via API
2. **Processing**: Automatic transcoding to multiple qualities
3. **CDN Distribution**: Global delivery through Livepeer's network
4. **Instant Playback**: Videos ready in seconds
5. **Automatic Thumbnails**: Generated automatically

## 🔧 Features You Get

- ✅ **Global CDN**: Fast video delivery worldwide
- ✅ **Multiple Qualities**: Automatic 360p, 720p, 1080p transcoding
- ✅ **Thumbnails**: Auto-generated video thumbnails
- ✅ **Analytics**: View counts and engagement metrics
- ✅ **IPFS Storage**: Decentralized storage option
- ✅ **No File Size Limits**: Upload any size video

## 🚨 Without API Key 

If you don't set `VITE_LIVEPEER_API_KEY`, the app will:
- **CRASH** when trying to upload videos
- Show error messages in console
- Only display the 3 mock videos on homepage
- **This is intentional** - no fallback mode

## 🎬 Alternative: Cloudflare Stream

If you prefer Cloudflare Stream instead:

1. Get API key from Cloudflare Stream
2. Replace Livepeer service with Cloudflare API calls
3. Update `src/services/livepeerStudio.js` 

## 📖 Resources

- [Livepeer Studio Docs](https://docs.livepeer.studio/)
- [API Reference](https://docs.livepeer.studio/api-reference)
- [Pricing Calculator](https://livepeer.studio/pricing)

---

**Ready to test?** Just add your API key to `.env` and upload your first video! 🎉