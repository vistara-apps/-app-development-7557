import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdminOrModerator } from '../_shared/auth.ts';
import { VideoCRDT, VectorClock } from '../_shared/crdt.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = await getAuthenticatedUser(req);
    requireAdminOrModerator(user);

    if (req.method === 'PUT') {
      return await handleUpdateVideo(req, supabase, user!);
    } else if (req.method === 'GET') {
      return await handleGetVideo(req, supabase, user);
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error in video update function:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function handleGetVideo(req: Request, supabase: any, user: any) {
  const url = new URL(req.url);
  const videoId = url.pathname.split('/').pop();

  if (!videoId) {
    return createErrorResponse('Video ID is required');
  }

  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      description,
      file_path,
      thumbnail_path,
      duration,
      file_size,
      mime_type,
      status,
      tags,
      category,
      is_featured,
      view_count,
      vector_clock,
      version,
      created_at,
      updated_at,
      profiles:last_modified_by (
        id,
        username,
        full_name
      )
    `)
    .eq('id', videoId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createErrorResponse('Video not found', 404);
    }
    throw new Error(`Failed to fetch video: ${error.message}`);
  }

  // Get public URLs if file paths exist
  let videoUrl = null;
  let thumbnailUrl = null;

  if (video.file_path) {
    const { data: videoUrlData } = supabase.storage
      .from('videos')
      .getPublicUrl(video.file_path);
    videoUrl = videoUrlData.publicUrl;
  }

  if (video.thumbnail_path) {
    const { data: thumbnailUrlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(video.thumbnail_path);
    thumbnailUrl = thumbnailUrlData.publicUrl;
  }

  return createResponse({
    ...video,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
  });
}

async function handleUpdateVideo(req: Request, supabase: any, user: any) {
  const url = new URL(req.url);
  const videoId = url.pathname.split('/').pop();
  const body = await req.json();

  if (!videoId) {
    return createErrorResponse('Video ID is required');
  }

  const {
    title,
    description,
    category,
    tags,
    is_featured,
    vector_clock: clientVectorClock,
    version: clientVersion,
  } = body;

  try {
    // Get current video state
    const { data: currentVideo, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Video not found', 404);
      }
      throw new Error(`Failed to fetch video: ${fetchError.message}`);
    }

    // CRDT conflict resolution
    const currentVectorClock: VectorClock = currentVideo.vector_clock || {};
    const incomingVectorClock: VectorClock = clientVectorClock || {};

    // Check if we need to resolve conflicts
    const clockComparison = VideoCRDT.compareVectorClocks(
      currentVectorClock,
      incomingVectorClock
    );

    let updateData: any = {};
    let newVectorClock: VectorClock;

    if (clockComparison === 'before') {
      // Client has newer changes, apply them
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(is_featured !== undefined && { is_featured }),
      };
      newVectorClock = VideoCRDT.incrementVectorClock(incomingVectorClock, user.id);
    } else if (clockComparison === 'after') {
      // Server has newer changes, reject client update
      return createErrorResponse(
        'Conflict detected: Server has newer changes. Please refresh and try again.',
        409
      );
    } else {
      // Concurrent changes - merge using CRDT rules
      const mergedClock = VideoCRDT.mergeVectorClocks(
        currentVectorClock,
        incomingVectorClock
      );

      // Apply Last-Writer-Wins strategy for concurrent updates
      updateData = {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(is_featured !== undefined && { is_featured }),
      };
      newVectorClock = VideoCRDT.incrementVectorClock(mergedClock, user.id);
    }

    // Add CRDT metadata to update
    updateData.vector_clock = newVectorClock;
    updateData.last_modified_by = user.id;
    updateData.version = (currentVideo.version || 0) + 1;

    // Perform the update
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select(`
        id,
        title,
        description,
        file_path,
        thumbnail_path,
        duration,
        file_size,
        mime_type,
        status,
        tags,
        category,
        is_featured,
        view_count,
        vector_clock,
        version,
        created_at,
        updated_at,
        profiles:last_modified_by (
          id,
          username,
          full_name
        )
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update video: ${updateError.message}`);
    }

    // Log CRDT operations for each field that was updated
    const operations = [];
    if (title !== undefined) {
      operations.push({
        video_id: videoId,
        operation_type: 'update_title',
        operation_data: { title },
        vector_clock: newVectorClock,
        actor_id: user.id,
      });
    }
    if (description !== undefined) {
      operations.push({
        video_id: videoId,
        operation_type: 'update_description',
        operation_data: { description },
        vector_clock: newVectorClock,
        actor_id: user.id,
      });
    }
    if (category !== undefined) {
      operations.push({
        video_id: videoId,
        operation_type: 'update_category',
        operation_data: { category },
        vector_clock: newVectorClock,
        actor_id: user.id,
      });
    }
    if (tags !== undefined) {
      operations.push({
        video_id: videoId,
        operation_type: 'set_tags',
        operation_data: { tags },
        vector_clock: newVectorClock,
        actor_id: user.id,
      });
    }
    if (is_featured !== undefined) {
      operations.push({
        video_id: videoId,
        operation_type: 'update_featured',
        operation_data: { is_featured },
        vector_clock: newVectorClock,
        actor_id: user.id,
      });
    }

    if (operations.length > 0) {
      await supabase.from('crdt_operations').insert(operations);
    }

    // Get public URLs
    let videoUrl = null;
    let thumbnailUrl = null;

    if (updatedVideo.file_path) {
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(updatedVideo.file_path);
      videoUrl = videoUrlData.publicUrl;
    }

    if (updatedVideo.thumbnail_path) {
      const { data: thumbnailUrlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(updatedVideo.thumbnail_path);
      thumbnailUrl = thumbnailUrlData.publicUrl;
    }

    return createResponse({
      ...updatedVideo,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      conflict_resolved: clockComparison === 'concurrent',
    });

  } catch (error) {
    console.error('Update error:', error);
    return createErrorResponse(error.message, 500);
  }
}
