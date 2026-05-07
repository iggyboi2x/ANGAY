import { useEffect, useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { supabase } from "../../../supabase";
import { Gift, Clock, CheckCircle2, XCircle, RotateCcw, Package, Image as ImageIcon, MessageSquare, MapPin } from "lucide-react";
import LogisticProgressBar from "../../components/LogisticProgressBar";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

const TABS = [
  { key: "pending",   label: "Pending"   },
  { key: "accepted",  label: "Accepted"  },
  { key: "completed", label: "History" },
  { key: "rejected",  label: "Rejected"  },
];

const STATUS_STYLE = {
  pending:   { bg: "bg-[#FFF3DC]", text: "text-[#C97700]",  label: "Pending",   Icon: Clock        },
  accepted:  { bg: "bg-blue-50",   text: "text-blue-600",   label: "Accepted",  Icon: Clock        },
  completed: { bg: "bg-green-50",  text: "text-green-600",  label: "Completed", Icon: CheckCircle2 },
  rejected:  { bg: "bg-red-50",    text: "text-red-500",    label: "Declined",  Icon: XCircle      },
};

const fmt = d => d ? new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "—";

import { useSearchParams } from "react-router-dom";

export default function DonorDonations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewingProof, setViewingProof] = useState(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Complex query: Get donation -> matching package -> matching distribution
    // This allows us to track the progress accurately
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        donation_packages(
          id,
          status,
          distributions(
            status,
            proof_images,
            proof_description,
            distributed_at
          )
        )
      `)
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error loading donations:", error);

    setDonations((data || []).map(d => {
      // Find the distribution status if it exists
      const pkg = d.donation_packages?.[0];
      const dist = pkg?.distributions?.[0];
      
      let logisticStatus = 'pending_fb'; // Default: waiting for FB to receive
      if (d.status === 'completed') logisticStatus = 'at_fb';
      if (dist?.status === 'received') logisticStatus = 'at_barangay';
      if (dist?.status === 'distributed') logisticStatus = 'distributed';

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

  const filtered = donations.filter(d => d.status === activeTab);
  const pendingCount = donations.filter(d => d.status === "pending").length;

  return (
    <DonorLayout>
      <div className="px-10 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">My Donations</h1>
            <p className="text-sm text-gray-400 font-medium">Track your contributions to the community</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#888] hover:text-[#FE9800] transition-colors">
            <RotateCcw size={14} /> Refresh Tracker
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                activeTab === key
                  ? "bg-[#FE9800] text-white border-[#FE9800] shadow-lg shadow-orange-100"
                  : "bg-white text-gray-400 border-gray-100 hover:border-[#FE9800]/50 hover:text-[#FE9800]"
              }`}>
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white text-[#FE9800]" : "bg-[#FE9800] text-white"}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-50 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-50 py-24 text-center">
            <Gift size={48} className="mx-auto mb-4 text-gray-100" />
            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No {activeTab} activity found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {filtered.map(d => {
              const s = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              const isDirect = !!d.barangay_name;

              return (
                <div key={d.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-7 flex flex-col gap-4 relative group hover:border-[#FE9800]/20 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0 shadow-sm`}>
                        <s.Icon size={20} className={s.text} />
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#1A1A1A] leading-tight">{d.foodbank_name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">Verified Foodbank</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1.5">Items Sent</p>
                      <p className="text-sm text-[#1A1A1A] font-semibold leading-relaxed">{d.items}</p>
                    </div>

                    {isDirect && (
                      <div className="px-4 py-3 bg-orange-50/50 border border-orange-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#FE9800]" />
                          <span className="text-xs font-bold text-orange-900">Destination: {d.barangay_name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-orange-400 bg-white px-2 py-0.5 rounded-full border border-orange-100 shadow-sm">Direct Donation</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar integration */}
                  {isDirect && d.status !== 'rejected' && (
                    <div className="py-2 border-y border-gray-50">
                      <LogisticProgressBar 
                        status={d.logisticStatus} 
                        onShowProof={() => setViewingProof(d.proof)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                      Submitted: {fmt(d.created_at)}
                    </p>
                    {d.status === "rejected" && (
                      <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-1 rounded-lg">Declined</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewingProof && (
        <Modal isOpen={true} onClose={() => setViewingProof(null)} title="Proof of Distribution" width="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {viewingProof.proof_images?.map((img, i) => (
                <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={img} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-[#FE9800]">
                <MessageSquare size={16} />
                <p className="text-xs font-bold uppercase tracking-wider">Barangay Feedback</p>
              </div>
              <p className="text-sm text-gray-600 italic leading-relaxed">"{viewingProof.proof_description}"</p>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distributed on {fmt(viewingProof.distributed_at)}</p>
                <div className="flex items-center gap-1.5 text-green-500">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Verified Journey</span>
                </div>
              </div>
            </div>
            <Button variant="primary" onClick={() => setViewingProof(null)} className="w-full h-12 rounded-2xl">Close Proof</Button>
          </div>
        </Modal>
      )}
    </DonorLayout>
  );
}
