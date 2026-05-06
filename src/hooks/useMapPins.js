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
      const extraCols = isFoodbank ? ', operating_hours, logo_url, website_url' : '';
      const demographicsJoin = !isFoodbank ? ', demographics(member_count, pwd_count, senior_count, children_count, pregnant_count)' : '';

      const { data, error } = await supabase
        .from(table)
        .select(`id, ${nameCol}, address, latitude, longitude${extraCols}, profiles(contact)${demographicsJoin}`);

      if (error) {
        console.error(`[useMapPins] Error fetching ${table}:`, error.message);
      }

      if (!cancelled) {
        const withCoords = (data || []).filter(
          row => row.latitude != null && row.longitude != null
        );
        const normalized = withCoords.map(row => {
          let demoTotals = null;
          if (!isFoodbank) {
            demoTotals = { population: 0, pwd: 0, seniors: 0, children: 0, pregnant: 0 };
            if (row.demographics && row.demographics.length > 0) {
              demoTotals = row.demographics.reduce((acc, curr) => ({
                population: acc.population + (curr.member_count || 0),
                pwd: acc.pwd + (curr.pwd_count || 0),
                seniors: acc.seniors + (curr.senior_count || 0),
                children: acc.children + (curr.children_count || 0),
                pregnant: acc.pregnant + (curr.pregnant_count || 0),
              }), demoTotals);
            }
          }

          return {
            ...row,
            type: isFoodbank ? 'foodbank' : 'barangay',
            org_name: row[nameCol],
            contact: row.profiles?.contact || null,
            hours: row.operating_hours || null,
            logo_url: row.logo_url || null,
            website_url: row.website_url || null,
            demographics: demoTotals,
          };
        });
        setPins(normalized);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [role]);

  return { pins, loading };
}
