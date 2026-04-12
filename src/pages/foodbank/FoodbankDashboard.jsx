import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import CalendarPanel from '../../components/CalendarPanel';
import BarangayPopup from '../../components/barangay/BarangayPopup';
import { barangays } from '../../assets/data/barangays';
import {
  Package, AlertTriangle, Truck, Clock,
  Bell, Search, CalendarDays
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const stats = [
  { label: 'Total Items',            value: '500', icon: Package,       badge: null,                                iconColor: '#FE9800' },
  { label: 'Nearing Expiry',         value: '3',   icon: AlertTriangle, badge: { label: 'Action Needed', type: 'warning' }, iconColor: '#FE9800' },
  { label: 'Distributed This Month', value: '24',  icon: Truck,         badge: null,                                iconColor: '#FE9800' },
  { label: 'Pending Pickups',        value: '7',   icon: Clock,         badge: null,                                iconColor: '#FE9800' },
];

const incomingDonations = [
  { item: 'Rice 50kg',        donor: 'John Doe',   date: 'Mar 20, 2026', status: 'Confirmed' },
  { item: 'Canned Goods 20x', donor: 'Maria Cruz', date: 'Mar 22, 2026', status: 'Pending'   },
  { item: 'Cooking Oil 10L',  donor: 'ABC Corp',   date: 'Mar 25, 2026', status: 'Confirmed' },
];

const DAYS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const EVENTS = [17, 20, 22, 25];
const grid   = Array.from({ length: 35 }, (_, i) => { const d = i + 1; return d <= 31 ? d : null; });

const philippinesBounds = [
  [4.5,  116.0],
  [21.5, 127.0],
];

export default function FoodbankDashboard() {
  const [selectedPin,  setSelectedPin]  = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-72">
            <Search size={14} className="text-[#888888]" />
            <input
              type="text"
              placeholder="Search here..."
              className="bg-transparent text-sm text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
              style={{ fontFamily: 'DM Sans' }}
            />
          </div>
          <div className="flex items-center gap-2">

            {/* Calendar Toggle */}
            <button
              onClick={() => setCalendarOpen(true)}
              className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors"
            >
              <CalendarDays size={18} />
            </button>

            {/* Notification */}
            <button className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>
                Cebu City Food Bank
              </span>
              <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">
                CF
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Panel */}
        <CalendarPanel isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />

        <div className="p-8 flex-1 flex flex-col">

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

          {/* Map + Right Column */}
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
                    {barangays.length} barangays
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden relative" style={{ height: '500px' }}>
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
                    {barangays.map((pin) => (
                      <Marker
                        key={pin.name}
                        position={pin.position}
                        icon={orangeIcon}
                        eventHandlers={{ click: () => setSelectedPin(pin) }}
                      />
                    ))}
                  </MapContainer>

                  {/* Centered Popup Overlay */}
                  {selectedPin && (
                    <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
                      <div className="pointer-events-auto">
                        <BarangayPopup pin={selectedPin} onClose={() => setSelectedPin(null)} />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="w-72 flex flex-col gap-4">

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}