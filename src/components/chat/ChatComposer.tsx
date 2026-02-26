"use client";

import {
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { hapticFeedback } from "@/lib/utils/haptics";
import type { ChatMessage, ChatMessageKind } from "@/components/chat/types";

type SendMediaPayload = {
  kind: Exclude<ChatMessageKind, "text">;
  file: File;
  durationSec?: number | null;
  width?: number | null;
  height?: number | null;
  text?: string | null;
  replyToId?: string | null;
};

type ChatComposerProps = {
  onSendText: (text: string, replyToId?: string | null) => Promise<boolean>;
  onSendMedia: (payload: SendMediaPayload) => Promise<boolean>;
  onTyping: (currentInput: string) => void;
  isSending: boolean;
  replyTarget?: ChatMessage | null;
  onCancelReply?: () => void;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  onEditMessage?: (messageId: string, text: string) => Promise<boolean>;
};

type PendingImage = {
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VOICE_SEC = 90;
const MAX_VIDEO_NOTE_SEC = 30;

function pickAudioMimeType() {
  const variants = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const variant of variants) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(variant)) {
      return variant;
    }
  }
  return "";
}

function pickVideoMimeType() {
  const variants = ["video/mp4", "video/webm;codecs=vp8,opus", "video/webm"];
  for (const variant of variants) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(variant)) {
      return variant;
    }
  }
  return "";
}

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.floor(seconds));
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function previewText(message: ChatMessage) {
  const text = (message.body_text || "").trim();
  if (text.length > 0) return text.length > 70 ? `${text.slice(0, 70)}…` : text;
  if (message.message_kind === "image") return "Фото";
  if (message.message_kind === "voice") return "Голосовое";
  if (message.message_kind === "video_note") return "Кружок";
  return "Сообщение";
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const imageBitmap = await createImageBitmap(file);
    const dimensions = { width: imageBitmap.width, height: imageBitmap.height };
    imageBitmap.close();
    return dimensions;
  } catch {
    return null;
  }
}

async function compressImage(file: File): Promise<{ file: File; width: number | null; height: number | null }> {
  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    return { file, width: null, height: null };
  }

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(dimensions.width, dimensions.height));
  const targetWidth = Math.max(1, Math.round(dimensions.width * scale));
  const targetHeight = Math.max(1, Math.round(dimensions.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { file, width: dimensions.width, height: dimensions.height };
  }

  const bitmap = await createImageBitmap(file);
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  if (!blob) {
    return { file, width: dimensions.width, height: dimensions.height };
  }

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error("Изображение слишком большое после сжатия (макс. 10MB)");
  }

  const compressedFile = new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "chat-image"}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    width: targetWidth,
    height: targetHeight,
  };
}

