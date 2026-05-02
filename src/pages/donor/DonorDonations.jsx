import { useEffect, useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { supabase } from "../../../supabase";
import { Gift, Clock, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

const TABS = [
  { key: "pending",   label: "Pending"   },
  { key: "accepted",  label: "Accepted"  },
  { key: "completed", label: "Completed" },
  { key: "rejected",  label: "Rejected"  },
];

const STATUS_STYLE = {
  pending:   { bg: "bg-[#FFF3DC]", text: "text-[#C97700]",  label: "Pending",   Icon: Clock        },
  accepted:  { bg: "bg-blue-50",   text: "text-blue-600",   label: "Accepted",  Icon: Clock        },
  completed: { bg: "bg-green-50",  text: "text-green-600",  label: "Completed", Icon: CheckCircle2 },
  rejected:  { bg: "bg-red-50",    text: "text-red-500",    label: "Declined",  Icon: XCircle      },
};

const fmt = d => d ? new Date(d).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" }) : "—";

export default function DonorDonations() {
  const [activeTab, setActiveTab] = useState("pending");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("donations")
      .select("id, foodbank_id, foodbank_name, items, notes, scheduled_date, status, created_at")
      .eq("donor_id", user.id)
      .order("created_at", { ascending: false });

    setDonations((data || []).map(d => ({ ...d, foodbank_name: d.foodbank_name || "Foodbank" })));
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  const filtered = donations.filter(d => d.status === activeTab);
  const pendingCount = donations.filter(d => d.status === "pending").length;

  return (
    <DonorLayout>
      <div className="px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">My Donations</h1>
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#FE9800] transition-colors">
            <RotateCcw size={13} /> Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === key
                  ? "bg-[#FE9800] text-white border-[#FE9800]"
                  : "bg-white text-[#555] border-[#DDD] hover:border-[#FE9800] hover:text-[#FE9800]"
              }`}>
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-white text-[#FE9800]" : "bg-[#FFF3DC] text-[#C97700]"}`}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-5">
            {[1,2].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            <Gift size={36} className="mx-auto mb-3 opacity-30" />
            No {activeTab} donations yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {filtered.map(d => {
              const s = STATUS_STYLE[d.status] || STATUS_STYLE.pending;
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                        <s.Icon size={15} className={s.text} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{d.foodbank_name || "Foodbank"}</p>
                        <p className="text-[11px] text-gray-400">Recipient Foodbank</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-[#555]"><span className="text-[#888]">Items: </span>{d.items}</p>
                  {d.notes && <p className="text-sm text-[#555]"><span className="text-[#888]">Notes: </span>{d.notes}</p>}
                  <p className="text-xs text-[#888]">Drop-off: {fmt(d.scheduled_date)} · Submitted: {fmt(d.created_at)}</p>
                  {d.status === "rejected" && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">This donation was declined by the foodbank.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
