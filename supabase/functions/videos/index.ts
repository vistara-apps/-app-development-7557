import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleCors, createResponse, createErrorResponse } from '../_shared/cors.ts';
import { getAuthenticatedUser, requireAdminOrModerator } from '../_shared/auth.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const user = await getAuthenticatedUser(req);

    if (req.method === 'GET') {
      return await handleGetVideos(req, supabase, user);
    } else if (req.method === 'POST') {
      // Allow video creation without authentication for guest users
      return await handleCreateVideo(req, supabase, user);
    }

    return createErrorResponse('Method not allowed', 405);
  } catch (error) {
    console.error('Error in videos function:', error);
    return createErrorResponse(error.message, 500);
  }
});

async function handleGetVideos(req: Request, supabase: any, user: any) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const status = url.searchParams.get('status') || 'ready';
  const featured = url.searchParams.get('featured');

  const offset = (page - 1) * limit;

  let query = supabase
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
    .is('deleted_at', null)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (category) {
    query = query.eq('category', category);
  }

  if (featured !== null) {
    query = query.eq('is_featured', featured === 'true');
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data: videos, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  // Get total count for pagination
  let countQuery = supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('status', status);

  if (category) {
    countQuery = countQuery.eq('category', category);
  }

  if (featured !== null) {
    countQuery = countQuery.eq('is_featured', featured === 'true');
  }

  if (search) {
    countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { count: totalCount } = await countQuery;

  return createResponse({
    videos,
    pagination: {
      page,
      limit,
      total: totalCount || 0,
      totalPages: Math.ceil((totalCount || 0) / limit),
    },
  });
}

async function handleCreateVideo(req: Request, supabase: any, user: any) {
  const body = await req.json();
  const { title, description, category, tags = [], is_featured = false } = body;

  if (!title) {
    return createErrorResponse('Title is required');
  }

  // Create user ID for guest users or use authenticated user
  const userId = user?.id || null; // Use null for anonymous users
  
  // Create initial vector clock - use a default key for anonymous users
  const vectorClockKey = userId || 'anonymous';
  const initialVectorClock = { [vectorClockKey]: 1 };

  // Prepare insert data
  const insertData: any = {
    title,
    description,
    category,
    tags,
    is_featured,
    status: 'uploading',
    vector_clock: initialVectorClock,
    version: 1,
  };

  // Only add last_modified_by if we have a valid user UUID
  if (userId) {
    insertData.last_modified_by = userId;
  }

  const { data: video, error } = await supabase
    .from('videos')
    .insert(insertData)
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

  if (error) {
    throw new Error(`Failed to create video: ${error.message}`);
  }

  // Log CRDT operation
  await supabase.from('crdt_operations').insert({
    video_id: video.id,
    operation_type: 'create_video',
    operation_data: { title, description, category, tags, is_featured },
    vector_clock: initialVectorClock,
    actor_id: user.id,
  });

  return createResponse(video, 201);
}
