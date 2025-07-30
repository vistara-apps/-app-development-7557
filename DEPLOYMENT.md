# Phyght - Combat Sports Video Platform

## Quick Deployment Guide

### 1. Environment Setup

Create a `.env` file in the root directory:

```env
# Livepeer Configuration
VITE_LIVEPEER_API_KEY=your-livepeer-api-key-here

# App Configuration
VITE_STEALTH_MODE=true
```

### 2. Get Livepeer API Key

1. Go to [Livepeer Studio](https://livepeer.studio/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm run build
# Upload the dist folder to Netlify
```

#### GitHub Pages
```bash
npm run build
# Push to GitHub and enable Pages
```

## Features

✅ **Fixed Issues:**
- Removed premium upgrade from main attention
- Fixed search categories font visibility
- Integrated Livepeer for real video streaming
- Fixed infinite loop errors
- Fixed Dashboard component errors

✅ **Video Features:**
- Real video playback with Livepeer
- Video modal with controls
- Token earning for watching videos
- Category filtering
- Search functionality

✅ **Ready for Demo:**
- Clean, production-ready UI
- No premium upgrade distractions
- Working video player
- Responsive design

## Livepeer Integration

The app now uses Livepeer for video streaming. To add real combat sports videos:

1. Upload videos to Livepeer Studio
2. Update the `COMBAT_VIDEOS` array in `src/services/livepeer.js`
3. Replace asset IDs with your actual Livepeer asset IDs

## Demo Videos

Currently using sample videos from Google's video collection for demo purposes. Replace with real combat sports content for production. 