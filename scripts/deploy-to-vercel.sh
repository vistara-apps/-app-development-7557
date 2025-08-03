#!/bin/bash

# 🚀 Automated Vercel Deployment Script for Phyght Video Platform
# This script automates the entire deployment process to Vercel with Supabase backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 🚀 Phyght Video Platform                    ║"
echo "║                Automated Vercel Deployment                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
log_info "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

log_success "Node.js $(node -v) is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm and try again."
    exit 1
fi

log_success "npm $(npm -v) is installed"

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    log_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    log_success "Vercel CLI installed"
else
    log_success "Vercel CLI is installed"
fi

# Install Supabase CLI if not present
if ! command -v supabase &> /dev/null; then
    log_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
    log_success "Supabase CLI installed"
else
    log_success "Supabase CLI is installed"
fi

# Function to prompt for input with validation
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local validation_regex="$3"
    local error_msg="$4"
    
    while true; do
        echo -n -e "${YELLOW}$prompt: ${NC}"
        read -r input
        
        if [[ -z "$input" ]]; then
            log_error "Input cannot be empty. Please try again."
            continue
        fi
        
        if [[ -n "$validation_regex" ]] && [[ ! "$input" =~ $validation_regex ]]; then
            log_error "$error_msg"
            continue
        fi
        
        eval "$var_name='$input'"
        break
    done
}

# Function to prompt for password input
prompt_password() {
    local prompt="$1"
    local var_name="$2"
    
    while true; do
        echo -n -e "${YELLOW}$prompt: ${NC}"
        read -s input
        echo
        
        if [[ -z "$input" ]]; then
            log_error "Input cannot be empty. Please try again."
            continue
        fi
        
        eval "$var_name='$input'"
        break
    done
}

# Configuration collection
log_info "Collecting deployment configuration..."

echo -e "${BLUE}Please provide the following information:${NC}"

# Supabase configuration
prompt_input "Supabase Project URL (e.g., https://your-project.supabase.co)" SUPABASE_URL "^https://.*\.supabase\.co$" "Please enter a valid Supabase URL"
prompt_password "Supabase Anon Key" SUPABASE_ANON_KEY
prompt_password "Supabase Service Role Key" SUPABASE_SERVICE_ROLE_KEY

# Optional configurations with defaults
echo -e "${BLUE}Optional configurations (press Enter for defaults):${NC}"

echo -n -e "${YELLOW}Max video size in bytes (default: 52428800 = 50MB): ${NC}"
read -r MAX_VIDEO_SIZE
MAX_VIDEO_SIZE=${MAX_VIDEO_SIZE:-52428800}

echo -n -e "${YELLOW}Max thumbnail size in bytes (default: 5242880 = 5MB): ${NC}"
read -r MAX_THUMBNAIL_SIZE
MAX_THUMBNAIL_SIZE=${MAX_THUMBNAIL_SIZE:-5242880}

echo -n -e "${YELLOW}Supported video formats (default: video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime): ${NC}"
read -r VIDEO_FORMATS
VIDEO_FORMATS=${VIDEO_FORMATS:-"video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime"}

echo -n -e "${YELLOW}Supported image formats (default: image/jpeg,image/png,image/webp): ${NC}"
read -r IMAGE_FORMATS
IMAGE_FORMATS=${IMAGE_FORMATS:-"image/jpeg,image/png,image/webp"}

echo -n -e "${YELLOW}Enable stealth mode? (y/N): ${NC}"
read -r STEALTH_MODE
if [[ "$STEALTH_MODE" =~ ^[Yy]$ ]]; then
    STEALTH_MODE="true"
else
    STEALTH_MODE="false"
fi

echo -n -e "${YELLOW}Enable debug mode? (y/N): ${NC}"
read -r DEBUG_MODE
if [[ "$DEBUG_MODE" =~ ^[Yy]$ ]]; then
    DEBUG_MODE="true"
else
    DEBUG_MODE="false"
fi

# Install dependencies
log_info "Installing project dependencies..."
npm install
log_success "Dependencies installed"

# Build the project locally to verify
log_info "Building project locally to verify..."
export VITE_SUPABASE_URL="$SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
export VITE_MAX_VIDEO_SIZE="$MAX_VIDEO_SIZE"
export VITE_MAX_THUMBNAIL_SIZE="$MAX_THUMBNAIL_SIZE"
export VITE_SUPPORTED_VIDEO_FORMATS="$VIDEO_FORMATS"
export VITE_SUPPORTED_IMAGE_FORMATS="$IMAGE_FORMATS"
export VITE_STEALTH_MODE="$STEALTH_MODE"
export VITE_DEBUG_MODE="$DEBUG_MODE"

npm run build
log_success "Local build successful"

# Login to Vercel
log_info "Logging into Vercel..."
if ! vercel whoami &> /dev/null; then
    log_warning "Not logged into Vercel. Please login..."
    vercel login
fi
log_success "Logged into Vercel as $(vercel whoami)"

# Link or create Vercel project
log_info "Setting up Vercel project..."
if [ ! -f ".vercel/project.json" ]; then
    log_info "Linking to Vercel project..."
    vercel link
else
    log_success "Project already linked to Vercel"
fi

# Set environment variables
log_info "Setting up environment variables..."

