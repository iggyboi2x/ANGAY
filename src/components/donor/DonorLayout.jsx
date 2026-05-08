import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings, Wheat, X, CheckCircle, Calendar } from "lucide-react";
import { supabase } from "../../../supabase";

import { useProfile } from "../../hooks/useProfile";
import CalendarPanel from "../../components/CalendarPanel";

export default function DonorLayout({ children }) {
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { id: userId, displayName: userName, initials, avatarUrl, loading: profileLoading } = useProfile();
  const [notifOpen, setNotifOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeCrises, setActiveCrises] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastViewedMsgs, setLastViewedMsgs] = useState(() => {
    return localStorage.getItem(`last_viewed_msgs_${userId}`) || new Date(0).toISOString();
  });
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [hasNew, setHasNew] = useState(false);

  const loadCrises = async () => {
    const { data } = await supabase
      .from('barangays')
      .select('id, barangay_name, crisis_type, is_in_crisis')
      .eq('is_in_crisis', true);
    if (data) {
      setActiveCrises(data);
    }
  };

  const loadUnreadMessages = async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .neq("user_id", userId)
      .gt("created_at", lastViewedMsgs);

    setUnreadMessages(count || 0);
  };

  const loadNotifications = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadNotifications();
    loadUnreadMessages();
    loadCrises();

    const notifChannel = supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => loadNotifications())
      .subscribe();

    const msgChannel = supabase
      .channel(`unread-msgs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, () => loadUnreadMessages())
      .subscribe();

    const crisisChannel = supabase
      .channel('global-crisis')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'barangays' }, () => loadCrises())
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(crisisChannel);
    };
  }, [userId, lastViewedMsgs]);

  useEffect(() => {
    const hasUnreadNotif = notifications.some(n => !n.is_read);
    const hasCrises = activeCrises.length > 0;
    setHasNew(hasUnreadNotif || hasCrises);
  }, [notifications, activeCrises]);

  const handleMessagesClick = () => {
    const now = new Date().toISOString();
    localStorage.setItem(`last_viewed_msgs_${userId}`, now);
    setLastViewedMsgs(now);
    setUnreadMessages(0);
  };

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

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      loadNotifications();
    }

    if (notif.title?.toLowerCase().includes("accepted")) {
      navigate("/donor/donations?tab=accepted");
    } else if (notif.title?.toLowerCase().includes("declined")) {
      navigate("/donor/donations?tab=rejected");
    } else {
      navigate("/donor/donations");
    }
    setNotifOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleToggleNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) {
      setHasNew(false); // Clear dot when dropdown is opened
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF1]" style={{ fontFamily: "'Fredoka', sans-serif" }}>
      <nav className="bg-white border-b border-gray-100 px-10 py-3.5 flex items-center justify-between sticky top-0 z-[5000] shadow-sm">
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
            { label: "Messages", to: "/donor/messages", count: unreadMessages },
          ].map(({ label, to, count }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (label === "Messages") {
                  handleMessagesClick();
                }
              }}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors pb-0.5 flex items-center gap-1 ${isActive
                  ? "text-[#FE9800] border-b-2 border-[#FE9800]"
                  : "text-gray-500 hover:text-[#FE9800]"
                }`
              }
            >
              <span className="relative">
                {label}
                {count > 0 && (
                  <span className="absolute -top-2 -right-4 bg-[#FE9800] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                    {count}
                  </span>
                )}
              </span>
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCalendarOpen(true)}
            className="p-2 text-gray-400 hover:text-[#FE9800] transition-colors rounded-full hover:bg-orange-50"
            title="View Calendar"
          >
            <Calendar size={18} />
          </button>

          <div className="relative" ref={notifRef}>
            <button
              onClick={handleToggleNotif}
              className="p-2 text-gray-400 hover:text-[#FE9800] transition-colors rounded-full hover:bg-orange-50 relative"
            >
              <Bell size={18} />
              {hasNew && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <p className="text-sm font-black text-gray-800 tracking-tight">Notifications</p>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {activeCrises.map((c) => (
                    <button
                      key={`crisis-${c.id}`}
                      onClick={() => { 
                        setNotifOpen(false); 
                        navigate(`/donor/home?focus=${c.id}`); 
                      }}
                      className="w-full px-5 py-4 border-b-2 border-red-100 bg-red-50/50 hover:bg-red-50 transition-all text-left flex gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-100 animate-pulse">
                        <Flame size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Emergency</p>
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                        </div>
                        <p className="text-xs font-black text-gray-900 leading-tight">
                          {c.barangay_name} is facing a {c.crisis_type}
                        </p>
                        <p className="text-[10px] text-red-500/70 font-bold mt-1 uppercase tracking-tighter italic">Support needed immediately</p>
                      </div>
                    </button>
                  ))}

                  {notifications.length === 0 && activeCrises.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-xs text-gray-400 font-medium">No updates to show.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full px-5 py-4 border-b border-gray-50 transition-all text-left flex gap-3 ${!item.is_read ? 'bg-orange-50/70 hover:bg-orange-100/70' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center shadow-sm ${item.title?.toLowerCase().includes('declined') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                          {item.title?.toLowerCase().includes('declined') ? <X size={15} /> : <CheckCircle size={15} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-gray-800 truncate ${!item.is_read ? 'text-[#FE9800]' : ''}`}>{item.title}</p>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.body}</p>
                          <p className="text-[9px] text-gray-400 mt-1.5 font-bold uppercase tracking-wider">
                            {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </button>
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
      <CalendarPanel isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  );
}
