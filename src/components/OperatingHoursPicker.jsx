import { useState } from 'react';
import { Clock } from 'lucide-react';

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

const TIMES = [];
for (let h = 0; h < 24; h++) {
  ['00', '30'].forEach(m => {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm   = h < 12 ? 'AM' : 'PM';
    const label  = `${hour12}:${m} ${ampm}`;
    const value  = `${String(h).padStart(2,'0')}:${m}`;
    TIMES.push({ label, value });
  });
}

// Converts selected state → human-readable string for storage
// e.g. "Mon–Fri 8:00 AM – 5:00 PM, Sat 8:00 AM – 12:00 PM"
function buildHoursString(selectedDays, open, close) {
  if (!selectedDays.length || !open || !close) return '';
  const order  = DAYS.map(d => d.id);
  const sorted = [...selectedDays].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  // Group consecutive days into ranges
  const ranges = [];
  let start = sorted[0], prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const curr = sorted[i];
    const prevIdx = order.indexOf(prev);
    const currIdx = curr ? order.indexOf(curr) : -1;
    if (currIdx === prevIdx + 1) { prev = curr; continue; }
    const startLabel = DAYS.find(d => d.id === start).label;
    const prevLabel  = DAYS.find(d => d.id === prev).label;
    ranges.push(start === prev ? startLabel : `${startLabel}–${prevLabel}`);
    start = curr; prev = curr;
  }

  const openLabel  = TIMES.find(t => t.value === open)?.label  || open;
  const closeLabel = TIMES.find(t => t.value === close)?.label || close;
  return `${ranges.join(', ')} ${openLabel} – ${closeLabel}`;
}

export default function OperatingHoursPicker({ onChange }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [openTime,  setOpenTime]  = useState('08:00');
  const [closeTime, setCloseTime] = useState('17:00');

  const toggleDay = (id) => {
    const next = selectedDays.includes(id)
      ? selectedDays.filter(d => d !== id)
      : [...selectedDays, id];
    setSelectedDays(next);
    onChange(buildHoursString(next, openTime, closeTime));
  };

  const handleTime = (type, val) => {
    const next = type === 'open'
      ? { open: val, close: closeTime }
      : { open: openTime, close: val };
    if (type === 'open')  setOpenTime(val);
    else                  setCloseTime(val);
    onChange(buildHoursString(selectedDays, next.open, next.close));
  };

  // Quick-select presets
  const applyPreset = (preset) => {
    let days = [], open = '08:00', close = '17:00';
    if (preset === 'weekdays')  { days = ['mon','tue','wed','thu','fri']; }
    if (preset === 'everyday')  { days = ['mon','tue','wed','thu','fri','sat','sun']; }
    if (preset === 'weekends')  { days = ['sat','sun']; }
    setSelectedDays(days); setOpenTime(open); setCloseTime(close);
    onChange(buildHoursString(days, open, close));
  };

  const preview = buildHoursString(selectedDays, openTime, closeTime);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
        <Clock size={14} className="text-[#FE9800]" /> Operating Hours
      </label>

      {/* Quick presets */}
      <div className="flex gap-1.5 mb-2">
        {[['weekdays','Mon–Fri'],['weekends','Sat–Sun'],['everyday','Every day']].map(([k,l]) => (
          <button key={k} type="button" onClick={() => applyPreset(k)}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-gray-200
              text-gray-500 hover:border-[#FE9800] hover:text-[#FE9800] hover:bg-orange-50 transition-all">
            {l}
          </button>
        ))}
      </div>

      {/* Day toggles */}
      <div className="flex gap-1.5 mb-3">
        {DAYS.map(({ id, label }) => (
          <button key={id} type="button" onClick={() => toggleDay(id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border-2 transition-all
              ${selectedDays.includes(id)
                ? 'bg-[#FE9800] border-[#FE9800] text-white'
                : 'bg-white border-gray-200 text-gray-400 hover:border-[#FE9800]/50 hover:text-[#FE9800]/70'
              }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">Opens</p>
          <select value={openTime} onChange={e => handleTime('open', e.target.value)}
            className="w-full px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
              outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20 transition-all">
            {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <span className="text-gray-400 mt-4 text-sm font-medium">–</span>
        <div className="flex-1">
          <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wide">Closes</p>
          <select value={closeTime} onChange={e => handleTime('close', e.target.value)}
            className="w-full px-2.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
              outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20 transition-all">
            {TIMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Live preview */}
      {preview && (
        <div className="mt-2.5 px-3 py-2 bg-orange-50 border border-[#FE9800]/20 rounded-lg">
          <p className="text-[10px] text-[#FE9800] font-semibold uppercase tracking-wide mb-0.5">Preview</p>
          <p className="text-xs text-[#b45309] font-medium">{preview}</p>
        </div>
      )}
    </div>
  );
}
