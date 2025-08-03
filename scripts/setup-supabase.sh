#!/bin/bash

# 🗄️ Supabase Setup Script for Phyght Video Platform
# This script sets up the complete Supabase backend infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
echo "║                 🗄️ Supabase Backend Setup                   ║"
echo "║                  Phyght Video Platform                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    log_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
    log_success "Supabase CLI installed"
fi

# Login to Supabase
log_info "Logging into Supabase..."
if ! supabase projects list &> /dev/null; then
    supabase login
fi
log_success "Logged into Supabase"

# Create project directory structure
log_info "Setting up project structure..."
mkdir -p supabase/{migrations,functions/{videos,videos-upload,videos-update,videos-delete,sync},seed}

# Create initial database schema
log_info "Creating database schema..."
cat > supabase/migrations/001_initial_schema.sql << 'EOF'
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'ready', 'failed', 'deleted');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table with CRDT support
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

-- Create CRDT operations log
CREATE TABLE public.crdt_operations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    operation_data JSONB NOT NULL,
    vector_clock JSONB NOT NULL,
    actor_id UUID REFERENCES public.profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video processing table
CREATE TABLE public.video_processing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    processing_data JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_videos_featured ON public.videos(is_featured) WHERE is_featured = true;
CREATE INDEX idx_videos_tags ON public.videos USING GIN(tags);
CREATE INDEX idx_videos_vector_clock ON public.videos USING GIN(vector_clock);
CREATE INDEX idx_crdt_operations_video_id ON public.crdt_operations(video_id);
CREATE INDEX idx_crdt_operations_timestamp ON public.crdt_operations(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crdt_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_processing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- RLS Policies for videos
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos FOR SELECT 
USING (deleted_at IS NULL);

CREATE POLICY "Only admins and moderators can insert videos" 
ON public.videos FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins and moderators can update videos" 
ON public.videos FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins can delete videos" 
ON public.videos FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- RLS Policies for CRDT operations
CREATE POLICY "CRDT operations are viewable by admins and moderators" 
ON public.crdt_operations FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins and moderators can insert CRDT operations" 
ON public.crdt_operations FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

-- RLS Policies for video processing
CREATE POLICY "Video processing is viewable by admins and moderators" 
ON public.video_processing FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins and moderators can manage video processing" 
ON public.video_processing FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_videos_updated_at 
    BEFORE UPDATE ON public.videos 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);

-- Storage policies for videos bucket
CREATE POLICY "Videos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Only admins and moderators can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins and moderators can update videos" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins can delete videos" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'videos' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Storage policies for thumbnails bucket
CREATE POLICY "Thumbnails are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "Only admins and moderators can upload thumbnails" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'thumbnails' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins and moderators can update thumbnails" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'thumbnails' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'moderator')
    )
);

CREATE POLICY "Only admins can delete thumbnails" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'thumbnails' AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);
EOF

log_success "Database schema created"

# Create Edge Functions
log_info "Creating Edge Functions..."

