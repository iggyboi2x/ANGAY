import { useState, useEffect, useRef } from 'react';
import { Bell, Gift, Send } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';

export default function NotificationBell() {
  const { id: foodbankId } = useProfile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef();

  useEffect(() => {
    if (!foodbankId) return;

    const loadNotifications = async () => {
      // Fetch pending donations (Donor -> Foodbank proposals)
      const { data: pendingDonations } = await supabase
        .from('donations')
        .select('id, donor_name, items, created_at')
        .eq('foodbank_id', foodbankId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch received distributions (Foodbank -> Barangay received updates)
      const { data: receivedDists } = await supabase
        .from('distributions')
        .select('id, barangay_name, updated_at, created_at')
        .eq('foodbank_id', foodbankId)
        .eq('status', 'received')
        .order('updated_at', { ascending: false })
        .limit(5);

      const notifs = [];

      (pendingDonations || []).forEach(d => {
        notifs.push({
          id: `don-${d.id}`,
          type: 'donation_proposal',
          title: 'New Donation Proposal',
          message: `${d.donor_name} proposed to donate ${d.items}.`,
          time: d.created_at,
          icon: <Gift size={16} className="text-[#FE9800]" />
        });
      });

      (receivedDists || []).forEach(d => {
        notifs.push({
          id: `dist-${d.id}`,
          type: 'distribution_received',
          title: 'Donation Received',
          message: `${d.barangay_name} successfully received your food aid package.`,
          time: d.updated_at || d.created_at,
          icon: <Send size={16} className="text-green-500" />
        });
      });

      // Sort by time descending
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setNotifications(notifs);
      setUnreadCount(notifs.length); // Assuming they are all unread for simplicity
    };

    loadNotifications();
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

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setUnreadCount(0); // clear badge when opened
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-[#888888] hover:text-[#FE9800] hover:bg-orange-50 rounded-full transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FE9800] rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-[#F0F0F0] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-[#F0F0F0] bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>Notifications</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#888]">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b border-[#F0F0F0] last:border-0 hover:bg-gray-50 transition-colors flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'donation_proposal' ? 'bg-[#FFF3DC]' : 'bg-green-50'}`}>
                    {n.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{n.title}</p>
                    <p className="text-xs text-[#555] mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-[#888] mt-1">
                      {new Date(n.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-[#F0F0F0] bg-gray-50 text-center">
               <a href="/foodbank/donations" className="text-xs font-bold text-[#FE9800] hover:underline">View all in Donations</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
