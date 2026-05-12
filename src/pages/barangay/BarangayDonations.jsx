import { useState, useEffect, useRef } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import BarangayNotificationBell from '../../components/barangay/BarangayNotificationBell';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';
import { Package, CheckCircle, Clock, RotateCcw, Camera, Image as ImageIcon, X, Send, ChevronRight, MessageSquare } from 'lucide-react';
import { logLedgerAction } from '../../utils/ledger';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import LogisticProgressBar from '../../components/LogisticProgressBar';
import VerifiedBadge from '../../components/VerifiedBadge';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const TABS = [
  { key: 'pending', label: 'Incoming' },
  { key: 'received', label: 'To Distribute' },
  { key: 'distributed', label: 'History' },
];

function ConfirmDistributionModal({ dist, onClose, onConfirm }) {
  const [description, setDescription] = useState('');
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      alert("Maximum 3 images allowed");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { file, url: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImg = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!description.trim() || images.length === 0) {
      alert("Please provide a description and at least one photo as proof.");
      return;
    }
    setUploading(true);
    const imageUrls = images.map(img => img.url);
    await onConfirm({
      proof_description: description,
      proof_images: imageUrls,
      distributed_at: new Date(distributionDate).toISOString()
    });
    setUploading(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Confirm Distribution" width="lg">
      <div className="space-y-3.5">
        <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex gap-3 items-center">
          <Camera className="text-blue-500" size={16} />
          <p className="text-[11px] font-bold text-blue-800 leading-tight">Please upload 1-3 photos showing the distribution to community members.</p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Distribution Date</label>
            <input
              type="date"
              value={distributionDate}
              onChange={e => setDistributionDate(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-[#FE9800] transition-all font-bold"
            />
          </div>
          <div className="col-span-7">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Items Summary</label>
            <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 line-clamp-1">
              {dist.items}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Impact Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the distribution impact..."
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs min-h-[80px] max-h-[120px] outline-none focus:border-[#FE9800] transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Proof Photos (Max 3)</label>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-2xl border border-gray-100 overflow-hidden relative group shadow-sm">
                <img src={img.url} className="w-full h-full object-cover" />
                <button onClick={() => removeImg(i)} className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-[#FE9800] hover:text-[#FE9800] hover:bg-orange-50/30 transition-all group"
              >
                <Camera size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Add Photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="pt-3 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={uploading} className="flex-[1.5] h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest" icon={<Send size={14} />}>
            {uploading ? 'Confirming...' : 'Complete Distribution'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AidCard({ dist, onConfirmReceived, onConfirmDistributed, onShowProof }) {
  const [acting, setActing] = useState(false);
  const isPending = dist.status === 'pending';
  const isReceived = dist.status === 'received';
  const isDistributed = dist.status === 'distributed';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-[#FE9800]/30 transition-all duration-300">
      {isDistributed && (
        <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-[27px] right-[-35px] bg-green-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 w-44 text-center rotate-45 shadow-sm border-b border-white/10">
            Distributed
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${isPending ? 'bg-[#FFF3DC] text-[#FE9800]' :
              isReceived ? 'bg-blue-50 text-blue-500' :
                'bg-green-50 text-green-500'
            }`}>
            {isPending ? <Clock size={20} /> : isReceived ? <Package size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-[#1A1A1A] leading-tight">{dist.foodbank_name || 'Foodbank'}</p>
              <VerifiedBadge isVerified={dist.foodbank_verified} size={14} />
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Origin: Foodbank</p>
          </div>
        </div>
        {!isDistributed && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${isPending ? 'bg-[#FFF3DC] text-[#C97700]' : 'bg-blue-50 text-blue-600'
            }`}>
            {isPending ? 'Incoming' : 'In Stock'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1">Items Included</p>
          <p className="text-sm text-[#1A1A1A] font-medium leading-relaxed">{dist.items}</p>
        </div>
      </div>

      <div className="py-4 border-y border-gray-50">
        <LogisticProgressBar
          status={
            isDistributed ? 'distributed' :
              isReceived ? 'at_barangay' :
                dist.status === 'pending' ? 'at_fb' : 'pending_fb'
          }
          onShowProof={() => isDistributed && onShowProof && onShowProof(dist)}
        />
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          {isDistributed ? `Distributed: ${fmt(dist.distributed_at)}` : `Sent: ${fmt(dist.created_at)}`}
        </p>

        {isPending && (
          <button
            onClick={async () => { setActing(true); await onConfirmReceived(); setActing(false); }}
            disabled={acting}
            className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-green-200">
            <CheckCircle size={14} /> Mark as Received
          </button>
        )}

        {isReceived && (
          <button
            onClick={() => onConfirmDistributed()}
            className="px-4 py-2 rounded-xl bg-[#FE9800] text-white text-xs font-bold hover:bg-[#e58a00] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm shadow-orange-200">
            <ImageIcon size={14} /> Mark as Distributed
          </button>
        )}
      </div>
    </div>
  );
}

export default function BarangayDonations() {
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('pending');
  const [dists, setDists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(null);
  const [viewingProof, setViewingProof] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch distributions assigned to this barangay
      // We check both the direct ID and potential profile matches
      const { data, error } = await supabase
        .from('distributions')
        .select(`
          *,
          foodbank:profiles!foodbank_id(is_verified),
          donation_packages!package_id(
            id, name, status,
            package_items(item_name, quantity, unit)
          )
        `)
        .eq('barangay_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDists((data || []).map(d => ({
        ...d,
        foodbank_verified: (Array.isArray(d.foodbank) ? d.foodbank[0]?.is_verified : d.foodbank?.is_verified) || false
      })));
    } catch (err) {
      console.error("Error loading barangay distributions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const confirmReceived = async (dist) => {
    try {
      await supabase.from('distributions').update({
        status: 'received',
        updated_at: new Date().toISOString()
      }).eq('id', dist.id);

      if (dist.package_id) {
        await supabase.from('donation_packages').update({ status: 'at_barangay' }).eq('id', dist.package_id);
      }

      await logLedgerAction({
        actionType: 'BARANGAY_ACCEPT',
        targetId: dist.foodbank_id,
        targetName: dist.foodbank_name || 'Foodbank',
        details: `Verified receipt of aid package: ${dist.items}`,
        metadata: { distribution_id: dist.id, items: dist.items }
      });

      await load();
    } catch (err) { console.error(err); }
  };

  const confirmDistributed = async (payload) => {
    if (!distributing) return;
    try {
      // 1. Update the distribution record
      await supabase.from('distributions').update({
        status: 'distributed',
        distributed_at: new Date().toISOString(),
        ...payload
      }).eq('id', distributing.id);

      // 2. Update the package status
      if (distributing.package_id) {
        await supabase.from('donation_packages').update({ status: 'donated' }).eq('id', distributing.package_id);
      }

      await logLedgerAction({
        actionType: 'BARANGAY_DISTRIBUTE',
        targetId: distributing.id,
        targetName: 'Community Distribution',
        details: `Final distribution completed: ${distributing.items}`,
        metadata: { 
          distribution_id: distributing.id, 
          items: distributing.items,
          proof_description: payload.proof_description,
          proof_url: payload.proof_images?.[0] // Log first image as main proof
        }
      });

      setDistributing(null);
      await load();
    } catch (err) { console.error(err); }
  };

  const filtered = dists.filter(d => {
    if (activeTab === 'pending') return d.status === 'pending';
    if (activeTab === 'received') return d.status === 'received';
    if (activeTab === 'distributed') return d.status === 'distributed';
    return false;
  });

  const incomingCount = dists.filter(d => d.status === 'pending').length;
  const stockCount = dists.filter(d => d.status === 'received').length;
  const toDistributeCount = dists.filter(d => d.status === 'received').length;

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-[#FE9800]" />
            <h1 className="text-[20px] font-black text-[#1A1A1A] uppercase tracking-tighter">Logistic Hub</h1>
          </div>
          <div className="flex items-center gap-2">
            <BarangayNotificationBell />
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
            <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
              {TABS.map(({ key, label }) => {
                const count = key === 'pending' ? incomingCount : key === 'received' ? toDistributeCount : 0;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                      ${activeTab === key ? 'bg-white text-[#FE9800] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    {label}
                    {count > 0 && <span className="ml-2 bg-[#FE9800] text-white px-2 py-0.5 rounded-full text-[10px]">{count}</span>}
                  </button>
                );
              })}
            </div>
            <button onClick={load} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#888] hover:text-[#FE9800] transition-colors">
              <RotateCcw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {[1, 2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
                <Package size={32} className="text-gray-200" />
              </div>
              <h3 className="text-lg font-black text-gray-400 uppercase tracking-tight">
                {activeTab === 'pending' ? 'No Incoming Aid' :
                  activeTab === 'received' ? 'Reserve Empty' : 'No History Recorded'}
              </h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs text-center leading-relaxed">
                {activeTab === 'pending' ? 'You have no incoming food aid packages from the Foodbank at this moment.' :
                  activeTab === 'received' ? 'You have distributed all items in your stock. Ready for the next batch!' : 'Distribution records and proof of impact will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {filtered.map(d => (
                <AidCard
                  key={d.id}
                  dist={d}
                  onConfirmReceived={() => confirmReceived(d)}
                  onConfirmDistributed={() => setDistributing(d)}
                  onShowProof={(p) => setViewingProof(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {distributing && <ConfirmDistributionModal dist={distributing} onClose={() => setDistributing(null)} onConfirm={confirmDistributed} />}

      {viewingProof && (
        <Modal isOpen={true} onClose={() => setViewingProof(null)} title="Journey Log" width="lg">
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
                <p className="text-xs font-bold uppercase tracking-wider">Distribution Feedback</p>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">"{viewingProof.proof_description}"</p>
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distributed on {fmt(viewingProof.distributed_at)}</p>
                <div className="flex items-center gap-1.5 text-green-500 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Verified Journey</span>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={() => setViewingProof(null)} className="w-full h-12 rounded-2xl">Close Details</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
