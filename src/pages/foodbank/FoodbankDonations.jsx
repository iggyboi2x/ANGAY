import { useState, useEffect } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';
import {
  Gift, Clock, CheckCircle, XCircle, Bell, Search,
  RotateCcw, Plus, X, ChevronDown, Send
} from 'lucide-react';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) : '—';

const STATUS_STYLE = {
  pending:   { bg: 'bg-[#FFF3DC]', text: 'text-[#C97700]',  label: 'Pending'   },
  accepted:  { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'Accepted'  },
  completed: { bg: 'bg-green-50',  text: 'text-green-600',  label: 'Completed' },
  rejected:  { bg: 'bg-red-50',    text: 'text-red-500',    label: 'Rejected'  },
  received:  { bg: 'bg-green-50',  text: 'text-green-600',  label: 'Received'  },
};

const DONOR_TABS = [
  { key: 'pending',   label: 'Incoming'  },
  { key: 'accepted',  label: 'Accepted'  },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected',  label: 'Rejected'  },
];

const DIST_TABS = [
  { key: 'pending',  label: 'Sent'     },
  { key: 'received', label: 'Received' },
];

const inputCls = "w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20 transition-all";

// ─── Donor Donation Cards ─────────────────────────────────────────────────────
function DonorCard({ donation, onAccept, onReject, onComplete }) {
  const [acting, setActing] = useState(false);
  const act = async fn => { setActing(true); await fn(); setActing(false); };
  const s = STATUS_STYLE[donation.status] || STATUS_STYLE.pending;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3DC] flex items-center justify-center shrink-0">
            <Gift size={15} className="text-[#FE9800]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">{donation.donor_name || 'Donor'}</p>
            <p className="text-[11px] text-gray-400">Donor</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>
      <p className="text-sm text-[#555]"><span className="text-[#888]">Items: </span>{donation.items}</p>
      {donation.notes && <p className="text-sm text-[#555]"><span className="text-[#888]">Notes: </span>{donation.notes}</p>}
      <p className="text-xs text-[#888]">Drop-off: {fmt(donation.scheduled_date)} · Submitted: {fmt(donation.created_at)}</p>

      {donation.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => act(onReject)} disabled={acting}
            className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
            <XCircle size={14} /> Decline
          </button>
          <button onClick={() => act(onAccept)} disabled={acting}
            className="flex-1 py-2 rounded-xl bg-[#FE9800] text-white text-sm font-semibold hover:bg-[#e58a00] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
            <CheckCircle size={14} /> Accept
          </button>
        </div>
      )}
      {donation.status === 'accepted' && (
        <button onClick={() => act(onComplete)} disabled={acting}
          className="w-full py-2 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5">
          <CheckCircle size={14} /> Mark as Received
        </button>
      )}
    </div>
  );
}

// ─── Distribution Cards ───────────────────────────────────────────────────────
function DistCard({ dist }) {
  const s = STATUS_STYLE[dist.status] || STATUS_STYLE.pending;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Send size={14} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1A1A1A]">{dist.barangay_name || 'Barangay'}</p>
            <p className="text-[11px] text-gray-400">Barangay</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>
      <p className="text-sm text-[#555]"><span className="text-[#888]">Items: </span>{dist.items}</p>
      {dist.notes && <p className="text-sm text-[#555]"><span className="text-[#888]">Notes: </span>{dist.notes}</p>}
      <p className="text-xs text-[#888]">Scheduled: {fmt(dist.scheduled_date)} · Sent: {fmt(dist.created_at)}</p>
    </div>
  );
}

