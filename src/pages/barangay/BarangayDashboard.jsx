import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import { Users, UserCheck, UserX, Baby, Bell, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const stats = [
  { label: 'Total Households', value: '845',   icon: Users     },
  { label: 'Total Population', value: '4,230', icon: Users     },
  { label: 'PWD Count',        value: '89',    icon: UserCheck },
  { label: 'Senior Citizens',  value: '312',   icon: UserX     },
];

const foodbankPins = [
  { name: 'Cebu City Food Bank', x: 40, y: 47 },
  { name: 'Mandaue Food Hub',    x: 60, y: 55 },
];

const DAYS    = ['S','M','T','W','T','F','S'];
const EVENTS  = [20, 22, 25];
const grid    = Array.from({ length: 35 }, (_, i) => { const d = i + 1; return d <= 31 ? d : null; });

export default function BarangayDashboard() {
  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />

      <div className="ml-60 flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>Barangay Luz</span>
              <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">BL</div>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="!p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{value}</div>
                  <Icon size={22} color="#FE9800" />
                </div>
                <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
                <div className="mt-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-1 rounded-full flex-1"
                      style={{ backgroundColor: i < 3 ? '#FE9800' : '#F0F0F0' }} />
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Map + Calendar */}
          <div className="flex gap-6">
            {/* Foodbank Map */}
            <div className="flex-1">
              <Card className="!p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Foodbank Map</h2>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F5F5] text-[#888888]"
                    style={{ fontFamily: 'DM Sans' }}>2 foodbanks</span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ height: '380px', position: 'relative', background: '#dbeafe' }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 380" xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'absolute', inset: 0 }}>
                    <rect width="800" height="380" fill="#dbeafe" />
                    <path d="M180,130 Q220,85 290,105 Q360,120 380,170 Q400,215 368,258 Q335,290 278,285 Q210,275 182,232 Q155,190 180,130Z"
                      fill="#c9b89a" opacity="0.85" />
                    <path d="M355,140 Q405,95 480,112 Q548,126 572,170 Q592,208 565,248 Q534,280 470,275 Q400,265 368,222 Q338,185 355,140Z"
                      fill="#c9b89a" opacity="0.85" />
                    <ellipse cx="245" cy="318" rx="55" ry="32" fill="#c9b89a" opacity="0.75" />
                    <line x1="362" y1="178" x2="400" y2="178" stroke="#bbb" strokeWidth="1.5" strokeDasharray="4,3" />
                  </svg>
                  {foodbankPins.map((pin) => (
                    <div key={pin.name}
                      style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-100%)' }}
                      className="flex flex-col items-center group cursor-pointer">
                      <div className="bg-white rounded-full p-1 shadow-md border-2 border-[#FE9800] group-hover:scale-110 transition-transform">
                        <MapPin size={14} className="text-[#FE9800]" fill="#FE9800" />
                      </div>
                      <div className="mt-1 bg-white text-xs font-medium text-[#333] px-2 py-0.5 rounded shadow-sm whitespace-nowrap border border-[#F0F0F0]">
                        {pin.name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Calendar */}
            <div className="w-72">
              <Card className="!p-4">
                <div className="flex items-center justify-between mb-3">
                  <button className="p-1 text-[#888888] hover:text-[#FE9800] transition-colors"><ChevronLeft size={16} /></button>
                  <span className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>March 2026</span>
                  <button className="p-1 text-[#888888] hover:text-[#FE9800] transition-colors"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d, i) => (
                    <div key={i} className="text-center text-[11px] font-semibold text-[#AAAAAA] py-1" style={{ fontFamily: 'DM Sans' }}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {grid.map((d, i) => (
                    <div key={i} className="flex flex-col items-center">
                      {d ? (
                        <>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs cursor-pointer transition-colors
                            ${d === 17 ? 'bg-[#FE9800] text-white font-bold' : 'text-[#333] hover:bg-[#FFF3DC]'}`}
                            style={{ fontFamily: 'DM Sans' }}>{d}</div>
                          {EVENTS.includes(d) && <div className="w-1 h-1 rounded-full bg-[#FE9800] mt-0.5" />}
                        </>
                      ) : <div className="w-7 h-7" />}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
