"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessageList from "@/components/chat/ChatMessageList";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatAdviceBubble from "@/components/chat/ChatAdviceBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import StateBlock from "@/components/ui/StateBlock";
import Card from "@/components/ui/Card";
import {
  deleteChatMessageAction,
  editChatMessageAction,
  getChatBootstrapAction,
  getChatAdviceAction,
  markChatReadAction,
  sendChatMessageAction,
} from "@/app/actions/chat";
import type { ChatMessage, ChatMessageKind, ChatUser } from "@/components/chat/types";

type ChatPartner = ChatUser & { lastSeenAt: string | null };

type AdviceState = {
  text: string;
  generatedAt: string;
};

type BootstrapResponse =
  | {
      pairId: string;
      me: ChatUser;
      partner: ChatPartner;
      messages: ChatMessage[];
      hasMore: boolean;
      error?: never;
    }
  | {
      error: string;
    };

const PAGE_LIMIT = 50;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asMessageKind(value: unknown): ChatMessageKind {
  if (value === "text" || value === "image" || value === "voice" || value === "video_note") {
    return value;
  }
  return "text";
}

function parseMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = asString(record.id);
  const pairId = asString(record.pair_id);
  const senderId = asString(record.sender_id);
  const receiverId = asString(record.receiver_id);
  const createdAt = asString(record.created_at);
  if (!id || !pairId || !senderId || !receiverId || !createdAt) return null;

  return {
    id,
    pair_id: pairId,
    sender_id: senderId,
    receiver_id: receiverId,
    reply_to_id: asString(record.reply_to_id),
    message_kind: asMessageKind(record.message_kind),
    body_text: asString(record.body_text),
    media_url: asString(record.media_url),
    media_mime: asString(record.media_mime),
    media_size_bytes: asNumber(record.media_size_bytes),
    media_duration_sec: asNumber(record.media_duration_sec),
    media_width: asNumber(record.media_width),
    media_height: asNumber(record.media_height),
    created_at: createdAt,
    edited_at: asString(record.edited_at),
    deleted_at: asString(record.deleted_at),
    read_at: asString(record.read_at),
  };
}

