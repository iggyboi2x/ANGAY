import { useState, useEffect } from 'react';
import {
  Menu, Search, CalendarDays, Package, AlertTriangle,
  Truck, Clock, X, MapPin, Users, MessageSquare, Bell
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import Card from '../../components/Card';
import CalendarPanel from '../../components/CalendarPanel';
import NotificationBell from '../../components/foodbank/NotificationBell';
import { useMapPins } from '../../hooks/useMapPins';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const philippinesBounds = [[4.5, 116.0], [21.5, 127.0]];

// Stat icons in order matching stats array below
const statIcons = [Package, AlertTriangle, Truck, Clock];

export default function FoodbankDashboard() {
  const [selectedPin, setSelectedPin] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pins: barangays, loading: pinsLoading } = useMapPins('barangay');
  const { id: foodbankId, displayName, initials, avatarUrl, loading: profileLoading } = useProfile();

  const [statsData, setStatsData] = useState({
    totalItems: 0,
    nearingExpiry: 0,
    distributedMonth: 0,
    pendingPickups: 0
  });

  const [pinDetails, setPinDetails] = useState({ history: [], helped: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!foodbankId) return;

    const fetchStats = async () => {
      // 1. Total Items & Expiry
      const { data: invData } = await supabase.from('foodbank_inventory').select('quantity, status').eq('foodbank_id', foodbankId);
      let totalItems = 0;
      let nearingExpiry = 0;
      if (invData) {
        invData.forEach(item => {
          totalItems += Number(item.quantity) || 0;
          if (item.status === 'expiring' || item.status === 'expired') {
            nearingExpiry += 1;
          }
        });
      }

      // 2. Distributed This Month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: distMonth } = await supabase.from('distributions')
        .select('*', { count: 'exact', head: true })
        .eq('foodbank_id', foodbankId)
        .gte('created_at', startOfMonth.toISOString());

      // 3. Pending Pickups (Distributions waiting)
      const { count: pendingDists } = await supabase.from('distributions')
        .select('*', { count: 'exact', head: true })
        .eq('foodbank_id', foodbankId)
        .eq('status', 'pending');

      setStatsData({
        totalItems,
        nearingExpiry,
        distributedMonth: distMonth || 0,
        pendingPickups: pendingDists || 0
      });
    };

    fetchStats();
  }, [foodbankId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedPin) {
      setPinDetails({ history: [], helped: [] });
      return;
    }

    const loadDetails = async () => {
      setLoadingDetails(true);
      const { data: history } = await supabase
        .from("distributions")
        .select("id, items, created_at, status")
        .eq("barangay_id", selectedPin.id)
        .eq("foodbank_id", foodbankId)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setPinDetails({ history: history || [], helped: [] });
        setLoadingDetails(false);
      }
    };

    loadDetails();
    return () => { cancelled = true; };
  }, [selectedPin, foodbankId]);

  const stats = [
    { label: 'Total Items', value: statsData.totalItems.toLocaleString(), badge: null },
    { label: 'Nearing Expiry', value: statsData.nearingExpiry.toString(), badge: statsData.nearingExpiry > 0 ? { label: 'Action Needed' } : null },
    { label: 'Distributed This Month', value: statsData.distributedMonth.toString(), badge: null },
    { label: 'Pending Pickups', value: statsData.pendingPickups.toString(), badge: null },
  ];

  return (
    <div className="flex min-h-screen bg-white relative overflow-x-hidden">
      {/* Details Slide-in Panel (Fixed Left - Covers Sidebar) */}
      <div 
        className={`fixed top-0 left-0 h-screen w-full max-w-[400px] bg-white z-[200] shadow-2xl transition-transform duration-500 ease-in-out border-r border-gray-100 flex flex-col ${selectedPin ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {selectedPin && (
          <>
            <div className="relative h-48 w-full flex-shrink-0">
              <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-5xl font-bold opacity-30">
                  {(selectedPin.org_name || selectedPin.name || "B").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button 
                onClick={() => setSelectedPin(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
              >
                <X size={20} />
              </button>
              
              <div className="absolute bottom-4 left-6 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-white font-bold text-2xl truncate drop-shadow-md">
                    {selectedPin.org_name || selectedPin.name || "Unnamed Barangay"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin size={14} /> {selectedPin.address || "Location not set"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
              <section>
                <div className="flex items-center gap-2 mb-3 text-gray-400">
                  <Clock size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest">About</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {selectedPin.description || `Active partner community dedicated to local welfare and sustainable food distribution.`}
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <Users size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Community Demographics</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Population', value: selectedPin.demographics?.population || 0, icon: '👥' },
                    { label: 'Seniors', value: selectedPin.demographics?.seniors || 0, icon: '👴' },
                    { label: 'Children', value: selectedPin.demographics?.children || 0, icon: '👶' },
                    { label: 'PWDs', value: selectedPin.demographics?.pwd || 0, icon: '♿' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <span className="text-xl mb-2 block">{stat.icon}</span>
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-black text-blue-900">{stat.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  <Truck size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Your Dispatch History</h3>
                </div>
                <div className="space-y-3">
                  {loadingDetails ? (
                    <p className="text-xs text-gray-400">Loading history...</p>
                  ) : pinDetails.history.length > 0 ? pinDetails.history.map((h) => (
                    <div key={h.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-blue-400 transition-colors">
                      <p className="text-sm font-bold text-gray-800">{h.items}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[10px] text-gray-400 font-bold">{new Date(h.created_at).toLocaleDateString()}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700`}>
                          {h.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400 italic">No aid has been sent to this barangay yet.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-10 flex gap-3">
              <button 
                className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} />
                Message
              </button>
              <button 
                className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Package size={18} />
                Send Food Aid
              </button>
            </div>
          </>
        )}
      </div>

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

        <div className="p-4 md:p-8 flex-1 flex flex-col">
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
          <Card className="!p-5 flex-1 min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Barangay Map</h2>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5F5F5] text-[#888888]">
                {pinsLoading ? '…' : `${barangays.length} barangay${barangays.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden relative h-full">
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
                {barangays.map(pin => (
                  <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={orangeIcon}
                    eventHandlers={{ click: () => setSelectedPin(pin) }} />
                ))}
              </MapContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