export default function ChatComposer({
  onSendText,
  onSendMedia,
  onTyping,
  isSending,
  replyTarget = null,
  onCancelReply,
  editingMessage = null,
  onCancelEdit,
  onEditMessage,
}: ChatComposerProps) {
  const [text, setText] = useState("");
  const [recordingKind, setRecordingKind] = useState<"voice" | "video_note" | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const [pendingImageCaption, setPendingImageCaption] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const recordingStartMsRef = useRef<number>(0);
  const recordingTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);
  const cancelRecordingRef = useRef(false);
  const pointerStartXRef = useRef<number | null>(null);
  const trackDimensionsRef = useRef<{ width: number | null; height: number | null }>({ width: null, height: null });
  const lastEditingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }
    };
  }, [pendingImage?.previewUrl]);

  useEffect(() => {
    if (!editingMessage?.id) {
      lastEditingIdRef.current = null;
      return;
    }
    if (lastEditingIdRef.current === editingMessage.id) return;
    lastEditingIdRef.current = editingMessage.id;
    setText(editingMessage.body_text || "");
    onTyping(editingMessage.body_text || "");
  }, [editingMessage, onTyping]);

  const isDisabled = isSending || mediaBusy || recordingKind !== null;
  const recordingHint = useMemo(() => {
    if (!recordingKind) return "";
    return recordingKind === "voice" ? "Запись голосового..." : "Запись кружка...";
  }, [recordingKind]);

  const clearTimers = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  };

  const releaseStream = () => {
    if (!mediaStreamRef.current) return;
    for (const track of mediaStreamRef.current.getTracks()) {
      track.stop();
    }
    mediaStreamRef.current = null;
  };

  const resetPendingImage = () => {
    if (pendingImage?.previewUrl) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }
    setPendingImage(null);
    setPendingImageCaption("");
  };

  const handleSubmitText = async (event: FormEvent) => {
    event.preventDefault();
    if (isDisabled) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    hapticFeedback.light();

    if (editingMessage && onEditMessage) {
      const success = await onEditMessage(editingMessage.id, trimmed);
      if (success) {
        setText("");
        onTyping("");
      }
      return;
    }

    const success = await onSendText(trimmed, replyTarget?.id ?? null);
    if (success) {
      setText("");
      onTyping("");
      onCancelReply?.();
    }
  };

  const sendPendingImage = async () => {
    if (!pendingImage) return;
    setMediaBusy(true);
    const success = await onSendMedia({
      kind: "image",
      file: pendingImage.file,
      width: pendingImage.width,
      height: pendingImage.height,
      durationSec: null,
      text: pendingImageCaption.trim() || null,
      replyToId: replyTarget?.id ?? null,
    });
    setMediaBusy(false);

    if (success) {
      hapticFeedback.success();
      resetPendingImage();
      onCancelReply?.();
    } else {
      hapticFeedback.heavy();
    }
  };

  const finalizeRecording = async () => {
    const recorder = mediaRecorderRef.current;
    const currentKind = recordingKind;
    mediaRecorderRef.current = null;

    if (!recorder || !currentKind) {
      clearTimers();
      setRecordingKind(null);
      setRecordingSeconds(0);
      releaseStream();
      return;
    }

    const durationSec = Math.max(0.1, (Date.now() - recordingStartMsRef.current) / 1000);
    const shouldCancel = cancelRecordingRef.current;

    clearTimers();
    setRecordingKind(null);
    setRecordingSeconds(0);

    const chunks = [...mediaChunksRef.current];
    mediaChunksRef.current = [];

    releaseStream();

    if (shouldCancel || chunks.length === 0) {
      cancelRecordingRef.current = false;
      return;
    }

    const mimeType = recorder.mimeType || (currentKind === "voice" ? "audio/webm" : "video/webm");
    const extension = currentKind === "voice" ? "webm" : mimeType.includes("mp4") ? "mp4" : "webm";
    const file = new File(chunks, `chat-${currentKind}-${Date.now()}.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });

    setMediaBusy(true);
    const success = await onSendMedia({
      kind: currentKind,
      file,
      durationSec,
      width: trackDimensionsRef.current.width,
      height: trackDimensionsRef.current.height,
      text: null,
      replyToId: replyTarget?.id ?? null,
    });
    setMediaBusy(false);

    if (!success) {
      hapticFeedback.heavy();
    } else {
      hapticFeedback.success();
      onCancelReply?.();
    }
  };

  const stopRecording = (cancel: boolean) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    cancelRecordingRef.current = cancel;
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async (kind: "voice" | "video_note", pointerX: number) => {
    if (isSending || mediaBusy || recordingKind) return;
    if (typeof window === "undefined" || !navigator.mediaDevices || typeof MediaRecorder === "undefined") {
      toast.error("Запись медиа не поддерживается на этом устройстве");
      return;
    }

    try {
      const constraints: MediaStreamConstraints =
        kind === "voice"
          ? { audio: true, video: false }
          : {
              audio: true,
              video: {
                facingMode: "user",
                width: { ideal: 720 },
                height: { ideal: 720 },
              },
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        trackDimensionsRef.current = {
          width: typeof settings.width === "number" ? settings.width : null,
          height: typeof settings.height === "number" ? settings.height : null,
        };
      } else {
        trackDimensionsRef.current = { width: null, height: null };
      }

      const pickedMime = kind === "voice" ? pickAudioMimeType() : pickVideoMimeType();
      const recorder = pickedMime ? new MediaRecorder(stream, { mimeType: pickedMime }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];
      cancelRecordingRef.current = false;
      pointerStartXRef.current = pointerX;
      recordingStartMsRef.current = Date.now();
      setRecordingKind(kind);
      setRecordingSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        void finalizeRecording();
      };

      recorder.start(200);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((Date.now() - recordingStartMsRef.current) / 1000);
      }, 150);

      const maxSeconds = kind === "voice" ? MAX_VOICE_SEC : MAX_VIDEO_NOTE_SEC;
      maxDurationTimerRef.current = window.setTimeout(() => {
        stopRecording(false);
      }, maxSeconds * 1000);

      hapticFeedback.medium();
    } catch (error) {
      console.error("startRecording error", error);
      releaseStream();
      setRecordingKind(null);
      toast.error("Не удалось начать запись. Проверь доступ к микрофону/камере");
    }
  };

  const onRecordPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!recordingKind || pointerStartXRef.current === null) return;
    const deltaX = event.clientX - pointerStartXRef.current;
    if (deltaX < -90) {
      stopRecording(true);
      toast("Запись отменена");
    }
  };

  const onRecordPointerUp = () => {
    if (!recordingKind) return;
    stopRecording(false);
  };

  const handlePickImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const rawFile = event.target.files?.[0];
    event.target.value = "";
    if (!rawFile) return;

    if (!rawFile.type.startsWith("image/")) {
      toast.error("Можно отправить только изображение");
      return;
    }

    if (rawFile.size > MAX_IMAGE_BYTES) {
      toast.error("Изображение больше 10MB");
      return;
    }

    try {
      setMediaBusy(true);
      const compressed = await compressImage(rawFile);
      const previewUrl = URL.createObjectURL(compressed.file);
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }
      setPendingImage({
        file: compressed.file,
        previewUrl,
        width: compressed.width,
        height: compressed.height,
      });
      setPendingImageCaption("");
    } catch (error) {
      console.error("image prepare error", error);
      toast.error(error instanceof Error ? error.message : "Не удалось подготовить фото");
    } finally {
      setMediaBusy(false);
    }
  };

  return (
    <>
      {pendingImage && (
        <div className="fixed inset-0 z-[110] bg-black/90 p-4 flex flex-col">
          <div className="w-full max-w-sm mx-auto flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white/90">Предпросмотр фото</p>
              <button
                type="button"
                onClick={resetPendingImage}
                className="h-9 px-3 rounded-full border border-white/30 text-white text-sm font-bold"
              >
                Закрыть
              </button>
            </div>
            <div className="relative flex-1 min-h-[280px] rounded-3xl overflow-hidden border border-white/15">
              <Image src={pendingImage.previewUrl} alt="Предпросмотр" fill className="object-contain bg-black" unoptimized />
            </div>
            <textarea
              value={pendingImageCaption}
              onChange={(event) => setPendingImageCaption(event.target.value)}
              placeholder="Добавить подпись к фото..."
              rows={3}
              maxLength={2000}
              className="w-full rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 px-4 py-3 resize-none outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetPendingImage}
                className="flex-1 h-11 rounded-2xl border border-white/30 text-white font-bold"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isSending || mediaBusy}
                onClick={() => void sendPendingImage()}
                className="flex-1 h-11 rounded-2xl bg-[color:var(--accent)] text-white font-black disabled:opacity-60"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmitText}
        className="w-full max-w-sm mx-auto mt-2 mb-1 pb-[calc(var(--space-2)+env(safe-area-inset-bottom,0px))]"
      >
        {(replyTarget || editingMessage) && (
          <div className="mb-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            {editingMessage ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase opacity-70" style={{ color: "var(--text)" }}>
                    Редактирование
                  </p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {previewText(editingMessage)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCancelEdit?.();
                    setText("");
                    onTyping("");
                  }}
                  className="h-7 px-2 rounded-full border border-[var(--border)] text-xs font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Отмена
                </button>
              </div>
            ) : replyTarget ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase opacity-70" style={{ color: "var(--text)" }}>
                    Ответ на сообщение
                  </p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                    {previewText(replyTarget)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancelReply}
                  className="h-7 px-2 rounded-full border border-[var(--border)] text-xs font-bold"
                  style={{ color: "var(--text)" }}
                >
                  Убрать
                </button>
              </div>
            ) : null}
          </div>
        )}

        {recordingKind && (
          <div className="mb-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-extrabold" style={{ color: "var(--text)" }}>
                {recordingHint}
              </p>
              <p className="text-xs opacity-70" style={{ color: "var(--text)" }}>
                {formatDuration(recordingSeconds)} • смахни влево для отмены
              </p>
            </div>
            <button
              type="button"
              onClick={() => stopRecording(true)}
              className="h-9 px-3 rounded-full border border-[var(--border)] font-bold text-sm"
              style={{ color: "var(--text)" }}
            >
              Отмена
            </button>
          </div>
        )}

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-2 flex items-center gap-2 shadow-[var(--shadow-soft)]">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 w-11 rounded-full border border-[var(--border)] text-[18px] font-bold disabled:opacity-45"
            style={{ color: "var(--text)" }}
            disabled={isDisabled}
            title="Вложение"
          >
            📎
          </button>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />

          <input
            value={text}
            onChange={(event) => {
              const nextValue = event.target.value;
              setText(nextValue);
              onTyping(nextValue);
            }}
            maxLength={2000}
            placeholder={editingMessage ? "Измените сообщение..." : "Ваше сообщение"}
            className="flex-1 h-11 bg-transparent px-2 text-[17px] font-semibold outline-none min-w-0"
            style={{ color: "var(--text)" }}
            disabled={isDisabled}
          />

          <button
            type="button"
            disabled={isSending || mediaBusy || !!recordingKind}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              void startRecording("voice", event.clientX);
            }}
            onPointerMove={onRecordPointerMove}
            onPointerUp={onRecordPointerUp}
            onPointerCancel={() => stopRecording(true)}
            className="h-11 w-11 rounded-full border border-[var(--border)] text-[18px] font-bold disabled:opacity-45"
            style={{ color: "var(--text)" }}
            title="Удерживай для голосового"
          >
            🎤
          </button>

          <button
            type="button"
            disabled={isSending || mediaBusy || !!recordingKind}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              void startRecording("video_note", event.clientX);
            }}
            onPointerMove={onRecordPointerMove}
            onPointerUp={onRecordPointerUp}
            onPointerCancel={() => stopRecording(true)}
            className="h-11 w-11 rounded-full border border-[var(--border)] text-[18px] font-bold disabled:opacity-45"
            style={{ color: "var(--text)" }}
            title="Удерживай для кружка"
          >
            🎥
          </button>

          <button
            type="submit"
            disabled={isDisabled || text.trim().length === 0}
            className="h-11 w-11 rounded-full font-black text-base transition-opacity bg-[color:var(--accent)] text-white disabled:opacity-45"
            title={editingMessage ? "Сохранить изменения" : "Отправить"}
          >
            {isSending ? "…" : "➤"}
          </button>
        </div>
      </form>
    </>
  );
}
