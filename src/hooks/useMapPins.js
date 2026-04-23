import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';

export function useMapPins(role) {
  const [pins, setPins]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const isFoodbank = role === 'foodbank';
      const table      = isFoodbank ? 'foodbanks' : 'barangays';
      const nameCol    = isFoodbank ? 'org_name'  : 'barangay_name';
      // operating_hours only exists on the foodbanks table
      const selectCols = isFoodbank
        ? `id, ${nameCol}, address, latitude, longitude, operating_hours`
        : `id, ${nameCol}, address, latitude, longitude`;

      const { data, error } = await supabase
        .from(table)
<<<<<<< HEAD
        .select(selectCols);
=======
        .select(`id, ${nameCol}, address, latitude, longitude, operating_hours, logo_url, created_at, contact`);
>>>>>>> 4bc6c7326733c2aa4628fc981865dc40f7961aaa

      let sourceRows = data || [];

      // Fallback to profiles if role-specific table is unavailable or empty.
      if (error || sourceRows.length === 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, role, org_name, address, latitude, longitude, hours, contact, file_url, created_at')
          .eq('role', role);
        sourceRows = (profileRows || []).map((row) => ({
          ...row,
          [nameCol]: row.org_name,
          operating_hours: row.hours,
          logo_url: row.file_url,
        }));
      }

      if (!cancelled) {
        const withCoords = sourceRows.filter(
          row => row.latitude != null && row.longitude != null
        );
<<<<<<< HEAD
=======

>>>>>>> 4bc6c7326733c2aa4628fc981865dc40f7961aaa
        const normalized = withCoords.map(row => ({
          ...row,
          org_name: row[nameCol],
          hours:    row.operating_hours || null,
          logo_url: row.logo_url || null,
          contact: row.contact || null,
          created_at: row.created_at || null,
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
