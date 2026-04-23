import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { ArrowRight, Calendar, Package, X } from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../supabase";
import { useMapPins } from "../../hooks/useMapPins";
import FlashMessage from "../../components/FlashMessage";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const philippinesBounds = [[4.5, 116.0], [21.5, 127.0]];

const formatDate = (rawDate) => {
  if (!rawDate) return "Not scheduled";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function DonorHome() {
  const navigate = useNavigate();
  const { pins: foodbanks, loading: pinsLoading } = useMapPins("foodbank");
  const [distributions, setDistributions] = useState([]);
  const [loadingDistributions, setLoadingDistributions] = useState(true);
  const [selectedFoodbank, setSelectedFoodbank] = useState(null);
  const [donationStats, setDonationStats] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [savingDonation, setSavingDonation] = useState(false);
  const [flash, setFlash] = useState(null);
  const [donationForm, setDonationForm] = useState({
    foodbank_id: "",
    barangay_name: "",
    items: "",
    scheduled_date: "",
  });
  const cardRef = useRef(null);

  const foodbankOptions = useMemo(
    () => foodbanks.map((bank) => ({ id: bank.id, label: bank.org_name || "Foodbank" })),
    [foodbanks]
  );

  useEffect(() => {
    let cancelled = false;

    const loadUpcomingDistributions = async () => {
      setLoadingDistributions(true);
      const { data, error } = await supabase
        .from("donations")
        .select("id, barangay_name, items, scheduled_date, status")
        .in("status", ["confirmed", "scheduled", "pending"])
        .order("scheduled_date", { ascending: true })
        .limit(6);

      if (!cancelled) {
        if (error) {
          setDistributions([]);
        } else {
          setDistributions(data || []);
        }
        setLoadingDistributions(false);
      }
    };

    loadUpcomingDistributions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (selectedFoodbank && cardRef.current && !cardRef.current.contains(event.target)) {
        setSelectedFoodbank(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectedFoodbank]);

  useEffect(() => {
    let cancelled = false;

    const loadDonationStats = async () => {
      const entries = await Promise.all(
        foodbanks.map(async (bank) => {
          const { count, error } = await supabase
            .from("donations")
            .select("id", { count: "exact", head: true })
            .eq("foodbank_id", bank.id);
          return [bank.id, error ? 0 : (count || 0)];
        })
      );
      if (!cancelled) {
        setDonationStats(Object.fromEntries(entries));
      }
    };

    if (foodbanks.length > 0) loadDonationStats();
    return () => {
      cancelled = true;
    };
  }, [foodbanks]);

  const handleDonationSubmit = async () => {
    if (!donationForm.items || !donationForm.scheduled_date || !donationForm.foodbank_id) {
      setFlash({ type: "error", message: "Please complete all required donation fields." });
      return;
    }

    setSavingDonation(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    const payload = {
      donor_id: user?.id || null,
      foodbank_id: donationForm.foodbank_id,
      barangay_name: donationForm.barangay_name || null,
      items: donationForm.items,
      scheduled_date: donationForm.scheduled_date,
      status: "pending",
    };

    const { error } = await supabase.from("donations").insert(payload);
    setSavingDonation(false);

    if (error) {
      setFlash({ type: "error", message: error.message || "Unable to submit donation." });
      return;
    }

    setFlash({ type: "success", message: "Donation request submitted." });
    setFormOpen(false);
    setDonationForm({ foodbank_id: "", barangay_name: "", items: "", scheduled_date: "" });
  };

  return (
    <DonorLayout>
      {flash && (
        <FlashMessage
          message={flash.message}
          type={flash.type}
          onClose={() => setFlash(null)}
        />
      )}
      <div className="bg-[#FE9800] px-10 py-8 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Help Feed Your Community</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="bg-white text-[#FE9800] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
        >
          Donate Now
        </button>
      </div>

      <div className="px-10 py-8">
        <div className="grid grid-cols-[1.5fr_1fr] gap-6">
          <section>
            <h2 className="text-gray-800 font-semibold text-base mb-4">Nearby Foodbanks</h2>
            <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: "520px" }}>
              {pinsLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center text-sm text-gray-500">
                  Loading map...
                </div>
              )}
              <MapContainer
                center={[12.8797, 121.7740]}
                zoom={5}
                minZoom={5}
                maxZoom={15}
                maxBounds={philippinesBounds}
                maxBoundsViscosity={1.0}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {foodbanks.map((pin) => (
                  <Marker
                    key={pin.id}
                    position={[pin.latitude, pin.longitude]}
                    icon={orangeIcon}
                    eventHandlers={{ click: () => setSelectedFoodbank(pin) }}
                  />
                ))}
              </MapContainer>

              {selectedFoodbank && (
                <div className="absolute top-4 left-4 z-[900]">
                  <div ref={cardRef} className="w-80 bg-white rounded-xl border border-gray-100 shadow-lg p-4">
                    <button
                      onClick={() => setSelectedFoodbank(null)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    >
                      <X size={14} />
                    </button>
                    <div className="flex items-start gap-3 mb-3">
                      {selectedFoodbank.logo_url ? (
                        <img
                          src={selectedFoodbank.logo_url}
                          alt={selectedFoodbank.org_name}
                          className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-[#FE9800] text-white font-bold flex items-center justify-center">
                          {(selectedFoodbank.org_name || "FB")
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase() || "")
                            .join("")}
                        </div>
                      )}
                      <div className="pr-5">
                        <p className="text-sm font-semibold text-gray-800">{selectedFoodbank.org_name || "Foodbank"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedFoodbank.address || "Address unavailable"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[11px] text-gray-400">Established</p>
                        <p className="text-xs font-semibold text-gray-700">
                          {selectedFoodbank.created_at
                            ? new Date(selectedFoodbank.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" })
                            : "Not set"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-[11px] text-gray-400">Total Donations</p>
                        <p className="text-xs font-semibold text-gray-700">{donationStats[selectedFoodbank.id] || 0}</p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/donor/messages?recipient=${selectedFoodbank.id}&name=${encodeURIComponent(selectedFoodbank.org_name || "Foodbank")}`)
                      }
                      className="w-full py-2.5 bg-[#FE9800] text-white text-sm font-semibold rounded-xl hover:bg-[#e58a00] transition-colors"
                    >
                      Contact Foodbank
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-gray-800 font-semibold text-base">Upcoming Distributions</h2>
              <button
                onClick={() => navigate("/donor/donations")}
                className="text-[#FE9800] text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>
            {loadingDistributions ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
                Loading upcoming distributions...
              </div>
            ) : distributions.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
                No upcoming distributions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {distributions.map((d) => (
                  <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-50 p-2 rounded-lg">
                        <Package size={16} className="text-[#FE9800]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{d.barangay_name || "Unassigned Barangay"}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{d.items || "Donation items to be finalized"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <Calendar size={12} />
                      <span>{formatDate(d.scheduled_date)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        d.status?.toLowerCase() === "confirmed"
                          ? "bg-green-50 text-green-600"
                          : "bg-yellow-50 text-yellow-600"
                      }`}>
                        {d.status || "pending"}
                      </span>
                      <button
                        onClick={() => navigate("/donor/donations")}
                        className="text-[#FE9800] text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        View Details <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/35 z-[950] flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 relative">
            <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={16} />
            </button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Donation</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Foodbank *</label>
                <select
                  value={donationForm.foodbank_id}
                  onChange={(e) => setDonationForm((prev) => ({ ...prev, foodbank_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#FE9800]"
                >
                  <option value="">Select recipient foodbank</option>
                  {foodbankOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Items *</label>
                <textarea
                  value={donationForm.items}
                  onChange={(e) => setDonationForm((prev) => ({ ...prev, items: e.target.value }))}
                  rows={3}
                  placeholder="Ex. Rice 20kg, canned goods 40 pcs"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#FE9800] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Proposed Date *</label>
                  <input
                    type="date"
                    value={donationForm.scheduled_date}
                    onChange={(e) => setDonationForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#FE9800]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Target Barangay</label>
                  <input
                    value={donationForm.barangay_name}
                    onChange={(e) => setDonationForm((prev) => ({ ...prev, barangay_name: e.target.value }))}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 outline-none focus:border-[#FE9800]"
                  />
                </div>
              </div>
              <button
                onClick={handleDonationSubmit}
                disabled={savingDonation}
                className="w-full py-2.5 bg-[#FE9800] text-white rounded-xl text-sm font-semibold hover:bg-[#e58a00] disabled:opacity-60"
              >
                {savingDonation ? "Submitting..." : "Submit Donation Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DonorLayout>
  );
}
