import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { ArrowRight, Calendar, Package, X, ChevronLeft, ChevronRight, Heart, Search, Filter, CheckCircle, Info, Users, MapPin, MessageSquare } from "lucide-react";
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

const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
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
  const { pins: foodbanks, loading: fbLoading } = useMapPins("foodbank");
  const { pins: barangays, loading: bLoading } = useMapPins("barangay");
  const [distributions, setDistributions] = useState([]);
  const [loadingDistributions, setLoadingDistributions] = useState(true);
  const [selectedPin, setSelectedPin] = useState(null);
  const [pinDetails, setPinDetails] = useState({ history: [], helped: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [donationStats, setDonationStats] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [savingDonation, setSavingDonation] = useState(false);
  const [flash, setFlash] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'foodbank', 'barangay'
  const [donationForm, setDonationForm] = useState({
    foodbank_id: "",
    barangay_name: "",
    scheduled_date: "",
  });
  const [itemsList, setItemsList] = useState([{ name: "", qty: "", unit: "kg" }]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const isCollapsed = false; // Not used anymore but kept for state
  const cardRef = useRef(null);
  const mapRef = useRef(null);

  const filteredPins = useMemo(() => {
    let combined = [...foodbanks, ...barangays];
    if (filterType === "foodbank") combined = combined.filter(p => p.type === "foodbank");
    if (filterType === "barangay") combined = combined.filter(p => p.type === "barangay");
    return combined;
  }, [foodbanks, barangays, filterType]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return [...foodbanks, ...barangays].filter(p => 
      (p.org_name || "").toLowerCase().includes(term) || 
      (p.address || "").toLowerCase().includes(term)
    ).slice(0, 8);
  }, [foodbanks, barangays, searchTerm]);

  const foodbankOptions = useMemo(
    () => foodbanks.map((bank) => ({ id: bank.id, label: bank.org_name || "Foodbank" })),
    [foodbanks]
  );

  const handleSelectResult = (pin) => {
    setSelectedPin(pin);
    setSearchTerm("");
    if (mapRef.current) {
      mapRef.current.flyTo([pin.latitude, pin.longitude], 14, {
        duration: 1.5,
        animate: true
      });
    }
  };

  const handleDonateToPin = (pin) => {
    setDonationForm((prev) => ({ 
      ...prev, 
      foodbank_id: pin.id 
    }));
    setFormOpen(true);
  };

  useEffect(() => {
    const loadBarangays = async () => {
      const { data, error } = await supabase
        .from("barangays")
        .select("id, barangay_name")
        .order("barangay_name", { ascending: true });
      if (!error && data) {
        setBarangayOptions(data.map((b) => ({ id: b.id, label: b.barangay_name || "Unnamed Barangay" })));
      }
    };
    loadBarangays();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedPin) {
      setPinDetails({ history: [], helped: [] });
      return;
    }

    const loadDetails = async () => {
      setLoadingDetails(true);
      
      if (selectedPin.type === "foodbank") {
        // Fetch distribution history for foodbank
        const { data: history } = await supabase
          .from("donations")
          .select("id, barangay_name, items, scheduled_date, status")
          .eq("foodbank_id", selectedPin.id)
          .eq("status", "completed")
          .order("scheduled_date", { ascending: false });

        const { data: helped } = await supabase
          .from("donations")
          .select("barangay_name")
          .eq("foodbank_id", selectedPin.id)
          .eq("status", "completed");

        if (!cancelled) {
          const uniqueBarangays = [...new Set((helped || []).map(h => h.barangay_name).filter(Boolean))];
          setPinDetails({ history: history || [], helped: uniqueBarangays });
        }
      } else {
        // Fetch history for barangay
        const { data: history } = await supabase
          .from("donations")
          .select("id, foodbank_name, items, scheduled_date, status")
          .eq("barangay_name", selectedPin.org_name)
          .eq("status", "completed")
          .order("scheduled_date", { ascending: false });

        if (!cancelled) {
          setPinDetails({ history: history || [], helped: [] });
        }
      }
      
      if (!cancelled) setLoadingDetails(false);
    };

    loadDetails();
    return () => { cancelled = true; };
  }, [selectedPin]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      // Don't close if clicking on the marker or the sidebar
      if (selectedPin && cardRef.current && !cardRef.current.contains(event.target)) {
        // We might want to keep it open if clicking markers, Leaflet handles that
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [selectedPin]);

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
    const filledItems = itemsList.filter((i) => i.name.trim());
    if (filledItems.length === 0 || !donationForm.scheduled_date || !donationForm.foodbank_id) {
      setFlash({ type: "error", message: "Please complete all required donation fields." });
      return;
    }

    const itemsString = filledItems
      .map((i) => (i.qty.trim() ? `${i.name.trim()} ${i.qty.trim()}${i.unit}` : i.name.trim()))
      .join(", ");

    setSavingDonation(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    const selectedFoodbankLabel = foodbankOptions.find(f => f.id === donationForm.foodbank_id)?.label || null;

    const payload = {
      donor_id: user?.id || null,
      foodbank_id: donationForm.foodbank_id,
      foodbank_name: selectedFoodbankLabel,
      barangay_name: donationForm.barangay_name || null,
      items: itemsString,
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
    setDonationForm({ foodbank_id: "", barangay_name: "", scheduled_date: "" });
    setItemsList([{ name: "", qty: "", unit: "kg" }]);
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
      
      {/* Floating Donate Button */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-8 right-8 z-[2000] bg-[#FE9800] text-white px-5 py-3.5 rounded-full shadow-lg hover:bg-orange-500 hover:scale-105 transition-all flex items-center gap-2 group"
      >
        <Heart size={18} className="fill-current" />
        <span className="font-semibold text-sm">Donate Now</span>
      </button>

      <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50">
        
        {/* Search and Filter Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FE9800] transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search foodbanks or barangays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-none rounded-2xl shadow-xl outline-none ring-2 ring-transparent focus:ring-[#FE9800]/30 transition-all text-sm font-medium"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left group border-b border-gray-50 last:border-none"
                    >
                      <div className={`p-2 rounded-xl transition-colors ${result.type === 'foodbank' ? 'bg-orange-50 text-[#FE9800] group-hover:bg-[#FE9800] group-hover:text-white' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white'}`}>
                        {result.type === 'foodbank' ? <Package size={18} /> : <MapPin size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm truncate">{result.org_name}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{result.address || "No address provided"}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex bg-white rounded-2xl shadow-xl p-1.5 ring-2 ring-transparent">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[#FE9800] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Both
              </button>
              <button
                onClick={() => setFilterType("foodbank")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'foodbank' ? 'bg-[#FE9800] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Foodbanks
              </button>
              <button
                onClick={() => setFilterType("barangay")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'barangay' ? 'bg-[#FE9800] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Barangays
              </button>
            </div>
          </div>
        </div>

        {/* Details Slide-in Panel */}
        <div 
          ref={cardRef}
          className={`absolute top-0 left-0 h-full w-[400px] bg-white z-[1100] shadow-2xl transition-transform duration-500 ease-in-out border-r border-gray-100 flex flex-col ${selectedPin ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {selectedPin && (
            <>
              {/* Header with Close Button */}
              <div className="relative h-48 w-full flex-shrink-0">
                {selectedPin.type === 'foodbank' && selectedPin.logo_url ? (
                  <img src={selectedPin.logo_url} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${selectedPin.type === 'foodbank' ? 'bg-[#FE9800]' : 'bg-blue-500'}`}>
                    <span className="text-white text-5xl font-bold opacity-30">
                      {(selectedPin.org_name || "A").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  onClick={() => setSelectedPin(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
                >
                  <X size={20} />
                </button>
                
                <div className="absolute bottom-4 left-6 pr-10">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white font-bold text-2xl truncate drop-shadow-md">
                      {selectedPin.org_name || "Unnamed"}
                    </h2>
                    <CheckCircle size={20} className="text-blue-400 fill-white flex-shrink-0" />
                  </div>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin size={14} /> {selectedPin.address || "Location not set"}
                  </p>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                
                {/* Bio / Description */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-gray-400">
                    <Info size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-widest">About</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedPin.description || `Dedicated to supporting the community through ${selectedPin.type === 'foodbank' ? 'food assistance' : 'local governance'} and sustainable development.`}
                  </p>
                </section>

                {selectedPin.type === 'foodbank' ? (
                  <>
                    {/* Foodbank Specific: Helped Barangays */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Users size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Helped Barangays</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pinDetails.helped.length > 0 ? pinDetails.helped.map((b, i) => (
                          <span key={i} className="px-3 py-1.5 bg-orange-50 text-[#FE9800] text-xs font-bold rounded-full border border-orange-100">
                            {b}
                          </span>
                        )) : (
                          <p className="text-xs text-gray-400 italic">No history recorded yet.</p>
                        )}
                      </div>
                    </section>

                    {/* Foodbank Specific: Distribution History */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Calendar size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Distribution History</h3>
                      </div>
                      <div className="space-y-3">
                        {loadingDetails ? (
                          <p className="text-xs text-gray-400">Loading history...</p>
                        ) : pinDetails.history.length > 0 ? pinDetails.history.map((h) => (
                          <div key={h.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-[#FE9800] transition-colors">
                            <p className="text-sm font-bold text-gray-800">{h.barangay_name}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{h.items}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-gray-400 font-bold">{formatDate(h.scheduled_date)}</span>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-gray-400 italic">No recent distributions found.</p>
                        )}
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    {/* Barangay Specific: Demographics */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Users size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Community Demographics</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Population', value: selectedPin.demographics?.population || 0, icon: '👥' },
                          { label: 'Seniors', value: selectedPin.demographics?.seniors || 0, icon: '👴' },
                          { label: 'Children', value: selectedPin.demographics?.children || 0, icon: '👶' },
                          { label: 'PWDs', value: selectedPin.demographics?.pwd || 0, icon: '♿' },
                          { label: 'Pregnant', value: selectedPin.demographics?.pregnant || 0, icon: '🤰' },
                        ].map((stat) => (
                          <div key={stat.label} className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <span className="text-xl mb-2 block">{stat.icon}</span>
                            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-black text-blue-900">{stat.value.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Barangay Specific: Donation History */}
                    <section>
                      <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Calendar size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Received Donations</h3>
                      </div>
                      <div className="space-y-3">
                        {loadingDetails ? (
                          <p className="text-xs text-gray-400">Loading history...</p>
                        ) : pinDetails.history.length > 0 ? pinDetails.history.map((h) => (
                          <div key={h.id} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:border-blue-400 transition-colors">
                            <p className="text-sm font-bold text-gray-800">{h.foodbank_name || "Partner Foodbank"}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{h.items}</p>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-gray-400 font-bold">{formatDate(h.scheduled_date)}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">RECEIVED</span>
                            </div>
                          </div>
                        )) : (
                          <p className="text-xs text-gray-400 italic">No donation history found for this barangay.</p>
                        )}
                      </div>
                    </section>
                  </>
                )}
              </div>

              {/* Floating Action Buttons at Bottom */}
              {selectedPin.type === 'foodbank' && (
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-10 flex gap-3">
                  <button 
                    onClick={() => navigate(`/donor/messages?recipient=${selectedPin.id}&name=${encodeURIComponent(selectedPin.org_name || "Foodbank")}`)}
                    className="flex-1 py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Message
                  </button>
                  <button 
                    onClick={() => handleDonateToPin(selectedPin)}
                    className="flex-[2] py-4 bg-[#FE9800] text-white font-bold rounded-2xl shadow-lg shadow-orange-100 hover:bg-orange-500 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <Heart size={18} className="fill-current" />
                    Donate
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Map */}
        <div className="h-full w-full">
          <MapContainer
            center={[12.8797, 121.7740]}
            zoom={6}
            minZoom={5}
            maxZoom={15}
            maxBounds={philippinesBounds}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%", zIndex: 1 }}
            scrollWheelZoom
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredPins.map((pin) => (
              <Marker
                key={`${pin.type}-${pin.id}`}
                position={[pin.latitude, pin.longitude]}
                icon={pin.type === 'foodbank' ? orangeIcon : blueIcon}
                eventHandlers={{ click: () => setSelectedPin(pin) }}
              />
            ))}
          </MapContainer>
        </div>

      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/35 z-[3000] flex items-center justify-center px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setFormOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-full transition-all">
              <X size={20} />
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Start a Donation</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Select Foodbank *</label>
                <select
                  value={donationForm.foodbank_id}
                  onChange={(e) => setDonationForm((prev) => ({ ...prev, foodbank_id: e.target.value }))}
                  className="w-full px-4 py-3.5 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                >
                  <option value="">Where would you like to donate?</option>
                  {foodbankOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Items to Donate *</label>
                <div className="space-y-3">
                  {itemsList.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${idx * 50}ms` }}>
                      <input
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...itemsList];
                          updated[idx].name = e.target.value;
                          setItemsList(updated);
                        }}
                        placeholder="Item (e.g. Rice)"
                        className="flex-1 px-4 py-3 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...itemsList];
                          updated[idx].qty = e.target.value;
                          setItemsList(updated);
                        }}
                        placeholder="Qty"
                        className="w-20 px-4 py-3 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...itemsList];
                          updated[idx].unit = e.target.value;
                          setItemsList(updated);
                        }}
                        className="w-24 px-2 py-3 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                      >
                        <option value="kg">kg</option>
                        <option value="pcs">pcs</option>
                        <option value="cans">cans</option>
                        <option value="packs">packs</option>
                        <option value="sacks">sacks</option>
                        <option value="boxes">boxes</option>
                      </select>
                      {itemsList.length > 1 && (
                        <button
                          onClick={() => setItemsList(itemsList.filter((_, i) => i !== idx))}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setItemsList([...itemsList, { name: "", qty: "", unit: "kg" }])}
                    className="text-sm text-[#FE9800] font-bold hover:text-orange-600 transition-colors flex items-center gap-1 mt-2"
                  >
                    + Add another item
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Proposed Date *</label>
                  <input
                    type="date"
                    value={donationForm.scheduled_date}
                    onChange={(e) => setDonationForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                    className="w-full px-4 py-3.5 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Barangay</label>
                  <select
                    value={donationForm.barangay_name}
                    onChange={(e) => setDonationForm((prev) => ({ ...prev, barangay_name: e.target.value }))}
                    className="w-full px-4 py-3.5 text-sm border-2 border-gray-100 rounded-2xl bg-gray-50 outline-none focus:border-[#FE9800] focus:bg-white transition-all"
                  >
                    <option value="">Optional</option>
                    {barangayOptions.map((opt) => (
                      <option key={opt.id} value={opt.label}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleDonationSubmit}
                disabled={savingDonation}
                className="w-full py-4 mt-4 bg-[#FE9800] text-white rounded-2xl text-base font-bold shadow-lg shadow-orange-100 hover:bg-orange-500 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