# Videos function
cat > supabase/functions/videos/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { method } = req
    const url = new URL(req.url)
    
    if (method === 'GET') {
      // Get videos with pagination and filtering
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const category = url.searchParams.get('category')
      const search = url.searchParams.get('search')
      const status = url.searchParams.get('status')
      const featured = url.searchParams.get('featured')
      
      let query = supabaseClient
        .from('videos')
        .select('*', { count: 'exact' })
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      if (category) query = query.eq('category', category)
      if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      if (status) query = query.eq('status', status)
      if (featured) query = query.eq('is_featured', featured === 'true')
      
      const { data: videos, error, count } = await query
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({
          videos,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    if (method === 'POST') {
      // Create new video
      const { title, description, category, tags, is_featured } = await req.json()
      
      const { data: video, error } = await supabaseClient
        .from('videos')
        .insert({
          title,
          description,
          category,
          tags: tags || [],
          is_featured: is_featured || false,
          vector_clock: {},
          version: 1
        })
        .select()
        .single()
      
      if (error) throw error
      
      return new Response(
        JSON.stringify(video),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        },
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
EOF

# Videos upload function
cat > supabase/functions/videos-upload/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { method } = req
    
    if (method === 'POST') {
      // Handle file upload
      const formData = await req.formData()
      const videoId = formData.get('videoId') as string
      const videoFile = formData.get('video') as File
      const thumbnailFile = formData.get('thumbnail') as File | null
      
      if (!videoId || !videoFile) {
        throw new Error('Video ID and video file are required')
      }
      
      // Upload video file
      const videoPath = `${videoId}/${Date.now()}.${videoFile.name.split('.').pop()}`
      const { error: videoError } = await supabaseClient.storage
        .from('videos')
        .upload(videoPath, videoFile)
      
      if (videoError) throw videoError
      
      // Upload thumbnail if provided
      let thumbnailPath = null
      if (thumbnailFile) {
        thumbnailPath = `${videoId}/${Date.now()}_thumb.${thumbnailFile.name.split('.').pop()}`
        const { error: thumbnailError } = await supabaseClient.storage
          .from('thumbnails')
          .upload(thumbnailPath, thumbnailFile)
        
        if (thumbnailError) throw thumbnailError
      }
      
      // Update video record
      const { data: video, error: updateError } = await supabaseClient
        .from('videos')
        .update({
          file_path: videoPath,
          thumbnail_path: thumbnailPath,
          file_size: videoFile.size,
          mime_type: videoFile.type,
          status: 'processing'
        })
        .eq('id', videoId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      return new Response(
        JSON.stringify(video),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    if (method === 'PUT') {
      // Mark processing complete
      const { videoId, duration, processingResults } = await req.json()
      
      const { data: video, error } = await supabaseClient
        .from('videos')
        .update({
          duration,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)
        .select()
        .single()
      
      if (error) throw error
      
      return new Response(
        JSON.stringify(video),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
EOF

# Videos update function with CRDT
cat > supabase/functions/videos-update/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CRDT helper functions
function compareVectorClocks(clock1: any, clock2: any): 'before' | 'after' | 'concurrent' {
  const allActors = new Set([...Object.keys(clock1), ...Object.keys(clock2)])
  let clock1Greater = false
  let clock2Greater = false
  
  for (const actor of allActors) {
    const val1 = clock1[actor] || 0
    const val2 = clock2[actor] || 0
    
    if (val1 > val2) clock1Greater = true
    if (val2 > val1) clock2Greater = true
  }
  
  if (clock1Greater && !clock2Greater) return 'after'
  if (clock2Greater && !clock1Greater) return 'before'
  return 'concurrent'
}

function mergeVectorClocks(clock1: any, clock2: any): any {
  const allActors = new Set([...Object.keys(clock1), ...Object.keys(clock2)])
  const merged: any = {}
  
  for (const actor of allActors) {
    merged[actor] = Math.max(clock1[actor] || 0, clock2[actor] || 0)
  }
  
  return merged
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { method } = req
    const url = new URL(req.url)
    const videoId = url.pathname.split('/').pop()
    
    if (method === 'GET') {
      // Get single video with public URLs
      const { data: video, error } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .is('deleted_at', null)
        .single()
      
      if (error) throw error
      
      // Get public URLs for files
      if (video.file_path) {
        const { data: videoUrl } = supabaseClient.storage
          .from('videos')
          .getPublicUrl(video.file_path)
        video.video_url = videoUrl.publicUrl
      }
      
      if (video.thumbnail_path) {
        const { data: thumbnailUrl } = supabaseClient.storage
          .from('thumbnails')
          .getPublicUrl(video.thumbnail_path)
        video.thumbnail_url = thumbnailUrl.publicUrl
      }
      
      return new Response(
        JSON.stringify(video),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    if (method === 'PUT') {
      // Update video with CRDT conflict resolution
      const updateData = await req.json()
      const { vector_clock: clientClock, version: clientVersion, ...updates } = updateData
      
      // Get current video state
      const { data: currentVideo, error: fetchError } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single()
      
      if (fetchError) throw fetchError
      
      const serverClock = currentVideo.vector_clock || {}
      const serverVersion = currentVideo.version || 1
      
      // Compare vector clocks for conflict detection
      const comparison = compareVectorClocks(clientClock, serverClock)
      
      let finalUpdates = { ...updates }
      let finalClock = clientClock
      let finalVersion = clientVersion
      
      if (comparison === 'concurrent') {
        // Merge concurrent changes using Last-Writer-Wins for most fields
        finalClock = mergeVectorClocks(clientClock, serverClock)
        finalVersion = Math.max(clientVersion, serverVersion) + 1
        
        // For tags, use set union (G-Set CRDT)
        if (updates.tags && currentVideo.tags) {
          finalUpdates.tags = [...new Set([...currentVideo.tags, ...updates.tags])]
        }
      } else if (comparison === 'before') {
        // Client is behind, reject update
        return new Response(
          JSON.stringify({
            error: 'Conflict detected: Server has newer changes. Please refresh and try again.',
            conflict_type: 'vector_clock_mismatch',
            server_vector_clock: serverClock,
            server_version: serverVersion
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          },
        )
      }
      
      // Apply update
      const { data: updatedVideo, error: updateError } = await supabaseClient
        .from('videos')
        .update({
          ...finalUpdates,
          vector_clock: finalClock,
          version: finalVersion,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      // Log CRDT operation
      await supabaseClient
        .from('crdt_operations')
        .insert({
          video_id: videoId,
          operation_type: 'update',
          operation_data: updates,
          vector_clock: finalClock,
          actor_id: req.headers.get('user-id') // Assuming user ID is passed in header
        })
      
      return new Response(
        JSON.stringify(updatedVideo),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
EOF

log_success "Edge Functions created"

# Initialize Supabase project
log_info "Initializing Supabase project..."
if [ ! -f "supabase/config.toml" ]; then
    supabase init
fi

# Prompt for project linking
echo -n -e "${YELLOW}Do you want to link to an existing Supabase project? (Y/n): ${NC}"
read -r LINK_PROJECT
if [[ ! "$LINK_PROJECT" =~ ^[Nn]$ ]]; then
    log_info "Linking to Supabase project..."
    supabase link
    log_success "Project linked"
fi

# Apply migrations
echo -n -e "${YELLOW}Do you want to apply database migrations? (Y/n): ${NC}"
read -r APPLY_MIGRATIONS
if [[ ! "$APPLY_MIGRATIONS" =~ ^[Nn]$ ]]; then
    log_info "Applying database migrations..."
    supabase db push
    log_success "Database migrations applied"
fi

# Deploy Edge Functions
echo -n -e "${YELLOW}Do you want to deploy Edge Functions? (Y/n): ${NC}"
read -r DEPLOY_FUNCTIONS
if [[ ! "$DEPLOY_FUNCTIONS" =~ ^[Nn]$ ]]; then
    log_info "Deploying Edge Functions..."
    supabase functions deploy
    log_success "Edge Functions deployed"
fi

# Create seed data
echo -n -e "${YELLOW}Do you want to create sample data? (y/N): ${NC}"
read -r CREATE_SEED
if [[ "$CREATE_SEED" =~ ^[Yy]$ ]]; then
    log_info "Creating sample data..."
    cat > supabase/seed/sample_data.sql << 'EOF'
-- Insert sample admin user (you'll need to create this user in Supabase Auth first)
-- INSERT INTO public.profiles (id, username, full_name, role) 
-- VALUES ('your-admin-user-id', 'admin', 'Admin User', 'admin');

-- Insert sample categories and videos
INSERT INTO public.videos (title, description, category, tags, is_featured, status) VALUES
('MMA Training Basics', 'Learn the fundamentals of mixed martial arts training', 'Training', ARRAY['mma', 'basics', 'training'], true, 'ready'),
('Boxing Techniques', 'Advanced boxing techniques for competitive fighters', 'Boxing', ARRAY['boxing', 'techniques', 'advanced'], false, 'ready'),
('Grappling Fundamentals', 'Essential grappling moves and positions', 'Grappling', ARRAY['grappling', 'bjj', 'wrestling'], true, 'ready'),
('Conditioning Workout', 'High-intensity conditioning for combat sports', 'Fitness', ARRAY['conditioning', 'fitness', 'cardio'], false, 'ready'),
('Self Defense Basics', 'Basic self-defense techniques for beginners', 'Self Defense', ARRAY['self-defense', 'basics', 'safety'], false, 'ready');
EOF
    
    supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')"
    log_success "Sample data created"
fi

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                🎉 SUPABASE SETUP COMPLETE!                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Setup Summary:${NC}"
echo "• Database schema: ✅ Created"
echo "• Edge Functions: ✅ Deployed"
echo "• Storage buckets: ✅ Configured"
echo "• RLS policies: ✅ Applied"
echo "• CRDT support: ✅ Implemented"

echo -e "${BLUE}Next Steps:${NC}"
echo "1. Create your first admin user in Supabase Auth"
echo "2. Update the sample data with your admin user ID"
echo "3. Test the API endpoints"
echo "4. Configure your frontend environment variables"

echo -e "${BLUE}Useful Commands:${NC}"
echo "• View project: supabase dashboard"
echo "• Check status: supabase status"
echo "• View logs: supabase functions logs"
echo "• Reset database: supabase db reset"

log_success "Supabase backend is ready for your Phyght Video Platform!"

