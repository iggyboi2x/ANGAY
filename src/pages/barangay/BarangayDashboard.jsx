import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import Card from '../../components/Card';
import FoodbankPopup from '../../components/foodbank/FoodbankPopup';
import CalendarPanel from '../../components/CalendarPanel';
import BarangayNotificationBell from '../../components/barangay/BarangayNotificationBell';
import { useMapPins } from '../../hooks/useMapPins';
import { useProfile } from '../../hooks/useProfile';
import { Bell, CalendarDays, AlertTriangle, Flame, Waves, X, CheckCircle2, BadgeCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import { useEffect } from 'react';
import { supabase } from '../../../supabase';
import { logLedgerAction } from '../../utils/ledger';

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
  const { id: myId, displayName, initials, avatarUrl, isVerified, loading: profileLoading } = useProfile();
  
  const [crisisData, setCrisisData] = useState({ is_in_crisis: false, crisis_type: null });
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (myId) {
      fetchCrisisStatus();
    }
  }, [myId]);

  async function fetchCrisisStatus() {
    const { data } = await supabase.from('barangays').select('is_in_crisis, crisis_type').eq('id', myId).maybeSingle();
    if (data) setCrisisData(data);
  }

  async function toggleCrisis(type = null) {
    setActing(true);
    const active = type !== null;
    const { error } = await supabase.from('barangays').update({
      is_in_crisis: active,
      crisis_type: type,
      crisis_started_at: active ? new Date().toISOString() : null
    }).eq('id', myId);

    if (!error) {
      if (active) {
        await logLedgerAction({
          actionType: 'EMERGENCY_SOS',
          targetId: myId,
          targetName: displayName,
          details: `Distress signal activated: ${type}`,
          metadata: { crisis_type: type, location_id: myId }
        });
      }

      setCrisisData({ is_in_crisis: active, crisis_type: type });
      setShowCrisisModal(false);
    }
    setActing(false);
  }

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Dashboard</h1>
            {crisisData.is_in_crisis && (
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Active Signal: {crisisData.crisis_type}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {crisisData.is_in_crisis ? (
              <button 
                onClick={() => toggleCrisis(null)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-600 transition-all shadow-sm"
              >
                <CheckCircle2 size={14} /> Mark as Controlled
              </button>
            ) : (
              <button 
                onClick={() => setShowCrisisModal(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-100"
              >
                <AlertTriangle size={14} /> Signal Emergency
              </button>
            )}
            
            <button onClick={() => setCalendarOpen(true)}
              className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <CalendarDays size={18} />
            </button>
            <BarangayNotificationBell />
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-medium text-[#333] flex items-center gap-1" style={{ fontFamily: 'DM Sans' }}>
                {profileLoading ? '…' : displayName}
                {isVerified && <BadgeCheck size={16} className="text-blue-500 fill-blue-50" />}
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

        {/* Crisis Signal Modal */}
        {showCrisisModal && (
          <Modal isOpen={true} onClose={() => setShowCrisisModal(false)} title="Signal Emergency" width="md">
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3">
                <AlertTriangle className="text-red-600 shrink-0" size={20} />
                <p className="text-xs text-red-900 leading-relaxed font-medium">
                  Select a crisis type to broadcast a distress signal. This will be visible to all Donors and Foodbanks on their maps to prioritize aid to your community.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: 'Fire', icon: <Flame className="text-red-500" />, desc: 'Structural or wildfire in the community' },
                  { id: 'Flood', icon: <Waves className="text-blue-500" />, desc: 'Rising waters due to storm or overflow' },
                  { id: 'Calamity', icon: <AlertTriangle className="text-orange-500" />, desc: 'General disaster requiring immediate aid' }
                ].map(type => (
                  <button 
                    key={type.id}
                    onClick={() => toggleCrisis(type.id)}
                    disabled={acting}
                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-red-500 hover:bg-red-50/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {type.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{type.id}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{type.desc}</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-red-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <Button variant="ghost" onClick={() => setShowCrisisModal(false)} className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Cancel / Safe
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
