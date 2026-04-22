import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

/**
 * Fetches all registered users of a given role that have geocoordinates.
 * @param {'foodbank' | 'barangay'} role
 */
export function useMapPins(role) {
  const [pins, setPins]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, org_name, full_name, address, latitude, longitude, contact, hours, file_url, role')
        .eq('role', role)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!cancelled) {
        setPins(data || []);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [role]);

  return { pins, loading };
}
