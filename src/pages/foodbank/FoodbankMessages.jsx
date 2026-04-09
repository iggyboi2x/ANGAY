import { useState } from 'react';
import FoodbankSidebar from '../../components/foodbank/FoodbankSidebar';
import { Search, Send, MoreVertical } from 'lucide-react';

const conversations = [
  {
    id: 1,
    name: 'John Doe',
    avatar: 'JD',
    avatarColor: '#FE9800',
    role: 'Donor',
    lastMessage: 'Your donation of Rice 50kg has been confirmed!',
    time: '10:32 AM',
    unread: 2,
    messages: [
      { from: 'them', text: 'Hi! I\'d like to donate 50kg of rice. Is that possible?', time: '9:05 AM' },
      { from: 'me',   text: 'Absolutely! That would be very helpful for our community.', time: '9:10 AM' },
      { from: 'me',   text: 'We have a scheduled pickup on March 20, 2026. Would that work?', time: '9:12 AM' },
      { from: 'them', text: 'Yes, that works perfectly for me.', time: '9:20 AM' },
      { from: 'me',   text: 'Your donation of Rice 50kg has been confirmed!', time: '10:32 AM' },
    ],
  },
  {
    id: 2,
    name: 'Maria Cruz',
    avatar: 'MC',
    avatarColor: '#34d399',
    role: 'Donor',
    lastMessage: 'When can we schedule the pickup?',
    time: 'Yesterday',
    unread: 1,
    messages: [
      { from: 'them', text: 'Hello! I have some canned goods to donate — about 3 boxes.', time: 'Mar 21' },
      { from: 'me',   text: 'Thank you so much, Maria! How many cans roughly?', time: 'Mar 21' },
      { from: 'them', text: 'Around 60 cans total. When can we schedule the pickup?', time: 'Mar 21' },
    ],
  },
  {
    id: 3,
    name: 'Barangay Luz',
    avatar: 'BL',
    avatarColor: '#60a5fa',
    role: 'Barangay',
    lastMessage: 'We need more rice supplies this week.',
    time: 'Mar 18',
    unread: 0,
    messages: [
      { from: 'them', text: 'Good morning! We need more rice supplies this week.', time: 'Mar 18' },
      { from: 'me',   text: 'Noted! We\'ll schedule a distribution for March 20.', time: 'Mar 18' },
    ],
  },
  {
    id: 4,
    name: 'ABC Corporation',
    avatar: 'AC',
    avatarColor: '#a78bfa',
    role: 'Donor',
    lastMessage: 'We can donate cooking oil and vegetables.',
    time: 'Mar 15',
    unread: 0,
    messages: [
      { from: 'them', text: 'Hi! We\'re ABC Corp and we\'d like to make a bulk donation.', time: 'Mar 15' },
      { from: 'me',   text: 'That\'s wonderful! What items are you looking to donate?', time: 'Mar 15' },
      { from: 'them', text: 'We can donate cooking oil and vegetables.', time: 'Mar 15' },
    ],
  },
];

const roleBadgeStyle = (role) =>
  role === 'Barangay'
    ? 'bg-blue-50 text-blue-500'
    : 'bg-orange-50 text-[#C97700]';

export default function FoodbankMessages() {
  const [selected, setSelected] = useState(conversations[0]);
  const [input, setInput]       = useState('');
  const [chats, setChats]       = useState(conversations);

  const handleSend = () => {
    if (!input.trim()) return;
    const now    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = { from: 'me', text: input, time: now };
    const updated = chats.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input, time: now, unread: 0 }
        : c
    );
    setChats(updated);
    setSelected((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setInput('');
  };

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 flex" style={{ height: '100vh' }}>
        {/* Conversation List */}
        <aside className="w-72 bg-white border-r border-[#F0F0F0] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[#F0F0F0]">
            <h2 className="text-base font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: 'DM Sans' }}>
              Messages
            </h2>
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB]">
              <Search size={14} className="text-[#888888]" />
              <input type="text" placeholder="Search conversations..."
                className="bg-transparent text-xs text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {chats.map((c) => (
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
                    <span className="text-sm font-semibold text-[#1A1A1A] truncate" style={{ fontFamily: 'DM Sans' }}>
                      {c.name}
                    </span>
                    <span className="text-[11px] text-[#AAAAAA] flex-shrink-0" style={{ fontFamily: 'DM Sans' }}>
                      {c.time}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeStyle(c.role)}`}
                    style={{ fontFamily: 'DM Sans' }}>
                    {c.role}
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#888888] truncate pr-2" style={{ fontFamily: 'DM Sans' }}>
                      {c.lastMessage}
                    </p>
                    {c.unread > 0 && (
                      <span className="bg-[#FE9800] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
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
        <div className="flex-1 flex flex-col bg-[#FAFAFA]">
          {/* Header */}
          <div className="bg-white border-b border-[#F0F0F0] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selected.avatarColor }}>
                {selected.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: 'DM Sans' }}>
                  {selected.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  <p className="text-xs text-green-500" style={{ fontFamily: 'DM Sans' }}>Active now</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeStyle(selected.role)}`}
                    style={{ fontFamily: 'DM Sans' }}>
                    {selected.role}
                  </span>
                </div>
              </div>
            </div>
            <button className="p-2 text-[#888888] hover:text-[#555] rounded-full hover:bg-[#F5F5F5] transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm
                  ${msg.from === 'me'
                    ? 'bg-[#FE9800] text-white rounded-br-sm'
                    : 'bg-white text-[#333] border border-[#F0F0F0] shadow-sm rounded-bl-sm'}`}>
                  <p style={{ fontFamily: 'DM Sans' }}>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-orange-100' : 'text-[#AAAAAA]'}`}
                    style={{ fontFamily: 'DM Sans' }}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-[#F0F0F0] px-6 py-4">
            <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-xl px-4 py-2.5 border border-[#EBEBEB]">
              <input type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-[#333] outline-none placeholder:text-[#AAAAAA]"
                style={{ fontFamily: 'DM Sans' }} />
              <button onClick={handleSend} disabled={!input.trim()}
                className="bg-[#FE9800] text-white p-2 rounded-lg hover:bg-[#e58a00] transition-colors disabled:opacity-40">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
