import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [savingMessage, setSavingMessage] = useState(false);
  const [sendError, setSendError] = useState("");
  const [targetInfo, setTargetInfo] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const selected = useMemo(
    () => chats.find((chat) => chat.id === selectedRoomId) || null,
    [chats, selectedRoomId]
  );
  const targetRecipientId = searchParams.get("recipient");
  const targetRecipientName = searchParams.get("name");

  const draftSelected = useMemo(() => {
    if (selected || !targetInfo) return selected;
    return {
      id: `draft-${targetInfo.id || "recipient"}`,
      participantId: targetInfo.id || null,
      name: targetInfo.name || "Foodbank",
      avatar: targetInfo.avatar || "FB",
      avatarColor: "#FE9800",
      avatarUrl: targetInfo.avatarUrl || null,
      messages: [],
    };
  }, [selected, targetInfo]);

  const selectedForUi = draftSelected || selected;

  const resolveRecipientAuthUserId = useCallback(async (recipientId, recipientName) => {
    if (!recipientId) return null;

    const { data: directProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", recipientId)
      .maybeSingle();
    if (directProfile?.id) return directProfile.id;

    const { data: fbRow } = await supabase
      .from("foodbanks")
      .select("id, org_name, user_id")
      .eq("id", recipientId)
      .maybeSingle();

    if (fbRow?.user_id) return fbRow.user_id;

    if (fbRow?.org_name || recipientName) {
      const orgName = fbRow?.org_name || recipientName;
      const { data: byOrg } = await supabase
        .from("profiles")
        .select("id, role, org_name")
        .eq("role", "foodbank")
        .eq("org_name", orgName)
        .maybeSingle();
      if (byOrg?.id) return byOrg.id;
    }

    return null;
  }, []);

  const loadTargetInfo = useCallback(async () => {
    if (!targetRecipientId) {
      setTargetInfo(null);
      return;
    }

    const { data: byId } = await supabase
      .from("foodbanks")
      .select("id, user_id, org_name, logo_url")
      .eq("id", targetRecipientId)
      .maybeSingle();

    const resolvedUserId =
      byId?.user_id || (await resolveRecipientAuthUserId(targetRecipientId, targetRecipientName));
    const fallbackName = byId?.org_name || targetRecipientName || "Foodbank";

    let avatarUrl = byId?.logo_url || null;
    let name = fallbackName;
    if (resolvedUserId) {
      const [{ data: byUserFoodbank }, { data: profile }] = await Promise.all([
        supabase
          .from("foodbanks")
          .select("org_name, logo_url")
          .eq("user_id", resolvedUserId)
          .maybeSingle(),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", resolvedUserId).maybeSingle(),
      ]);
      name = byUserFoodbank?.org_name || name || profile?.full_name || "Foodbank";
      avatarUrl = byUserFoodbank?.logo_url || avatarUrl || profile?.avatar_url || null;
    }

    const initials = (name || "Foodbank")
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

    setTargetInfo({
      id: resolvedUserId || targetRecipientId,
      name,
      avatarUrl,
      avatar: initials || "FB",
    });
  }, [resolveRecipientAuthUserId, targetRecipientId, targetRecipientName]);

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

    const nameLookup = {};
    if (counterpartIds.length > 0) {
      const [{ data: foodbanksByUser }, { data: foodbanksById }, { data: profiles }] = await Promise.all([
        supabase.from("foodbanks").select("id, user_id, org_name, logo_url").in("user_id", counterpartIds),
        supabase.from("foodbanks").select("id, user_id, org_name, logo_url").in("id", counterpartIds),
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", counterpartIds),
      ]);

      [...(foodbanksByUser || []), ...(foodbanksById || [])].forEach((row) => {
        const key = row.user_id || row.id;
        if (!key) return;
        nameLookup[key] = {
          name: row.org_name || "Foodbank",
          avatarUrl: row.logo_url || null,
        };
      });
      (profiles || []).forEach((row) => {
        if (!nameLookup[row.id]) {
        nameLookup[row.id] = {
            name: row.full_name || "User",
            avatarUrl: row.avatar_url || null,
          };
        } else if (!nameLookup[row.id].avatarUrl && row.avatar_url) {
          nameLookup[row.id].avatarUrl = row.avatar_url;
        }
      });
    }

    if (targetInfo?.id && !nameLookup[targetInfo.id]) {
      nameLookup[targetInfo.id] = {
        name: targetInfo.name || "Foodbank",
        avatarUrl: targetInfo.avatarUrl || null,
      };
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
        const resolved = nameLookup[counterpartId];
        const displayName = rawName || resolved?.name || "Foodbank";
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
          avatar: initials || "FB",
          avatarColor: "#FE9800",
          avatarUrl: resolved?.avatarUrl || null,
          lastMessage: last?.text || "Start a conversation",
          time: last?.time || "",
          unread: 0,
          messages: roomMessages,
          createdAt: last ? last.createdAt : room.created_at,
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

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

  const findOrCreateRoom = useCallback(
    async (recipientId, recipientName) => {
      if (!recipientId || !currentUserId) return null;
      const resolvedRecipientId = await resolveRecipientAuthUserId(recipientId, recipientName);
      const candidateRecipientIds = Array.from(
        new Set([resolvedRecipientId, recipientId].filter(Boolean))
      );
      let lastError = "Unable to start chat with this foodbank.";

      for (const candidateId of candidateRecipientIds) {
        const existing = chats.find((chat) => chat.participantId === candidateId);
        if (existing) return existing.id;

        const { data: mine } = await supabase
          .from("room_members")
          .select("room_id")
          .eq("user_id", currentUserId);
        const myRoomIds = (mine || []).map((row) => row.room_id).filter(Boolean);

        if (myRoomIds.length > 0) {
          const { data: matchRows } = await supabase
            .from("room_members")
            .select("room_id")
            .eq("user_id", candidateId)
            .in("room_id", myRoomIds);
          const matchedRoomId = matchRows?.[0]?.room_id;
          if (matchedRoomId) return matchedRoomId;
        }

        const roomId = crypto.randomUUID();
        const { error: roomError } = await supabase
          .from("rooms")
          .insert({
            id: roomId,
            name: `${recipientName || ""}__auth__${candidateId}`,
          });

        if (roomError) {
          lastError = roomError?.message || lastError;
          continue;
        }

        const { error: selfMemberError } = await supabase.from("room_members").insert({
          room_id: roomId,
          user_id: currentUserId,
        });
        if (selfMemberError) {
          lastError = selfMemberError.message || lastError;
          continue;
        }

        const { error: recipientMemberError } = await supabase.from("room_members").insert({
          room_id: roomId,
          user_id: candidateId,
        });
        if (recipientMemberError) {
          lastError = recipientMemberError.message || lastError;
          continue;
        }

        return roomId;
      }

      setSendError(lastError);
      return null;
    },
    [chats, currentUserId, resolveRecipientAuthUserId]
  );

  useEffect(() => {
    loadTargetInfo();
  }, [loadTargetInfo]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations, targetInfo]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`donor-messages-${currentUserId}`)
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

  const lastTargetIdRef = useRef(null);
  useEffect(() => {
    if (!targetRecipientId || !currentUserId || loading) return;
    if (lastTargetIdRef.current === targetRecipientId) return;
    
    const startTargetChat = async () => {
      lastTargetIdRef.current = targetRecipientId;
      const roomId = await findOrCreateRoom(targetRecipientId, targetRecipientName);
      if (!roomId) return;
      await loadConversations(false);
      setSelectedRoomId(roomId);
    };
    startTargetChat();
  }, [targetRecipientId, currentUserId, loading, findOrCreateRoom, loadConversations, targetRecipientName]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !currentUserId || savingMessage) return;
    setSendError("");
    setSavingMessage(true);

    let targetRoomId = selected?.id || null;
    if (!targetRoomId && targetRecipientId) {
      targetRoomId = await findOrCreateRoom(targetRecipientId, targetRecipientName);
      if (targetRoomId) setSelectedRoomId(targetRoomId);
    }
    if (!targetRoomId) {
      setSendError("Unable to start chat with this foodbank. Please try again.");
      setSavingMessage(false);
      return;
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const optimisticMessage = { id: `temp-${Date.now()}`, from: "me", text: content, time: now };
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === targetRoomId
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

    const { error } = await supabase.from("messages").insert({
      room_id: targetRoomId,
      user_id: currentUserId,
      content,
    });

    setSavingMessage(false);
    await loadConversations(false);
    if (error) {
      setSendError(error.message || "Unable to send message.");
      return;
    }
  };

  const filteredChats = chats.filter(
    (c) =>
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
            ) : (
              filteredChats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedRoomId(c.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-orange-50 transition-colors border-b border-gray-50 ${
                    selected?.id === c.id ? "bg-orange-50 border-l-2 border-l-[#FE9800]" : ""
                  }`}
                >
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0"
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
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-[#FFFAF1]">
          <div className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between shadow-sm">
            {selectedForUi ? (
              <div className="flex items-center gap-3">
                {selectedForUi.avatarUrl ? (
                  <img
                    src={selectedForUi.avatarUrl}
                    alt={selectedForUi.name}
                    className="w-9 h-9 rounded-full object-cover border border-gray-100"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: selectedForUi.avatarColor }}
                  >
                    {selectedForUi.avatar}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{selectedForUi.name}</p>
                  <p className={`text-xs ${onlineUsers.has(selectedForUi.participantId) ? "text-green-500" : "text-gray-400"}`}>
                    {onlineUsers.has(selectedForUi.participantId) ? "Active now" : "Offline"}
                  </p>
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
            ) : (
              selected.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      msg.from === "me"
                        ? "bg-[#FE9800] text-white rounded-br-sm"
                        : "bg-white text-gray-700 border border-gray-100 shadow-sm rounded-bl-sm"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.from === "me" ? "text-orange-100" : "text-gray-400"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))
            )}
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
                disabled={!input.trim() || savingMessage}
              >
                <Send size={14} />
              </button>
            </div>
            {sendError ? <p className="text-xs text-red-500 mt-2">{sendError}</p> : null}
          </div>
        </div>
      </div>
    </DonorLayout>
  );
}
