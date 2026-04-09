import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import {
  Package, AlertTriangle, Truck, Clock,
  MapPin, Bell, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { label: 'Total Items',           value: '500', icon: Package,       badge: null,                         iconColor: '#FE9800' },
  { label: 'Nearing Expiry',        value: '3',   icon: AlertTriangle, badge: { label: 'Action Needed', type: 'warning' }, iconColor: '#FE9800' },
  { label: 'Distributed This Month',value: '24',  icon: Truck,         badge: null,                         iconColor: '#FE9800' },
  { label: 'Pending Pickups',       value: '7',   icon: Clock,         badge: null,                         iconColor: '#FE9800' },
];

const barangayPins = [
  { name: 'Barangay Luz',      x: 28, y: 48 },
  { name: 'Barangay Mabolo',   x: 46, y: 57 },
  { name: 'Barangay Lahug',    x: 55, y: 40 },
  { name: 'Barangay Banilad',  x: 68, y: 52 },
  { name: 'Barangay Talamban', x: 34, y: 74 },
];

const incomingDonations = [
  { item: 'Rice 50kg',        donor: 'John Doe',    date: 'Mar 20, 2026', status: 'Confirmed' },
  { item: 'Canned Goods 20x', donor: 'Maria Cruz',  date: 'Mar 22, 2026', status: 'Pending'   },
  { item: 'Cooking Oil 10L',  donor: 'ABC Corp',    date: 'Mar 25, 2026', status: 'Confirmed' },
];

const DAYS = ['S','M','T','W','T','F','S'];
const EVENTS = [17, 20, 22, 25]; // days with dots

export default function FoodbankDashboard() {
  const [currentMonth] = useState('March 2026');

  const calendarDays = [];
  // March 2026 starts on Sunday (0), 31 days
  for (let i = 0; i < 6; i++) calendarDays.push(null); // offset — actually 0, keep it simple
  // March 1 2026 = Sunday, offset = 0
  for (let d = 1; d <= 31; d++) calendarDays.push(d);

  // Build 5-week grid: March 1 is Sunday
  const grid = Array.from({ length: 35 }, (_, i) => {
    const d = i + 1;
    return d <= 31 ? d : null;
  });

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-72">
            <Search size={14} className="text-[#888888]" />
            <input type="text" placeholder="Search here..."
              className="bg-transparent text-sm text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
              style={{ fontFamily: 'DM Sans' }} />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>
                Cebu City Food Bank
              </span>
              <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">
                CF
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, badge, iconColor }) => (
              <Card key={label} className="!p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                    {value}
                  </div>
                  <Icon size={22} color={iconColor} />
                </div>
                <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
                {badge && (
                  <div className="mt-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF3DC] text-[#C97700]"
                      style={{ fontFamily: 'DM Sans' }}>
                      {badge.label}
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Map + Sidebar */}
          <div className="flex gap-6">
            {/* Barangay Map */}
            <div className="flex-1">
              <Card className="!p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                    Barangay Map
                  </h2>
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F5F5] text-[#888888]"
                    style={{ fontFamily: 'DM Sans' }}>
                    5 barangays
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ height: '340px', position: 'relative', background: '#dbeafe' }}>
                  <svg width="100%" height="100%" viewBox="0 0 800 340" xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'absolute', inset: 0 }}>
                    <rect width="800" height="340" fill="#dbeafe" />
                    {/* Cebu island shapes */}
                    <path d="M180,120 Q220,80 280,100 Q340,115 360,160 Q380,200 350,240 Q320,275 270,270 Q210,260 185,220 Q160,180 180,120Z"
                      fill="#c9b89a" opacity="0.85" />
                    <path d="M340,130 Q390,90 460,105 Q530,118 560,160 Q580,195 555,235 Q525,265 465,260 Q400,250 365,210 Q335,175 340,130Z"
                      fill="#c9b89a" opacity="0.85" />
                    <ellipse cx="240" cy="295" rx="50" ry="30" fill="#c9b89a" opacity="0.75" />
                    <line x1="340" y1="170" x2="380" y2="170" stroke="#bbb" strokeWidth="1.5" strokeDasharray="4,3" />
                  </svg>
                  {barangayPins.map((pin) => (
                    <div key={pin.name}
                      style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-100%)' }}
                      className="flex flex-col items-center group cursor-pointer">
                      <div className="bg-white rounded-full p-1 shadow-md border-2 border-[#FE9800] group-hover:scale-110 transition-transform">
                        <MapPin size={14} className="text-[#FE9800]" fill="#FE9800" />
                      </div>
                      <div className="mt-1 bg-white text-xs font-medium text-[#333] px-2 py-0.5 rounded shadow-sm
                        whitespace-nowrap border border-[#F0F0F0]">
                        {pin.name}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="w-72 flex flex-col gap-4">
              {/* Calendar */}
              <Card className="!p-4">
                <div className="flex items-center justify-between mb-3">
                  <button className="p-1 text-[#888888] hover:text-[#FE9800] transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                    {currentMonth}
                  </span>
                  <button className="p-1 text-[#888888] hover:text-[#FE9800] transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d, i) => (
                    <div key={i} className="text-center text-[11px] font-semibold text-[#AAAAAA] py-1"
                      style={{ fontFamily: 'DM Sans' }}>{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-y-1">
                  {grid.map((d, i) => (
                    <div key={i} className="flex flex-col items-center">
                      {d ? (
                        <>
                          <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs cursor-pointer
                            transition-colors ${d === 17
                              ? 'bg-[#FE9800] text-white font-bold'
                              : 'text-[#333] hover:bg-[#FFF3DC]'}`}
                            style={{ fontFamily: 'DM Sans' }}>
                            {d}
                          </div>
                          {EVENTS.includes(d) && d !== 17 && (
                            <div className="w-1 h-1 rounded-full bg-[#FE9800] mt-0.5" />
                          )}
                        </>
                      ) : <div className="w-7 h-7" />}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Incoming Donations */}
              <Card className="!p-4 flex-1">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'DM Sans' }}>
                  Incoming Donations
                </h3>
                <div className="space-y-3">
                  {incomingDonations.map((d, i) => (
                    <div key={i} className="border-l-4 border-[#FE9800] pl-3 py-1">
                      <div className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                        {d.item}
                      </div>
                      <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{d.donor}</div>
                      <div className="text-xs text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{d.date}</div>
                      <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full
                        ${d.status === 'Confirmed'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-yellow-50 text-yellow-600'}`}
                        style={{ fontFamily: 'DM Sans' }}>
                        {d.status}
                      </span>
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
