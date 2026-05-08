import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Package, Box, Gift, Settings, LogOut, Wheat, X, AlertTriangle } from 'lucide-react';
import ReportModal from '../ReportModal';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';

const navItemsList = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/foodbank/dashboard' },
  { label: 'Messages',  icon: MessageSquare,   to: '/foodbank/messages', key: 'messages'  },
  { label: 'Inventory', icon: Package,          to: '/foodbank/inventory' },
  { label: 'Packages',  icon: Box,              to: '/foodbank/packages'  },
  { label: 'Donations', icon: Gift,             to: '/foodbank/donations' },
];

export default function FoodbankSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const { id: userId } = useProfile();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [lastViewedMsgs, setLastViewedMsgs] = useState(() => {
    return localStorage.getItem(`fb_last_viewed_msgs_${userId}`) || new Date(0).toISOString();
  });

  const loadUnreadMessages = async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .neq("user_id", userId)
      .gt("created_at", lastViewedMsgs);
    
    setUnreadMessages(count || 0);
  };

  useEffect(() => {
    if (!userId) return;
    loadUnreadMessages();

    const channel = supabase
      .channel(`fb-unread-msgs-${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, () => loadUnreadMessages())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId, lastViewedMsgs]);

  const handleMessagesClick = () => {
    const now = new Date().toISOString();
    localStorage.setItem(`fb_last_viewed_msgs_${userId}`, now);
    setLastViewedMsgs(now);
    setUnreadMessages(0);
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden" 
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}
      <div className={`w-60 bg-white h-screen flex flex-col fixed left-0 top-0 border-r border-[#F0F0F0] z-50 transition-transform transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat size={20} className="text-[#FE9800]" />
            <h1 className="text-[24px] text-[#FE9800]" style={{ fontFamily: 'Fredoka', fontWeight: 700 }}>ANGAY</h1>
          </div>
          {mobileOpen && setMobileOpen && (
            <button className="md:hidden text-[#888888] hover:bg-gray-100 p-1 rounded-md" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

      {/* Nav */}
      <nav className="flex-1 px-4 pt-2">
        {navItemsList.map(({ label, icon: Icon, to, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => {
              if (key === 'messages') handleMessagesClick();
              if (mobileOpen && setMobileOpen) setMobileOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 h-12 rounded-lg transition-colors relative mb-1 ${
                isActive ? 'bg-[#FFF3DC] text-[#FE9800]' : 'text-[#444444] hover:bg-[#F8F8F8]'
              }`
            }
          >
            <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#FE9800] rounded-r hidden [.active_&]:block" />
            <Icon size={18} />
            <span className="text-[14px] flex-1" style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>
              {label}
            </span>
            {key === 'messages' && unreadMessages > 0 && (
              <span className="bg-[#FE9800] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                {unreadMessages}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#F0F0F0] px-4 py-4">
        <NavLink
          to="/account/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 h-12 rounded-lg transition-colors relative mb-1 ${
              isActive ? 'bg-[#FFF3DC] text-[#FE9800]' : 'text-[#444444] hover:bg-[#F8F8F8]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FE9800] rounded-r" />}
              <Settings size={18} className={isActive ? 'text-[#FE9800]' : 'text-[#888888]'} />
              <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: isActive ? 600 : 500 }}>
                Account Settings
              </span>
            </>
          )}
        </NavLink>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 px-4 h-12 text-[#444444] hover:bg-red-50 hover:text-[#E74C3C] rounded-lg transition-colors w-full"
        >
          <LogOut size={18} className="text-[#888888]" />
          <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>Logout</span>
        </button>

        <button
          onClick={() => setReportOpen(true)}
          className="flex items-center gap-3 px-4 h-12 text-gray-400 hover:bg-orange-50 hover:text-[#FE9800] rounded-lg transition-colors w-full group mt-1"
        >
          <AlertTriangle size={18} className="text-gray-400 group-hover:text-[#FE9800]" />
          <span className="text-[14px]" style={{ fontFamily: 'DM Sans', fontWeight: 500 }}>Report Issue</span>
        </button>
      </div>
      </div>

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}