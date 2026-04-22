// Nominatim (OpenStreetMap) geocoding – free, no API key required
const BASE = 'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(query) {
  const params = new URLSearchParams({
    q: query + ', Philippines',
    format: 'json',
    countrycodes: 'ph',
    limit: 5,
    addressdetails: 1,
  });

  try {
    const res = await fetch(`${BASE}?${params}`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'ANGAY-FoodBank-App/1.0',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item) => ({
      label: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch {
    return [];
  }
}
