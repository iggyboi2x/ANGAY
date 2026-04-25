import { useState, useEffect } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';
import { Package, CheckCircle, Clock, Bell, RotateCcw } from 'lucide-react';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) : '—';

const TABS = [
  { key: 'pending',  label: 'Incoming'  },
  { key: 'received', label: 'Received'  },
];

function AidCard({ dist, onConfirmReceived }) {
  const [acting, setActing] = useState(false);
  const isPending = dist.status === 'pending';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPending ? 'bg-[#FFF3DC]' : 'bg-green-50'}`}>
            {isPending
              ? <Clock size={15} className="text-[#FE9800]" />
              : <CheckCircle size={15} className="text-green-500" />}
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">{dist.foodbank_name || 'Foodbank'}</p>
            <p className="text-[11px] text-gray-400">Foodbank</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isPending ? 'bg-[#FFF3DC] text-[#C97700]' : 'bg-green-50 text-green-600'
        }`}>
          {isPending ? 'Incoming' : 'Received'}
        </span>
      </div>

      <p className="text-sm text-[#555]"><span className="text-[#888]">Items: </span>{dist.items}</p>
      {dist.notes && <p className="text-sm text-[#555]"><span className="text-[#888]">Notes: </span>{dist.notes}</p>}
      <p className="text-xs text-[#888]">Scheduled: {fmt(dist.scheduled_date)} · Sent: {fmt(dist.created_at)}</p>

      {isPending && (
        <button
          onClick={async () => { setActing(true); await onConfirmReceived(); setActing(false); }}
          disabled={acting}
          className="w-full py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
          <CheckCircle size={14} /> Confirm Receipt
        </button>
      )}
    </div>
  );
}

export default function BarangayDonations() {
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('pending');
  const [dists, setDists]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('distributions')
      .select('*')
      .eq('barangay_id', user.id)
      .order('created_at', { ascending: false });
    setDists(data || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const confirmReceived = async (id) => {
    await supabase.from('distributions')
      .update({ status: 'received', updated_at: new Date().toISOString() })
      .eq('id', id);
    await load();
  };

  const filtered   = dists.filter(d => d.status === activeTab);
  const incomingCount = dists.filter(d => d.status === 'pending').length;

  const Avatar = () => avatarUrl
    ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
    : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">
        {profileLoading ? '…' : initials}
      </div>;

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-[22px] font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Food Aid</h1>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <Bell size={18} />
              {incomingCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />}
            </button>
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-medium text-[#333]" style={{ fontFamily: 'DM Sans' }}>
                {profileLoading ? '…' : displayName}
              </span>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
                : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">{profileLoading ? '…' : initials}</div>
              }
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          {/* Info banner */}
          <div className="mb-6 px-4 py-3 bg-orange-50 border border-[#FE9800]/20 rounded-xl flex items-center gap-3">
            <Package size={18} className="text-[#FE9800] shrink-0" />
            <p className="text-sm text-[#b45309]" style={{ fontFamily: 'DM Sans' }}>
              This page shows food aid sent to your barangay by foodbanks. Confirm receipt when packages arrive.
            </p>
          </div>

          {/* Tabs + refresh */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {TABS.map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all
                    ${activeTab === key
                      ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-sm'
                      : 'bg-white text-[#555] border-[#CCC] hover:border-[#FE9800] hover:text-[#FE9800]'
                    }`}
                  style={{ fontFamily: 'DM Sans' }}>
                  {label}
                  {key === 'pending' && incomingCount > 0 && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                      ${activeTab === key ? 'bg-white text-[#FE9800]' : 'bg-[#FFF3DC] text-[#C97700]'}`}>
                      {incomingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={load} className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#FE9800] transition-colors">
              <RotateCcw size={13} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5">
              {[1,2].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Package size={40} className="mb-3 opacity-30" />
              <p className="text-sm" style={{ fontFamily: 'DM Sans' }}>
                {activeTab === 'pending' ? 'No incoming food aid yet.' : 'No received packages yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {filtered.map(d => (
                <AidCard key={d.id} dist={d} onConfirmReceived={() => confirmReceived(d.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
