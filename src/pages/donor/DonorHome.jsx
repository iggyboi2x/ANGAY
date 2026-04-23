import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { ArrowRight, Package, Calendar } from "lucide-react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../../supabase";
import { useMapPins } from "../../hooks/useMapPins";

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

  return (
    <DonorLayout>
      <div className="bg-[#FE9800] px-10 py-8 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Help Feed Your Community</h1>
        <button
          onClick={() => navigate("/donor/donations")}
          className="bg-white text-[#FE9800] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm"
        >
          Donate Now
        </button>
      </div>

      <div className="px-10 py-8 space-y-8">
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-4">Nearby Foodbanks</h2>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative" style={{ height: "320px" }}>
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
                <Marker key={pin.id} position={[pin.latitude, pin.longitude]} icon={orangeIcon} />
              ))}
            </MapContainer>
          </div>
        </section>

        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-4">Upcoming Distributions</h2>
          {loadingDistributions ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
              Loading upcoming distributions...
            </div>
          ) : distributions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-sm text-gray-500">
              No upcoming distributions yet.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-5">
              {distributions.map((d) => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
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
    </DonorLayout>
  );
}
