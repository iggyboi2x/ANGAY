import { useState, useEffect, useRef } from 'react';
import { Bell, Package, Gift } from 'lucide-react';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';

export default function BarangayNotificationBell() {
  const { id: barangayId, displayName: barangayName } = useProfile();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef();

  useEffect(() => {
    if (!barangayId) return;

    const loadNotifications = async () => {
      // 1. Fetch incoming distributions (Foodbank -> Barangay pending packages)
      const { data: pendingDists } = await supabase
        .from('distributions')
        .select('id, foodbank_name, items, created_at')
        .eq('barangay_id', barangayId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      let proposedDonations = [];
      // 2. Fetch donation proposals (Donor -> Foodbank targeted for this barangay)
      if (barangayName) {
         // Use ilike for partial case-insensitive matching
         const { data: proposals } = await supabase
           .from('donations')
           .select('id, donor_name, items, created_at')
           .ilike('barangay_name', `%${barangayName}%`)
           .eq('status', 'pending')
           .order('created_at', { ascending: false })
           .limit(5);
         proposedDonations = proposals || [];
      }

      const notifs = [];

      (pendingDists || []).forEach(d => {
        notifs.push({
          id: `dist-pending-${d.id}`,
          type: 'incoming_activity',
          title: 'Incoming Food Aid',
          message: `${d.foodbank_name || 'A Foodbank'} has prepared a distribution of ${d.items} for your barangay.`,
          time: d.created_at,
          icon: <Package size={16} className="text-blue-500" />
        });
      });

      proposedDonations.forEach(d => {
        notifs.push({
          id: `don-${d.id}`,
          type: 'donation_proposal',
          title: 'Donation Proposal Targeting You',
          message: `${d.donor_name || 'A Donor'} proposed a donation of ${d.items} to a Foodbank, targeting your barangay.`,
          time: d.created_at,
          icon: <Gift size={16} className="text-[#FE9800]" />
        });
      });

      // Sort by time descending
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setNotifications(notifs);
      setUnreadCount(notifs.length); 
    };

    loadNotifications();
  }, [barangayId, barangayName]);

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
      setUnreadCount(0);
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'donation_proposal' ? 'bg-[#FFF3DC]' : 'bg-blue-50'}`}>
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
               <a href="/barangay/donations" className="text-xs font-bold text-[#FE9800] hover:underline">View all in Food Aid</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
