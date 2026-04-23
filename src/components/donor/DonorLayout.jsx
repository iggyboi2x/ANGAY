import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings, Wheat } from "lucide-react";
import { supabase } from "../../../supabase";

export default function DonorLayout({ children }) {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userName, setUserName] = useState("Donor");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadNavbarData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, file_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        const fullName = profile?.full_name || user.user_metadata?.full_name || "Donor";
        setUserName(fullName);
        setAvatarUrl(profile?.avatar_url || profile?.file_url || null);
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, is_read")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!cancelled) {
        setNotifications(notifData || []);
      }
    };

    loadNavbarData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const initials = useMemo(() => {
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "DN";
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
  }, [userName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FFFAF1]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
      <nav className="bg-white border-b border-gray-100 px-10 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate("/donor/home")}
        >
          <span className="text-[#FE9800] text-xl"> <Wheat size={20} className="text-[#FE9800]" /></span>
          <span className="text-[#FE9800] font-bold text-lg tracking-wide">ANGAY</span>
        </div>

        <div className="flex items-center gap-8">
          {[
            { label: "Home", to: "/donor/home" },
            { label: "Donations", to: "/donor/donations" },
            { label: "Messages", to: "/donor/messages" },
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
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((prev) => !prev)}
              className="p-2 text-gray-400 hover:text-[#FE9800] transition-colors rounded-full hover:bg-orange-50 relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-gray-400">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <div key={item.id} className="px-4 py-3 border-b border-gray-50 hover:bg-orange-50/40">
                        <p className="text-xs font-semibold text-gray-800">{item.title || "Update"}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.body || "You have a new notification."}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-[#FE9800] text-white flex items-center justify-center text-xs font-bold cursor-pointer overflow-hidden"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/donor/account");
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center gap-2"
                >
                  <Settings size={14} />
                  Account Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
