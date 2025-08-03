import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdminOrModerator } from '../_shared/auth.ts';
import { VideoCRDT, VectorClock, CRDTOperation } from '../_shared/crdt.ts';

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

    if (req.method === 'POST') {
      return await handleSyncRequest(req, supabase, user!);
    } else if (req.method === 'GET') {
      return await handleGetSyncState(req, supabase, user!);
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error in sync function:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function handleSyncRequest(req: Request, supabase: any, user: any) {
  const body = await req.json();
  const { 
    video_id, 
    client_vector_clock, 
    client_version, 
    operations = [] 
  } = body;

  if (!video_id) {
    return createErrorResponse('Video ID is required');
  }

  try {
    // Get current server state
    const { data: serverVideo, error: fetchError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', video_id)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return createErrorResponse('Video not found', 404);
      }
      throw new Error(`Failed to fetch video: ${fetchError.message}`);
    }

    const serverVectorClock: VectorClock = serverVideo.vector_clock || {};
    const clientVectorClock: VectorClock = client_vector_clock || {};

    // Compare vector clocks to determine sync strategy
    const clockComparison = VideoCRDT.compareVectorClocks(
      serverVectorClock,
      clientVectorClock
    );

    let syncResult: any = {
      video_id,
      sync_type: clockComparison,
      server_vector_clock: serverVectorClock,
      server_version: serverVideo.version,
    };

    if (clockComparison === 'before') {
      // Server is behind client - apply client operations
      syncResult = await applyClientOperations(
        supabase,
        serverVideo,
        operations,
        user,
        syncResult
      );
    } else if (clockComparison === 'after') {
      // Client is behind server - send server state to client
      syncResult.action = 'update_client';
      syncResult.server_state = await getVideoWithUrls(supabase, serverVideo);
      
      // Get operations since client's last known state
      const { data: missedOps } = await supabase
        .from('crdt_operations')
        .select('*')
        .eq('video_id', video_id)
        .gte('timestamp', getTimestampFromVectorClock(clientVectorClock))
        .order('timestamp', { ascending: true });

      syncResult.missed_operations = missedOps || [];
    } else {
      // Concurrent state - need to merge
      syncResult = await handleConcurrentSync(
        supabase,
        serverVideo,
        operations,
        clientVectorClock,
        user,
        syncResult
      );
    }

    return createResponse(syncResult);

  } catch (error) {
    console.error('Sync error:', error);
    return createErrorResponse(error.message, 500);
  }
}

