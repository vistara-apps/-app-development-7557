-- Migration to allow anonymous video uploads
-- This allows the last_modified_by field to be NULL for anonymous users

-- Remove the NOT NULL constraint and foreign key constraint temporarily
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_last_modified_by_fkey;

-- Modify the column to allow NULL values  
ALTER TABLE public.videos ALTER COLUMN last_modified_by DROP NOT NULL;

-- Add back the foreign key constraint but allow NULL values
ALTER TABLE public.videos 
ADD CONSTRAINT videos_last_modified_by_fkey 
FOREIGN KEY (last_modified_by) REFERENCES public.profiles(id);

-- Update RLS policies to allow anonymous uploads
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to insert videos" ON public.videos;
DROP POLICY IF EXISTS "Allow users to view non-deleted videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video owners and admins to update videos" ON public.videos;
DROP POLICY IF EXISTS "Allow video owners and admins to delete videos" ON public.videos;

-- Create new policies that allow anonymous access
CREATE POLICY "Allow anyone to view non-deleted videos" ON public.videos
FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Allow anyone to insert videos" ON public.videos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow video owners and admins to update videos" ON public.videos
FOR UPDATE USING (
  auth.uid() = last_modified_by OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) OR 
  last_modified_by IS NULL -- Allow updates to anonymous videos
);

CREATE POLICY "Allow video owners and admins to delete videos" ON public.videos
FOR DELETE USING (
  auth.uid() = last_modified_by OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) OR 
  last_modified_by IS NULL -- Allow deletion of anonymous videos
);

-- Update storage policies to allow anonymous uploads
-- Videos bucket policies
DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view videos" ON storage.objects;

CREATE POLICY "Allow anyone to upload videos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public to view videos" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Allow users to update their own videos" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own videos" ON storage.objects
FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Thumbnails bucket policies
DROP POLICY IF EXISTS "Allow authenticated users to upload thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view thumbnails" ON storage.objects;

CREATE POLICY "Allow anyone to upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "Allow public to view thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Allow users to update their own thumbnails" ON storage.objects
FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own thumbnails" ON storage.objects
FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
