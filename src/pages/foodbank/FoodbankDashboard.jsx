import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import CalendarPanel from '../../components/CalendarPanel';
import BarangayPopup from '../../components/barangay/BarangayPopup';
import NotificationBell from '../../components/foodbank/NotificationBell';
import { useMapPins } from '../../hooks/useMapPins';
import { useProfile } from '../../hooks/useProfile';
import { Package, AlertTriangle, Truck, Clock, Bell, Search, CalendarDays, Menu } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const orangeIcon = new L.Icon({
  iconUrl:     'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl:   'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:    [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const philippinesBounds = [[4.5, 116.0], [21.5, 127.0]];

// Stat icons in order matching stats array below
const statIcons = [Package, AlertTriangle, Truck, Clock];
const stats = [
  { label: 'Total Items',            value: '500', badge: null                        },
  { label: 'Nearing Expiry',         value: '3',   badge: { label: 'Action Needed' } },
  { label: 'Distributed This Month', value: '24',  badge: null                        },
  { label: 'Pending Pickups',        value: '7',   badge: null                        },
];

export default function FoodbankDashboard() {
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pins: barangays, loading: pinsLoading } = useMapPins('barangay');
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="md:ml-60 flex-1 flex flex-col w-full min-w-0">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-[#888888] hover:text-[#FE9800]" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-64 md:w-72">
              <Search size={14} className="text-[#888888]" />
              <input type="text" placeholder="Search here…"
                className="bg-transparent text-sm text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCalendarOpen(true)}
              className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <CalendarDays size={18} />
            </button>
            <NotificationBell />
            <div className="flex items-center gap-2.5 ml-2">
              <span className="hidden sm:inline text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>
                {profileLoading ? '…' : displayName}
              </span>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
                : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">
                    {profileLoading ? '…' : initials}
                  </div>
              }
            </div>
          </div>
        </div>

        <CalendarPanel isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />

        <div className="p-4 md:p-8 flex-1 flex flex-col overflow-x-hidden">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, badge }, i) => {
              const StatIcon = statIcons[i];
              return (
                <Card key={label} className="!p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{value}</div>
                    <StatIcon size={22} color="#FE9800" />
                  </div>
                  <div className="text-sm text-[#888888]" style={{ fontFamily: 'DM Sans' }}>{label}</div>
                  {badge && (
                    <div className="mt-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF3DC] text-[#C97700]"
                        style={{ fontFamily: 'DM Sans' }}>{badge.label}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Map */}
          <Card className="!p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Barangay Map</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F5F5] text-[#888888]">
                {pinsLoading ? '…' : `${barangays.length} barangay${barangays.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden relative h-[400px] md:h-[500px]">
              {pinsLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <span className="text-sm text-[#888]">Loading map…</span>
                </div>
              )}
              <MapContainer center={[12.8797, 121.7740]} zoom={5} minZoom={5} maxZoom={15}
                maxBounds={philippinesBounds} maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }} scrollWheelZoom>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {barangays.map(pin => (
                  <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={orangeIcon}
                    eventHandlers={{ click: () => setSelectedPin(pin) }} />
                ))}
              </MapContainer>
              {selectedPin && (
                <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none p-4">
                  <div className="pointer-events-auto w-full max-w-sm">
                    <BarangayPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