// ─── Send to Barangay Modal ───────────────────────────────────────────────────
function SendModal({ barangays, onClose, onSubmit }) {
  const [form, setForm] = useState({ barangay_id: '', items: '', notes: '', scheduled_date: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.barangay_id || !form.items || !form.scheduled_date) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    const ok = await onSubmit(form);
    setLoading(false);
    if (!ok) setError('Failed to send. Please try again.');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FE9800] to-[#FBBF24]" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#1A1A1A]">Send Food Aid to Barangay</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          {error && <p className="text-xs text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Barangay *</label>
              <div className="relative">
                <select value={form.barangay_id} onChange={set('barangay_id')} className={inputCls + ' appearance-none pr-8'}>
                  <option value="">Select barangay…</option>
                  {barangays.map(b => <option key={b.id} value={b.id}>{b.barangay_name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Items *</label>
              <textarea value={form.items} onChange={set('items')} rows={3}
                placeholder="e.g. Rice 50kg, Canned goods 20pcs"
                className={inputCls + ' resize-none'} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Scheduled Date *</label>
              <input type="date" value={form.scheduled_date} onChange={set('scheduled_date')}
                min={new Date().toISOString().split('T')[0]} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notes <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                placeholder="Any special instructions…" className={inputCls + ' resize-none'} />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#FE9800] text-white text-sm font-semibold hover:bg-[#e58a00] disabled:opacity-60 transition-all">
              {loading ? 'Sending…' : 'Send Food Aid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FoodbankDonations() {
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [section, setSection]       = useState('donors');   // 'donors' | 'barangays'
  const [donorTab, setDonorTab]     = useState('pending');
  const [distTab, setDistTab]       = useState('pending');
  const [donations, setDonations]   = useState([]);
  const [dists, setDists]           = useState([]);
  const [barangays, setBarangays]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: don }, { data: dis }, { data: bays }] = await Promise.all([
      supabase.from('donations').select('*').eq('foodbank_id', user.id).order('created_at', { ascending: false }),
      supabase.from('distributions').select('*').eq('foodbank_id', user.id).order('created_at', { ascending: false }),
      supabase.from('barangays').select('id, barangay_name').not('latitude', 'is', null),
    ]);
    setDonations(don || []);
    setDists(dis || []);
    setBarangays(bays || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadAll(); }, []);

  const updateDonation = async (id, status) => {
    await supabase.from('donations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    await loadAll();
  };

  const handleSend = async (form) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const bay = barangays.find(b => b.id === form.barangay_id);
    const { error } = await supabase.from('distributions').insert({
      foodbank_id:   user.id,
      barangay_id:   form.barangay_id,
      foodbank_name: displayName,
      barangay_name: bay?.barangay_name || '',
      items:         form.items,
      notes:         form.notes || null,
      scheduled_date: form.scheduled_date,
      status:        'pending',
    });
    if (error) { console.error(error); return false; }
    setShowModal(false);
    await loadAll();
    return true;
  };

  const pendingDonors = donations.filter(d => d.status === 'pending').length;
  const filteredDonations = donations.filter(d => d.status === donorTab);
  const filteredDists     = dists.filter(d => d.status === distTab);

  const Avatar = () => avatarUrl
    ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
    : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">
        {profileLoading ? '…' : initials}
      </div>;

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-72">
            <Search size={14} className="text-[#888888]" />
            <input type="text" placeholder="Search donations…"
              className="bg-transparent text-sm outline-none w-full placeholder:text-[#AAAAAA]" />
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-[#888888] hover:text-[#FE9800] transition-colors">
              <Bell size={18} />
              {pendingDonors > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />}
            </button>
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-medium text-[#333]">{profileLoading ? '…' : displayName}</span>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
                : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">{profileLoading ? '…' : initials}</div>
              }
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-[22px] font-bold text-[#1A1A1A]">Donations</h1>
            <div className="flex items-center gap-3">
              <button onClick={loadAll} className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#FE9800] transition-colors">
                <RotateCcw size={13} /> Refresh
              </button>
            </div>
          </div>

          {/* Section toggle */}
          <div className="flex gap-1.5 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            {[['donors','From Donors'],['barangays','To Barangays']].map(([key, label]) => (
              <button key={key} onClick={() => setSection(key)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                  ${section === key ? 'bg-white text-[#FE9800] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
                {key === 'donors' && pendingDonors > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-[#FFF3DC] text-[#C97700]">{pendingDonors}</span>
                )}
              </button>
            ))}
          </div>

          {/* From Donors section */}
          {section === 'donors' && (
            <>
              <div className="flex gap-2 mb-6">
                {DONOR_TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setDonorTab(key)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all
                      ${donorTab === key ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-sm' : 'bg-white text-[#555] border-[#CCC] hover:border-[#FE9800] hover:text-[#FE9800]'}`}>
                    {label}
                    {key === 'pending' && pendingDonors > 0 && (
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${donorTab === key ? 'bg-white text-[#FE9800]' : 'bg-[#FFF3DC] text-[#C97700]'}`}>{pendingDonors}</span>
                    )}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-5">{[1,2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
              ) : filteredDonations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <Gift size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">No {donorTab} donations from donors.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {filteredDonations.map(d => (
                    <DonorCard key={d.id} donation={d}
                      onAccept={() => updateDonation(d.id, 'accepted')}
                      onReject={() => updateDonation(d.id, 'rejected')}
                      onComplete={() => updateDonation(d.id, 'completed')} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* To Barangays section */}
          {section === 'barangays' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  {DIST_TABS.map(({ key, label }) => (
                    <button key={key} onClick={() => setDistTab(key)}
                      className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all
                        ${distTab === key ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-sm' : 'bg-white text-[#555] border-[#CCC] hover:border-[#FE9800] hover:text-[#FE9800]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FE9800] text-white text-sm font-semibold rounded-xl hover:bg-[#e58a00] active:scale-[0.98] transition-all shadow-sm">
                  <Plus size={16} /> Send Food Aid
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-5">{[1,2].map(i => <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
              ) : filteredDists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <Send size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">No distributions yet.</p>
                  {distTab === 'pending' && (
                    <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-[#FE9800] font-semibold hover:underline">
                      Send your first food aid →
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-5">
                  {filteredDists.map(d => <DistCard key={d.id} dist={d} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && <SendModal barangays={barangays} onClose={() => setShowModal(false)} onSubmit={handleSend} />}
    </div>
  );
}
