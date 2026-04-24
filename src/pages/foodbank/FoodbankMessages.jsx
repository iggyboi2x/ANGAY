import { useCallback, useEffect, useMemo, useState } from "react";
import FoodbankSidebar from "../../components/foodbank/FoodbankSidebar";
import { Search, Send, MoreVertical } from "lucide-react";
import { supabase } from "../../../supabase";

const formatMessageTime = (raw) => {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const roleBadgeStyle = (role) =>
  role === "barangay" ? "bg-blue-50 text-blue-500" : "bg-orange-50 text-[#C97700]";

export default function FoodbankMessages() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chats, setChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const selected = useMemo(
    () => chats.find((chat) => chat.id === selectedRoomId) || null,
    [chats, selectedRoomId]
  );

  const loadConversations = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;
    setCurrentUserId(userId);

    if (!userId) {
      setChats([]);
      setSelectedRoomId(null);
      setLoading(false);
      return;
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("room_members")
      .select("room_id")
      .eq("user_id", userId);

    if (membershipsError) {
      setChats([]);
      setLoading(false);
      return;
    }

    const roomIds = Array.from(new Set((memberships || []).map((m) => m.room_id))).filter(Boolean);
    if (roomIds.length === 0) {
      setChats([]);
      setSelectedRoomId(null);
      setLoading(false);
      return;
    }

    const [{ data: rooms }, { data: roomMembers }, { data: rawMessages }] = await Promise.all([
      supabase.from("rooms").select("id, name, created_at").in("id", roomIds),
      supabase.from("room_members").select("room_id, user_id").in("room_id", roomIds),
      supabase
        .from("messages")
        .select("id, room_id, user_id, content, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: true }),
    ]);

    const memberRows = roomMembers || [];
    const messages = rawMessages || [];
    const extractedIds = (rooms || []).map(r => {
      if (r.name && r.name.includes("__auth__")) return r.name.split("__auth__")[1];
      return null;
    }).filter(Boolean);
    const counterpartIds = Array.from(
      new Set([
        ...memberRows.map((m) => m.user_id),
        ...extractedIds
      ].filter((id) => id && id !== userId))
    );

    const profileLookup = {};
    if (counterpartIds.length > 0) {
      const [{ data: donors }, { data: barangays }, { data: profiles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role, avatar_url").in("id", counterpartIds).eq("role", "donor"),
        supabase.from("barangays").select("id, barangay_name").in("id", counterpartIds),
        supabase.from("profiles").select("id, full_name, role, avatar_url").in("id", counterpartIds),
      ]);

      (donors || []).forEach((row) => {
        profileLookup[row.id] = {
          name: row.full_name || "Donor",
          role: "donor",
          avatarUrl: row.avatar_url || null,
        };
      });
      (barangays || []).forEach((row) => {
        profileLookup[row.id] = {
          name: row.barangay_name || "Barangay",
          role: "barangay",
          avatarUrl: null,
        };
      });
      (profiles || []).forEach((row) => {
        if (!profileLookup[row.id]) {
          profileLookup[row.id] = {
            name: row.full_name || "User",
            role: row.role || "donor",
            avatarUrl: row.avatar_url || null,
          };
        }
      });
    }

    const messagesByRoom = messages.reduce((acc, msg) => {
      if (!acc[msg.room_id]) acc[msg.room_id] = [];
      acc[msg.room_id].push({
        id: msg.id,
        from: msg.user_id === userId ? "me" : "them",
        text: msg.content || "",
        time: formatMessageTime(msg.created_at),
        createdAt: msg.created_at,
      });
      return acc;
    }, {});

    const built = (rooms || [])
      .map((room) => {
        const memberIds = memberRows
          .filter((m) => m.room_id === room.id)
          .map((m) => m.user_id);
          
        let rawName = room.name || "";
        let parsedCounterpartId = null;
        if (rawName.includes("__auth__")) {
          const parts = rawName.split("__auth__");
          rawName = parts[0];
          parsedCounterpartId = parts[1];
        }

        const counterpartId = memberIds.find((id) => id !== userId) || parsedCounterpartId || null;
        const resolved = profileLookup[counterpartId];
        const displayName = rawName || resolved?.name || "Conversation";
        const role = resolved?.role || "donor";
        const roomMessages = messagesByRoom[room.id] || [];
        const last = roomMessages[roomMessages.length - 1];
        const initials = displayName
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || "")
          .join("");

        return {
          id: room.id,
          participantId: counterpartId,
          name: displayName,
          role,
          avatar: initials || "AN",
          avatarColor: "#FE9800",
          avatarUrl: resolved?.avatarUrl || null,
          lastMessage: last?.text || "Start a conversation",
          time: last?.time || "",
          unread: 0,
          messages: roomMessages,
          createdAt: last?.createdAt || room.created_at,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const uniqueBuilt = [];
    const seenParticipants = new Set();
    const seenNames = new Set();
    for (const chat of built) {
      if (chat.participantId && seenParticipants.has(chat.participantId)) continue;
      if (!chat.participantId && seenNames.has(chat.name)) continue;
      
      if (chat.participantId) seenParticipants.add(chat.participantId);
      seenNames.add(chat.name);
      uniqueBuilt.push(chat);
    }

    setChats(uniqueBuilt);
    setSelectedRoomId((prev) => {
      if (prev && uniqueBuilt.some((chat) => chat.id === prev)) return prev;
      return uniqueBuilt[0]?.id || null;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`foodbank-messages-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async () => {
          await loadConversations(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  useEffect(() => {
    const channel = supabase.channel('online-users');
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = new Set();
      for (const id in state) {
        onlineIds.add(id);
      }
      setOnlineUsers(onlineIds);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !selected || !currentUserId || savingMessage) return;
    setSavingMessage(true);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const optimisticMessage = { id: `temp-${Date.now()}`, from: "me", text: content, time: now };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selected.id
          ? {
              ...chat,
              messages: [...chat.messages, optimisticMessage],
              lastMessage: content,
              time: now,
            }
          : chat
      )
    );
    setInput("");

    await supabase.from("messages").insert({
      room_id: selected.id,
      user_id: currentUserId,
      content,
    });

    setSavingMessage(false);
    await loadConversations(false);
  };

  const filteredChats = chats.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-white">
      <FoodbankSidebar />

      <div className="ml-60 flex-1 flex" style={{ height: "100vh" }}>
        <aside className="w-72 bg-white border-r border-[#F0F0F0] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[#F0F0F0]">
            <h2 className="text-base font-bold text-[#1A1A1A] mb-3" style={{ fontFamily: "DM Sans" }}>
              Messages
            </h2>
            <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-lg px-3 py-2 border border-[#EBEBEB]">
              <Search size={14} className="text-[#888888]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="bg-transparent text-xs text-[#555] outline-none w-full placeholder:text-[#AAAAAA]"
                style={{ fontFamily: "DM Sans" }}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <p className="text-xs text-[#888] px-4 py-5">Loading conversations...</p>
            ) : filteredChats.length === 0 ? (
              <p className="text-xs text-[#888] px-4 py-5">No conversations found.</p>
            ) : (
              filteredChats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedRoomId(c.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 transition-colors border-b border-[#F5F5F5] ${
                    selected?.id === c.id ? "bg-orange-50 border-l-2 border-l-[#FE9800]" : ""
                  }`}
                >
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#F0F0F0] flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: c.avatarColor }}
                    >
                      {c.avatar}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-semibold text-[#1A1A1A] truncate"
                        style={{ fontFamily: "DM Sans" }}
                      >
                        {c.name}
                      </span>
                      <span className="text-[11px] text-[#AAAAAA] flex-shrink-0" style={{ fontFamily: "DM Sans" }}>
                        {c.time}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeStyle(c.role)}`}
                      style={{ fontFamily: "DM Sans" }}
                    >
                      {c.role === "barangay" ? "Barangay" : "Donor"}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-[#888888] truncate pr-2" style={{ fontFamily: "DM Sans" }}>
                        {c.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-[#FAFAFA]">
          <div className="bg-white border-b border-[#F0F0F0] px-6 py-3.5 flex items-center justify-between">
            {selected ? (
              <div className="flex items-center gap-3">
                {selected.avatarUrl ? (
                  <img
                    src={selected.avatarUrl}
                    alt={selected.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#F0F0F0]"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: selected.avatarColor }}
                  >
                    {selected.avatar}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]" style={{ fontFamily: "DM Sans" }}>
                    {selected.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${onlineUsers.has(selected.participantId) ? "bg-green-400" : "bg-gray-300"}`} />
                    <p className={`text-xs ${onlineUsers.has(selected.participantId) ? "text-green-500" : "text-gray-400"}`} style={{ fontFamily: "DM Sans" }}>
                      {onlineUsers.has(selected.participantId) ? "Active now" : "Offline"}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeStyle(selected.role)}`}
                      style={{ fontFamily: "DM Sans" }}
                    >
                      {selected.role === "barangay" ? "Barangay" : "Donor"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#888]">Select a conversation</p>
            )}
            <button className="p-2 text-[#888888] hover:text-[#555] rounded-full hover:bg-[#F5F5F5] transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
            {!selected ? (
              <p className="text-sm text-[#888]">No active chat selected.</p>
            ) : (
              selected.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      msg.from === "me"
                        ? "bg-[#FE9800] text-white rounded-br-sm"
                        : "bg-white text-[#333] border border-[#F0F0F0] shadow-sm rounded-bl-sm"
                    }`}
                  >
                    <p style={{ fontFamily: "DM Sans" }}>{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${msg.from === "me" ? "text-orange-100" : "text-[#AAAAAA]"}`}
                      style={{ fontFamily: "DM Sans" }}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white border-t border-[#F0F0F0] px-6 py-4">
            <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-xl px-4 py-2.5 border border-[#EBEBEB]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-[#333] outline-none placeholder:text-[#AAAAAA]"
                style={{ fontFamily: "DM Sans" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !selected || savingMessage}
                className="bg-[#FE9800] text-white p-2 rounded-lg hover:bg-[#e58a00] transition-colors disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
