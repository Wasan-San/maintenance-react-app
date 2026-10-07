import { supabase } from '../lib/supabase.js';

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, role, store_id')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  return {
    userId: data.user_id,
    displayName: data.display_name || '',
    role: data.role,
    storeId: data.store_id
  };
}

export function getPermissions(profile) {
  const role = profile?.role;

  return {
    canReadAll: role === 'admin' || role === 'viewer',
    canCreate: ['admin', 'viewer', 'store'].includes(role),
    canEdit: role === 'admin',
    canDelete: role === 'admin',
    isStoreUser: role === 'store'
  };
}
