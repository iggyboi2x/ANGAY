import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Gift, Send, AlertTriangle, Flame } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';

export default function NotificationBell() {
  const { id: foodbankId } = useProfile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeCrises, setActiveCrises] = useState([]);
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
    }
  };

  const loadCrises = async () => {
    const { data } = await supabase
      .from('barangays')
      .select('id, barangay_name, crisis_type, is_in_crisis')
      .eq('is_in_crisis', true);
    if (data) {
      setActiveCrises(data);
    }
  };

  useEffect(() => {
    if (!foodbankId) return;
    loadNotifications();
    loadCrises();

    const notifChannel = supabase
      .channel(`fb-notifs-${foodbankId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${foodbankId}` }, () => loadNotifications())
      .subscribe();

    const crisisChannel = supabase
      .channel('global-crisis')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'barangays' }, () => loadCrises())
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(crisisChannel);
    };
  }, [foodbankId]);

  useEffect(() => {
    const hasUnreadNotif = notifications.some(n => !n.is_read);
    const hasCrises = activeCrises.length > 0;
    setHasNew(hasUnreadNotif || hasCrises);
  }, [notifications, activeCrises]);

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
            {activeCrises.map((c) => (
              <button 
                key={`crisis-${c.id}`}
                onClick={() => { 
                  setOpen(false); 
                  navigate(`/foodbank/dashboard?focus=${c.id}`);
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
                    Barangay {c.barangay_name.replace(/^barangay\s+/i, '')} is facing a {c.crisis_type}
                  </p>
                  <p className="text-[10px] text-red-500/70 font-bold mt-1 uppercase tracking-tighter italic">Responders needed immediately</p>
                </div>
              </button>
            ))}

            {notifications.length === 0 && activeCrises.length === 0 ? (
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

