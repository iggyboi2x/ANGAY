import { useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { Search, Send, MoreVertical } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Cebu City Food Bank",
    avatar: "CF",
    avatarColor: "#FE9800",
    lastMessage: "Your donation of Rice 50kg has been confirmed!",
    time: "10:32 AM",
    unread: 2,
    messages: [
      { from: "them", text: "Hello! Thank you for reaching out to Cebu City Food Bank.", time: "9:00 AM" },
      { from: "me", text: "Hi! I'd like to donate 50kg of rice. Is that possible?", time: "9:05 AM" },
      { from: "them", text: "Absolutely! That would be very helpful for our community.", time: "9:10 AM" },
      { from: "them", text: "We have a scheduled pickup on March 20, 2026. Would that work?", time: "9:12 AM" },
      { from: "me", text: "Yes, that works perfectly for me.", time: "9:20 AM" },
      { from: "them", text: "Your donation of Rice 50kg has been confirmed!", time: "10:32 AM" },
    ],
  },
  {
    id: 2,
    name: "Mandaue Food Hub",
    avatar: "MF",
    avatarColor: "#34d399",
    lastMessage: "We will contact you for the schedule soon.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { from: "me", text: "Hi Mandaue Food Hub! I have some canned goods to donate.", time: "Mar 21" },
      { from: "them", text: "Thank you so much! How many cans are you looking to donate?", time: "Mar 21" },
      { from: "me", text: "Around 3 boxes, roughly 60 cans total.", time: "Mar 21" },
      { from: "them", text: "That's wonderful! We will contact you for the schedule soon.", time: "Mar 22" },
    ],
  },
  {
    id: 3,
    name: "ANGAY Support",
    avatar: "AS",
    avatarColor: "#60a5fa",
    lastMessage: "How can we help you today?",
    time: "Mar 15",
    unread: 0,
    messages: [
      { from: "them", text: "Welcome to ANGAY! How can we help you today?", time: "Mar 15" },
    ],
  },
];

export default function DonorMessages() {
  const [selected, setSelected] = useState(conversations[0]);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState(conversations);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "me", text: input, time: now };
    const updated = chats.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: input, time: now }
        : c
    );
    setChats(updated);
    setSelected((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
    setInput("");
  };

  return (
    <DonorLayout>
      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">Messages</h2>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="bg-transparent text-xs text-gray-600 outline-none w-full placeholder-gray-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 transition-colors border-b border-gray-50 ${
                  selected.id === c.id ? "bg-orange-50 border-l-2 border-l-[#FE9800]" : ""
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: c.avatarColor }}
                >
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{c.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate pr-2">{c.lastMessage}</p>
                    {c.unread > 0 && (
                      <span className="bg-[#FE9800] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
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
        <div className="flex-1 flex flex-col bg-[#FFFAF1]">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selected.avatarColor }}
              >
                {selected.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{selected.name}</p>
                <p className="text-xs text-green-500">Active now</p>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <MoreVertical size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {selected.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === "me"
                    ? "bg-[#FE9800] text-white rounded-br-sm"
                    : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm"
                }`}>
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.from === "me" ? "text-orange-100" : "text-gray-400"}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
              />
              <button
                onClick={handleSend}
                className="bg-[#FE9800] text-white p-2 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-40"
                disabled={!input.trim()}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
}
