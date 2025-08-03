import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdmin } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = await getAuthenticatedUser(req);
    requireAdmin(user); // Only admins can delete videos

    if (req.method === 'DELETE') {
      return await handleDeleteVideo(req, supabase, user!);
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error in video delete function:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function handleDeleteVideo(req: Request, supabase: any, user: any) {
  const url = new URL(req.url);
  const videoId = url.pathname.split('/').pop();
  const hardDelete = url.searchParams.get('hard') === 'true';

  if (!videoId) {
    return createErrorResponse('Video ID is required');
  }

  try {
    // Get current video to check if it exists and get file paths
    const { data: currentVideo, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Video not found', 404);
      }
      throw new Error(`Failed to fetch video: ${fetchError.message}`);
    }

    if (currentVideo.deleted_at && !hardDelete) {
      return createErrorResponse('Video is already deleted', 400);
    }

    if (hardDelete) {
      // Hard delete: Remove from database and storage completely
      await performHardDelete(supabase, currentVideo, user);
      
      return createResponse({
        message: 'Video permanently deleted',
        video_id: videoId,
        deleted_at: new Date().toISOString(),
        hard_delete: true,
      });
    } else {
      // Soft delete: Mark as deleted but keep in database
      const deletedAt = new Date().toISOString();
      
      const { data: deletedVideo, error: deleteError } = await supabase
        .from('videos')
        .update({
          deleted_at: deletedAt,
          status: 'deleted',
          last_modified_by: user.id,
        })
        .eq('id', videoId)
        .select(`
          id,
          title,
          description,
          status,
          deleted_at,
          vector_clock,
          version,
          created_at,
          updated_at
        `)
        .single();

      if (deleteError) {
        throw new Error(`Failed to delete video: ${deleteError.message}`);
      }

      // Log CRDT operation
      await supabase.from('crdt_operations').insert({
        video_id: videoId,
        operation_type: 'soft_delete_video',
        operation_data: { deleted_at: deletedAt },
        vector_clock: deletedVideo.vector_clock,
        actor_id: user.id,
      });

      return createResponse({
        message: 'Video soft deleted successfully',
        video: deletedVideo,
        hard_delete: false,
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    return createErrorResponse(error.message, 500);
  }
}

async function performHardDelete(supabase: any, video: any, user: any) {
  const filesToDelete = [];
  
  // Collect file paths to delete
  if (video.file_path) {
    filesToDelete.push({ bucket: 'videos', path: video.file_path });
  }
  if (video.thumbnail_path) {
    filesToDelete.push({ bucket: 'thumbnails', path: video.thumbnail_path });
  }

  // Delete files from storage
  for (const file of filesToDelete) {
    try {
      const { error: storageError } = await supabase.storage
        .from(file.bucket)
        .remove([file.path]);
      
      if (storageError) {
        console.warn(`Failed to delete file ${file.path} from ${file.bucket}:`, storageError.message);
      }
    } catch (error) {
      console.warn(`Error deleting file ${file.path}:`, error);
    }
  }

  // Delete related records first (due to foreign key constraints)
  await supabase.from('video_processing').delete().eq('video_id', video.id);
  await supabase.from('crdt_operations').delete().eq('video_id', video.id);
  await supabase.from('video_analytics').delete().eq('video_id', video.id);

  // Finally delete the video record
  const { error: deleteError } = await supabase
    .from('videos')
    .delete()
    .eq('id', video.id);

  if (deleteError) {
    throw new Error(`Failed to hard delete video: ${deleteError.message}`);
  }

  // Log the hard delete operation in a separate audit table if needed
  // For now, we'll just log it to console
  console.log(`Video ${video.id} hard deleted by user ${user.id} at ${new Date().toISOString()}`);
}