async function handleGetSyncState(req: Request, supabase: any, user: any) {
  const url = new URL(req.url);
  const videoId = url.searchParams.get('video_id');
  const since = url.searchParams.get('since'); // ISO timestamp

  if (!videoId) {
    return createErrorResponse('Video ID is required');
  }

  try {
    // Get current video state
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .is('deleted_at', null)
      .single();

    if (videoError) {
      if (videoError.code === 'PGRST116') {
        return createErrorResponse('Video not found', 404);
      }
      throw new Error(`Failed to fetch video: ${videoError.message}`);
    }

    // Get recent operations
    let operationsQuery = supabase
      .from('crdt_operations')
      .select('*')
      .eq('video_id', videoId)
      .order('timestamp', { ascending: true })
      .limit(100);

    if (since) {
      operationsQuery = operationsQuery.gte('timestamp', since);
    }

    const { data: operations, error: opsError } = await operationsQuery;

    if (opsError) {
      throw new Error(`Failed to fetch operations: ${opsError.message}`);
    }

    const videoWithUrls = await getVideoWithUrls(supabase, video);

    return createResponse({
      video: videoWithUrls,
      operations: operations || [],
      sync_timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Get sync state error:', error);
    return createErrorResponse(error.message, 500);
  }
}

async function applyClientOperations(
  supabase: any,
  serverVideo: any,
  operations: CRDTOperation[],
  user: any,
  syncResult: any
) {
  if (operations.length === 0) {
    syncResult.action = 'no_changes';
    return syncResult;
  }

  // Sort operations by timestamp to ensure correct order
  const sortedOps = VideoCRDT.resolveConflicts(operations);
  
  let currentVideo = { ...serverVideo };
  const appliedOperations = [];

  for (const operation of sortedOps) {
    try {
      // Apply operation to current state
      const videoMetadata = {
        id: currentVideo.id,
        title: currentVideo.title,
        description: currentVideo.description,
        tags: currentVideo.tags || [],
        category: currentVideo.category,
        vectorClock: currentVideo.vector_clock || {},
        version: currentVideo.version || 1,
        lastModifiedBy: currentVideo.last_modified_by,
      };

      const updatedMetadata = VideoCRDT.applyOperation(videoMetadata, operation);
      
      // Update database
      const { data: updatedVideo, error: updateError } = await supabase
        .from('videos')
        .update({
          title: updatedMetadata.title,
          description: updatedMetadata.description,
          tags: updatedMetadata.tags,
          category: updatedMetadata.category,
          vector_clock: updatedMetadata.vectorClock,
          version: updatedMetadata.version,
          last_modified_by: updatedMetadata.lastModifiedBy,
        })
        .eq('id', currentVideo.id)
        .select('*')
        .single();

      if (updateError) {
        console.error(`Failed to apply operation ${operation.type}:`, updateError);
        continue;
      }

      currentVideo = updatedVideo;
      appliedOperations.push(operation);

      // Log the operation
      await supabase.from('crdt_operations').insert({
        video_id: currentVideo.id,
        operation_type: operation.type,
        operation_data: operation.data,
        vector_clock: operation.vectorClock,
        actor_id: operation.actorId,
      });

    } catch (error) {
      console.error(`Error applying operation ${operation.type}:`, error);
    }
  }

  syncResult.action = 'applied_operations';
  syncResult.applied_operations = appliedOperations;
  syncResult.updated_video = await getVideoWithUrls(supabase, currentVideo);
  syncResult.server_vector_clock = currentVideo.vector_clock;
  syncResult.server_version = currentVideo.version;

  return syncResult;
}

async function handleConcurrentSync(
  supabase: any,
  serverVideo: any,
  clientOperations: CRDTOperation[],
  clientVectorClock: VectorClock,
  user: any,
  syncResult: any
) {
  // Get server operations since the common ancestor
  const { data: serverOperations } = await supabase
    .from('crdt_operations')
    .select('*')
    .eq('video_id', serverVideo.id)
    .gte('timestamp', getTimestampFromVectorClock(clientVectorClock))
    .order('timestamp', { ascending: true });

  // Merge operations from both client and server
  const allOperations = [
    ...(serverOperations || []),
    ...clientOperations,
  ];

  // Resolve conflicts and get the final operation order
  const resolvedOperations = VideoCRDT.resolveConflicts(allOperations);

  // Apply all operations in order to get the merged state
  let mergedVideo = { ...serverVideo };
  const newOperations = [];

  for (const operation of resolvedOperations) {
    // Skip operations that are already applied (check by timestamp and actor)
    const isAlreadyApplied = (serverOperations || []).some(
      op => op.timestamp === operation.timestamp && op.actor_id === operation.actorId
    );

    if (!isAlreadyApplied) {
      const videoMetadata = {
        id: mergedVideo.id,
        title: mergedVideo.title,
        description: mergedVideo.description,
        tags: mergedVideo.tags || [],
        category: mergedVideo.category,
        vectorClock: mergedVideo.vector_clock || {},
        version: mergedVideo.version || 1,
        lastModifiedBy: mergedVideo.last_modified_by,
      };

      const updatedMetadata = VideoCRDT.applyOperation(videoMetadata, operation);
      mergedVideo = {
        ...mergedVideo,
        title: updatedMetadata.title,
        description: updatedMetadata.description,
        tags: updatedMetadata.tags,
        category: updatedMetadata.category,
        vector_clock: updatedMetadata.vectorClock,
        version: updatedMetadata.version,
        last_modified_by: updatedMetadata.lastModifiedBy,
      };

      newOperations.push(operation);
    }
  }

  // Update the database with merged state
  const { data: finalVideo, error: updateError } = await supabase
    .from('videos')
    .update({
      title: mergedVideo.title,
      description: mergedVideo.description,
      tags: mergedVideo.tags,
      category: mergedVideo.category,
      vector_clock: mergedVideo.vector_clock,
      version: mergedVideo.version,
      last_modified_by: mergedVideo.last_modified_by,
    })
    .eq('id', mergedVideo.id)
    .select('*')
    .single();

  if (updateError) {
    throw new Error(`Failed to update merged video: ${updateError.message}`);
  }

  // Log new operations
  if (newOperations.length > 0) {
    await supabase.from('crdt_operations').insert(
      newOperations.map(op => ({
        video_id: finalVideo.id,
        operation_type: op.type,
        operation_data: op.data,
        vector_clock: op.vectorClock,
        actor_id: op.actorId,
      }))
    );
  }

  syncResult.action = 'merged_concurrent';
  syncResult.merged_video = await getVideoWithUrls(supabase, finalVideo);
  syncResult.conflicts_resolved = newOperations.length;
  syncResult.server_vector_clock = finalVideo.vector_clock;
  syncResult.server_version = finalVideo.version;

  return syncResult;
}

async function getVideoWithUrls(supabase: any, video: any) {
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

  return {
    ...video,
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
  };
}

function getTimestampFromVectorClock(vectorClock: VectorClock): string {
  // This is a simplified approach - in a real implementation,
  // you'd want to track timestamps more precisely
  const maxClock = Math.max(...Object.values(vectorClock));
  const baseTime = new Date('2024-01-01').getTime();
  return new Date(baseTime + maxClock * 1000).toISOString();
}
