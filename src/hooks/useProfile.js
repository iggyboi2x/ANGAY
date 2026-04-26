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

      if (role === 'foodbank') {
        const { data } = await supabase
          .from('foodbanks')
          .select('org_name, logo_url')
          .eq('id', user.id)
          .maybeSingle();
        displayName = data?.org_name || user.user_metadata?.org_name || 'Food Bank';
        avatarUrl   = data?.logo_url || null;

      } else if (role === 'barangay') {
        const { data } = await supabase
          .from('barangays')
          .select('barangay_name, barangay_profile')
          .eq('id', user.id)
          .maybeSingle();
        displayName = data?.barangay_name || user.user_metadata?.org_name || 'Barangay';
        avatarUrl   = data?.barangay_profile || null;

      } else {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        displayName = data?.full_name || user.user_metadata?.full_name || 'User';
      }

      // Build initials from first letters of each word (max 2)
      const initials = displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');

      if (!cancelled) {
        setProfile({ id: user.id, displayName, initials, avatarUrl, role, loading: false });
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return profile;
}
