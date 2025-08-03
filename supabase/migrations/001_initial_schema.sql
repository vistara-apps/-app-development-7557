-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'ready', 'failed', 'deleted');
CREATE TYPE processing_quality AS ENUM ('720p', '1080p', '4k');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table with CRDT support
CREATE TABLE public.videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    thumbnail_path TEXT,
    duration INTEGER, -- in seconds
    file_size BIGINT, -- in bytes
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

-- Video processing jobs
CREATE TABLE public.video_processing (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    quality processing_quality,
    status video_status DEFAULT 'processing',
    output_path TEXT,
    progress INTEGER DEFAULT 0, -- 0-100
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- CRDT operations log for conflict resolution
CREATE TABLE public.crdt_operations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL, -- 'update_title', 'update_description', 'add_tag', etc.
    operation_data JSONB NOT NULL,
    vector_clock JSONB NOT NULL,
    actor_id UUID REFERENCES public.profiles(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video analytics
CREATE TABLE public.video_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    event_type TEXT NOT NULL, -- 'view', 'like', 'share', etc.
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_videos_updated_at ON public.videos(updated_at DESC);
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_videos_tags ON public.videos USING GIN(tags);
CREATE INDEX idx_videos_vector_clock ON public.videos USING GIN(vector_clock);

CREATE INDEX idx_crdt_operations_video_id ON public.crdt_operations(video_id);
CREATE INDEX idx_crdt_operations_timestamp ON public.crdt_operations(timestamp DESC);

CREATE INDEX idx_video_processing_video_id ON public.video_processing(video_id);
CREATE INDEX idx_video_processing_status ON public.video_processing(status);

CREATE INDEX idx_video_analytics_video_id ON public.video_analytics(video_id);
CREATE INDEX idx_video_analytics_created_at ON public.video_analytics(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crdt_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Videos policies
CREATE POLICY "Videos are viewable by everyone" ON public.videos
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Only admins and moderators can insert videos" ON public.videos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Only admins and moderators can update videos" ON public.videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Only admins can delete videos" ON public.videos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Video processing policies
CREATE POLICY "Admins and moderators can view processing status" ON public.video_processing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- CRDT operations policies
CREATE POLICY "Admins and moderators can view CRDT operations" ON public.crdt_operations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admins and moderators can insert CRDT operations" ON public.crdt_operations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

-- Video analytics policies
CREATE POLICY "Only admins can view analytics" ON public.video_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Functions for CRDT operations
CREATE OR REPLACE FUNCTION public.merge_vector_clocks(clock1 JSONB, clock2 JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    key TEXT;
    val1 INTEGER;
    val2 INTEGER;
BEGIN
    -- Merge two vector clocks by taking the maximum value for each actor
    FOR key IN SELECT jsonb_object_keys(clock1 || clock2) LOOP
        val1 := COALESCE((clock1->>key)::INTEGER, 0);
        val2 := COALESCE((clock2->>key)::INTEGER, 0);
        result := result || jsonb_build_object(key, GREATEST(val1, val2));
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_vector_clock(current_clock JSONB, actor_id UUID)
RETURNS JSONB AS $$
DECLARE
    current_value INTEGER;
BEGIN
    current_value := COALESCE((current_clock->>actor_id::TEXT)::INTEGER, 0);
    RETURN current_clock || jsonb_build_object(actor_id::TEXT, current_value + 1);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vector clock on video updates
CREATE OR REPLACE FUNCTION public.update_video_vector_clock()
RETURNS TRIGGER AS $$
BEGIN
    NEW.vector_clock := public.increment_vector_clock(
        COALESCE(OLD.vector_clock, '{}'), 
        NEW.last_modified_by
    );
    NEW.version := COALESCE(OLD.version, 0) + 1;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_vector_clock
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_video_vector_clock();

-- Function to handle profile creation
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

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('videos', 'videos', true),
    ('thumbnails', 'thumbnails', true);

-- Storage policies
CREATE POLICY "Videos are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Only admins and moderators can upload videos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'videos' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Only admins and moderators can upload thumbnails" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'thumbnails' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Only admins and moderators can delete videos" ON storage.objects
    FOR DELETE USING (
        bucket_id IN ('videos', 'thumbnails') AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'moderator')
        )
    );
