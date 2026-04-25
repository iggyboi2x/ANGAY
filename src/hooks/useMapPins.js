import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export function useMapPins(role) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const isFoodbank = role === 'foodbank';
      const table = isFoodbank ? 'foodbanks' : 'barangays';
      const nameCol = isFoodbank ? 'org_name' : 'barangay_name';
      const extraCols = isFoodbank ? ', operating_hours' : '';

      const { data, error } = await supabase
        .from(table)
        .select(`id, ${nameCol}, address, latitude, longitude${extraCols}, profiles(contact)`);

      if (error) {
        console.error(`[useMapPins] Error fetching ${table}:`, error.message);
      }

      if (!cancelled) {
        const withCoords = (data || []).filter(
          row => row.latitude != null && row.longitude != null
        );
        const normalized = withCoords.map(row => ({
          ...row,
          org_name: row[nameCol],
          contact: row.profiles?.contact || null,
          hours: row.operating_hours || null,
        }));
        setPins(normalized);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [role]);

  return { pins, loading };
}
