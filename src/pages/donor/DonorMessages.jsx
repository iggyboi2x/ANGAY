import { useEffect, useMemo, useState } from "react";
import DonorLayout from "../../components/donor/DonorLayout";
import { Search, Send, MoreVertical } from "lucide-react";
import { supabase } from "../../../supabase";

const formatMessageTime = (raw) => {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function DonorMessages() {
  const [selectedId, setSelectedId] = useState(null);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const selected = useMemo(() => chats.find((chat) => chat.id === selectedId) || null, [chats, selectedId]);

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id || null;
      setCurrentUserId(userId);

      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, receiver_id, content, created_at, is_read")
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (error) {
          setChats([]);
        } else {
          const grouped = new Map();
          (data || []).forEach((msg) => {
            const key = msg.conversation_id || `${msg.sender_id}-${msg.receiver_id}`;
            if (!grouped.has(key)) {
              grouped.set(key, {
                id: key,
                name: "Conversation " + String(key).slice(0, 8),
                avatar: "AN",
                avatarColor: "#FE9800",
                time: "",
                unread: 0,
                lastMessage: "",
                messages: [],
              });
            }

            const current = grouped.get(key);
            const isMine = msg.sender_id === userId;
            const message = {
              from: isMine ? "me" : "them",
              text: msg.content || "",
              time: formatMessageTime(msg.created_at),
            };
            current.messages.push(message);
            current.lastMessage = msg.content || "";
            current.time = formatMessageTime(msg.created_at);
            if (!msg.is_read) current.unread += 1;
          });

          const nextChats = Array.from(grouped.values());
          setChats(nextChats);
          if (nextChats.length > 0) setSelectedId(nextChats[0].id);
        }
        setLoading(false);
      }
    };

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !selected) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "me", text: input, time: now };
    const content = input;
    const updated = chats.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: content, time: now }
        : c
    );
    setChats(updated);
    setInput("");

    if (currentUserId) {
      await supabase.from("messages").insert({
        conversation_id: selected.id,
        sender_id: currentUserId,
        content,
      });
    }
  };

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DonorLayout>
      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
        <aside className="w-80 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">Messages</h2>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent text-xs text-gray-600 outline-none w-full placeholder-gray-400"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <p className="text-xs text-gray-400 px-4 py-5">Loading conversations...</p>
            ) : filteredChats.length === 0 ? (
              <p className="text-xs text-gray-400 px-4 py-5">No conversations found.</p>
            ) : filteredChats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 transition-colors border-b border-gray-50 ${
                  selected?.id === c.id ? "bg-orange-50 border-l-2 border-l-[#FE9800]" : ""
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

        <div className="flex-1 flex flex-col bg-[#FFFAF1]">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
            {selected ? (
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
            ) : (
              <p className="text-sm text-gray-500">Select a conversation</p>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {!selected ? (
              <p className="text-sm text-gray-400">No active chat selected.</p>
            ) : selected.messages.map((msg, i) => (
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
                disabled={!input.trim() || !selected}
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
