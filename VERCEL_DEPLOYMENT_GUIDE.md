# 🚀 Vercel Deployment Guide - Phyght Video Platform

## Overview

This guide provides comprehensive instructions for deploying the Phyght video platform to Vercel with full backend API integration using Supabase. The deployment includes automated setup scripts and production-ready configurations.

## 📋 Prerequisites

Before starting the deployment, ensure you have:

- ✅ **Vercel Account**: [Sign up at vercel.com](https://vercel.com)
- ✅ **Supabase Account**: [Sign up at supabase.com](https://supabase.com)
- ✅ **GitHub Repository**: Access to this repository
- ✅ **Node.js**: Version 18+ installed locally
- ✅ **Vercel CLI**: `npm install -g vercel`
- ✅ **Supabase CLI**: `npm install -g supabase`

## 🎯 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel App    │    │  Supabase API   │    │ Supabase DB     │
│   (Frontend)    │◄──►│ (Edge Functions)│◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ - React App     │    │ - Video CRUD    │    │ - Video Metadata│
│ - Admin Panel   │    │ - File Upload   │    │ - CRDT State    │
│ - Video Player  │    │ - CRDT Sync     │    │ - User Profiles │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Deploy (Automated)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vistara-apps/-app-development-7557&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20configuration%20required&envLink=https://supabase.com/dashboard)

### Option 2: Automated Setup Script

Run our automated deployment script:

```bash
# Clone and setup
git clone https://github.com/vistara-apps/-app-development-7557.git
cd -app-development-7557

# Run automated deployment
chmod +x scripts/deploy-to-vercel.sh
./scripts/deploy-to-vercel.sh
```

## 📝 Manual Deployment Steps

### Step 1: Supabase Project Setup

#### 1.1 Create Supabase Project

```bash
# Login to Supabase
supabase login

# Create new project
supabase projects create phyght-video-platform

# Initialize Supabase in your project
supabase init
```

#### 1.2 Configure Database Schema

```bash
# Apply database migrations
supabase db push

# Or manually run the schema
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
```

#### 1.3 Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy individually
supabase functions deploy videos
supabase functions deploy videos-upload
supabase functions deploy videos-update
supabase functions deploy videos-delete
supabase functions deploy sync
```

#### 1.4 Configure Storage Buckets

```bash
# Create storage buckets
supabase storage create videos --public
supabase storage create thumbnails --public

# Set up storage policies (run in Supabase SQL editor)
```

### Step 2: Vercel Project Setup

#### 2.1 Connect Repository

```bash
# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Or import from GitHub dashboard
# Go to https://vercel.com/new and import your repository
```

#### 2.2 Configure Environment Variables

Set the following environment variables in Vercel dashboard or via CLI:

```bash
# Core Supabase Configuration
vercel env add VITE_SUPABASE_URL
# Enter: https://your-project.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Enter: your_supabase_anon_key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Enter: your_supabase_service_role_key

# Video Configuration
vercel env add VITE_MAX_VIDEO_SIZE
# Enter: 52428800

vercel env add VITE_MAX_THUMBNAIL_SIZE
# Enter: 5242880

vercel env add VITE_SUPPORTED_VIDEO_FORMATS
# Enter: video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime

vercel env add VITE_SUPPORTED_IMAGE_FORMATS
# Enter: image/jpeg,image/png,image/webp

# Optional: Feature Flags
vercel env add VITE_STEALTH_MODE
# Enter: false

vercel env add VITE_DEBUG_MODE
# Enter: false
```

#### 2.3 Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

## ⚙️ Advanced Configuration

### Custom Domain Setup

```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS records
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.61
```

### Performance Optimization

#### Build Configuration

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=86400"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-project.supabase.co/functions/v1/:path*"
    }
  ]
}
```

#### Edge Functions Configuration

```json
{
  "functions": {
    "src/api/**/*.js": {
      "runtime": "edge"
    }
  }
}
```

### Security Configuration

#### Content Security Policy

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
        }
      ]
    }
  ]
}
```

## 🔧 Environment-Specific Configurations

### Production Environment

```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key
VITE_STEALTH_MODE=false
VITE_DEBUG_MODE=false
NODE_ENV=production
```

### Staging Environment

```bash
# Staging environment variables
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
VITE_STEALTH_MODE=true
VITE_DEBUG_MODE=true
NODE_ENV=staging
```

### Development Environment

```bash
# Development environment variables
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
VITE_STEALTH_MODE=true
VITE_DEBUG_MODE=true
NODE_ENV=development
```

## 🔄 CI/CD Pipeline

### GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build project
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Automated Database Migrations

```yaml
- name: Run Supabase Migrations
  run: |
    supabase db push --db-url ${{ secrets.DATABASE_URL }}
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## 📊 Monitoring & Analytics

