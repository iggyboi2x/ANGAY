import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Gift, Send } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';

export default function NotificationBell() {
  const { id: foodbankId } = useProfile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const navigate = useNavigate();
  const ref = useRef();

  const loadNotifications = async () => {
    if (!foodbankId) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', foodbankId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNotifications(data);
      setHasNew(data.some(n => !n.is_read));
    }
  };

  useEffect(() => {
    if (!foodbankId) return;
    loadNotifications();

    const channel = supabase
      .channel(`fb-notifs-${foodbankId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${foodbankId}` 
      }, () => loadNotifications())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [foodbankId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    // Mark as read in DB
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      loadNotifications();
    }

    // Redirection logic
    if (notif.title?.toLowerCase().includes("proposal") || notif.title?.toLowerCase().includes("donation")) {
      navigate("/foodbank/donations");
    } else if (notif.title?.toLowerCase().includes("received")) {
      navigate("/foodbank/packages");
    }
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setHasNew(false); // clear dot when opened
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-[#888888] hover:text-[#FE9800] hover:bg-orange-50 rounded-full transition-colors"
      >
        <Bell size={18} />
        {hasNew && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#F0F0F0] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-5 py-4 border-b border-[#F0F0F0] bg-gray-50/50 flex justify-between items-center">
            <span className="text-sm font-black text-[#1A1A1A] tracking-tight">NOTIFICATIONS</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center text-xs text-[#888] font-medium">
                No updates yet
              </div>
            ) : (
              notifications.map((n) => (
                <button 
                  key={n.id} 
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full px-5 py-4 border-b border-[#F0F0F0] last:border-0 transition-all text-left flex gap-3 ${!n.is_read ? 'bg-orange-50/70 hover:bg-orange-100/70' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${n.title?.toLowerCase().includes('proposal') ? 'bg-[#FFF3DC] text-[#FE9800]' : 'bg-green-50 text-green-500'}`}>
                    {n.title?.toLowerCase().includes('proposal') ? <Gift size={15} /> : <Send size={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold text-[#1A1A1A] truncate ${!n.is_read ? 'text-[#FE9800]' : ''}`}>{n.title}</p>
                    <p className="text-[11px] text-[#555] mt-1 leading-snug line-clamp-2">{n.body}</p>
                    <p className="text-[9px] text-[#888] mt-1.5 font-bold uppercase tracking-wider">
                      {new Date(n.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

