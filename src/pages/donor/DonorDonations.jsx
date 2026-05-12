import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { 
  Package, Clock, CheckCircle, Gift, ArrowRight, X, Search, 
  Trash2, MessageSquare, CheckCircle2, ChevronRight, MapPin, LayoutGrid, List
} from "lucide-react";
import { supabase } from "../../../supabase";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import LogisticProgressBar from "../../components/LogisticProgressBar";
import VerifiedBadge from "../../components/VerifiedBadge";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_STYLE = {
  pending: { bg: "bg-[#FFF3DC]", text: "text-[#C97700]", label: "Pending" },
  accepted: { bg: "bg-blue-50", text: "text-blue-600", label: "Accepted" },
  completed: { bg: "bg-green-50", text: "text-green-600", label: "Completed" },
  rejected: { bg: "bg-red-50", text: "text-red-500", label: "Rejected" },
};

const TABS = [
  { key: "pending", label: "Requests" },
  { key: "accepted", label: "In Transit" },
  { key: "completed", label: "History" },
  { key: "rejected", label: "Cancelled" },
];

export default function DonorDonations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [filterType, setFilterType] = useState("all"); // all, direct, reserve
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewingProof, setViewingProof] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [viewingItem, setViewingItem] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        foodbank:profiles!foodbank_id(is_verified),
        donation_packages!original_donation_id(
          id, status, 
          distributions(status, distributed_at, proof_images, proof_description)
        ),
        impact_logs:package_items!source_donation_id(
          quantity, unit, item_name,
          donation_packages(
            name,
            distributions(
              status,
              barangay_name, 
              distributed_at,
              proof_images,
              proof_description
            )
          )
        )
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading donations:", error);
      setLoading(false);
      return;
    }

    setDonations((data || []).map(d => {
      const pkg = d.donation_packages?.[0];
      const dist = pkg?.distributions?.[0];
      const isDirect = !!d.barangay_name;
      const hasImpact = d.impact_logs?.length > 0;
      
      let logisticStatus = 'pending_fb'; 
      if (d.status === 'completed' || d.status === 'accepted') logisticStatus = 'at_fb';
      
      if (isDirect) {
        if (dist?.status === 'received') logisticStatus = 'at_barangay';
        if (dist?.status === 'distributed') logisticStatus = 'distributed';
      } else {
        // For Inventory: Only show distributed if at least one impact log exists
        if (hasImpact) logisticStatus = 'distributed';
      }

      return { 
        ...d, 
        foodbank_name: d.foodbank_name || "Foodbank",
        foodbank_verified: (Array.isArray(d.foodbank) ? d.foodbank[0]?.is_verified : d.foodbank?.is_verified) || false,
        logisticStatus,
        proof: dist?.status === 'distributed' ? dist : null
      };
    }));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const handleDeleteDonation = async (id) => {
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) {
      alert("Error deleting donation: " + error.message);
    } else {
      setConfirmDeleteId(null);
      await load();
    }
  };

  const filteredDonations = donations.filter((d) => {
    const tabMatch = d.status === activeTab;
    const isDirect = !!d.barangay_name;
    const typeMatch = filterType === "all" || 
                     (filterType === "direct" && isDirect) || 
                     (filterType === "reserve" && !isDirect);
    return tabMatch && typeMatch;
  });

  return (
    <DonorLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header & Tabs */}
        <div className="flex items-end justify-between mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A1A] uppercase tracking-tighter">Donation Tracking</h1>
            <p className="text-sm text-gray-400 font-medium">Monitor your contributions from pickup to impact.</p>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSearchParams({ tab: tab.key });
                  }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${activeTab === tab.key ? "bg-white text-[#FE9800] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-[#F5F5F5] p-1.5 rounded-[18px] w-fit mt-4">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-[14px] transition-all ${viewMode === 'grid' ? 'bg-white text-[#FE9800] shadow-sm' : 'text-[#888888] hover:text-[#FE9800]'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-[14px] transition-all ${viewMode === 'list' ? 'bg-white text-[#FE9800] shadow-sm' : 'text-[#888888] hover:text-[#FE9800]'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4">
              <Gift size={32} className="text-gray-300" />
            </div>
            <p className="text-lg font-bold text-gray-400 uppercase tracking-tight">No donations found</p>
            <p className="text-sm text-gray-400 mt-1">Your generosity will show up here.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-6">
              {filteredDonations.map((d) => {
                const isDirect = !!d.barangay_name;

                return (
                  <div key={d.id} className={`bg-white border ${isDirect ? 'border-orange-100' : 'border-blue-100'} rounded-[2rem] shadow-sm p-7 flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all duration-500`}>
                    {/* ... (existing DonorCard contents) */}
                    <div className={`absolute top-0 right-0 px-6 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-[0.2em] ${isDirect ? 'bg-[#FE9800] text-white' : 'bg-blue-600 text-white'}`}>
                      {isDirect ? 'Direct Aid' : 'General Reserve'}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${isDirect ? 'bg-[#FFF3DC]' : 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Gift size={24} className={isDirect ? 'text-[#FE9800]' : 'text-blue-600'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-lg font-bold text-[#1A1A1A] leading-tight">{d.foodbank_name}</p>
                            <VerifiedBadge isVerified={d.foodbank_verified} size={16} />
                          </div>
                          <p className="text-xs text-gray-400 font-medium italic">Partner Foodbank</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${STATUS_STYLE[d.status]?.bg} ${STATUS_STYLE[d.status]?.text} border border-transparent`}>
                        {STATUS_STYLE[d.status]?.label}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className={`p-4 ${isDirect ? 'bg-orange-50/30' : 'bg-blue-50/30'} rounded-2xl border border-transparent group-hover:border-current/10 transition-colors`}>
                        <p className={`text-[10px] ${isDirect ? 'text-[#FE9800]' : 'text-blue-600'} font-black uppercase tracking-widest mb-1.5 opacity-70`}>Donated Items</p>
                        <p className="text-sm text-[#1A1A1A] font-bold leading-relaxed">{d.items}</p>
                      </div>

                      {isDirect && (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin size={14} />
                            <span className="text-xs font-bold uppercase tracking-tighter">Destination: {d.barangay_name}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {d.status !== "rejected" && (
                      <div className="py-2 border-y border-gray-50">
                        {isDirect ? (
                          <LogisticProgressBar 
                            status={d.logisticStatus} 
                            onShowProof={() => setViewingProof(d.donation_packages?.[0]?.distributions?.[0])}
                          />
                        ) : (
                          <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${d.impact_logs?.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                <Package size={16} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Status</p>
                                <p className={`text-xs font-bold ${d.impact_logs?.length > 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                                  {d.impact_logs?.length > 0 ? `Supporting ${d.impact_logs.length} Mission${d.impact_logs.length > 1 ? 's' : ''}` : 'Secured in Foodbank Reserve'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Scheduled: {fmt(d.scheduled_date)}
                      </p>
                      {d.status === "rejected" && (
                        <button 
                          onClick={() => setConfirmDeleteId(d.id)}
                          className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Partner Foodbank</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Items Donated</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDonations.map((d) => (
                    <tr 
                      key={d.id} 
                      onClick={() => setViewingItem(d)}
                      className="group hover:bg-gray-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${d.barangay_name ? 'bg-[#FFF3DC]' : 'bg-blue-50'} flex items-center justify-center`}>
                            <Gift size={18} className={d.barangay_name ? 'text-[#FE9800]' : 'text-blue-600'} />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#1A1A1A]">{d.foodbank_name}</span>
                            <VerifiedBadge isVerified={d.foodbank_verified} size={12} />
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-gray-600 font-medium">{d.items}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${d.barangay_name ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {d.barangay_name ? 'Direct' : 'Reserve'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[11px] text-gray-400 font-bold">{fmt(d.created_at)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${STATUS_STYLE[d.status]?.bg} ${STATUS_STYLE[d.status]?.text}`}>
                          {STATUS_STYLE[d.status]?.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* Detail Popup */}
      {viewingItem && (
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto" 
          onClick={() => setViewingItem(null)}
        >
          <div 
            className="w-full max-w-[540px] animate-in fade-in zoom-in duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className={`bg-white border ${viewingItem.barangay_name ? 'border-orange-100' : 'border-blue-100'} rounded-[3rem] shadow-2xl p-10 flex flex-col gap-6 relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 px-8 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-[0.2em] ${viewingItem.barangay_name ? 'bg-[#FE9800] text-white' : 'bg-blue-600 text-white'}`}>
                {viewingItem.barangay_name ? 'Direct Aid' : 'General Reserve'}
              </div>

              <div className="flex items-start justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${viewingItem.barangay_name ? 'bg-[#FFF3DC]' : 'bg-blue-50'} flex items-center justify-center shrink-0`}>
                    <Gift size={28} className={viewingItem.barangay_name ? 'text-[#FE9800]' : 'text-blue-600'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-2xl font-black text-[#1A1A1A] tracking-tighter uppercase leading-tight">{viewingItem.foodbank_name}</h2>
                      <VerifiedBadge isVerified={viewingItem.foodbank_verified} size={20} />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Partner Foodbank</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full ${STATUS_STYLE[viewingItem.status]?.bg} ${STATUS_STYLE[viewingItem.status]?.text}`}>
                  {STATUS_STYLE[viewingItem.status]?.label}
                </span>
              </div>

              <div className="space-y-6">
                <div className={`p-6 ${viewingItem.barangay_name ? 'bg-orange-50/30' : 'bg-blue-50/30'} rounded-[2rem] border border-transparent`}>
                  <p className={`text-[11px] ${viewingItem.barangay_name ? 'text-[#FE9800]' : 'text-blue-600'} font-black uppercase tracking-[0.2em] mb-2`}>Donated Items Manifest</p>
                  <p className="text-lg font-bold text-[#1A1A1A] leading-relaxed">{viewingItem.items}</p>
                </div>

                {viewingItem.barangay_name && (
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-3xl flex items-center gap-3">
                    <MapPin size={18} className="text-gray-400" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</p>
                      <p className="text-sm font-bold text-[#1A1A1A] uppercase tracking-tighter">Barangay {viewingItem.barangay_name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">Donation ID</p>
                  <p className="text-[11px] text-[#1A1A1A] font-black uppercase">#{viewingItem.id.substring(0, 8)}</p>
                </div>
                <button
                  onClick={() => setViewingItem(null)}
                  className="w-full py-4 bg-gray-100 text-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-gray-200 transition-colors mt-2"
                >
                  Close Tracking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {viewingProof && (
          <Modal isOpen={true} onClose={() => setViewingProof(null)} title="Mission Accomplished" width="lg">
            <div className="space-y-4">
              {/* Proof Images - Compact Grid */}
              <div className="grid grid-cols-2 gap-3">
                {viewingProof.proof_images?.slice(0, 2).map((img, i) => (
                  <div key={i} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 shadow-sm group">
                    <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
              
              {/* Description & Impact - Tighter Padding */}
              <div className="p-5 bg-[#FE9800]/5 rounded-[2rem] border border-[#FE9800]/10">
                <div className="flex items-center gap-2 mb-2 text-[#FE9800]">
                  <MessageSquare size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Barangay Impact Story</p>
                </div>
                <p className="text-xs text-gray-600 font-medium italic leading-relaxed mb-4">"{viewingProof.proof_description}"</p>
                
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                  <div className="bg-white/80 p-3 rounded-xl border border-gray-50 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Date Distributed</p>
                    <p className="text-[11px] font-black text-[#1A1A1A]">{fmt(viewingProof.distributed_at)}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-gray-50 shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Verification</p>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 size={10} />
                      <p className="text-[11px] font-black uppercase">Verified Aid</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button variant="primary" onClick={() => setViewingProof(null)} className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-100">Close Journey</Button>
            </div>
          </Modal>
        )}

        {/* Custom Confirmation Modal */}
        {confirmDeleteId && (
          <Modal isOpen={true} onClose={() => setConfirmDeleteId(null)} title="Remove Record" width="sm">
            <div className="p-2 space-y-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">Confirm Deletion?</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">This will permanently remove this donation from your history.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">Keep It</Button>
                <Button variant="primary" onClick={() => handleDeleteDonation(confirmDeleteId)} className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white border-none text-[10px] font-black uppercase tracking-widest shadow-red-100">Remove</Button>
              </div>
            </div>
          </Modal>
        )}
    </DonorLayout>
  );
}
