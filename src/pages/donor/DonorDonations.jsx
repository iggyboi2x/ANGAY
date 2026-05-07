import { useEffect, useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { supabase } from "../../../supabase";
import { Gift, Clock, CheckCircle2, XCircle, RotateCcw, Package, Image as ImageIcon, MessageSquare, MapPin, Trash2 } from "lucide-react";
import LogisticProgressBar from "../../components/LogisticProgressBar";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import { useSearchParams } from "react-router-dom";

const TABS = [
  { key: "pending",   label: "Request Sent"   },
  { key: "accepted",  label: "In Progress"  },
  { key: "completed", label: "Distributed" },
  { key: "rejected",  label: "Cancelled"  },
];

const STATUS_STYLE = {
  pending:   { bg: "bg-[#FFF3DC]", text: "text-[#C97700]",  label: "Pending",   Icon: Clock        },
  accepted:  { bg: "bg-blue-50",   text: "text-blue-600",   label: "Accepted",  Icon: Clock        },
  completed: { bg: "bg-green-50",  text: "text-green-600",  label: "Completed", Icon: CheckCircle2 },
  rejected:  { bg: "bg-red-50",    text: "text-red-500",    label: "Declined",  Icon: XCircle      },
};

const fmt = d => d ? new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "—";

export default function DonorDonations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "pending");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [viewingProof, setViewingProof] = useState(null);

  const handleDeleteDonation = async (id) => {
    if (!window.confirm("Are you sure you want to remove this donation record?")) return;
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) {
      alert("Error deleting donation: " + error.message);
    } else {
      await load();
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from("donations")
      .select(`
        *,
        donation_packages!original_donation_id(
          id,
          status,
          distributions!package_id(
            status,
            proof_images,
            proof_description,
            distributed_at
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
      
      let logisticStatus = 'pending_fb'; 
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

  return (
    <DonorLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-black text-[#1A1A1A] tracking-tighter uppercase">Your Donations</h1>
            <p className="text-sm text-gray-400 font-medium">Track the impact of your contributions</p>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#888] hover:text-[#FE9800] transition-colors bg-gray-50 px-4 py-2 rounded-xl">
            <RotateCcw size={14} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
                setSearchParams({ tab: key });
              }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === key
                  ? "bg-white text-[#FE9800] shadow-sm shadow-orange-100"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-50 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[3rem]">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Gift size={32} className="text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No donations found in {activeTab}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(d => {
              const S = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              const isDirect = !!d.barangay_name;

              return (
                <div key={d.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:border-[#FE9800]/30 transition-all group flex flex-col gap-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${S.bg} flex items-center justify-center shadow-sm`}>
                        <S.Icon size={20} className={S.text} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#1A1A1A] leading-tight">{d.foodbank_name}</h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Verified Foodbank</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${S.bg} ${S.text}`}>
                      {S.label}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Items Sent</p>
                      <p className="text-sm text-[#1A1A1A] font-bold leading-relaxed">{d.items}</p>
                    </div>

                    {isDirect && (
                      <div className="px-5 py-4 bg-orange-50/50 border border-orange-100 rounded-[1.5rem] flex items-center justify-between group-hover:bg-orange-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-[#FE9800]" />
                          <span className="text-xs font-black text-orange-900 uppercase tracking-tight">Destination: {d.barangay_name}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter text-orange-400 bg-white px-3 py-1 rounded-full border border-orange-100 shadow-sm">Direct Donation</span>
                      </div>
                    )}
                  </div>

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
                      <button 
                        onClick={() => handleDeleteDonation(d.id)}
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

        {viewingProof && (
          <Modal isOpen={true} onClose={() => setViewingProof(null)} title="Mission Accomplished" width="lg">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {viewingProof.proof_images?.map((img, i) => (
                  <div key={i} className="aspect-square rounded-3xl overflow-hidden border-2 border-gray-100 shadow-sm group">
                    <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
              
              <div className="p-6 bg-[#FE9800]/5 rounded-[2.5rem] border border-[#FE9800]/10">
                <div className="flex items-center gap-2 mb-3 text-[#FE9800]">
                  <MessageSquare size={18} />
                  <p className="text-xs font-black uppercase tracking-widest">Barangay Impact Story</p>
                </div>
                <p className="text-sm text-gray-600 font-medium italic leading-relaxed">"{viewingProof.proof_description}"</p>
                
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distribution Date</p>
                    <p className="text-xs font-bold text-gray-600">{fmt(viewingProof.distributed_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-500 bg-green-50 px-4 py-2 rounded-full">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Verified Aid</span>
                  </div>
                </div>
              </div>
              <Button variant="primary" onClick={() => setViewingProof(null)} className="w-full h-14 rounded-3xl font-black uppercase tracking-widest text-xs">Close Journey</Button>
            </div>
          </Modal>
        )}
      </div>
    </DonorLayout>
  );
}
