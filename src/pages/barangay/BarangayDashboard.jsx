import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import FoodbankPopup from '../../components/foodbank/FoodbankPopup';
import CalendarPanel from '../../components/CalendarPanel';
import BarangayNotificationBell from '../../components/barangay/BarangayNotificationBell';
import { useMapPins } from '../../hooks/useMapPins';
import { useProfile } from '../../hooks/useProfile';
import { Bell, CalendarDays } from 'lucide-react';
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

export default function BarangayDashboard() {
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { pins: foodbanks, loading: pinsLoading } = useMapPins('foodbank');
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Dashboard</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCalendarOpen(true)}
              className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <CalendarDays size={18} />
            </button>
            <BarangayNotificationBell />
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>
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

        <div className="p-8 flex-1 flex flex-col">
          {/* Map Section */}
          <Card className="flex-1 !p-5 flex flex-col border border-[#F0F0F0] overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Foodbank Map</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F5F5] text-[#888888]">
                {pinsLoading ? '…' : `${foodbanks.length} foodbank${foodbanks.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            
            <div className="rounded-xl overflow-hidden relative flex-1 min-h-[500px]">
              {pinsLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <span className="text-sm text-[#888]">Loading map…</span>
                </div>
              )}
              <MapContainer 
                center={[12.8797, 121.7740]} 
                zoom={5} 
                minZoom={5} 
                maxZoom={15}
                maxBounds={philippinesBounds} 
                maxBoundsViscosity={1.0}
                style={{ height: '100%', width: '100%' }} 
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {foodbanks.map(pin => (
                  <Marker 
                    key={pin.id} 
                    position={[pin.latitude, pin.longitude]} 
                    icon={orangeIcon}
                    eventHandlers={{ click: () => setSelectedPin(pin) }} 
                  />
                ))}
              </MapContainer>

              {selectedPin && (
                <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
                  <div className="pointer-events-auto">
                    <FoodbankPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
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
