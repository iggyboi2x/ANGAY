import { useNavigate } from "react-router-dom";
import DonorLayout from "../../components/donor/DonorLayout";
import { MapPin, ArrowRight, Package, Calendar } from "lucide-react";

const distributions = [
  {
    barangay: "Barangay Luz",
    goods: "Rice 50kg, Canned Goods",
    date: "Mar 20, 2026",
    status: "Confirmed",
  },
  {
    barangay: "Barangay Mabolo",
    goods: "Vegetables 30kg",
    date: "Mar 22, 2026",
    status: "Pending",
  },
  {
    barangay: "Barangay Lahug",
    goods: "Mixed Goods",
    date: "Mar 25, 2026",
    status: "Confirmed",
  },
];

const foodbanks = [
  { name: "Cebu City Food Bank", x: 34, y: 42 },
  { name: "Mandaue Food Hub", x: 59, y: 56 },
];

export default function DonorHome() {
  return (
    <DonorLayout>
      {/* Hero Banner */}
      <div className="bg-[#FE9800] px-10 py-8 flex items-center justify-between">
        <h1 className="text-white font-bold text-2xl">Help Feed Your Community</h1>
        <button className="bg-white text-[#FE9800] font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-orange-50 transition-colors shadow-sm">
          Donate Now
        </button>
      </div>

      <div className="px-10 py-8 space-y-8">
        {/* Nearby Foodbanks */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-4">Nearby Foodbanks</h2>
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: "300px", background: "#dbeafe", position: "relative" }}>
            {/* Stylized Cebu map SVG placeholder */}
            <svg width="100%" height="100%" viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
              <rect width="800" height="300" fill="#dbeafe" />
              {/* Cebu island shape approximation */}
              <ellipse cx="310" cy="155" rx="110" ry="90" fill="#c9b89a" opacity="0.85" />
              <ellipse cx="520" cy="130" rx="90" ry="75" fill="#c9b89a" opacity="0.85" />
              <ellipse cx="320" cy="260" rx="55" ry="35" fill="#c9b89a" opacity="0.75" />
              {/* Connecting line */}
              <line x1="345" y1="148" x2="450" y2="148" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4,3" />
            </svg>

            {/* Foodbank pins */}
            {foodbanks.map((fb) => (
              <div
                key={fb.name}
                style={{ position: "absolute", left: `${fb.x}%`, top: `${fb.y}%`, transform: "translate(-50%,-100%)" }}
                className="flex flex-col items-center"
              >
                <div className="bg-white rounded-full p-1 shadow-md border-2 border-[#FE9800]">
                  <MapPin size={14} className="text-[#FE9800]" fill="#FE9800" />
                </div>
                <div className="mt-1 bg-white text-xs font-medium text-gray-700 px-2 py-0.5 rounded shadow-sm whitespace-nowrap border border-gray-100">
                  {fb.name}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Distributions */}
        <section>
          <h2 className="text-gray-800 font-semibold text-base mb-4">Upcoming Distributions</h2>
          <div className="grid grid-cols-3 gap-5">
            {distributions.map((d) => (
              <div key={d.barangay} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <Package size={16} className="text-[#FE9800]" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{d.barangay}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{d.goods}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Calendar size={12} />
                  <span>{d.date}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    d.status === "Confirmed"
                      ? "bg-green-50 text-green-600"
                      : "bg-yellow-50 text-yellow-600"
                  }`}>
                    {d.status}
                  </span>
                  <button className="text-[#FE9800] text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
                    View Details <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DonorLayout>
  );
}