### Vercel Analytics

```javascript
// Add to your main component
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Performance Monitoring

```javascript
// Add to vercel.json
{
  "functions": {
    "app/**/*.js": {
      "includeFiles": "**"
    }
  },
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "0 */5 * * * *"
    }
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Check build logs
vercel logs

# Local build test
npm run build

# Clear cache
vercel --force
```

#### Environment Variable Issues

```bash
# List current environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

#### Supabase Connection Issues

```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/videos

# Check Edge Functions
supabase functions list
```

### Performance Issues

#### Bundle Size Optimization

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react']
        }
      }
    }
  }
}
```

#### Image Optimization

```javascript
// Use Vercel Image Optimization
import Image from 'next/image'

<Image
  src="/video-thumbnail.jpg"
  alt="Video thumbnail"
  width={300}
  height={200}
  priority
/>
```

## 🔐 Security Best Practices

### Environment Security

- ✅ Never commit `.env` files
- ✅ Use Vercel's encrypted environment variables
- ✅ Rotate API keys regularly
- ✅ Use different keys for different environments

### API Security

```javascript
// Add rate limiting
export default async function handler(req, res) {
  // Rate limiting logic
  const rateLimited = await checkRateLimit(req.ip);
  if (rateLimited) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Your API logic
}
```

### Content Security

```javascript
// Validate file uploads
const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
const maxSize = 50 * 1024 * 1024; // 50MB

if (!allowedTypes.includes(file.type) || file.size > maxSize) {
  throw new Error('Invalid file');
}
```

## 📈 Scaling Considerations

### Database Scaling

- **Connection Pooling**: Use Supabase connection pooling
- **Read Replicas**: Configure read replicas for better performance
- **Indexing**: Optimize database queries with proper indexes

### CDN Configuration

```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/videos/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Edge Functions

- Use Vercel Edge Functions for global performance
- Implement caching strategies
- Monitor function execution times

## 🎉 Post-Deployment Checklist

### Verification Steps

- [ ] ✅ Application loads successfully
- [ ] ✅ Video upload functionality works
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Database connections established
- [ ] ✅ Real-time features working
- [ ] ✅ CRDT synchronization functional
- [ ] ✅ File storage operational
- [ ] ✅ Authentication working
- [ ] ✅ Performance metrics acceptable
- [ ] ✅ Error monitoring active

### Performance Benchmarks

- **Page Load Time**: < 3 seconds
- **Video Upload**: < 30 seconds for 50MB
- **API Response**: < 500ms average
- **Database Queries**: < 100ms average

### Monitoring Setup

```bash
# Set up monitoring
vercel logs --follow

# Monitor Supabase
# Check Supabase dashboard for metrics
```

## 📞 Support & Resources

### Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://react.dev/)

### Community Support

- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/vistara-apps/-app-development-7557/issues)

### Professional Support

For enterprise deployments or custom configurations, contact:
- **Vercel Enterprise**: [vercel.com/enterprise](https://vercel.com/enterprise)
- **Supabase Pro**: [supabase.com/pricing](https://supabase.com/pricing)

---

## 🎯 Next Steps

After successful deployment:

1. **Configure Custom Domain**: Set up your production domain
2. **Set Up Monitoring**: Implement comprehensive monitoring
3. **Performance Optimization**: Fine-tune for your specific needs
4. **Security Hardening**: Implement additional security measures
5. **Backup Strategy**: Set up automated backups
6. **Scaling Plan**: Prepare for traffic growth

Your Phyght video platform is now ready for production! 🚀

