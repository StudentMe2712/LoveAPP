"use server";

import { createClient } from "@/lib/supabase/server";

const PARTNER_FALLBACK_NAME = "Партнёр";
const HEAVY_STATUS_HINTS = ["тяж", "груст", "зл", "устал", "плохо", "печал", "бол"];
const HEAVY_STATUS_EMOJIS = new Set(["😔", "😞", "🥲", "😢", "😭", "😡", "💔", "😤", "😣"]);

const CHAT_FIELDS =
  "id,pair_id,sender_id,receiver_id,reply_to_id,message_kind,body_text,media_url,media_mime,media_size_bytes,media_duration_sec,media_width,media_height,created_at,edited_at,deleted_at,read_at";

type PairRow = {
  id: string;
  user1_id: string;
  user2_id: string | null;
};

export type ChatMessageRow = {
  id: string;
  pair_id: string;
  sender_id: string;
  receiver_id: string;
  reply_to_id: string | null;
  message_kind: "text" | "image" | "voice" | "video_note";
  body_text: string | null;
  media_url: string | null;
  media_mime: string | null;
  media_size_bytes: number | null;
  media_duration_sec: number | null;
  media_width: number | null;
  media_height: number | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  read_at: string | null;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

type ChatUserInfo = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

type ChatContext = {
  pair: PairRow;
  me: ChatUserInfo;
  partner: ChatUserInfo;
};

function normalizeName(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readMetadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const candidate = (metadata as Record<string, unknown>)[key];
  return typeof candidate === "string" ? normalizeName(candidate) : null;
}

function isHeavyStatus(text: string | null, emoji: string | null): boolean {
  const normalized = (text || "").toLowerCase();
  if (HEAVY_STATUS_HINTS.some((hint) => normalized.includes(hint))) return true;
  return emoji ? HEAVY_STATUS_EMOJIS.has(emoji) : false;
}

async function resolveChatContext(): Promise<{ data?: ChatContext; error?: string }> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { error: "Необходима авторизация" };
  }

  const meUser = authData.user;
  const meId = meUser.id;

  const { data: pair, error: pairError } = await supabase
    .from("pair")
    .select("id,user1_id,user2_id")
    .or(`user1_id.eq.${meId},user2_id.eq.${meId}`)
    .maybeSingle<PairRow>();

  if (pairError) {
    console.error("resolveChatContext pair error", pairError);
    return { error: "Не удалось загрузить пару" };
  }

  if (!pair || !pair.user1_id || !pair.user2_id) {
    return { error: "Сначала создайте пару" };
  }

  const partnerId = pair.user1_id === meId ? pair.user2_id : pair.user1_id;
  if (!partnerId) return { error: "Партнёр не подключён" };

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_url")
    .in("id", [meId, partnerId])
    .returns<ProfileRow[]>();

  if (profilesError) {
    console.error("resolveChatContext profiles error", profilesError);
  }

  const profileMap = new Map<string, ProfileRow>((profiles || []).map((item) => [item.id, item]));
  const meProfile = profileMap.get(meId);
  const partnerProfile = profileMap.get(partnerId);

  const meName = normalizeName(meProfile?.display_name) || readMetadataString(meUser.user_metadata, "display_name") || "Вы";
  const partnerName = normalizeName(partnerProfile?.display_name) || PARTNER_FALLBACK_NAME;

  return {
    data: {
      pair,
      me: {
        id: meId,
        displayName: meName,
        avatarUrl: normalizeName(meProfile?.avatar_url) || readMetadataString(meUser.user_metadata, "avatar_url"),
      },
      partner: {
        id: partnerId,
        displayName: partnerName,
        avatarUrl: normalizeName(partnerProfile?.avatar_url),
      },
    },
  };
}

async function assertReplyTargetInPair(pairId: string, replyToId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("id", replyToId)
    .eq("pair_id", pairId)
    .maybeSingle<{ id: string }>();
  if (error) return false;
  return Boolean(data?.id);
}

export async function getChatBootstrapAction(limit = 50, before?: string) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось открыть чат" };

  const supabase = await createClient();
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 50;

  let query = supabase
    .from("chat_messages")
    .select(CHAT_FIELDS)
    .eq("pair_id", resolved.data.pair.id)
    .order("created_at", { ascending: false })
    .limit(safeLimit + 1);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: rows, error: rowsError } = await query.returns<ChatMessageRow[]>();

  if (rowsError) {
    console.error("getChatBootstrapAction rows error", rowsError);
    return { error: "Не удалось загрузить сообщения" };
  }

  const hasMore = (rows || []).length > safeLimit;
  const messages = (rows || []).slice(0, safeLimit).reverse();

  const { data: partnerPresence } = await supabase
    .from("user_presence")
    .select("last_seen_at")
    .eq("pair_id", resolved.data.pair.id)
    .eq("user_id", resolved.data.partner.id)
    .maybeSingle<{ last_seen_at: string | null }>();

  return {
    pairId: resolved.data.pair.id,
    me: resolved.data.me,
    partner: {
      ...resolved.data.partner,
      lastSeenAt: partnerPresence?.last_seen_at || null,
    },
    messages,
    hasMore,
  };
}

