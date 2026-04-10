import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const DAYS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const EVENTS = [20, 22, 25];

function getGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function CalendarPanel({ isOpen, onClose }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const grid = getGrid(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Panel Header */}
        <div className="h-14 border-b border-[#F0F0F0] flex items-center justify-between px-5">
          <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
            Calendar
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-[#1A1A1A] transition-colors rounded-full hover:bg-[#F5F5F5]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 text-[#888888] hover:text-[#FE9800] transition-colors rounded-full hover:bg-[#FFF3DC]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 text-[#888888] hover:text-[#FE9800] transition-colors rounded-full hover:bg-[#FFF3DC]"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div
                key={i}
                className="text-center text-[11px] font-semibold text-[#AAAAAA] py-1"
                style={{ fontFamily: 'DM Sans' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {grid.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                {d ? (
                  <>
                    <div
                      className={`w-8 h-8 flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors
                        ${d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                          ? 'bg-[#FE9800] text-white font-bold'
                          : 'text-[#333] hover:bg-[#FFF3DC]'
                        }`}
                      style={{ fontFamily: 'DM Sans' }}
                    >
                      {d}
                    </div>
                    {EVENTS.includes(d) && (
                      <div className="w-1 h-1 rounded-full bg-[#FE9800] mt-0.5" />
                    )}
                  </>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <hr className="border-[#F0F0F0] my-5" />

          {/* Upcoming Events */}
          <div>
            <p className="text-[11px] font-semibold text-[#AAAAAA] tracking-widest uppercase mb-3"
              style={{ fontFamily: 'DM Sans' }}>
              Upcoming Events
            </p>
            {EVENTS.map((d) => (
              <div key={d} className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#FFF3DC] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-semibold text-[#FE9800] uppercase">
                    {MONTH_NAMES[month].slice(0, 3)}
                  </span>
                  <span className="text-sm font-bold text-[#FE9800] leading-none">{d}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                    Barangay Event
                  </p>
                  <p className="text-[11px] text-[#888888]" style={{ fontFamily: 'DM Sans' }}>
                    {MONTH_NAMES[month]} {d}, {year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}