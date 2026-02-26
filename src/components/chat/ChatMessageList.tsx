"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ChatMessage } from "@/components/chat/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  meId: string;
  partnerName: string;
  partnerAvatarUrl: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  autoScrollToken: number;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
};

type ChatMenuState = {
  messageId: string;
  x: number;
  y: number;
};

const CHAT_MENU_WIDTH = 224;
const CHAT_MENU_HEIGHT = 172;
const CHAT_MENU_MARGIN = 8;
const LONG_PRESS_MS = 380;
const LONG_PRESS_MOVE_TOLERANCE = 22;

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(value: number | null) {
  if (!value || !Number.isFinite(value) || value <= 0) return null;
  const rounded = Math.round(value);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function previewText(message: ChatMessage | undefined) {
  if (!message) return "Сообщение";
  if (message.deleted_at) return "Удалено";
  const text = (message.body_text || "").trim();
  if (text.length > 0) return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  if (message.message_kind === "image") return "Фото";
  if (message.message_kind === "voice") return "Голосовое";
  if (message.message_kind === "video_note") return "Кружок";
  return "Сообщение";
}

function resolveMessageActions(message: ChatMessage, meId: string) {
  const canReply = !message.deleted_at;
  const canEdit = message.sender_id === meId && !message.deleted_at && message.message_kind === "text";
  const canDelete = message.sender_id === meId && !message.deleted_at;
  return {
    canReply,
    canEdit,
    canDelete,
    hasAny: canReply || canEdit || canDelete,
  };
}

function MediaBlock({ message }: { message: ChatMessage }) {
  if (message.deleted_at) return null;

  if (message.message_kind === "image" && message.media_url) {
    return (
      <Link href={`/chat/media/${message.id}`} className="block mt-2">
        <Image
          src={message.media_url}
          alt="Фото из чата"
          width={320}
          height={320}
          unoptimized
          className="w-full max-w-[240px] rounded-2xl object-cover border border-[var(--border)]"
        />
      </Link>
    );
  }

  if (message.message_kind === "voice" && message.media_url) {
    return (
      <div className="mt-2">
        <audio controls preload="metadata" src={message.media_url} className="w-full max-w-[250px] h-10" />
        {formatDuration(message.media_duration_sec) && (
          <p className="text-xs mt-1 opacity-65" style={{ color: "var(--text)" }}>
            Голосовое: {formatDuration(message.media_duration_sec)}
          </p>
        )}
      </div>
    );
  }

  if (message.message_kind === "video_note" && message.media_url) {
    return (
      <div className="mt-2">
        <video
          src={message.media_url}
          controls
          preload="metadata"
          playsInline
          className="w-[180px] h-[180px] rounded-full object-cover border border-[var(--border)] bg-black"
        />
        {formatDuration(message.media_duration_sec) && (
          <p className="text-xs mt-1 opacity-65" style={{ color: "var(--text)" }}>
            Кружок: {formatDuration(message.media_duration_sec)}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export default function ChatMessageList({
  messages,
  meId,
  partnerName,
  partnerAvatarUrl,
  hasMore,
  isLoadingMore,
  onLoadMore,
  autoScrollToken,
  onReply,
  onEdit,
  onDelete,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [menuState, setMenuState] = useState<ChatMenuState | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const messageById = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const message of messages) map.set(message.id, message);
    return map;
  }, [messages]);
  const activeMenu = useMemo(() => {
    if (!menuState) return null;
    const message = messageById.get(menuState.messageId);
    if (!message) return null;
    return { message, x: menuState.x, y: menuState.y };
  }, [menuState, messageById]);

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const openMenuAt = (messageId: string, x: number, y: number) => {
    const viewportWidth = typeof window === "undefined" ? 390 : window.innerWidth;
    const viewportHeight = typeof window === "undefined" ? 844 : window.innerHeight;
    const clampedX = Math.max(CHAT_MENU_MARGIN, Math.min(x, viewportWidth - CHAT_MENU_WIDTH - CHAT_MENU_MARGIN));
    const clampedY = Math.max(CHAT_MENU_MARGIN, Math.min(y, viewportHeight - CHAT_MENU_HEIGHT - CHAT_MENU_MARGIN));
    setMenuState({ messageId, x: clampedX, y: clampedY });
  };

  const startLongPress = (messageId: string, isEnabled: boolean, event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isEnabled || event.pointerType === "mouse" || event.button !== 0) return;
    clearLongPress();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      const point = longPressStartRef.current;
      if (point) openMenuAt(messageId, point.x, point.y);
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
        navigator.vibrate(8);
      }
      clearLongPress();
    }, LONG_PRESS_MS);
  };

  const trackLongPressMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!longPressStartRef.current) return;
    const deltaX = event.clientX - longPressStartRef.current.x;
    const deltaY = event.clientY - longPressStartRef.current.y;
    if (Math.hypot(deltaX, deltaY) > LONG_PRESS_MOVE_TOLERANCE) clearLongPress();
  };

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ block: "end" });
  }, [autoScrollToken]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuState(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const bubble = target.closest<HTMLElement>("[data-chat-message-id]");
      if (!bubble || !container.contains(bubble)) return;

      const messageId = bubble.dataset.chatMessageId;
      if (!messageId) return;

      const message = messageById.get(messageId);
      if (!message) return;

      const actions = resolveMessageActions(message, meId);
      if (!actions.hasAny) return;

      event.preventDefault();
      event.stopPropagation();
      openMenuAt(messageId, event.clientX, event.clientY);
    };

    container.addEventListener("contextmenu", onContextMenu, true);
    return () => container.removeEventListener("contextmenu", onContextMenu, true);
  }, [meId, messageById]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      longPressStartRef.current = null;
    },
    [],
  );

  return (
    <div ref={containerRef} className="w-full max-w-sm mx-auto flex-1 overflow-y-auto px-1 pb-2">
      {hasMore && (
        <div className="flex justify-center pt-1 pb-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="h-10 px-4 rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-sm font-bold disabled:opacity-60"
            style={{ color: "var(--text)" }}
          >
            {isLoadingMore ? "Загрузка..." : "Загрузить ещё"}
          </button>
        </div>
      )}

      <div className="space-y-2 pb-2">
        {messages.map((message) => {
          const isMine = message.sender_id === meId;
          const sourceMessage = message.reply_to_id ? messageById.get(message.reply_to_id) : null;
          const showText = (message.body_text || "").trim().length > 0;
          const actions = resolveMessageActions(message, meId);

          return (
            <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <div className="w-8 mr-2 shrink-0">
                  {partnerAvatarUrl ? (
                    <Image
                      src={partnerAvatarUrl}
                      alt={partnerName}
                      width={32}
                      height={32}
                      unoptimized
                      className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center border border-[var(--border)] bg-[var(--bg-muted)] text-xs">
                      👤
                    </div>
                  )}
                </div>
              )}

              <div className="relative max-w-[82%]">
                <div
                  data-chat-message-id={message.id}
                  onPointerDown={(event) => startLongPress(message.id, actions.hasAny, event)}
                  onPointerUp={clearLongPress}
                  onPointerCancel={clearLongPress}
                  onPointerMove={trackLongPressMove}
                  className={`rounded-[24px] px-4 py-3 border ${
                    isMine
                      ? "bg-[color:rgba(223,232,253,0.9)] dark:bg-[color:rgba(56,66,96,0.88)] border-[color:rgba(154,180,245,0.55)]"
                      : "bg-[color:rgba(253,251,249,0.92)] dark:bg-[color:rgba(49,42,37,0.90)] border-[var(--border)]"
                  }`}
                >
                  {sourceMessage && (
                    <div className="mb-2 rounded-xl border border-[var(--border)] bg-black/5 dark:bg-white/5 px-2 py-1">
                      <p className="text-[10px] font-black uppercase opacity-60" style={{ color: "var(--text)" }}>
                        Ответ
                      </p>
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                        {previewText(sourceMessage)}
                      </p>
                    </div>
                  )}

                  {message.deleted_at ? (
                    <p className="text-[15px] italic opacity-70" style={{ color: "var(--text)" }}>
                      Сообщение удалено
                    </p>
                  ) : (
                    <>
                      {showText && (
                        <p className="text-[16px] font-semibold whitespace-pre-wrap break-words leading-relaxed" style={{ color: "var(--text)" }}>
                          {message.body_text}
                        </p>
                      )}
                      <MediaBlock message={message} />
                    </>
                  )}

                  <p className="text-xs font-bold opacity-60 mt-1 text-right" style={{ color: "var(--text)" }}>
                    {formatTime(message.created_at)} {message.edited_at ? "· изм." : ""} {isMine ? (message.read_at ? "✓✓" : "✓") : ""}
                  </p>
                </div>

              </div>
              {isMine && <div className="w-2 ml-1 shrink-0" />}
            </div>
          );
        })}
      </div>
      {activeMenu && (
        <>
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setMenuState(null)}
            className="fixed inset-0 z-[70] bg-transparent"
          />
          <div
            className="fixed z-[80] w-56 overflow-hidden rounded-2xl border border-[#3f6182] bg-[linear-gradient(180deg,rgba(17,43,70,0.98),rgba(11,31,52,0.98))] shadow-[0_24px_44px_rgba(0,0,0,0.52)] backdrop-blur-md"
            style={{ left: `${activeMenu.x}px`, top: `${activeMenu.y}px` }}
          >
            <div className="px-4 py-2 border-b border-white/10 text-[11px] font-semibold tracking-wide uppercase text-white/55">Действия</div>
            {!activeMenu.message.deleted_at && (
              <button
                type="button"
                onClick={() => {
                  setMenuState(null);
                  onReply(activeMenu.message);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-white hover:bg-white/10"
              >
                <span className="text-[17px]">↩</span>
                <span>Ответить</span>
              </button>
            )}
            {activeMenu.message.sender_id === meId && !activeMenu.message.deleted_at && activeMenu.message.message_kind === "text" && (
              <button
                type="button"
                onClick={() => {
                  setMenuState(null);
                  onEdit(activeMenu.message);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-white hover:bg-white/10 border-t border-white/10"
              >
                <span className="text-[17px]">✎</span>
                <span>Изменить</span>
              </button>
            )}
            {activeMenu.message.sender_id === meId && !activeMenu.message.deleted_at && (
              <button
                type="button"
                onClick={() => {
                  setMenuState(null);
                  onDelete(activeMenu.message);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-red-300 hover:bg-red-500/10 border-t border-white/10"
              >
                <span className="text-[17px]">🗑</span>
                <span>Удалить</span>
              </button>
            )}
          </div>
        </>
      )}
      <div ref={endRef} />
    </div>
  );
}
