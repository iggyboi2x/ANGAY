import { useState, useEffect, useRef } from 'react';
import { Search, Send, User, Building2, Home } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../supabase';
import { useProfile } from '../../hooks/useProfile';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';

export default function BarangayMessages() {
  const { id: myId } = useProfile();
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const scrollRef = useRef();

  // 1. Initial Load and Redirect handling
  useEffect(() => {
    if (myId) {
      const init = async () => {
        const convos = await fetchConversations();
        
        const targetUser = location.state?.targetUser;
        if (targetUser) {
          // 1. Check if we already have a conversation with this person
          const existing = convos.find(c => c.other_user_id === targetUser.id);
          if (existing) {
            setSelected(existing);
          } else {
            // 2. Fetch/Prepare profile but don't create room yet
            const name = targetUser.org_name || targetUser.full_name || targetUser.name || 'User';
            setSelected({ 
              room_id: null, 
              other_user_id: targetUser.id, 
              name: name,
              avatar: targetUser.file_url || targetUser.avatar || null,
              initials: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
              type: targetUser.role || 'user'
            });
          }
        } else if (!selected && convos.length > 0) {
          setSelected(convos[0]);
        }
      };
      init();
    }
  }, [myId]);

  // 2. Real-time Subscription
  useEffect(() => {
    if (!myId) return;
    const subscription = supabase
      .channel('messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        fetchConversations();
        if (selected?.room_id === payload.new.room_id) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [myId, selected?.room_id]);

  // 3. Fetch messages when selection changes
  useEffect(() => {
    if (selected?.room_id) {
      fetchMessages(selected.room_id);
    } else {
      setMessages([]);
    }
  }, [selected?.room_id]);

  // 4. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data: memberships } = await supabase.from('room_members').select('room_id').eq('user_id', myId);
      if (!memberships || memberships.length === 0) { setConversations([]); return []; }

      const roomIds = memberships.map(m => m.room_id);
      const [membersRes, msgsRes] = await Promise.all([
        supabase.from('room_members').select('room_id, user_id').in('room_id', roomIds),
        supabase.from('messages').select('room_id, content, created_at').in('room_id', roomIds).order('created_at', { ascending: false })
      ]);

      const allMembers = membersRes.data || [];
      const allMsgs = msgsRes.data || [];
      const convos = [];

      for (const roomId of roomIds) {
        const otherMember = allMembers.find(m => m.room_id === roomId && m.user_id !== myId);
        if (!otherMember) continue;

        const latestMsg = allMsgs.find(m => m.room_id === roomId);
        const profile = await fetchProfile(otherMember.user_id);

        convos.push({
          room_id: roomId,
          other_user_id: otherMember.user_id,
          ...profile,
          lastMessage: latestMsg?.content || 'No messages yet',
          time: latestMsg ? new Date(latestMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          raw_time: latestMsg?.created_at || '0'
        });
      }

      convos.sort((a, b) => new Date(b.raw_time) - new Date(a.raw_time));
      setConversations(convos);
      return convos;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return [];
    }
  };

  const fetchProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) {
      const name = data.org_name || data.full_name || 'User';
      return {
        id,
        name: name,
        avatar: data.file_url || null,
        initials: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        type: data.role
      };
    }
    return { id, name: 'Unknown', initials: '?', type: 'user' };
  };

  const fetchMessages = async (roomId) => {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const handleSearch = async (val) => {
    setSearchTerm(val);
    if (val.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const { data } = await supabase.from('profiles').select('id, full_name, org_name, role, file_url').or(`full_name.ilike.%${val}%,org_name.ilike.%${val}%`).neq('id', myId).limit(5);
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const startConversation = async (otherUser) => {
    // 1. Check if room exists
    const { data: myRooms } = await supabase.from('room_members').select('room_id').eq('user_id', myId);
    const { data: theirRooms } = await supabase.from('room_members').select('room_id').eq('user_id', otherUser.id);
    const myIds = new Set((myRooms || []).map(r => r.room_id));
    const sharedRoomId = (theirRooms || []).find(r => myIds.has(r.room_id))?.room_id;

    const profile = await fetchProfile(otherUser.id);
    if (sharedRoomId) {
      setSelected({ room_id: sharedRoomId, other_user_id: otherUser.id, ...profile });
    } else {
      setSelected({ room_id: null, other_user_id: otherUser.id, ...profile });
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const createRoomAndSend = async (content) => {
    try {
      // 1. Create Room
      const { data: room, error: re } = await supabase.from('rooms').insert([{ name: null }]).select().single();
      if (re) throw re;

      // 2. Add Members (Sequential)
      await supabase.from('room_members').insert([{ room_id: room.id, user_id: myId }]);
      await supabase.from('room_members').insert([{ room_id: room.id, user_id: selected.other_user_id }]);

      // 3. Send Message
      const { error: me } = await supabase.from('messages').insert([{ room_id: room.id, user_id: myId, content }]);
      if (me) throw me;
      
      // Update local state to reflect the new room
      setSelected(prev => ({ ...prev, room_id: room.id }));
      fetchConversations();
    } catch (err) {
      console.error('Error creating room/sending message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selected || !myId) return;
    const content = input;
    setInput('');

    if (!selected.room_id) {
      await createRoomAndSend(content);
    } else {
      const { error } = await supabase.from('messages').insert([{ room_id: selected.room_id, user_id: myId, content }]);
      if (error) {
        console.error('Send error:', error);
        alert('Could not send message.');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />
      <div className="ml-60 flex-1 flex overflow-hidden" style={{ height: '100vh' }}>

        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-[#F0F0F0] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#F0F0F0] relative">
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-3 py-2.5 border border-[#EBEBEB] focus-within:border-[#FE9800] transition-all">
              <Search size={14} className="text-[#888888]" />
              <input type="text" value={searchTerm} onChange={e => handleSearch(e.target.value)}
                placeholder="Search people..."
                className="bg-transparent text-xs text-[#555] outline-none w-full"
                style={{ fontFamily: 'DM Sans' }} />
            </div>

            {searchTerm.length >= 2 && (
              <div className="absolute left-4 right-4 top-16 bg-white border border-gray-200 rounded-xl shadow-xl z-20 overflow-hidden">
                {isSearching ? <div className="p-4 text-center text-xs text-gray-400">Searching...</div> :
                  searchResults.length === 0 ? <div className="p-4 text-center text-xs text-gray-400">No profiles found</div> :
                  searchResults.map(res => (
                    <button key={res.id} onClick={() => startConversation(res)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#FE9800]">
                        {res.role === 'foodbank' ? <Building2 size={14} /> : res.role === 'barangay' ? <Home size={14} /> : <User size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{res.org_name || res.full_name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{res.role}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {conversations.length === 0 ? <div className="p-10 text-center text-xs text-gray-400">No chats yet.</div> :
              conversations.map(c => (
                <button key={c.room_id} onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-orange-50 transition-all border-b border-[#F5F5F5]
                    ${selected?.room_id === c.room_id ? 'bg-orange-50 border-l-4 border-l-[#FE9800]' : 'border-l-4 border-l-transparent'}`}>
                  {c.avatar ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" /> :
                    <div className="w-10 h-10 rounded-full bg-[#FE9800] flex items-center justify-center text-white text-xs font-bold shrink-0">{c.initials}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A1A1A] truncate">{c.name}</span>
                      <span className="text-[10px] text-[#AAAAAA]">{c.time}</span>
                    </div>
                    <p className="text-xs text-[#888888] truncate mt-0.5">{c.lastMessage}</p>
                  </div>
                </button>
              ))}
          </div>
        </aside>

        {/* Chat */}
        {selected ? (
          <div className="flex-1 flex flex-col bg-white">
            <div className="border-b border-[#F0F0F0] px-6 py-4 flex items-center gap-3 shrink-0">
              {selected.avatar ? <img src={selected.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" /> :
                <div className="w-10 h-10 rounded-full bg-[#FE9800] flex items-center justify-center text-white text-sm font-bold">{selected.initials}</div>}
              <div>
                <p className="text-sm font-bold text-[#1A1A1A]">{selected.name}</p>
                <p className="text-[11px] text-[#FE9800] font-semibold capitalize">{selected.type}</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 bg-[#F9FAFB]/30 custom-scrollbar">
              {messages.length === 0 && !selected.room_id ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Send size={20} className="text-[#FE9800]" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">Say hi to {selected.name}!</p>
                  <p className="text-[10px] text-gray-400 mt-1">Chat will start once you send a message.</p>
                </div>
              ) : messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.user_id === myId ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-md px-4 py-3 rounded-2xl text-sm shadow-sm
                    ${msg.user_id === myId ? 'bg-[#FE9800] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-[#333] rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-[#AAAAAA] mt-1.5 font-medium">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#F0F0F0] px-6 py-5 shrink-0">
              <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-2xl px-5 py-3 border border-[#EBEBEB] focus-within:border-[#FE9800] focus-within:bg-white transition-all shadow-sm">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-[#333] outline-none" />
                <button onClick={handleSend} disabled={!input.trim()}
                  className="bg-[#FE9800] text-white p-2 rounded-xl hover:bg-[#e58a00] transition-all disabled:opacity-40 active:scale-95">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#F9FAFB]/30">
            <Send size={24} className="text-gray-300 mb-4" />
            <p className="text-sm text-gray-400 font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
