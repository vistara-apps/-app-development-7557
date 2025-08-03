import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthUser {
  id: string;
  email?: string;
  role?: 'admin' | 'moderator' | 'user';
}

export async function getAuthenticatedUser(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export function requireRole(user: AuthUser | null, allowedRoles: string[]): AuthUser {
  const authenticatedUser = requireAuth(user);
  
  if (!allowedRoles.includes(authenticatedUser.role || 'user')) {
    throw new Error('Insufficient permissions');
  }
  
  return authenticatedUser;
}

export function requireAdmin(user: AuthUser | null): AuthUser {
  return requireRole(user, ['admin']);
}

export function requireAdminOrModerator(user: AuthUser | null): AuthUser {
  return requireRole(user, ['admin', 'moderator']);
}