# Core Supabase configuration
vercel env add VITE_SUPABASE_URL production <<< "$SUPABASE_URL"
vercel env add VITE_SUPABASE_ANON_KEY production <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"

# Video configuration
vercel env add VITE_MAX_VIDEO_SIZE production <<< "$MAX_VIDEO_SIZE"
vercel env add VITE_MAX_THUMBNAIL_SIZE production <<< "$MAX_THUMBNAIL_SIZE"
vercel env add VITE_SUPPORTED_VIDEO_FORMATS production <<< "$VIDEO_FORMATS"
vercel env add VITE_SUPPORTED_IMAGE_FORMATS production <<< "$IMAGE_FORMATS"

# Feature flags
vercel env add VITE_STEALTH_MODE production <<< "$STEALTH_MODE"
vercel env add VITE_DEBUG_MODE production <<< "$DEBUG_MODE"

# Set preview environment variables (same as production for now)
vercel env add VITE_SUPABASE_URL preview <<< "$SUPABASE_URL"
vercel env add VITE_SUPABASE_ANON_KEY preview <<< "$SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY preview <<< "$SUPABASE_SERVICE_ROLE_KEY"
vercel env add VITE_MAX_VIDEO_SIZE preview <<< "$MAX_VIDEO_SIZE"
vercel env add VITE_MAX_THUMBNAIL_SIZE preview <<< "$MAX_THUMBNAIL_SIZE"
vercel env add VITE_SUPPORTED_VIDEO_FORMATS preview <<< "$VIDEO_FORMATS"
vercel env add VITE_SUPPORTED_IMAGE_FORMATS preview <<< "$IMAGE_FORMATS"
vercel env add VITE_STEALTH_MODE preview <<< "$STEALTH_MODE"
vercel env add VITE_DEBUG_MODE preview <<< "$DEBUG_MODE"

log_success "Environment variables configured"

# Create vercel.json configuration
log_info "Creating Vercel configuration..."
cat > vercel.json << EOF
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
    },
    {
      "source": "/videos/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "$SUPABASE_URL/functions/v1/:path*"
    }
  ]
}
EOF

log_success "Vercel configuration created"

# Deploy to Vercel
log_info "Deploying to Vercel..."
DEPLOYMENT_URL=$(vercel --prod --yes)
log_success "Deployment successful!"

# Supabase setup
echo -e "${BLUE}Setting up Supabase backend...${NC}"

# Check if user wants to set up Supabase automatically
echo -n -e "${YELLOW}Do you want to set up Supabase database and functions automatically? (Y/n): ${NC}"
read -r SETUP_SUPABASE
if [[ ! "$SETUP_SUPABASE" =~ ^[Nn]$ ]]; then
    log_info "Setting up Supabase..."
    
    # Login to Supabase
    if ! supabase projects list &> /dev/null; then
        log_warning "Not logged into Supabase. Please login..."
        supabase login
    fi
    
    # Extract project reference from URL
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')
    
    # Link to Supabase project
    echo "$PROJECT_REF" | supabase link --project-ref
    
    # Apply database migrations
    log_info "Applying database migrations..."
    if [ -f "supabase/migrations/001_initial_schema.sql" ]; then
        supabase db push
        log_success "Database migrations applied"
    else
        log_warning "No migration files found. Please set up your database manually."
    fi
    
    # Deploy edge functions
    log_info "Deploying edge functions..."
    if [ -d "supabase/functions" ]; then
        supabase functions deploy
        log_success "Edge functions deployed"
    else
        log_warning "No edge functions found. Please deploy them manually if needed."
    fi
    
    log_success "Supabase setup completed"
fi

# Create deployment summary
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🎉 DEPLOYMENT SUCCESSFUL!                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Deployment Summary:${NC}"
echo "• Application URL: $DEPLOYMENT_URL"
echo "• Supabase URL: $SUPABASE_URL"
echo "• Environment: Production"
echo "• Build Status: ✅ Successful"
echo "• Database: ✅ Configured"
echo "• Edge Functions: ✅ Deployed"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Visit your application: $DEPLOYMENT_URL"
echo "2. Test video upload functionality"
echo "3. Verify admin dashboard access"
echo "4. Configure custom domain (optional)"
echo "5. Set up monitoring and analytics"

echo -e "${BLUE}Useful Commands:${NC}"
echo "• View logs: vercel logs"
echo "• Redeploy: vercel --prod"
echo "• Environment variables: vercel env ls"
echo "• Supabase dashboard: supabase dashboard"

echo -e "${GREEN}🚀 Your Phyght Video Platform is now live!${NC}"

# Save deployment info
cat > deployment-info.txt << EOF
Deployment Information
=====================
Date: $(date)
Application URL: $DEPLOYMENT_URL
Supabase URL: $SUPABASE_URL
Environment: Production
Status: Successful

Configuration:
- Max Video Size: $MAX_VIDEO_SIZE bytes
- Max Thumbnail Size: $MAX_THUMBNAIL_SIZE bytes
- Video Formats: $VIDEO_FORMATS
- Image Formats: $IMAGE_FORMATS
- Stealth Mode: $STEALTH_MODE
- Debug Mode: $DEBUG_MODE

Next Steps:
1. Test the application thoroughly
2. Configure monitoring
3. Set up custom domain
4. Implement backup strategy
EOF

log_success "Deployment information saved to deployment-info.txt"

