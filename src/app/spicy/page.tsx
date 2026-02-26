"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import BackButton from "@/components/BackButton";
import { hapticFeedback } from "@/lib/utils/haptics";

type SpicyGameMode = "truth" | "dare" | "rather" | "discuss" | "hot" | "hot-dare";
type CardGameItem = string | [string, string];

type AISuggestion = {
  question: string;
  hint?: string;
};

const TRUTH_QUESTIONS: string[] = [
  "Что тебе больше всего нравится в наших отношениях?",
  "Какой момент с нами ты вспоминаешь с самой большой теплотой?",
  "Чего тебе сейчас не хватает в нашей паре?",
  "Что тебя во мне вдохновляет?",
  "Как ты понял(а), что влюбился(ась)?",
  "О чём ты мечтаешь для нас двоих через год?",
  "Какая моя привычка вызывает у тебя улыбку?",
  "Что для тебя значит «быть рядом»?",
  "Какую тему мы давно откладываем, но стоит обсудить?",
  "За что ты сегодня мне благодарен(на)?",
  "Что бы ты хотел(а), чтобы я чаще говорил(а)?",
  "Какая наша общая ценность для тебя самая важная?",
];

const DARE_CHALLENGES: string[] = [
  "Скажи партнёру 3 искренних комплимента подряд.",
  "Обними партнёра и молча держи 30 секунд.",
  "Расскажи смешную историю о нас в трёх предложениях.",
  "Спой 20 секунд любимой песни партнёра.",
  "Сделай мини-массаж плеч 2 минуты.",
  "Покажи танец на 15 секунд без музыки.",
  "Скажи, что тебе в партнёре нравится сегодня больше всего.",
  "Придумай для вашей пары милое прозвище-команду.",
  "Повтори последнюю фразу партнёра смешным голосом.",
  "Сними короткое видео «признание» и покажи партнёру.",
  "Назови 5 причин, почему тебе хорошо в этой паре.",
  "Сделай фото-позу «самая счастливая пара» прямо сейчас.",
];

const WOULD_YOU_RATHER: [string, string][] = [
  ["Путешествие спонтанно", "Путешествие по чёткому плану"],
  ["Ужин дома", "Ужин в новом месте"],
  ["Романтичный вечер", "Весёлый активный вечер"],
  ["Море", "Горы"],
  ["Ранний подъём", "Поздний сон"],
  ["Фильм", "Настольная игра"],
  ["Молчаливые объятия", "Долгий разговор"],
  ["Сюрприз без повода", "Сюрприз по поводу"],
  ["Фотосессия", "Видео-влог"],
  ["День без соцсетей", "День без сериалов"],
];

const DISCUSS_TOPICS: string[] = [
  "Какие наши совместные традиции мы хотим развивать?",
  "Как выглядит идеальный выходной для нас двоих?",
  "Что нам помогает легче проходить сложные дни?",
  "Какие маленькие ритуалы делают нас ближе?",
  "Как мы можем лучше поддерживать друг друга в стрессе?",
  "Что стоит упростить в быту уже на этой неделе?",
  "Какие общие цели до конца года нам важны?",
  "Какой формат свиданий нам заходит больше всего?",
  "Какой честный разговор мы давно откладываем?",
  "Что в наших отношениях уже работает отлично?",
];

const HOT_QUESTIONS: string[] = [
  "Какой мой взгляд для тебя самый «опасный»?",
  "Какое прикосновение тебе нравится больше всего?",
  "Что ты хочешь, чтобы я чаще делал(а) только для тебя?",
  "Какой комплимент от меня тебя особенно зажигает?",
  "Что в нашей близости тебе хочется усилить?",
  "Какой сценарий свидания ты считаешь самым горячим?",
  "Какая моя фраза действует на тебя мгновенно?",
  "Что ты думаешь обо мне, но редко говоришь вслух?",
  "Какой момент между нами был самым запоминающимся?",
  "Какой эксперимент в романтике тебе хочется попробовать?",
];

const HOT_DARES: string[] = [
  "Смотри партнёру в глаза 45 секунд и не отводи взгляд.",
  "Шёпотом скажи партнёру то, что давно хотел(а) сказать.",
  "Сделай медленный массаж рук 2 минуты.",
  "Обними партнёра сзади и скажи 3 тёплых фразы.",
  "Придумай «горячее» прозвище и объясни почему.",
  "Поцелуй партнёра в щёку ровно 10 секунд.",
  "Расскажи о своём самом смелом романтичном желании.",
  "Сделай 20 секунд «танца только для нас».",
  "Скажи партнёру одну вещь, которая тебя в нём заводит.",
  "Обними партнёра и молча подышите вместе 30 секунд.",
];

function textFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const values = Object.values(value as Record<string, unknown>);
    const firstString = values.find((entry) => typeof entry === "string" && entry.trim().length > 0);
    return typeof firstString === "string" ? firstString.trim() : null;
  }
  return null;
}

