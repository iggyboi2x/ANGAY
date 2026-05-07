import { useState, useEffect, useRef } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import BarangayNotificationBell from '../../components/barangay/BarangayNotificationBell';
import { useProfile } from '../../hooks/useProfile';
import { supabase } from '../../../supabase';
import { Package, CheckCircle, Clock, RotateCcw, Camera, Image as ImageIcon, X, Send, ChevronRight } from 'lucide-react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import LogisticProgressBar from '../../components/LogisticProgressBar';

const fmt = d => d ? new Date(d).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }) : '—';

const TABS = [
  { key: 'pending',     label: 'Incoming'  },
  { key: 'received',    label: 'To Distribute' },
  { key: 'distributed', label: 'History' },
];

function ConfirmDistributionModal({ dist, onClose, onConfirm }) {
  const [description, setDescription] = useState('');
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
    
    // In a real app, we'd upload to Supabase Storage. For this demo, we'll store the base64 or just URLs
    const imageUrls = images.map(img => img.url); 
    
    await onConfirm({
      proof_description: description,
      proof_images: imageUrls,
      distributed_at: new Date().toISOString()
    });
    setUploading(false);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Confirm Distribution" width="lg">
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
          <Camera className="text-blue-500 mt-1" size={18} />
          <div>
            <p className="text-sm font-bold text-blue-900">Proof of Distribution</p>
            <p className="text-xs text-blue-700 mt-0.5">Please upload 1-3 photos showing the items being distributed to your community members.</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the distribution (e.g. distributed to 50 households in Sitio Maligaya)"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[100px] outline-none focus:border-[#FE9800] transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Photos (Max 3)</label>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl border border-gray-100 overflow-hidden relative group">
                <img src={img.url} className="w-full h-full object-cover" />
                <button onClick={() => removeImg(i)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button 
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#FE9800] hover:text-[#FE9800] transition-all"
              >
                <Camera size={24} />
                <span className="text-[10px] font-bold uppercase">Add Photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="pt-4 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={uploading} className="flex-1" icon={<Send size={16} />}>
            {uploading ? 'Confirming...' : 'Complete Distribution'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AidCard({ dist, onConfirmReceived, onConfirmDistributed }) {
  const [acting, setActing] = useState(false);
  const isPending = dist.status === 'pending';
  const isReceived = dist.status === 'received';
  const isDistributed = dist.status === 'distributed';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-[#FE9800]/30 transition-all duration-300">
      {isDistributed && (
        <div className="absolute -right-8 top-4 rotate-45 bg-green-500 text-white px-10 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm">
          Distributed
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isPending ? 'bg-[#FFF3DC] text-[#FE9800]' : 
            isReceived ? 'bg-blue-50 text-blue-500' : 
            'bg-green-50 text-green-500'
          }`}>
            {isPending ? <Clock size={20} /> : isReceived ? <Package size={20} /> : <CheckCircle size={20} />}
          </div>
          <div>
            <p className="text-base font-bold text-[#1A1A1A] leading-tight">{dist.foodbank_name || 'Foodbank'}</p>
            <p className="text-[11px] text-gray-400 font-medium">Origin: Foodbank</p>
          </div>
        </div>
        {!isDistributed && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
            isPending ? 'bg-[#FFF3DC] text-[#C97700]' : 'bg-blue-50 text-blue-600'
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
        
        {dist.notes && (
          <div className="flex gap-2 items-start px-1">
            <span className="text-[10px] font-black uppercase text-gray-300 mt-0.5">Notes:</span>
            <p className="text-xs text-gray-500 leading-tight">{dist.notes}</p>
          </div>
        )}
      </div>

      {/* Progress Bar integration */}
      <div className="py-2 border-y border-gray-50">
        <LogisticProgressBar 
          status={
            isDistributed ? 'distributed' : 
            isReceived ? 'at_barangay' : 
            dist.status === 'pending' ? 'at_fb' : 'pending_fb'
          } 
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

        {isDistributed && dist.proof_images?.length > 0 && (
          <div className="flex -space-x-2">
            {dist.proof_images.slice(0, 3).map((img, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden shadow-sm">
                <img src={img} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BarangayDonations() {
  const { displayName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('pending');
  const [dists, setDists]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [distributing, setDistributing] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Direct query using user.id as barangay_id
    const { data, error } = await supabase
      .from('distributions')
      .select('*')
      .eq('barangay_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error loading distributions:", error.message);
    }
    
    setDists(data || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const confirmReceived = async (dist) => {
    // 1. Update distribution status
    await supabase.from('distributions')
      .update({ status: 'received', updated_at: new Date().toISOString() })
      .eq('id', dist.id);
    
    // NOTE: We no longer mark the package as 'donated' automatically here
    // to guarantee that history only shows actually distributed items.

    // 2. Notify the foodbank
    await supabase.from('notifications').insert({
      user_id: dist.foodbank_id,
      title: 'Aid Package Received',
      body: `${displayName || 'A barangay'} has received the aid package. It is now awaiting distribution.`,
      is_read: false
    });

    await load();
  };

  const confirmDistributed = async (payload) => {
    if (!distributing) return;
    
    // 1. Update distribution status with proof
    const { error: dErr } = await supabase.from('distributions')
      .update({ 
        status: 'distributed', 
        ...payload,
        updated_at: new Date().toISOString() 
      })
      .eq('id', distributing.id);

    if (dErr) {
      alert("Error updating distribution: " + dErr.message);
      return;
    }
    
    // 2. Mark the package as 'donated' ONLY now
    if (distributing.package_id) {
      await supabase.from('donation_packages')
        .update({ status: 'donated', updated_at: new Date().toISOString() })
        .eq('id', distributing.package_id);
    }

    // 3. Notify the foodbank and Donor (if original_donation_id exists)
    // First, find the donor_id if possible
    let donorId = null;
    if (distributing.package_id) {
      const { data: pkg } = await supabase.from('donation_packages').select('original_donation_id').eq('id', distributing.package_id).single();
      if (pkg?.original_donation_id) {
        const { data: don } = await supabase.from('donations').select('donor_id').eq('id', pkg.original_donation_id).single();
        donorId = don?.donor_id;
      }
    }

    const notifications = [
      {
        user_id: distributing.foodbank_id,
        title: 'Package Distributed!',
        body: `Your food aid has been distributed by ${displayName}. Proof of distribution is now available.`,
        is_read: false
      }
    ];

    if (donorId) {
      notifications.push({
        user_id: donorId,
        title: 'Donation Distributed!',
        body: `Great news! Your donation has reached its destination and was distributed by ${displayName}.`,
        is_read: false
      });
    }

    await supabase.from('notifications').insert(notifications);

    setDistributing(null);
    await load();
  };

  const filtered   = dists.filter(d => d.status === activeTab);
  const incomingCount = dists.filter(d => d.status === 'pending').length;
  const toDistributeCount = dists.filter(d => d.status === 'received').length;

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-[#F0F0F0] flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-[#FE9800]" />
            <h1 className="text-[20px] font-black text-[#1A1A1A] uppercase tracking-tighter" style={{ fontFamily: 'DM Sans' }}>Logistic Hub</h1>
          </div>
          <div className="flex items-center gap-2">
            <BarangayNotificationBell />
            <div className="flex items-center gap-2.5 ml-2">
              <span className="text-sm font-bold text-[#333]" style={{ fontFamily: 'DM Sans' }}>
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
          {/* Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
              {TABS.map(({ key, label }) => {
                const count = key === 'pending' ? incomingCount : key === 'received' ? toDistributeCount : 0;
                return (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                      ${activeTab === key
                        ? 'bg-white text-[#FE9800] shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                    style={{ fontFamily: 'DM Sans' }}>
                    {label}
                    {count > 0 && (
                      <span className="ml-2 bg-[#FE9800] text-white px-2 py-0.5 rounded-full text-[10px]">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={load} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#888] hover:text-[#FE9800] transition-colors">
              <RotateCcw size={14} /> Refresh System
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6">
              {[1,2].map(i => <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[3rem]">
              <Package size={48} className="mb-4 text-gray-100" />
              <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">
                {activeTab === 'pending' ? 'No incoming food aid' : activeTab === 'received' ? 'Inventory clear' : 'History empty'}
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {distributing && (
        <ConfirmDistributionModal 
          dist={distributing} 
          onClose={() => setDistributing(null)} 
          onConfirm={confirmDistributed}
        />
      )}
    </div>
  );
}
