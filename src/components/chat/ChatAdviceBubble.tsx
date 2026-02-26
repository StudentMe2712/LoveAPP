"use client";

type ChatAdviceBubbleProps = {
  text: string;
  generatedAt: string;
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatAdviceBubble({ text, generatedAt }: ChatAdviceBubbleProps) {
  return (
    <div className="w-full max-w-sm px-2">
      <div className="rounded-3xl border p-4 bg-[color:rgba(255,247,235,0.9)] dark:bg-[color:rgba(58,45,36,0.88)] border-[color:rgba(204,165,115,0.45)]">
        <div className="flex items-start gap-3">
          <div className="text-3xl leading-none pt-0.5">💡</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              AI совет
            </p>
            <p className="text-base font-semibold leading-snug" style={{ color: "var(--text)" }}>
              {text}
            </p>
            <p className="text-xs font-bold opacity-60 text-right mt-2" style={{ color: "var(--text)" }}>
              {formatTime(generatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}