function normalizeAISuggestions(raw: unknown): AISuggestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): AISuggestion | null => {
      if (typeof item === "string") {
        const question = item.trim();
        return question ? { question } : null;
      }
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const values = Object.values(record);
      const question =
        textFromUnknown(record.question) ??
        textFromUnknown(record.prompt) ??
        textFromUnknown(record.text) ??
        textFromUnknown(record.title) ??
        textFromUnknown(values[0]);
      if (!question) return null;
      const hint =
        textFromUnknown(record.hint) ?? textFromUnknown(record.clue) ?? textFromUnknown(record.tip) ?? textFromUnknown(values[1]);
      return hint && hint !== question ? { question, hint } : { question };
    })
    .filter((item): item is AISuggestion => item !== null);
}

function normalizeSpicyItems(items: unknown[], mode: SpicyGameMode): CardGameItem[] {
  if (mode === "rather") {
    return items
      .filter(
        (item): item is [string, string] =>
          Array.isArray(item) && item.length >= 2 && typeof item[0] === "string" && typeof item[1] === "string",
      )
      .map(([a, b]) => [a, b]);
  }

  return items.filter((item): item is string => typeof item === "string");
}

function CardGame({
  title,
  emoji,
  color,
  initialItems,
  renderItem,
  onBack,
  aiMode,
}: {
  title: string;
  emoji: string;
  color: string;
  initialItems: CardGameItem[];
  renderItem: (item: CardGameItem, i: number) => React.ReactNode;
  onBack: () => void;
  aiMode: SpicyGameMode;
}) {
  const [items, setItems] = useState<CardGameItem[]>(initialItems);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [generating, setGenerating] = useState(false);

  const current = items[index];
  const remaining = items.map((_, i) => i).filter((i) => !done.includes(i) && i !== index);

  const next = () => {
    hapticFeedback.medium();
    if (remaining.length === 0) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setFinished(true);
      return;
    }

    const nextIdx = remaining[Math.floor(Math.random() * remaining.length)];
    setDone((prev) => [...prev, index]);
    setIndex(nextIdx);
  };

  const loadAI = async () => {
    setGenerating(true);
    hapticFeedback.medium();

    try {
      const response = await fetch("/api/spicy-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: aiMode, count: 10 }),
      });
      const data = (await response.json()) as { items?: unknown[] };
      const generatedItems = Array.isArray(data.items) ? normalizeSpicyItems(data.items, aiMode) : [];
      if (generatedItems.length > 0) {
        const startIdx = items.length;
        setItems((prev) => [...prev, ...generatedItems]);
        setDone([]);
        setIndex(startIdx);
        setFinished(false);
        hapticFeedback.success();
      }
    } catch {
      setDone([]);
      setIndex(0);
      setFinished(false);
    } finally {
      setGenerating(false);
    }
  };

  const restart = () => {
    setDone([]);
    setIndex(0);
    setFinished(false);
    hapticFeedback.light();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center px-5 pt-10 pb-28">
      <header className="w-full flex items-center gap-3 mb-8">
        <BackButton onClick={onBack} />
        <h1 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
          {emoji} {title}
        </h1>
        <span className="ml-auto text-xs font-bold opacity-40" style={{ color: "var(--text)" }}>
          {done.length + 1}/{items.length}
        </span>
      </header>

      <div className="w-full max-w-sm h-1.5 rounded-full mb-6" style={{ background: "var(--bg-muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((done.length + 1) / items.length) * 100}%`, background: color }}
        />
      </div>

      <div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center gap-6">
        {finished ? (
          <div className="flex flex-col items-center gap-6 text-center w-full">
            <span className="text-6xl animate-bounce">🎉</span>
            <div>
              <p className="text-xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
                Всё прошли!
              </p>
              <p className="text-sm opacity-70" style={{ color: "var(--text)" }}>
                {done.length + 1} карточек позади
              </p>
            </div>

            <button
              type="button"
              onClick={loadAI}
              disabled={generating}
              className="w-full py-3 rounded-2xl font-extrabold text-white disabled:opacity-60"
              style={{ background: color }}
            >
              {generating ? "⚙️ Генерирую..." : "✨ Сгенерировать ещё (AI)"}
            </button>

            <button
              type="button"
              onClick={restart}
              className="w-full py-3 rounded-2xl font-bold border"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              🔄 Начать заново
            </button>
          </div>
        ) : (
          <>
            <div
              className="w-full rounded-3xl p-6 border shadow-sm"
              style={{ borderColor: `${color}55`, background: "var(--bg-card)" }}
            >
              <div className="text-base leading-relaxed font-semibold" style={{ color: "var(--text)" }}>
                {renderItem(current, index)}
              </div>
            </div>

            <button
              type="button"
              onClick={next}
              className="w-full py-3 rounded-2xl font-black text-white"
              style={{ background: color }}
            >
              {remaining.length === 0 ? "🏁 Закончить" : "Следующий →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function SpicyPage() {
  const [mode, setMode] = useState<SpicyGameMode | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  if (mode === "truth") {
    return (
      <CardGame
        title="Правда"
        emoji="💬"
        color="#8b5cf6"
        initialItems={TRUTH_QUESTIONS}
        aiMode="truth"
        onBack={() => setMode(null)}
        renderItem={(item) => <>{String(item)}</>}
      />
    );
  }

  if (mode === "dare") {
    return (
      <CardGame
        title="Действие"
        emoji="🎯"
        color="#e07a5f"
        initialItems={DARE_CHALLENGES}
        aiMode="dare"
        onBack={() => setMode(null)}
        renderItem={(item) => <>{String(item)}</>}
      />
    );
  }

  if (mode === "rather") {
    return (
      <CardGame
        title="Что лучше?"
        emoji="⚖️"
        color="#f59e0b"
        initialItems={WOULD_YOU_RATHER}
        aiMode="rather"
        onBack={() => setMode(null)}
        renderItem={(item) => {
          const [a, b] = item as [string, string];
          return (
            <div className="space-y-3">
              <p>А) {a}</p>
              <p>Б) {b}</p>
            </div>
          );
        }}
      />
    );
  }

  if (mode === "discuss") {
    return (
      <CardGame
        title="Поговорим"
        emoji="🫂"
        color="#10b981"
        initialItems={DISCUSS_TOPICS}
        aiMode="discuss"
        onBack={() => setMode(null)}
        renderItem={(item) => <>{String(item)}</>}
      />
    );
  }

  if (mode === "hot") {
    return (
      <CardGame
        title="Горячие вопросы"
        emoji="🌶️"
        color="#ec4899"
        initialItems={HOT_QUESTIONS}
        aiMode="hot"
        onBack={() => setMode(null)}
        renderItem={(item) => <>{String(item)}</>}
      />
    );
  }

  if (mode === "hot-dare") {
    return (
      <CardGame
        title="Горячие задания"
        emoji="💋"
        color="#f43f5e"
        initialItems={HOT_DARES}
        aiMode="hot-dare"
        onBack={() => setMode(null)}
        renderItem={(item) => <>{String(item)}</>}
      />
    );
  }

  const generateAIQuestions = async () => {
    setAiLoading(true);
    hapticFeedback.medium();
    try {
      const res = await fetch("/api/spicy-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "truth", count: 5 }),
      });
      const data = (await res.json()) as { items?: unknown[] };
      const parsed = normalizeAISuggestions(data.items ?? []);
      setAiSuggestions(parsed);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] px-5 pt-10 pb-28" style={{ color: "var(--text)" }}>
      <div className="max-w-sm mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <BackButton href="/" />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Для двоих</h1>
            <p className="text-sm opacity-70">Игры, вопросы и темы для вечера вдвоём</p>
          </div>
        </header>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("truth");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#ede9fe", borderColor: "#c4b5fd" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#8b5cf6" }}>
              💬
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#4c1d95" }}>Правда</h2>
              <p className="text-sm opacity-70" style={{ color: "#4c1d95" }}>{TRUTH_QUESTIONS.length} вопросов о вас обоих</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("dare");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#fff1ea", borderColor: "#f3c4b2" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#e07a5f" }}>
              🎯
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#7c2d12" }}>Действие</h2>
              <p className="text-sm opacity-70" style={{ color: "#7c2d12" }}>{DARE_CHALLENGES.length} заданий для смелых</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("rather");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#fff7dd", borderColor: "#f8df99" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#f59e0b" }}>
              ⚖️
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#78350f" }}>Что лучше?</h2>
              <p className="text-sm opacity-70" style={{ color: "#78350f" }}>{WOULD_YOU_RATHER.length} дилемм — выбери и объясни</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("discuss");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#e6fff3", borderColor: "#9de7c9" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#10b981" }}>
              🫂
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#065f46" }}>Поговорим</h2>
              <p className="text-sm opacity-70" style={{ color: "#065f46" }}>{DISCUSS_TOPICS.length} глубоких тем</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("hot");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#ffe8f2", borderColor: "#f9b7d1" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#ec4899" }}>
              🌶️
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#831843" }}>Горячие вопросы</h2>
              <p className="text-sm opacity-70" style={{ color: "#831843" }}>{HOT_QUESTIONS.length} интимных вопросов</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hapticFeedback.light();
              setMode("hot-dare");
            }}
            className="w-full rounded-3xl border p-4 flex items-center gap-3"
            style={{ background: "#ffe8ec", borderColor: "#f8a6b6" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "#f43f5e" }}>
              💋
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-base" style={{ color: "#881337" }}>Горячие задания</h2>
              <p className="text-sm opacity-70" style={{ color: "#881337" }}>{HOT_DARES.length} чувственных заданий</p>
            </div>
            <span className="ml-auto text-xl opacity-30">›</span>
          </button>
        </div>

        <section className="mt-6 rounded-3xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-extrabold">AI-подсказки для вопросов</h3>
            <button
              type="button"
              onClick={generateAIQuestions}
              disabled={aiLoading}
              className="px-4 py-2 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}
            >
              {aiLoading ? "Генерирую..." : "Сгенерировать"}
            </button>
          </div>

          {aiSuggestions.length > 0 && (
            <ul className="mt-3 space-y-2">
              {aiSuggestions.map((item, index) => (
                <li key={`${item.question}-${index}`} className="rounded-2xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-semibold">{item.question}</p>
                  {item.hint && <p className="text-xs opacity-70 mt-1">{item.hint}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}