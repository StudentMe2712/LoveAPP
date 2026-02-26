"use client";

import Image from "next/image";
import BackButton from "@/components/BackButton";

type ChatHeaderProps = {
  partnerName: string;
  partnerAvatarUrl: string | null;
  isPartnerOnline: boolean;
};

export default function ChatHeader({ partnerName, partnerAvatarUrl, isPartnerOnline }: ChatHeaderProps) {
  return (
    <header className="w-full max-w-sm mx-auto pt-3 pb-3 flex items-center justify-between gap-2">
      <BackButton href="/" />

      <div className="flex items-center gap-3 min-w-0 flex-1">
        {partnerAvatarUrl ? (
          <Image
            src={partnerAvatarUrl}
            alt={partnerName}
            width={52}
            height={52}
            unoptimized
            className="w-12 h-12 rounded-full object-cover border border-[var(--border)] shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-muted)] border border-[var(--border)] text-xl shrink-0">
            👤
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[26px] leading-none font-extrabold tracking-tight truncate" style={{ color: "var(--text)" }}>
            {partnerName}
          </p>
          <p className="text-sm font-bold mt-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
            {isPartnerOnline ? "в сети" : "не в сети"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          disabled
          aria-label="Видеозвонок (скоро)"
          className="w-11 h-11 rounded-full border border-[var(--border)] bg-[var(--bg-card)] opacity-60 cursor-not-allowed text-lg"
        >
          📹
        </button>
        <button
          type="button"
          disabled
          aria-label="Звонок (скоро)"
          className="w-11 h-11 rounded-full border border-[var(--border)] bg-[var(--bg-card)] opacity-60 cursor-not-allowed text-lg"
        >
          📞
        </button>
      </div>
    </header>
  );
}