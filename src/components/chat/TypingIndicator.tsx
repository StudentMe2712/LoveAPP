"use client";

type TypingIndicatorProps = {
  partnerName: string;
};

export default function TypingIndicator({ partnerName }: TypingIndicatorProps) {
  return (
    <div className="w-full max-w-sm px-2 pb-2">
      <p className="text-sm font-semibold opacity-70" style={{ color: "var(--text)" }}>
        • {partnerName} печатает...
      </p>
    </div>
  );
}