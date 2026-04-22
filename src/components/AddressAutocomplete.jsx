import { useState, useEffect, useRef } from 'react';
import { geocodeAddress } from '../utils/geocoding';
import { MapPin } from 'lucide-react';

export default function AddressAutocomplete({ label, placeholder, onSelect }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef(null);
  const wrapperRef              = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 4) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await geocodeAddress(query);
      setResults(res);
      setOpen(res.length > 0);
      setLoading(false);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const pick = (item) => {
    setQuery(item.label);
    setSelected(true);
    setResults([]);
    setOpen(false);
    onSelect(item.label, item.lat, item.lng);
  };

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder || 'Type address to search…'}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(false); }}
          className="w-full px-3.5 py-2.5 pr-9 text-sm bg-gray-50 border border-gray-200
            rounded-xl outline-none transition-all
            focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
        />
        <MapPin
          size={15}
          className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors
            ${selected ? 'text-[#FE9800]' : 'text-gray-400'}`}
        />
      </div>

      {loading && (
        <p className="text-xs text-gray-400 mt-1 pl-1 animate-pulse">Searching…</p>
      )}

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200
          rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => pick(r)}
              className="px-3.5 py-2.5 text-xs text-gray-700 cursor-pointer
                hover:bg-orange-50 hover:text-[#FE9800]
                border-b last:border-0 border-gray-100 flex items-start gap-2"
            >
              <MapPin size={11} className="mt-0.5 shrink-0 text-gray-400" />
              <span>{r.label}</span>
            </li>
          ))}
        </ul>
      )}

      {!selected && query.length >= 4 && !loading && results.length === 0 && !open && (
        <p className="text-xs text-red-400 mt-1 pl-1">
          No results found. Try a more specific address.
        </p>
      )}

      {selected && (
        <p className="text-xs text-green-600 mt-1 pl-1 flex items-center gap-1">
          <MapPin size={11} /> Location pinned successfully
        </p>
      )}
    </div>
  );
}
