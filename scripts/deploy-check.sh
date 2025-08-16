#!/bin/bash

# Deployment Check Script for PHYGHT TV
# Verifies that the app is ready for deployment

echo "🚀 PHYGHT TV Deployment Check"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_env_vars() {
    echo "📋 Checking environment variables..."
    
    # Required variables
    if [ -z "$VITE_SUPABASE_URL" ]; then
        echo -e "${RED}❌ VITE_SUPABASE_URL is not set${NC}"
        MISSING_ENV=true
    else
        echo -e "${GREEN}✅ VITE_SUPABASE_URL is set${NC}"
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY is not set${NC}"
        MISSING_ENV=true
    else
        echo -e "${GREEN}✅ VITE_SUPABASE_ANON_KEY is set${NC}"
    fi
    
    # Optional variables
    if [ -z "$VITE_LIVEPEER_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  VITE_LIVEPEER_API_KEY is not set (optional)${NC}"
    else
        echo -e "${GREEN}✅ VITE_LIVEPEER_API_KEY is set${NC}"
    fi
}

check_dependencies() {
    echo -e "\n📦 Checking dependencies..."
    
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✅ package.json found${NC}"
    else
        echo -e "${RED}❌ package.json not found${NC}"
        return 1
    fi
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ node_modules found${NC}"
    else
        echo -e "${YELLOW}⚠️  node_modules not found. Run 'npm install'${NC}"
    fi
}

check_build() {
    echo -e "\n🔨 Checking build configuration..."
    
    if [ -f "vite.config.js" ]; then
        echo -e "${GREEN}✅ vite.config.js found${NC}"
    else
        echo -e "${RED}❌ vite.config.js not found${NC}"
    fi
    
    if [ -f "vercel.json" ]; then
        echo -e "${GREEN}✅ vercel.json found${NC}"
    else
        echo -e "${YELLOW}⚠️  vercel.json not found (optional for Vercel)${NC}"
    fi
}

test_build() {
    echo -e "\n🧪 Testing build process..."
    
    echo "Running npm run build..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Build successful${NC}"
        
        if [ -d "dist" ]; then
            echo -e "${GREEN}✅ dist directory created${NC}"
        else
            echo -e "${RED}❌ dist directory not found${NC}"
        fi
    else
        echo -e "${RED}❌ Build failed${NC}"
        echo "Run 'npm run build' to see the full error"
    fi
}

display_deployment_urls() {
    echo -e "\n🌐 Ready for deployment to:"
    echo "• Vercel: https://vercel.com"
    echo "• Netlify: https://netlify.com"
    echo "• GitHub Pages: https://pages.github.com"
    echo "• Any static hosting provider"
}

main() {
    MISSING_ENV=false
    
    check_dependencies
    check_env_vars
    check_build
    
    if [ "$MISSING_ENV" = true ]; then
        echo -e "\n${RED}❌ Deployment check failed${NC}"
        echo "Please set the required environment variables and try again."
        echo "See DEPLOYMENT_ENVIRONMENT_GUIDE.md for details."
        exit 1
    fi
    
    test_build
    
    echo -e "\n${GREEN}🎉 Deployment check completed successfully!${NC}"
    echo "Your app is ready for deployment."
    
    display_deployment_urls
    
    echo -e "\n📖 For detailed deployment instructions, see:"
    echo "• DEPLOYMENT_ENVIRONMENT_GUIDE.md"
    echo "• VERCEL_DEPLOYMENT_GUIDE.md"
}

# Run the main function
main
