-- Migration: Add AWS S3 storage support to Phyght Video Platform
-- This migration adds fields to support hybrid storage (Supabase + AWS S3)

-- Add storage provider enum
CREATE TYPE storage_provider AS ENUM ('supabase', 'aws');
CREATE TYPE migration_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- Add AWS S3 support columns to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS storage_provider storage_provider DEFAULT 'supabase';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS s3_key TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS s3_thumbnail_key TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS s3_bucket TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS s3_region TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS storage_class TEXT DEFAULT 'STANDARD_IA';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS cloudfront_url TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS cloudfront_thumbnail_url TEXT;

-- Migration tracking columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS migration_status migration_status DEFAULT 'pending';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS migration_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS migration_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS migration_error TEXT;

-- Upload metadata
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS upload_metadata JSONB DEFAULT '{}';

-- Create storage migration jobs table
CREATE TABLE IF NOT EXISTS public.storage_migrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    source_provider storage_provider NOT NULL,
    target_provider storage_provider NOT NULL,
    status migration_status DEFAULT 'pending',
    progress INTEGER DEFAULT 0, -- 0-100
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.profiles(id)
);

-- Create storage analytics table for monitoring
CREATE TABLE IF NOT EXISTS public.storage_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    provider storage_provider NOT NULL,
    metric_type TEXT NOT NULL, -- 'storage_size', 'file_count', 'bandwidth', 'cost'
    metric_value BIGINT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage costs tracking table
CREATE TABLE IF NOT EXISTS public.storage_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    provider storage_provider NOT NULL,
    service_type TEXT NOT NULL, -- 's3_storage', 'cloudfront_bandwidth', 'data_transfer'
    cost_usd DECIMAL(10,4) NOT NULL,
    usage_amount BIGINT, -- bytes, requests, etc.
    usage_unit TEXT, -- 'bytes', 'requests', 'gb_month'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_storage_provider ON public.videos(storage_provider);
CREATE INDEX IF NOT EXISTS idx_videos_migration_status ON public.videos(migration_status);
CREATE INDEX IF NOT EXISTS idx_videos_s3_key ON public.videos(s3_key);
CREATE INDEX IF NOT EXISTS idx_videos_s3_bucket ON public.videos(s3_bucket);

