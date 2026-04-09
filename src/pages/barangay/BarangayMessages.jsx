import { useState } from 'react';
import BarangaySidebar from '../../components/barangay/BarangaySidebar';
import { Search, Send } from 'lucide-react';

const conversations = [
  {
    id: 1, name: 'Ramon Dela Cruz', avatar: 'RC', avatarColor: '#FE9800',
    type: 'citizen', lastMessage: 'Thank you for the assistance!', time: '10:30 AM', unread: 0,
    messages: [
      { from: 'them', text: 'Good morning! Is there a distribution scheduled this week?', time: '10:00 AM' },
      { from: 'me',   text: 'Yes, distribution is on March 20 at the barangay hall.', time: '10:05 AM' },
      { from: 'them', text: 'Thank you for the assistance!', time: '10:30 AM' },
    ],
  },
  {
    id: 2, name: 'Cebu City Food Bank', avatar: 'CF', avatarColor: '#FE9800',
    type: 'foodbank', lastMessage: 'We have rice available', time: '9:15', unread: 3,
    messages: [
      { from: 'them', text: 'Good morning! We have rice and canned goods available for distribution.', time: '9:10 AM' },
      { from: 'me',   text: 'That\'s great! We need about 100kg of rice for our community.', time: '9:12 AM' },
      { from: 'them', text: 'We can provide that. When would you like to schedule the pickup?', time: '9:15 AM' },
      { from: 'me',   text: 'Would Friday morning work for you?', time: '9:18 AM' },
    ],
  },
  {
    id: 3, name: 'Sofia Reyes', avatar: 'SR', avatarColor: '#FE9800',
    type: 'citizen', lastMessage: 'Is there a distribution today?', time: 'Yesterday', unread: 0,
    messages: [
      { from: 'them', text: 'Is there a distribution today?', time: 'Yesterday' },
      { from: 'me',   text: 'Not today, but we have one scheduled for March 20.', time: 'Yesterday' },
    ],
  },
  {
    id: 4, name: 'Caritas Food Center', avatar: 'CC', avatarColor: '#FE9800',
    type: 'foodbank', lastMessage: 'Confirmed for tomorrow', time: 'Mar 15', unread: 0,
    messages: [
      { from: 'me',   text: 'Hi! Can you deliver cooking oil and vegetables this week?', time: 'Mar 15' },
      { from: 'them', text: 'Confirmed for tomorrow.', time: 'Mar 15' },
    ],
  },
];

const FILTERS = ['All', 'Citizens', 'Foodbanks'];

export default function BarangayMessages() {
  const [selected, setSelected]   = useState(conversations[1]);
  const [input, setInput]         = useState('');
  const [chats, setChats]         = useState(conversations);
  const [activeFilter, setFilter] = useState('All');

  const filtered = chats.filter(c => {
    if (activeFilter === 'Citizens')  return c.type === 'citizen';
    if (activeFilter === 'Foodbanks') return c.type === 'foodbank';
    return true;
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { from: 'me', text: input, time: now };
    const updated = chats.map(c =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input, time: now, unread: 0 }
        : c
    );
    setChats(updated);
    setSelected(prev => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setInput('');
  };

  return (
    <div className="flex min-h-screen bg-white">
      <BarangaySidebar />

      <div className="ml-60 flex-1 flex" style={{ height: '100vh' }}>
        {/* Conversation List */}
        <aside className="w-72 bg-white border-r border-[#F0F0F0] flex flex-col flex-shrink-0">
          {/* Search */}
          <div className="p-4 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-3 py-2 border border-[#EBEBEB]">
              <Search size={14} className="text-[#888888]" />
              <input type="text" placeholder="Search messages..."
                className="bg-transparent text-xs text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 px-4 py-3 border-b border-[#F0F0F0]">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all
                  ${activeFilter === f
                    ? 'bg-[#FE9800] text-white border-[#FE9800]'
                    : 'bg-white text-[#555] border-[#CCCCCC] hover:border-[#FE9800] hover:text-[#FE9800]'}`}
                style={{ fontFamily: 'DM Sans' }}>
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 transition-colors
                  border-b border-[#F5F5F5]
                  ${selected.id === c.id ? 'bg-orange-50 border-l-2 border-l-[#FE9800]' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: c.avatarColor }}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1A1A1A] truncate" style={{ fontFamily: 'DM Sans' }}>{c.name}</span>
                    <span className="text-[11px] text-[#AAAAAA] flex-shrink-0" style={{ fontFamily: 'DM Sans' }}>{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-[#888888] truncate pr-2" style={{ fontFamily: 'DM Sans' }}>{c.lastMessage}</p>
                    {c.unread > 0 && (
                      <span className="bg-[#FE9800] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="border-b border-[#F0F0F0] px-6 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: selected.avatarColor }}>
              {selected.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>{selected.name}</p>
              <p className="text-xs text-[#888888] capitalize" style={{ fontFamily: 'DM Sans' }}>{selected.type}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4 bg-white">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm
                  ${msg.from === 'me'
                    ? 'bg-[#FE9800] text-white rounded-br-sm'
                    : 'bg-[#F5F5F5] text-[#333] rounded-bl-sm'}`}>
                  <p style={{ fontFamily: 'DM Sans' }}>{msg.text}</p>
                </div>
                <span className="text-[11px] text-[#AAAAAA] mt-1 px-1" style={{ fontFamily: 'DM Sans' }}>{msg.time}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-[#F0F0F0] px-6 py-4 bg-white">
            <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-xl px-4 py-2.5 border border-[#EBEBEB]">
              <input type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-[#333] outline-none placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
              <button onClick={handleSend} disabled={!input.trim()}
                className="bg-[#FE9800] text-white p-2 rounded-full hover:bg-[#e58a00] transition-colors disabled:opacity-40">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
