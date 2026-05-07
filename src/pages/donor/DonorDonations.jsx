import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { 
  Package, Clock, CheckCircle, Gift, ArrowRight, X, Search, 
  Trash2, MessageSquare, CheckCircle2, ChevronRight, MapPin 
} from "lucide-react";
import { supabase } from "../../../supabase";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import LogisticProgressBar from "../../components/LogisticProgressBar";

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

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
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

            {/* Type Toggles */}
            <div className="flex gap-3">
              {[
                { key: 'all', label: 'All Types' },
                { key: 'direct', label: 'Direct Aid' },
                { key: 'reserve', label: 'General Reserve' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilterType(t.key)}
                  className={`text-[9px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full border transition-all
                    ${filterType === t.key 
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                      : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                >
                  {t.label}
                </button>
              ))}
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
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filteredDonations.map((d) => {
              const s = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              const isDirect = !!d.barangay_name;
              const hasImpact = d.impact_logs?.length > 0;
              const pkg = d.donation_packages?.[0];
              const dist = pkg?.distributions?.[0];

              return (
                <div key={d.id} className={`bg-white border ${isDirect ? 'border-orange-100' : 'border-blue-100'} rounded-[2rem] shadow-sm p-7 flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all duration-500`}>
                  {/* Type Ribbon */}
                  <div className={`absolute top-0 right-0 px-6 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-[0.2em] ${isDirect ? 'bg-[#FE9800] text-white' : 'bg-blue-600 text-white'}`}>
                    {isDirect ? 'Direct Aid' : 'General Reserve'}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl ${isDirect ? 'bg-[#FFF3DC]' : 'bg-blue-50'} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Gift size={24} className={isDirect ? 'text-[#FE9800]' : 'text-blue-600'} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[#1A1A1A] leading-tight">{d.foodbank_name}</p>
                        <p className="text-xs text-gray-400 font-medium italic">Partner Foodbank</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${s.bg} ${s.text} border border-transparent`}>
                      {s.label}
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
                        /* Linear journey for Direct Aid */
                        <LogisticProgressBar 
                          status={d.logisticStatus} 
                          onShowProof={() => setViewingProof(dist)}
                        />
                      ) : (
                        /* Multi-point status for Reserve */
                        <div className="flex items-center justify-between px-4 py-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasImpact ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Inventory Status</p>
                              <p className={`text-xs font-bold ${hasImpact ? 'text-blue-600' : 'text-gray-600'}`}>
                                {hasImpact ? `Supporting ${d.impact_logs.length} Mission${d.impact_logs.length > 1 ? 's' : ''}` : 'Secured in Foodbank Reserve'}
                              </p>
                            </div>
                          </div>
                          {hasImpact && (
                            <div className="flex -space-x-2">
                              {d.impact_logs.map((_, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[8px] font-black text-white">
                                  {i + 1}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inventory Impact Feed - Enhanced for Multi-point */}
                  {!isDirect && hasImpact && (
                    <div className="mt-4 p-4 bg-blue-50/30 rounded-[2rem] border border-blue-100/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Package size={14} />
                          <p className="text-[10px] font-black uppercase tracking-widest">Distribution Timeline</p>
                        </div>
                        <span className="text-[9px] font-black px-2 py-0.5 bg-blue-600 text-white rounded-full uppercase">Impact Feed</span>
                      </div>
                      <div className="space-y-4">
                        {d.impact_logs.map((log, i) => {
                          const impactPkg  = log.donation_packages;
                          const impactDist = impactPkg?.distributions?.[0];
                          
                          return (
                            <div key={i} className="flex gap-4 items-start group/log cursor-pointer relative" onClick={() => impactDist && setViewingProof(impactDist)}>
                              {i !== d.impact_logs.length - 1 && (
                                <div className="absolute left-[7px] top-6 bottom-0 w-[1px] bg-blue-200/50" />
                              )}
                              <div className={`w-[15px] h-[15px] rounded-full border-4 mt-1 shrink-0 z-10 ${impactDist?.status === 'distributed' ? 'bg-blue-500 border-blue-50' : 'bg-gray-300 border-gray-100'}`} />
                              <div className="flex-1 bg-white p-3 rounded-2xl border border-blue-100/30 shadow-sm group-hover/log:border-blue-400/50 transition-all">
                                <p className="text-[11px] text-gray-600 leading-snug">
                                  <span className="font-bold text-blue-700">{log.quantity}{log.unit}</span> {impactDist?.status === 'distributed' ? 'distributed to' : 'assigned to'} <span className="font-bold text-[#1A1A1A]">{impactDist?.barangay_name || impactPkg?.name || 'Package'}</span>
                                </p>
                                <div className="mt-1 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <p className="text-[9px] text-gray-400 font-bold">
                                      {impactDist?.status === 'distributed' 
                                        ? `Mission Accomplished on ${fmt(impactDist.distributed_at)}`
                                        : impactDist?.status === 'received' 
                                          ? 'Currently with Barangay (In Stock)'
                                          : 'Awaiting Dispatch to Barangay'}
                                    </p>
                                  </div>
                                  {impactDist?.status === 'distributed' && (
                                    <div className="flex items-center gap-1 text-[8px] font-black text-blue-500 uppercase tracking-tighter opacity-0 group-hover/log:opacity-100 transition-opacity">
                                      View Proof <ChevronRight size={8} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {!isDirect && !hasImpact && d.status === 'completed' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Distribution</p>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium italic">Your contribution is currently in the Foodbank Reserve, supporting future community aid.</p>
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
        )}
      </div>

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
