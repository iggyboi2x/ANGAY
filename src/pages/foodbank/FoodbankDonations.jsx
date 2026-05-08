import { useState, useEffect } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';
import {
  Gift, Clock, CheckCircle, XCircle, Bell, Search,
  RotateCcw, Plus, X, ChevronDown, Send, MessageSquare, MapPin, CheckCircle2
} from 'lucide-react';
import LogisticProgressBar from '../../components/LogisticProgressBar';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import SendFoodAidModal from '../../components/foodbank/SendFoodAidModal';
import NotificationBell from '../../components/foodbank/NotificationBell';
import AcceptDonationModal from '../../components/foodbank/AcceptDonationModal';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const STATUS_STYLE = {
  pending: { bg: 'bg-[#FFF3DC]', text: 'text-[#C97700]', label: 'Pending' },
  accepted: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Accepted' },
  completed: { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed' },
  rejected: { bg: 'bg-red-50', text: 'text-red-500', label: 'Rejected' },
  received: { bg: 'bg-green-50', text: 'text-green-600', label: 'Received' },
};

const DONOR_TABS = [
  { key: 'pending', label: 'Incoming' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'History' },
  { key: 'rejected', label: 'Rejected' },
];

const DIST_TABS = [
  { key: 'pending', label: 'Sent' },
  { key: 'received', label: 'Received' },
  { key: 'distributed', label: 'Distributed' },
];

function computeStatus(expDate) {
  if (!expDate) return 'fresh';
  const d = new Date(expDate);
  const now = new Date();
  const days = Math.ceil((d - now) / 86400000);
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'fresh';
}

// ─── Donor Card Component ─────────────────────────────────────────────────────
function DonorCard({ donation, onAccept, onReject, onComplete, onShowProof }) {
  const [acting, setActing] = useState(false);
  const act = async fn => { setActing(true); await fn(); setActing(false); };
  const s = STATUS_STYLE[donation.status] || STATUS_STYLE.pending;
  const isDirect = !!donation.barangay_name;

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-7 flex flex-col gap-4 group hover:border-[#FE9800]/30 transition-all duration-300 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFF3DC] flex items-center justify-center shrink-0 shadow-sm">
            <Gift size={20} className="text-[#FE9800]" />
          </div>
          <div>
            <p className="text-base font-bold text-[#1A1A1A] leading-tight">{donation.donor_name || 'Donor'}</p>
            <p className="text-[11px] text-gray-400 font-medium">Verified Donor</p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1.5">Items Sent</p>
          <p className="text-sm text-[#1A1A1A] font-semibold leading-relaxed">{donation.items}</p>
        </div>

        {isDirect && (
          <div className="px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#FE9800]" />
              <span className="text-xs font-bold text-orange-900">Destination: {donation.barangay_name}</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-orange-400 bg-white px-2 py-0.5 rounded-full border border-orange-100 shadow-sm">Direct Donation</span>
          </div>
        )}
      </div>

      {/* Progress Tracker for Direct Donations */}
      {isDirect && donation.status !== 'rejected' && (
        <div className="py-2 border-y border-gray-50">
          <LogisticProgressBar
            status={donation.logisticStatus}
            onShowProof={onShowProof}
          />
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
          Scheduled: {fmt(donation.scheduled_date)} · {fmt(donation.created_at)}
        </p>

        {donation.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={() => act(onReject)} disabled={acting}
              className="px-4 py-2 rounded-xl border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-wider hover:bg-red-50 active:scale-95 transition-all">
              Decline
            </button>
            <button onClick={() => act(onAccept)} disabled={acting}
              className="px-6 py-2 rounded-xl bg-[#FE9800] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#e58a00] active:scale-95 transition-all shadow-sm shadow-orange-100">
              Accept
            </button>
          </div>
        )}
        {donation.status === 'accepted' && (
          <button onClick={() => act(onComplete)} disabled={acting}
            className="px-6 py-2 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-green-600 active:scale-95 transition-all shadow-sm shadow-green-100">
            Verify & Receive
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Distribution Card Component ──────────────────────────────────────────────
function DistCard({ dist, onShowProof }) {
  const s = STATUS_STYLE[dist.status] || STATUS_STYLE.pending;
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-7 flex flex-col gap-4 hover:border-blue-200 transition-all duration-300 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Send size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-base font-bold text-[#1A1A1A] leading-tight">{dist.barangay_name || 'Barangay'}</p>
            <p className="text-[11px] text-gray-400 font-medium">Target Barangay</p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1.5">Aid Package Details</p>
        <p className="text-sm text-[#1A1A1A] font-semibold leading-relaxed">{dist.items}</p>
      </div>

      <div className="py-2 border-y border-gray-50">
        <LogisticProgressBar
          status={dist.status === 'distributed' ? 'distributed' : dist.status === 'received' ? 'at_barangay' : 'at_fb'}
          onShowProof={() => dist.status === 'distributed' && onShowProof(dist)}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
          Sent: {fmt(dist.created_at)}
        </p>
        {dist.status === 'distributed' && (
          <button onClick={() => onShowProof(dist)} className="text-[10px] font-black uppercase text-blue-500 hover:underline">
            View Distribution Proof
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Foodbank Donations Page ─────────────────────────────────────────────
export default function FoodbankDonations() {
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [section, setSection] = useState('donors');
  const [donorTab, setDonorTab] = useState('pending');
  const [distTab, setDistTab] = useState('pending');
  const [donations, setDonations] = useState([]);
  const [dists, setDists] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [acceptingDonation, setAcceptingDonation] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: don }, { data: dis }, { data: bays }, { data: pkgs }] = await Promise.all([
      supabase.from('donations').select(`
        *,
        donation_packages!original_donation_id(
          *,
          distributions!package_id(*)
        )
      `).eq('foodbank_id', user.id).order('created_at', { ascending: false }),
      supabase.from('distributions').select('*').eq('foodbank_id', user.id).order('created_at', { ascending: false }),
      supabase.from('barangays').select('id, barangay_name').not('latitude', 'is', null),
      supabase.from('donation_packages').select('*, package_items(*)').eq('foodbank_id', user.id).eq('status', 'available'),
    ]);

    const mappedDonations = (don || []).map(d => {
      const pkg = d.donation_packages?.[0];
      const dist = pkg?.distributions?.[0];

      let logisticStatus = 'pending_fb';
      if (d.status === 'completed') logisticStatus = 'at_fb';
      if (dist?.status === 'received') logisticStatus = 'at_barangay';
      if (dist?.status === 'distributed') logisticStatus = 'distributed';

      return {
        ...d,
        logisticStatus,
        proof: dist?.status === 'distributed' ? dist : null
      };
    });

    setDonations(mappedDonations);
    setDists(dis || []);
    setBarangays(bays || []);
    setPackages(pkgs || []);
    setLoading(false);
  };

  useEffect(() => { void loadAll(); }, []);

  const updateDonation = async (id, status, inventoryItems = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: donation } = await supabase.from('donations').select('*').eq('id', id).single();

      await supabase.from('donations').update({ status, updated_at: new Date().toISOString() }).eq('id', id);

      if (status === 'completed' && inventoryItems && user) {
        if (donation.barangay_name) {
          const pkgName = `Direct Donation: ${donation.items.substring(0, 30)}...`;
          const { data: pkg } = await supabase.from('donation_packages').insert([{
            name: pkgName, foodbank_id: user.id, status: 'available', original_donation_id: donation.id
          }]).select().single();

          const pkgItems = inventoryItems.map(item => ({
            package_id: pkg.id, item_name: item.item_name, quantity: Number(item.quantity), unit: item.unit || 'pcs'
          }));
          await supabase.from('package_items').insert(pkgItems);
        } else {
          const rows = inventoryItems.map(item => ({
            foodbank_id: user.id,
            item_name: item.item_name,
            category_id: item.category_id || null,
            quantity: Number(item.quantity),
            unit: item.unit || 'pcs',
            expiration_date: item.expiration_date || null,
            status: computeStatus(item.expiration_date),
            source_donation_id: donation.id // NEW: Track the source
          }));
          await supabase.from('foodbank_inventory').insert(rows);
        }
      }

      if (donation?.donor_id) {
        const label = status === 'accepted' ? 'Accepted' : status === 'rejected' ? 'Declined' : 'Received';
        await supabase.from('notifications').insert({
          user_id: donation.donor_id,
          title: `Donation ${label}`,
          body: `Your donation of ${donation.items} has been ${label.toLowerCase()} by ${donation.foodbank_name}.`,
          is_read: false
        });
      }
      await loadAll();
    } catch (err) { console.error(err); }
  };

  const handleConfirmAccept = async (items) => {
    if (!acceptingDonation) return;
    await updateDonation(acceptingDonation.id, 'completed', items);
    setAcceptingDonation(null);
  };

  const handleSend = async (form) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Auth required' };
    const bay = barangays.find(b => b.id === form.barangay_id);
    const { error } = await supabase.from('distributions').insert({
      foodbank_id: user.id, barangay_id: form.barangay_id, foodbank_name: displayName,
      barangay_name: bay?.barangay_name || '', items: form.items, notes: form.notes || null,
      scheduled_date: form.scheduled_date, status: 'pending', package_id: form.package_id || null
    });
    if (error) return { error: error.message };

    // Automatically send a Message Box to the Barangay chat
    try {
      const recipientUserId = form.barangay_id;
      if (user.id && recipientUserId) {
        // Find or create room
        const { data: myRooms } = await supabase.from('room_members').select('room_id').eq('user_id', user.id);
        const { data: theirRooms } = await supabase.from('room_members').select('room_id').eq('user_id', recipientUserId);

        const myIds = new Set((myRooms || []).map(r => r.room_id));
        let roomId = (theirRooms || []).find(r => myIds.has(r.room_id))?.room_id;

        if (!roomId) {
          const { data: newRoom } = await supabase.from('rooms').insert([{ name: `${bay?.barangay_name || "Barangay"}__auth__${recipientUserId}` }]).select().single();
          if (newRoom) {
            roomId = newRoom.id;
            await supabase.from('room_members').insert([
              { room_id: roomId, user_id: user.id },
              { room_id: roomId, user_id: recipientUserId }
            ]);
          }
        }

        if (roomId) {
          const messageContent = `🚚 AID PACKAGE DISPATCHED\n\nItems: ${form.items}\nExpected Arrival: ${fmt(form.scheduled_date)}\n\nHello! We have dispatched an aid package to your barangay. Please coordinate with us for the turnover.`;
          await supabase.from('messages').insert({
            room_id: roomId,
            user_id: user.id,
            content: messageContent
          });
        }
      }
    } catch (msgErr) {
      console.error("Auto-message error:", msgErr);
    }

    if (form.package_id) await supabase.from('donation_packages').update({ status: 'pending' }).eq('id', form.package_id);
    setShowModal(false);
    await loadAll();
    return { success: true };
  };

  const pendingDonorsCount = donations.filter(d => d.status === 'pending').length;
  const filteredDonations = donations.filter(d => d.status === donorTab);
  const filteredDists = dists.filter(d => d.status === distTab);

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />
      <div className="ml-60 flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB] w-72">
            <Search size={14} className="text-[#888888]" />
            <input type="text" placeholder="Search tracking data…" className="bg-transparent text-sm outline-none w-full placeholder:text-[#AAAAAA]" />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-bold text-[#333]">{profileLoading ? '…' : displayName}</span>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover border-2 border-[#FE9800]" />
                : <div className="w-9 h-9 rounded-full bg-[#FE9800] text-white text-sm font-bold flex items-center justify-center">{profileLoading ? '…' : initials}</div>
              }
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[24px] font-black text-[#1A1A1A] uppercase tracking-tighter">Logistic Hub</h1>
            <button onClick={loadAll} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#888] hover:text-[#FE9800] transition-colors">
              <RotateCcw size={14} /> Refresh Tracker
            </button>
          </div>

          <div className="flex gap-1.5 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
            {[['donors', 'Incoming Aid'], ['barangays', 'Aid Dispatched']].map(([key, label]) => (
              <button key={key} onClick={() => setSection(key)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                  ${section === key ? 'bg-white text-[#FE9800] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {label}
                {key === 'donors' && pendingDonorsCount > 0 && (
                  <span className="ml-2 bg-[#FE9800] text-white px-2 py-0.5 rounded-full text-[10px]">{pendingDonorsCount}</span>
                )}
              </button>
            ))}
          </div>

          {section === 'donors' ? (
            <>
              <div className="flex gap-2 mb-8">
                {DONOR_TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setDonorTab(key)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border
                      ${donorTab === key ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-[#FE9800]'}`}>
                    {label}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-6">{[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}</div>
              ) : filteredDonations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[3rem]">
                  <Gift size={48} className="mb-4 text-gray-100" />
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No donor activity</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {filteredDonations.map(d => (
                    <DonorCard key={d.id} donation={d}
                      onAccept={() => updateDonation(d.id, 'accepted')}
                      onReject={() => updateDonation(d.id, 'rejected')}
                      onComplete={() => setAcceptingDonation(d)}
                      onShowProof={() => setViewingProof(d.proof)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  {DIST_TABS.map(({ key, label }) => (
                    <button key={key} onClick={() => setDistTab(key)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border
                        ${distTab === key ? 'bg-[#FE9800] text-white border-[#FE9800] shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-[#FE9800]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#FE9800] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#e58a00] transition-all shadow-lg shadow-orange-100">
                  <Plus size={16} /> Send Aid
                </button>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-6">{[1, 2].map(i => <div key={i} className="h-64 bg-gray-50 rounded-[2.5rem] animate-pulse" />)}</div>
              ) : filteredDists.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[3rem]">
                  <Send size={48} className="mb-4 text-gray-100" />
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No dispatched aid</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {filteredDists.map(d => <DistCard key={d.id} dist={d} onShowProof={(dist) => setViewingProof(dist)} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showModal && <SendFoodAidModal barangays={barangays} packages={packages} onClose={() => setShowModal(false)} onSubmit={handleSend} />}
      {acceptingDonation && (
        <AcceptDonationModal donation={acceptingDonation} onClose={() => setAcceptingDonation(null)} onConfirm={handleConfirmAccept} />
      )}
      {viewingProof && (
        <Modal isOpen={true} onClose={() => setViewingProof(null)} title="Journey Verified" width="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {viewingProof.proof_images?.map((img, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-[#FE9800]">
                <MessageSquare size={16} />
                <p className="text-xs font-bold uppercase tracking-wider">Barangay Feedback</p>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">"{viewingProof.proof_description}"</p>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distributed on {fmt(viewingProof.distributed_at)}</p>
                <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Verified Journey</span>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={() => setViewingProof(null)} className="w-full h-12 rounded-2xl">Close Journey Details</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
