# 🚀 Deployment Guide - Phyght Video Platform

## Quick Start

### 🎯 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vistara-apps/-app-development-7557&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY&envDescription=Supabase%20configuration%20required&envLink=https://supabase.com/dashboard)

### 🤖 Automated Script Deploy

```bash
# Clone the repository
git clone https://github.com/vistara-apps/-app-development-7557.git
cd -app-development-7557

# Run automated deployment
chmod +x scripts/deploy-to-vercel.sh
./scripts/deploy-to-vercel.sh
```

## 📋 Prerequisites

- ✅ **Vercel Account**: [Sign up here](https://vercel.com)
- ✅ **Supabase Account**: [Sign up here](https://supabase.com)
- ✅ **Node.js 18+**: [Download here](https://nodejs.org)
- ✅ **Git**: [Download here](https://git-scm.com)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel App    │    │  Supabase API   │    │ Supabase DB     │
│   (Frontend)    │◄──►│ (Edge Functions)│◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ - React App     │    │ - Video CRUD    │    │ - Video Metadata│
│ - Admin Panel   │    │ - File Upload   │    │ - CRDT State    │
│ - Video Player  │    │ - CRDT Sync     │    │ - User Profiles │
│ - Real-time UI  │    │ - Auth & RLS    │    │ - Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Manual Deployment

### Step 1: Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Run our automated setup script
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

### Step 2: Vercel Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to Vercel
vercel --prod
```

### Step 3: Environment Configuration

Set these environment variables in Vercel:

```bash
# Core Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Video Configuration
VITE_MAX_VIDEO_SIZE=52428800
VITE_MAX_THUMBNAIL_SIZE=5242880
VITE_SUPPORTED_VIDEO_FORMATS=video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime
VITE_SUPPORTED_IMAGE_FORMATS=image/jpeg,image/png,image/webp

# Feature Flags
VITE_STEALTH_MODE=false
VITE_DEBUG_MODE=false
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Our automated CI/CD pipeline includes:

- ✅ **Code Quality**: Linting and testing
- ✅ **Security Scanning**: Vulnerability detection
- ✅ **Performance Testing**: Lighthouse audits
- ✅ **Preview Deployments**: PR previews
- ✅ **Production Deployment**: Automatic main branch deployment
- ✅ **Supabase Sync**: Database and function deployment

### Required GitHub Secrets

```bash
# Vercel Configuration
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Supabase Configuration
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_REF=your_supabase_project_ref

# Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAX_VIDEO_SIZE=52428800
VITE_MAX_THUMBNAIL_SIZE=5242880
VITE_SUPPORTED_VIDEO_FORMATS=video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime
VITE_SUPPORTED_IMAGE_FORMATS=image/jpeg,image/png,image/webp
VITE_STEALTH_MODE=false
```

## 🌍 Environment-Specific Deployments

### Production Environment

```bash
# Production deployment
vercel --prod

# Environment variables
VITE_STEALTH_MODE=false
VITE_DEBUG_MODE=false
NODE_ENV=production
```

### Staging Environment

```bash
# Staging deployment
vercel --target staging

# Environment variables
VITE_STEALTH_MODE=true
VITE_DEBUG_MODE=true
NODE_ENV=staging
```

### Development Environment

```bash
# Local development
npm run dev

# Environment variables
VITE_STEALTH_MODE=true
VITE_DEBUG_MODE=true
NODE_ENV=development
```

## 📊 Performance Optimization

### Build Configuration

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
    },
    chunkSizeWarningLimit: 1000
  }
}
```

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["iad1", "sfo1", "lhr1"],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## 🔐 Security Configuration

### Content Security Policy

```json
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

### Environment Security

- 🔒 **Encrypted Variables**: All secrets stored encrypted in Vercel
- 🔒 **API Key Rotation**: Regular rotation of Supabase keys
- 🔒 **Access Control**: Role-based permissions in Supabase
- 🔒 **HTTPS Only**: All traffic encrypted in transit

## 📈 Monitoring & Analytics

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

- **Core Web Vitals**: Automatic tracking
- **Real User Monitoring**: Performance insights
- **Error Tracking**: Automatic error reporting
- **Custom Metrics**: Business-specific tracking

### Health Checks

```javascript
// api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
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

# Clear cache and rebuild
vercel --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Environment Variable Issues

```bash
# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Add missing environment variable
vercel env add VARIABLE_NAME
```

#### Supabase Connection Issues

```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     https://your-project.supabase.co/rest/v1/videos

# Check Edge Functions
supabase functions list

# View function logs
supabase functions logs videos
```

#### Performance Issues

```bash
# Analyze bundle size
npm run build -- --analyze

# Check Lighthouse scores
npx lighthouse https://your-app.vercel.app

# Monitor Core Web Vitals
# Check Vercel Analytics dashboard
```

### Debug Commands

```bash
# Vercel debugging
vercel logs --follow
vercel inspect

# Supabase debugging
supabase status
supabase dashboard

# Local debugging
npm run dev
npm run build:debug
```

## 🔄 Deployment Checklist

### Pre-Deployment

- [ ] ✅ Code reviewed and tested
- [ ] ✅ Environment variables configured
- [ ] ✅ Database migrations ready
- [ ] ✅ Edge Functions tested
- [ ] ✅ Security scan passed
- [ ] ✅ Performance benchmarks met

### Post-Deployment

- [ ] ✅ Application loads successfully
- [ ] ✅ Video upload functionality works
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Database connections established
- [ ] ✅ Real-time features working
- [ ] ✅ CRDT synchronization functional
- [ ] ✅ Authentication working
- [ ] ✅ Performance metrics acceptable
- [ ] ✅ Error monitoring active

### Performance Benchmarks

- **Page Load Time**: < 3 seconds
- **Video Upload**: < 30 seconds for 50MB
- **API Response**: < 500ms average
- **Database Queries**: < 100ms average
- **Lighthouse Score**: > 80 for all categories

## 🎯 Scaling Considerations

### Database Scaling

- **Connection Pooling**: Supabase handles automatically
- **Read Replicas**: Available in Supabase Pro
- **Indexing**: Optimized for video queries
- **Caching**: Redis layer for frequently accessed data

### CDN & Edge

- **Global Distribution**: Vercel Edge Network
- **Video Delivery**: Supabase Storage CDN
- **Edge Functions**: Distributed compute
- **Cache Optimization**: Aggressive caching for static assets

### Cost Optimization

- **Vercel Pro**: $20/month for team features
- **Supabase Pro**: $25/month for production features
- **Storage Costs**: ~$0.021/GB/month
- **Bandwidth**: Included in base plans

## 📞 Support Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/guide/)
- [React Docs](https://react.dev/)

### Community

- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/vistara-apps/-app-development-7557/issues)

### Professional Support

- **Vercel Enterprise**: Custom SLA and support
- **Supabase Enterprise**: Dedicated support team
- **Custom Development**: Available on request

---

## 🎉 Success!

Your Phyght Video Platform is now deployed and ready for production use! 

🔗 **Live Application**: Check your Vercel dashboard for the deployment URL
📊 **Analytics**: Monitor performance in Vercel Analytics
🗄️ **Database**: Manage data in Supabase Dashboard
🚀 **Scaling**: Ready to handle growth with auto-scaling infrastructure

Need help? Check our [troubleshooting guide](VERCEL_DEPLOYMENT_GUIDE.md) or reach out to our support team!

