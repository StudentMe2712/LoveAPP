import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import { getChatMediaMessageAction } from "@/app/actions/chat";

type MediaViewerPageProps = {
  params: Promise<{ id: string }>;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default async function MediaViewerPage({ params }: MediaViewerPageProps) {
  const { id } = await params;
  const result = await getChatMediaMessageAction(id);
  if ("error" in result || !result.message.media_url) {
    notFound();
  }

  const message = result.message;
  const mediaUrl = message.media_url;
  if (!mediaUrl) {
    notFound();
  }

  return (
    <main className="app-safe-top app-safe-bottom w-full min-h-[100dvh] bg-black text-white px-4 py-4">
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4">
        <BackButton href="/chat" />
        <p className="text-xs font-bold opacity-70">{formatTime(message.created_at)}</p>
      </div>

      <div className="w-full max-w-md mx-auto">
        {message.message_kind === "image" && (
          <div className="relative w-full min-h-[60dvh] rounded-3xl overflow-hidden border border-white/20">
            <Image
              src={mediaUrl}
              alt="Фото"
              fill
              unoptimized
              className="object-contain bg-black"
              sizes="100vw"
            />
          </div>
        )}

        {message.message_kind === "voice" && (
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4">
            <audio controls preload="metadata" src={mediaUrl} className="w-full" />
          </div>
        )}

        {message.message_kind === "video_note" && (
          <div className="rounded-3xl border border-white/20 bg-white/10 p-4 flex justify-center">
            <video src={mediaUrl} controls preload="metadata" playsInline className="w-full max-w-[360px] rounded-2xl" />
          </div>
        )}

        {(message.body_text || "").trim().length > 0 && (
          <p className="mt-4 text-sm font-medium whitespace-pre-wrap opacity-90">{message.body_text}</p>
        )}

        <Link href="/chat" className="mt-6 inline-flex h-10 items-center justify-center rounded-full border border-white/30 px-4 text-sm font-bold">
          Назад в чат
        </Link>
      </div>
    </main>
  );
}