export async function sendChatMessageAction(text: string, replyToId?: string | null) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось отправить сообщение" };

  const bodyText = text.trim();
  if (bodyText.length < 1) return { error: "Сообщение пустое" };
  if (bodyText.length > 2000) return { error: "Сообщение слишком длинное (макс. 2000 символов)" };

  let safeReplyToId: string | null = null;
  if (typeof replyToId === "string" && replyToId.trim()) {
    const exists = await assertReplyTargetInPair(resolved.data.pair.id, replyToId.trim());
    if (!exists) return { error: "Сообщение для ответа не найдено" };
    safeReplyToId = replyToId.trim();
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("chat_messages")
    .insert({
      pair_id: resolved.data.pair.id,
      sender_id: resolved.data.me.id,
      receiver_id: resolved.data.partner.id,
      reply_to_id: safeReplyToId,
      message_kind: "text",
      body_text: bodyText,
      media_url: null,
    })
    .select(CHAT_FIELDS)
    .single<ChatMessageRow>();

  if (error || !row) {
    console.error("sendChatMessageAction error", error);
    return { error: "Не удалось отправить сообщение" };
  }

  return { success: true, message: row };
}

export async function editChatMessageAction(messageId: string, text: string) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось изменить сообщение" };

  const bodyText = text.trim();
  if (bodyText.length < 1) return { error: "Сообщение пустое" };
  if (bodyText.length > 2000) return { error: "Сообщение слишком длинное (макс. 2000 символов)" };

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("chat_messages")
    .update({ body_text: bodyText, edited_at: now })
    .eq("id", messageId)
    .eq("pair_id", resolved.data.pair.id)
    .eq("sender_id", resolved.data.me.id)
    .is("deleted_at", null)
    .select(CHAT_FIELDS)
    .single<ChatMessageRow>();

  if (error || !row) {
    console.error("editChatMessageAction error", error);
    return { error: "Не удалось изменить сообщение" };
  }

  return { success: true, message: row };
}

export async function deleteChatMessageAction(messageId: string) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось удалить сообщение" };

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("chat_messages")
    .update({ body_text: null, deleted_at: now })
    .eq("id", messageId)
    .eq("pair_id", resolved.data.pair.id)
    .eq("sender_id", resolved.data.me.id)
    .is("deleted_at", null)
    .select(CHAT_FIELDS)
    .single<ChatMessageRow>();

  if (error || !row) {
    console.error("deleteChatMessageAction error", error);
    return { error: "Не удалось удалить сообщение" };
  }

  return { success: true, message: row };
}

export async function getChatMediaMessageAction(messageId: string) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось открыть медиа" };

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("chat_messages")
    .select(CHAT_FIELDS)
    .eq("id", messageId)
    .eq("pair_id", resolved.data.pair.id)
    .maybeSingle<ChatMessageRow>();

  if (error || !row) {
    console.error("getChatMediaMessageAction error", error);
    return { error: "Медиа не найдено" };
  }

  if (!row.media_url) {
    return { error: "У сообщения нет медиа" };
  }

  return { message: row, me: resolved.data.me, partner: resolved.data.partner };
}

export async function markChatReadAction(messageIds?: string[]) {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось обновить статус прочтения" };

  const supabase = await createClient();
  const now = new Date().toISOString();
  const cleanIds = Array.isArray(messageIds)
    ? messageIds.filter((value) => typeof value === "string" && value.trim().length > 0)
    : [];

  let query = supabase
    .from("chat_messages")
    .update({ read_at: now })
    .eq("pair_id", resolved.data.pair.id)
    .eq("receiver_id", resolved.data.me.id)
    .is("read_at", null);

  if (cleanIds.length > 0) {
    query = query.in("id", cleanIds);
  }

  const { data, error } = await query.select("id").returns<{ id: string }[]>();

  if (error) {
    console.error("markChatReadAction error", error);
    return { error: "Не удалось отметить сообщения прочитанными" };
  }

  return { success: true, updated: data?.length || 0, readAt: now };
}

export async function getChatAdviceAction() {
  const resolved = await resolveChatContext();
  if (!resolved.data) return { error: resolved.error || "Не удалось получить совет" };

  const supabase = await createClient();
  const partnerName = resolved.data.partner.displayName || PARTNER_FALLBACK_NAME;

  const { data: statusRow } = await supabase
    .from("user_statuses")
    .select("status_text,status_emoji,updated_at")
    .eq("pair_id", resolved.data.pair.id)
    .eq("user_id", resolved.data.partner.id)
    .maybeSingle<{ status_text: string | null; status_emoji: string | null; updated_at: string | null }>();

  const generatedAt = new Date().toISOString();
  if (isHeavyStatus(statusRow?.status_text || null, statusRow?.status_emoji || null)) {
    return {
      text: `Спроси, как сейчас себя чувствует ${partnerName}`,
      generatedAt,
    };
  }

  const { data: lastPartnerMessage } = await supabase
    .from("chat_messages")
    .select("created_at")
    .eq("pair_id", resolved.data.pair.id)
    .eq("sender_id", resolved.data.partner.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ created_at: string }>();

  if (!lastPartnerMessage?.created_at) {
    return { text: `Спроси, о чём сейчас думает ${partnerName}`, generatedAt };
  }

  const lastTimestamp = new Date(lastPartnerMessage.created_at).getTime();
  const minutesFromLastMessage = Math.floor((Date.now() - lastTimestamp) / 60000);

  if (Number.isFinite(minutesFromLastMessage) && minutesFromLastMessage > 120) {
    return { text: `Спроси, о чём сейчас думает ${partnerName}`, generatedAt };
  }

  return { text: `Спроси настроение у ${partnerName}`, generatedAt };
}
