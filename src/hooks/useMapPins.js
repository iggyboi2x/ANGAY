import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export function useMapPins(role) {
  const [pins, setPins]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const table   = role === 'foodbank' ? 'foodbanks' : 'barangays';
      const nameCol = role === 'foodbank' ? 'org_name'  : 'barangay_name';

      const { data, error } = await supabase
        .from(table)
        .select(`id, ${nameCol}, address, latitude, longitude, operating_hours`);

      console.log(`[useMapPins] table=${table}`, { data, error });

      if (!cancelled) {
        const withCoords = (data || []).filter(
          row => row.latitude != null && row.longitude != null
        );
        console.log(`[useMapPins] rows with coords:`, withCoords);

        const normalized = withCoords.map(row => ({
          ...row,
          org_name: row[nameCol],
          hours:    row.operating_hours || null,
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
