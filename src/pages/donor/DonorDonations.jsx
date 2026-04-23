import { useEffect, useMemo, useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { supabase } from "../../../supabase";
import { Gift, Clock, CheckCircle2, RotateCcw } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
];

const formatDate = (rawDate) => {
  if (!rawDate) return "Not scheduled";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function DonorDonations() {
  const [activeTab, setActiveTab] = useState("pending");
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadDonations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("donations")
        .select("id, barangay_name, items, status, scheduled_date, created_at")
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setDonations(error ? [] : (data || []));
        setLoading(false);
      }
    };

    loadDonations();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => donations.filter((d) => (d.status || "pending").toLowerCase() === activeTab),
    [donations, activeTab]
  );

  return (
    <DonorLayout>
      <div className="px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">My Donations</h1>
          <div className="flex items-center gap-2 text-sm text-[#888888]">
            <RotateCcw size={14} />
            <span>Live database data</span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === tab.key
                  ? "bg-[#FE9800] text-white border-[#FE9800]"
                  : "bg-white text-[#555] border-[#DDDDDD] hover:border-[#FE9800] hover:text-[#FE9800]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-500">Loading donations...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-sm text-gray-500">
            No donations under this status yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            {filtered.map((donation) => (
              <div key={donation.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFF3DC] flex items-center justify-center">
                      {activeTab === "completed" ? (
                        <CheckCircle2 size={16} className="text-green-600" />
                      ) : activeTab === "confirmed" ? (
                        <Clock size={16} className="text-blue-600" />
                      ) : (
                        <Gift size={16} className="text-[#FE9800]" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[#1A1A1A]">
                      {donation.barangay_name || "Unassigned Barangay"}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#F5F5F5] text-[#666] capitalize">
                    {donation.status || "pending"}
                  </span>
                </div>
                <p className="text-sm text-[#555555]">{donation.items || "No items specified"}</p>
                <p className="text-xs text-[#888888]">Scheduled: {formatDate(donation.scheduled_date)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
