import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

/**
 * Loads the current user's profile + role-specific data.
 * Returns: { displayName, initials, avatarUrl, role, loading }
 */
export function useProfile() {
  const [profile, setProfile] = useState({
    id: null,
    displayName: '',
    initials: '',
    avatarUrl: null,
    role: null,
    isVerified: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const role = user.user_metadata?.role;

      let displayName = '';
      let avatarUrl   = null;
      let isVerified  = user.user_metadata?.is_verified || false;

      try {
        if (role === 'foodbank') {
          const { data } = await supabase.from('foodbanks').select('*').eq('id', user.id).maybeSingle();
          displayName = data?.org_name || user.user_metadata?.org_name || 'Food Bank';
          avatarUrl   = data?.logo_url || null;
          isVerified  = data?.is_verified ?? user.user_metadata?.is_verified ?? false;
        } else if (role === 'barangay') {
          const { data } = await supabase.from('barangays').select('*').eq('id', user.id).maybeSingle();
          displayName = data?.barangay_name || user.user_metadata?.org_name || 'Barangay';
          avatarUrl   = data?.barangay_profile || null;
          isVerified  = data?.is_verified ?? user.user_metadata?.is_verified ?? false;
        } else {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
          displayName = data?.full_name || user.user_metadata?.full_name || 'User';
          isVerified  = data?.is_verified ?? user.user_metadata?.is_verified ?? false;
        }
      } catch (err) {
        console.warn("Profile table fetch failed, falling back to metadata:", err);
        displayName = user.user_metadata?.org_name || user.user_metadata?.full_name || 'User';
        isVerified = user.user_metadata?.is_verified || false;
      }

      // Build initials from first letters of each word (max 2)
      const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');

      if (!cancelled) {
        setProfile({ id: user.id, displayName, initials, avatarUrl, role, isVerified, loading: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return profile;
}
