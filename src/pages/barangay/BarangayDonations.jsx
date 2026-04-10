import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import { Users, UserCheck, UserX, Bell } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon broken in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom orange marker to match theme
const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const stats = [
  { label: 'Total Households', value: '845',   icon: Users     },
  { label: 'Total Population', value: '4,230', icon: Users     },
  { label: 'PWD Count',        value: '89',    icon: UserCheck },
  { label: 'Senior Citizens',  value: '312',   icon: UserX     },
];

const foodbankPins = [
  { name: 'Cebu City Food Bank', position: [10.3157, 123.8854] },
  { name: 'Mandaue Food Hub',    position: [10.3236, 123.9223] },
];

// Philippines bounds to restrict panning
const philippinesBounds = [
  [4.5, 116.0],
  [21.5, 127.0],
];

const DAYS   = ['S','M','T','W','T','F','S'];
const EVENTS = [20, 22, 25];
const grid   = Array.from({ length: 35 }, (_, i) => { const d = i + 1; return d <= 31 ? d : null; });

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

                <div className="rounded-xl overflow-hidden" style={{ height: '380px' }}>
                  <MapContainer
                    center={[12.8797, 121.7740]}
                    zoom={5}
                    minZoom={5}
                    maxZoom={15}
                    maxBounds={philippinesBounds}
                    maxBoundsViscosity={1.0}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {foodbankPins.map((pin) => (
                      <Marker key={pin.name} position={pin.position} icon={orangeIcon}>
                        <Popup>{pin.name}</Popup>
                      </Marker>
                    ))}
                  </MapContainer>
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