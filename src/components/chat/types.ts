export type ChatMessageKind = "text" | "image" | "voice" | "video_note";

export type ChatMessage = {
  id: string;
  pair_id: string;
  sender_id: string;
  receiver_id: string;
  reply_to_id: string | null;
  message_kind: ChatMessageKind;
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

export type ChatUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};
