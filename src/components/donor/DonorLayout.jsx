import { NavLink, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";

export default function DonorLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFFAF1]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
      <nav className="bg-white border-b border-gray-100 px-10 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate("/donor/home")}
        >
          <span className="text-[#FE9800] text-xl">🌾</span>
          <span className="text-[#FE9800] font-bold text-lg tracking-wide">ANGAY</span>
        </div>

        <div className="flex items-center gap-8">
          {[
            { label: "Home", to: "/donor/home" },
            { label: "Donations", to: "/donor/donations" },
            { label: "Messages", to: "/donor/messages" },
            { label: "Account", to: "/donor/account" },
          ].map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors pb-0.5 ${
                  isActive
                    ? "text-[#FE9800] border-b-2 border-[#FE9800]"
                    : "text-gray-500 hover:text-[#FE9800]"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-[#FE9800] transition-colors rounded-full hover:bg-orange-50">
            <Bell size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#FE9800] text-white flex items-center justify-center text-xs font-bold cursor-pointer">
            JD
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