function mergeMessages(base: ChatMessage[], nextItems: ChatMessage[]) {
  const map = new Map<string, ChatMessage>();
  for (const item of base) map.set(item.id, item);
  for (const item of nextItems) map.set(item.id, item);
  return Array.from(map.values()).sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function replaceTempMessage(base: ChatMessage[], realMessage: ChatMessage, meId: string) {
  const tempIndex = base.findIndex((item) => item.id.startsWith("temp-") && item.sender_id === meId);
  if (tempIndex === -1) return mergeMessages(base, [realMessage]);
  const clone = [...base];
  clone.splice(tempIndex, 1);
  return mergeMessages(clone, [realMessage]);
}

function isOnline(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  const timestamp = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return Date.now() - timestamp <= 90 * 1000;
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string | null>(null);
  const [me, setMe] = useState<ChatUser | null>(null);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [advice, setAdvice] = useState<AdviceState | null>(null);
  const [autoScrollToken, setAutoScrollToken] = useState(0);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingHideTimeoutRef = useRef<number | null>(null);
  const lastTypingEmitRef = useRef(0);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const refreshAdvice = useCallback(async () => {
    const result = await getChatAdviceAction();
    if ("error" in result) return;
    setAdvice({ text: result.text, generatedAt: result.generatedAt });
  }, []);

  const markIncomingMessagesAsRead = useCallback(async (items: ChatMessage[], meId: string) => {
    const unreadIncomingIds = items
      .filter((item) => item.receiver_id === meId && item.read_at === null)
      .map((item) => item.id);

    if (unreadIncomingIds.length === 0) return;

    const result = await markChatReadAction(unreadIncomingIds);
    if ("error" in result) return;

    setMessages((prev) =>
      prev.map((item) => (unreadIncomingIds.includes(item.id) ? { ...item, read_at: result.readAt } : item)),
    );
  }, []);

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    const result = (await getChatBootstrapAction(PAGE_LIMIT)) as BootstrapResponse;
    if ("error" in result) {
      setErrorText(result.error || "Не удалось открыть чат");
      setLoading(false);
      return;
    }

    setErrorText(null);
    setPairId(result.pairId);
    setMe(result.me);
    setPartner(result.partner);
    setMessages(result.messages);
    setHasMore(result.hasMore);
    setAutoScrollToken((value) => value + 1);
    setLoading(false);

    void markIncomingMessagesAsRead(result.messages, result.me.id);
    void refreshAdvice();
  }, [markIncomingMessagesAsRead, refreshAdvice]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadBootstrap();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadBootstrap]);

  useEffect(() => {
    if (!pairId || !me || !partner) return;

    const channel = supabase
      .channel(`chat:${pairId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `pair_id=eq.${pairId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = parseMessage(payload.new);
          if (!row) return;

          setMessages((prev) => {
            if (row.sender_id === me.id) {
              return replaceTempMessage(prev, row, me.id);
            }
            return mergeMessages(prev, [row]);
          });

          if (row.sender_id !== me.id) {
            setAutoScrollToken((value) => value + 1);
            void markIncomingMessagesAsRead([row], me.id);
            void refreshAdvice();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `pair_id=eq.${pairId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = parseMessage(payload.new);
          if (!row) return;
          setMessages((prev) => mergeMessages(prev, [row]));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `pair_id=eq.${pairId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const presenceRow = (payload.new ?? null) as Record<string, unknown> | null;
          const userId = asString(presenceRow?.["user_id"]);
          const lastSeenAt = asString(presenceRow?.["last_seen_at"]);
          if (!userId || userId !== partner.id) return;
          setPartner((prev) => (prev ? { ...prev, lastSeenAt } : prev));
        },
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`chat-typing:${pairId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const raw = payload.payload as { userId?: string; isTyping?: boolean };
        if (!raw || raw.userId !== partner.id) return;

        const active = Boolean(raw.isTyping);
        setIsPartnerTyping(active);

        if (typingHideTimeoutRef.current) {
          window.clearTimeout(typingHideTimeoutRef.current);
          typingHideTimeoutRef.current = null;
        }

        if (active) {
          typingHideTimeoutRef.current = window.setTimeout(() => {
            setIsPartnerTyping(false);
          }, 2500);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      if (typingHideTimeoutRef.current) {
        window.clearTimeout(typingHideTimeoutRef.current);
        typingHideTimeoutRef.current = null;
      }
      typingChannelRef.current = null;
      void supabase.removeChannel(channel);
      void supabase.removeChannel(typingChannel);
    };
  }, [markIncomingMessagesAsRead, me, pairId, partner, refreshAdvice, supabase]);

  const loadMore = useCallback(async () => {
    if (!messages.length || loadingMore) return;
    const before = messages[0]?.created_at;
    if (!before) return;

    setLoadingMore(true);
    const result = (await getChatBootstrapAction(PAGE_LIMIT, before)) as BootstrapResponse;
    setLoadingMore(false);

    if ("error" in result) {
      toast.error(result.error || "Не удалось загрузить сообщения");
      return;
    }

    setMessages((prev) => mergeMessages(result.messages, prev));
    setHasMore(result.hasMore);
  }, [loadingMore, messages]);

  const handleTyping = useCallback(
    (currentInput: string) => {
      const channel = typingChannelRef.current;
      if (!channel || !me) return;

      const now = Date.now();
      const shouldSendNow = currentInput.trim().length === 0 || now - lastTypingEmitRef.current > 650;
      if (!shouldSendNow) return;

      lastTypingEmitRef.current = now;
      void channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: me.id, isTyping: currentInput.trim().length > 0 },
      });
    },
    [me],
  );

  const handleSendText = useCallback(
    async (text: string, replyToId?: string | null) => {
      if (!me || !partner || !pairId || sending) return false;

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        pair_id: pairId,
        sender_id: me.id,
        receiver_id: partner.id,
        reply_to_id: replyToId || null,
        message_kind: "text",
        body_text: text,
        media_url: null,
        media_mime: null,
        media_size_bytes: null,
        media_duration_sec: null,
        media_width: null,
        media_height: null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        read_at: null,
      };

      setSending(true);
      setMessages((prev) => mergeMessages(prev, [tempMessage]));
      setAutoScrollToken((value) => value + 1);

      const result = await sendChatMessageAction(text, replyToId || null);
      setSending(false);

      if ("error" in result) {
        setMessages((prev) => prev.filter((item) => item.id !== tempMessage.id));
        toast.error(result.error || "Не удалось отправить сообщение");
        return false;
      }

      setMessages((prev) => replaceTempMessage(prev, result.message, me.id));
      setAutoScrollToken((value) => value + 1);
      setReplyTarget(null);
      void refreshAdvice();
      return true;
    },
    [me, pairId, partner, sending, refreshAdvice],
  );

  const handleSendMedia = useCallback(
    async (payload: {
      kind: Exclude<ChatMessageKind, "text">;
      file: File;
      durationSec?: number | null;
      width?: number | null;
      height?: number | null;
      text?: string | null;
      replyToId?: string | null;
    }) => {
      if (!me || !partner || !pairId || sending) return false;

      const localPreview = payload.kind === "image" || payload.kind === "voice" || payload.kind === "video_note"
        ? URL.createObjectURL(payload.file)
        : null;

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        pair_id: pairId,
        sender_id: me.id,
        receiver_id: partner.id,
        reply_to_id: payload.replyToId || null,
        message_kind: payload.kind,
        body_text: payload.text?.trim() || null,
        media_url: localPreview,
        media_mime: payload.file.type || null,
        media_size_bytes: payload.file.size,
        media_duration_sec: payload.durationSec ?? null,
        media_width: payload.width ?? null,
        media_height: payload.height ?? null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        read_at: null,
      };

      setSending(true);
      setMessages((prev) => mergeMessages(prev, [tempMessage]));
      setAutoScrollToken((value) => value + 1);

      const formData = new FormData();
      formData.append("kind", payload.kind);
      formData.append("file", payload.file);
      if (payload.text?.trim()) formData.append("text", payload.text.trim());
      if (payload.replyToId?.trim()) formData.append("replyToId", payload.replyToId.trim());
      if (typeof payload.durationSec === "number") formData.append("durationSec", String(payload.durationSec));
      if (typeof payload.width === "number") formData.append("width", String(payload.width));
      if (typeof payload.height === "number") formData.append("height", String(payload.height));

      let success = false;
      try {
        const response = await fetch("/api/chat/media", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as { error?: string; message?: ChatMessage };
        if (!response.ok || data.error || !data.message) {
          toast.error(data.error || "Не удалось отправить медиа");
        } else {
          const parsed = parseMessage(data.message);
          if (parsed) {
            setMessages((prev) => replaceTempMessage(prev, parsed, me.id));
            setAutoScrollToken((value) => value + 1);
            setReplyTarget(null);
            void refreshAdvice();
            success = true;
          } else {
            toast.error("Ответ сервера некорректный");
          }
        }
      } catch {
        toast.error("Не удалось отправить медиа");
      }

      setSending(false);
      if (!success) {
        setMessages((prev) => prev.filter((item) => item.id !== tempMessage.id));
      }
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
      return success;
    },
    [me, pairId, partner, sending, refreshAdvice],
  );

  const handleReply = useCallback((message: ChatMessage) => {
    setEditingMessage(null);
    setReplyTarget(message);
  }, []);

  const handleStartEdit = useCallback((message: ChatMessage) => {
    setReplyTarget(null);
    setEditingMessage(message);
  }, []);

  const handleDeleteMessage = useCallback(
    async (message: ChatMessage) => {
      if (!me) return;
      if (message.sender_id !== me.id) return;
      if (!window.confirm("Удалить сообщение?")) return;

      const result = await deleteChatMessageAction(message.id);
      if ("error" in result) {
        toast.error(result.error || "Не удалось удалить сообщение");
        return;
      }

      setMessages((prev) => prev.map((item) => (item.id === result.message.id ? { ...item, ...result.message } : item)));
      if (editingMessage?.id === message.id) setEditingMessage(null);
      if (replyTarget?.id === message.id) setReplyTarget(null);
      toast.success("Сообщение удалено");
    },
    [editingMessage?.id, me, replyTarget?.id],
  );

  const handleEditMessage = useCallback(
    async (messageId: string, text: string) => {
      const result = await editChatMessageAction(messageId, text);
      if ("error" in result) {
        toast.error(result.error || "Не удалось изменить сообщение");
        return false;
      }
      setMessages((prev) => prev.map((item) => (item.id === result.message.id ? { ...item, ...result.message } : item)));
      setEditingMessage(null);
      toast.success("Сообщение обновлено");
      return true;
    },
    [],
  );

  if (loading) {
    return (
      <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] px-5">
        <StateBlock icon="💬" title="Открываем чат..." className="mt-12" />
      </main>
    );
  }

  if (errorText?.includes("пару")) {
    return (
      <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] px-5 py-8">
        <Card className="max-w-sm mx-auto rounded-3xl p-6 border border-[var(--border)] bg-[var(--bg-card)]">
          <StateBlock
            icon="🔗"
            title="Чат доступен после создания пары"
            description="Подключите партнёра в разделе пары."
          />
          <Link
            href="/pair"
            className="mt-4 h-11 rounded-xl flex items-center justify-center font-bold bg-[color:var(--accent)] text-white"
          >
            Перейти в пару
          </Link>
        </Card>
      </main>
    );
  }

  if (!me || !partner || !pairId) {
    return (
      <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] px-5">
        <StateBlock
          icon="⚠️"
          title="Чат временно недоступен"
          description={errorText || "Попробуйте обновить страницу"}
          className="mt-12"
        />
      </main>
    );
  }

  const showTyping = isPartnerTyping && partner.displayName.trim().length > 0;

  return (
    <main className="app-safe-top w-full min-h-[100dvh] px-3 flex flex-col">
      <ChatHeader
        partnerName={partner.displayName}
        partnerAvatarUrl={partner.avatarUrl}
        isPartnerOnline={isOnline(partner.lastSeenAt)}
      />

      {advice && <ChatAdviceBubble text={advice.text} generatedAt={advice.generatedAt} />}

      <div className="mt-3 flex-1 min-h-0">
        {messages.length === 0 ? (
          <StateBlock
            icon="💞"
            title="Начните диалог"
            description={`Напишите первое сообщение для ${partner.displayName}.`}
            className="mt-16"
          />
        ) : (
          <ChatMessageList
            messages={messages}
            meId={me.id}
            partnerName={partner.displayName}
            partnerAvatarUrl={partner.avatarUrl}
            hasMore={hasMore}
            isLoadingMore={loadingMore}
            onLoadMore={loadMore}
            autoScrollToken={autoScrollToken}
            onReply={handleReply}
            onEdit={handleStartEdit}
            onDelete={handleDeleteMessage}
          />
        )}
      </div>

      {showTyping && <TypingIndicator partnerName={partner.displayName} />}

      <div className="w-full max-w-sm mx-auto pb-[86px]">
        <ChatComposer
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
          onTyping={handleTyping}
          isSending={sending}
          replyTarget={replyTarget}
          onCancelReply={() => setReplyTarget(null)}
          editingMessage={editingMessage}
          onCancelEdit={() => setEditingMessage(null)}
          onEditMessage={handleEditMessage}
        />
      </div>
    </main>
  );
}
