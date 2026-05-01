import { createContext, useEffect, useState } from "react";
import { supabase } from "../../supabase";

export const PresenceContext = createContext(new Set());

export function PresenceProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    let channel = null;

    const setupPresence = async (userId) => {
      if (channel) {
        supabase.removeChannel(channel);
      }

      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: userId || 'anonymous',
          },
        },
      });

      channel.on('presence', { event: 'sync' }, () => {
        if (!mounted) return;
        const state = channel.presenceState();
        const onlineIds = new Set();
        for (const id in state) {
          if (id !== 'anonymous') {
            onlineIds.add(id);
          }
        }
        setOnlineUsers(onlineIds);
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && userId && mounted) {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    };

    // Initial setup
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        setupPresence(user?.id);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setupPresence(session?.user?.id);
      }
    });

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <PresenceContext.Provider value={onlineUsers}>
      {children}
    </PresenceContext.Provider>
  );
}