CREATE INDEX IF NOT EXISTS idx_storage_migrations_video_id ON public.storage_migrations(video_id);
CREATE INDEX IF NOT EXISTS idx_storage_migrations_status ON public.storage_migrations(status);
CREATE INDEX IF NOT EXISTS idx_storage_migrations_created_at ON public.storage_migrations(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_storage_analytics_date ON public.storage_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_storage_analytics_provider ON public.storage_analytics(provider);
CREATE INDEX IF NOT EXISTS idx_storage_analytics_metric_type ON public.storage_analytics(metric_type);

CREATE INDEX IF NOT EXISTS idx_storage_costs_date ON public.storage_costs(date DESC);
CREATE INDEX IF NOT EXISTS idx_storage_costs_provider ON public.storage_costs(provider);

-- Create function to update migration status
CREATE OR REPLACE FUNCTION update_video_migration_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update migration timestamps based on status changes
    IF NEW.migration_status = 'in_progress' AND OLD.migration_status = 'pending' THEN
        NEW.migration_started_at = NOW();
    ELSIF NEW.migration_status = 'completed' AND OLD.migration_status = 'in_progress' THEN
        NEW.migration_completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for migration status updates
DROP TRIGGER IF EXISTS trigger_update_migration_status ON public.videos;
CREATE TRIGGER trigger_update_migration_status
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION update_video_migration_status();

-- Create function to get storage statistics
CREATE OR REPLACE FUNCTION get_storage_statistics(
    provider_filter storage_provider DEFAULT NULL,
    date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    provider storage_provider,
    total_videos BIGINT,
    total_size BIGINT,
    avg_file_size BIGINT,
    migration_pending BIGINT,
    migration_completed BIGINT,
    migration_failed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.storage_provider,
        COUNT(*)::BIGINT as total_videos,
        COALESCE(SUM(v.file_size), 0)::BIGINT as total_size,
        COALESCE(AVG(v.file_size), 0)::BIGINT as avg_file_size,
        COUNT(*) FILTER (WHERE v.migration_status = 'pending')::BIGINT as migration_pending,
        COUNT(*) FILTER (WHERE v.migration_status = 'completed')::BIGINT as migration_completed,
        COUNT(*) FILTER (WHERE v.migration_status = 'failed')::BIGINT as migration_failed
    FROM public.videos v
    WHERE 
        v.deleted_at IS NULL
        AND v.created_at::DATE BETWEEN date_from AND date_to
        AND (provider_filter IS NULL OR v.storage_provider = provider_filter)
    GROUP BY v.storage_provider;
END;
$$ LANGUAGE plpgsql;

-- Create function to get videos ready for migration
CREATE OR REPLACE FUNCTION get_videos_for_migration(
    limit_count INTEGER DEFAULT 10,
    source_provider storage_provider DEFAULT 'supabase',
    target_provider storage_provider DEFAULT 'aws'
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    file_path TEXT,
    thumbnail_path TEXT,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.title,
        v.file_path,
        v.thumbnail_path,
        v.file_size,
        v.mime_type,
        v.created_at
    FROM public.videos v
    WHERE 
        v.storage_provider = source_provider
        AND v.status = 'ready'
        AND v.migration_status = 'pending'
        AND v.deleted_at IS NULL
        AND v.file_path IS NOT NULL
    ORDER BY v.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to record storage analytics
CREATE OR REPLACE FUNCTION record_storage_metric(
    provider_name storage_provider,
    metric_name TEXT,
    metric_val BIGINT,
    metric_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    analytics_id UUID;
BEGIN
    INSERT INTO public.storage_analytics (
        provider,
        metric_type,
        metric_value,
        metadata
    ) VALUES (
        provider_name,
        metric_name,
        metric_val,
        metric_metadata
    ) RETURNING id INTO analytics_id;
    
    RETURN analytics_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to record storage costs
CREATE OR REPLACE FUNCTION record_storage_cost(
    provider_name storage_provider,
    service_name TEXT,
    cost_amount DECIMAL(10,4),
    usage_amt BIGINT DEFAULT NULL,
    usage_unit_name TEXT DEFAULT NULL,
    cost_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    cost_id UUID;
BEGIN
    INSERT INTO public.storage_costs (
        provider,
        service_type,
        cost_usd,
        usage_amount,
        usage_unit,
        metadata
    ) VALUES (
        provider_name,
        service_name,
        cost_amount,
        usage_amt,
        usage_unit_name,
        cost_metadata
    ) RETURNING id INTO cost_id;
    
    RETURN cost_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing videos to have default storage provider
UPDATE public.videos 
SET storage_provider = 'supabase' 
WHERE storage_provider IS NULL;

-- Create view for storage overview
CREATE OR REPLACE VIEW storage_overview AS
SELECT 
    storage_provider,
    COUNT(*) as video_count,
    SUM(file_size) as total_size,
    AVG(file_size) as avg_size,
    COUNT(*) FILTER (WHERE status = 'ready') as ready_videos,
    COUNT(*) FILTER (WHERE migration_status = 'pending') as pending_migration,
    COUNT(*) FILTER (WHERE migration_status = 'completed') as completed_migration,
    COUNT(*) FILTER (WHERE migration_status = 'failed') as failed_migration,
    MIN(created_at) as oldest_video,
    MAX(created_at) as newest_video
FROM public.videos 
WHERE deleted_at IS NULL
GROUP BY storage_provider;

-- Grant permissions
GRANT SELECT ON storage_overview TO authenticated;
GRANT ALL ON public.storage_migrations TO authenticated;
GRANT ALL ON public.storage_analytics TO authenticated;
GRANT ALL ON public.storage_costs TO authenticated;

-- Add RLS policies for storage tables
ALTER TABLE public.storage_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_costs ENABLE ROW LEVEL SECURITY;

-- RLS policies for storage_migrations (admin/moderator only)
CREATE POLICY "storage_migrations_admin_all" ON public.storage_migrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- RLS policies for storage_analytics (admin/moderator read)
CREATE POLICY "storage_analytics_admin_read" ON public.storage_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'moderator')
        )
    );

-- RLS policies for storage_costs (admin only)
CREATE POLICY "storage_costs_admin_only" ON public.storage_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.storage_migrations IS 'Tracks video migrations between storage providers';
COMMENT ON TABLE public.storage_analytics IS 'Stores storage usage metrics and analytics';
COMMENT ON TABLE public.storage_costs IS 'Tracks storage costs across different providers';
COMMENT ON COLUMN public.videos.storage_provider IS 'Storage provider: supabase or aws';
COMMENT ON COLUMN public.videos.s3_key IS 'AWS S3 object key for video file';
COMMENT ON COLUMN public.videos.s3_thumbnail_key IS 'AWS S3 object key for thumbnail';
COMMENT ON COLUMN public.videos.cloudfront_url IS 'CloudFront CDN URL for video';
COMMENT ON COLUMN public.videos.migration_status IS 'Status of migration to AWS S3';
COMMENT ON FUNCTION get_storage_statistics IS 'Returns storage statistics by provider';
COMMENT ON FUNCTION get_videos_for_migration IS 'Returns videos ready for migration';
COMMENT ON FUNCTION record_storage_metric IS 'Records storage usage metrics';
COMMENT ON FUNCTION record_storage_cost IS 'Records storage costs';
