import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { removeSharedFileByPath, saveFileToSharedFolder } from "@/lib/media/sharedStorage";

export const runtime = "nodejs";

type PairRow = {
  id: string;
  user1_id: string;
  user2_id: string | null;
};

type MediaKind = "image" | "voice" | "video_note";

type ChatMessageRow = {
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

const CHAT_FIELDS =
  "id,pair_id,sender_id,receiver_id,reply_to_id,message_kind,body_text,media_url,media_mime,media_size_bytes,media_duration_sec,media_width,media_height,created_at,edited_at,deleted_at,read_at";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VOICE_BYTES = 6 * 1024 * 1024;
const MAX_VIDEO_NOTE_BYTES = 10 * 1024 * 1024;
const MAX_VOICE_DURATION_SEC = 90;
const MAX_VIDEO_NOTE_DURATION_SEC = 30;

function toPositiveNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toOptionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function ensureMediaKind(value: FormDataEntryValue | null): MediaKind | null {
  if (typeof value !== "string") return null;
  if (value === "image" || value === "voice" || value === "video_note") return value;
  return null;
}

export async function POST(request: NextRequest) {
  let savedFilePath: string | null = null;
  let insertedMomentId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    }

    const { data: pair, error: pairError } = await supabase
      .from("pair")
      .select("id,user1_id,user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle<PairRow>();

    if (pairError || !pair?.id || !pair.user1_id || !pair.user2_id) {
      return NextResponse.json({ error: "Сначала создайте пару" }, { status: 400 });
    }

    const partnerId = pair.user1_id === user.id ? pair.user2_id : pair.user1_id;
    if (!partnerId) {
      return NextResponse.json({ error: "Партнёр не найден" }, { status: 400 });
    }

    const formData = await request.formData();
    const kind = ensureMediaKind(formData.get("kind"));
    const file = formData.get("file");
    const messageText = toOptionalText(formData.get("text"));
    const replyToIdRaw = toOptionalText(formData.get("replyToId"));
    const durationSec = toPositiveNumber(formData.get("durationSec"));
    const width = toPositiveNumber(formData.get("width"));
    const height = toPositiveNumber(formData.get("height"));

    if (!kind) {
      return NextResponse.json({ error: "Неподдерживаемый тип медиа" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }
    if (messageText && messageText.length > 2000) {
      return NextResponse.json({ error: "Подпись слишком длинная (макс. 2000 символов)" }, { status: 400 });
    }

    if (kind === "image") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Для изображения нужен image/* файл" }, { status: 400 });
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Изображение слишком большое (макс. 10MB)" }, { status: 400 });
      }
    }

    if (kind === "voice") {
      if (!file.type.startsWith("audio/")) {
        return NextResponse.json({ error: "Для голосового нужен audio/* файл" }, { status: 400 });
      }
      if (file.size > MAX_VOICE_BYTES) {
        return NextResponse.json({ error: "Голосовое слишком большое (макс. 6MB)" }, { status: 400 });
      }
      if ((durationSec ?? 0) > MAX_VOICE_DURATION_SEC) {
        return NextResponse.json({ error: "Голосовое слишком длинное (макс. 90 сек)" }, { status: 400 });
      }
    }

    if (kind === "video_note") {
      if (!file.type.startsWith("video/")) {
        return NextResponse.json({ error: "Для кружка нужен video/* файл" }, { status: 400 });
      }
      if (file.size > MAX_VIDEO_NOTE_BYTES) {
        return NextResponse.json({ error: "Кружок слишком большой (макс. 10MB)" }, { status: 400 });
      }
      if ((durationSec ?? 0) > MAX_VIDEO_NOTE_DURATION_SEC) {
        return NextResponse.json({ error: "Кружок слишком длинный (макс. 30 сек)" }, { status: 400 });
      }
    }

    let safeReplyToId: string | null = null;
    if (replyToIdRaw) {
      const { data: replyTarget } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("id", replyToIdRaw)
        .eq("pair_id", pair.id)
        .maybeSingle<{ id: string }>();
      if (!replyTarget?.id) {
        return NextResponse.json({ error: "Сообщение для ответа не найдено" }, { status: 400 });
      }
      safeReplyToId = replyTarget.id;
    }

    const saved = await saveFileToSharedFolder({
      file,
      ownerId: user.id,
      prefix: `chat-${kind}`,
      routeBase: "/api/media",
    });
    savedFilePath = saved.filePath;

    if (kind === "image") {
      const { data: momentRow, error: momentInsertError } = await supabase
        .from("moments")
        .insert({
          sender_id: user.id,
          photo_url: saved.publicUrl,
          caption: null,
        })
        .select("id")
        .single<{ id: string }>();

      if (momentInsertError || !momentRow?.id) {
        console.error("chat media insert moment error", momentInsertError);
        await removeSharedFileByPath(saved.filePath);
        return NextResponse.json({ error: "Не удалось сохранить фото в галерею" }, { status: 500 });
      }

      insertedMomentId = momentRow.id;
    }

    const { data: insertedMessage, error: insertMessageError } = await supabase
      .from("chat_messages")
      .insert({
        pair_id: pair.id,
        sender_id: user.id,
        receiver_id: partnerId,
        reply_to_id: safeReplyToId,
        message_kind: kind,
        body_text: messageText,
        media_url: saved.publicUrl,
        media_mime: file.type || null,
        media_size_bytes: file.size,
        media_duration_sec: durationSec,
        media_width: width,
        media_height: height,
      })
      .select(CHAT_FIELDS)
      .single<ChatMessageRow>();

    if (insertMessageError || !insertedMessage) {
      console.error("chat media insert message error", insertMessageError);
      if (insertedMomentId) {
        await supabase.from("moments").delete().eq("id", insertedMomentId);
      }
      await removeSharedFileByPath(saved.filePath);
      return NextResponse.json({ error: "Не удалось сохранить сообщение" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: insertedMessage }, { status: 200 });
  } catch (error) {
    console.error("chat media upload error", error);

    if (insertedMomentId) {
      try {
        const supabase = await createClient();
        await supabase.from("moments").delete().eq("id", insertedMomentId);
      } catch {
        // ignore cleanup failure
      }
    }

    if (savedFilePath) {
      await removeSharedFileByPath(savedFilePath);
    }

    return NextResponse.json({ error: "Внутренняя ошибка при загрузке медиа" }, { status: 500 });
  }
}
