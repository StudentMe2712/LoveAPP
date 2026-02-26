import {
  createEmptySectionBackgroundState,
  SECTION_BACKGROUND_EVENT,
  SECTION_BACKGROUND_STORAGE_KEY,
  SECTION_KEYS,
  type SectionBackgroundConfig,
  type SectionBackgroundState,
} from "@/lib/backgrounds/types";

const DB_NAME = "nash_domik_assets";
const DB_VERSION = 1;
const STORE_NAME = "section_backgrounds";

type BackgroundBlobRecord = {
  id: string;
  blob: Blob;
  createdAt: number;
};

const MAX_DIM = 0.55;
const MAX_BLUR = 6;

function isBackgroundSource(value: unknown): value is SectionBackgroundConfig["source"] {
  return value === "preset" || value === "upload";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeConfig(value: unknown): SectionBackgroundConfig | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  if (typeof raw.value !== "string" || !raw.value.trim()) return null;
  if (!isBackgroundSource(raw.source)) return null;

  const dimValue = typeof raw.dim === "number" ? raw.dim : 0.2;
  const blurValue = typeof raw.blur === "number" ? raw.blur : 0;
  const updatedAt = typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
    ? raw.updatedAt
    : Date.now();

  return {
    enabled: Boolean(raw.enabled),
    source: raw.source,
    value: raw.value,
    dim: clamp(dimValue, 0, MAX_DIM),
    blur: clamp(blurValue, 0, MAX_BLUR),
    updatedAt,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onsuccess = () => resolve(request.result);
  });
}

function runDbRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = operation(store);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        request.onsuccess = () => resolve(request.result);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      }),
  );
}

export function readSectionBackgroundState(): SectionBackgroundState {
  const fallback = createEmptySectionBackgroundState();
  if (typeof window === "undefined") return fallback;

  try {
    const raw = localStorage.getItem(SECTION_BACKGROUND_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next = createEmptySectionBackgroundState();

    for (const key of SECTION_KEYS) {
      next[key] = normalizeConfig(parsed[key]);
    }
    return next;
  } catch {
    return fallback;
  }
}

export function writeSectionBackgroundState(state: SectionBackgroundState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SECTION_BACKGROUND_STORAGE_KEY, JSON.stringify(state));
}

export function emitSectionBackgroundUpdate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SECTION_BACKGROUND_EVENT));
}

export function subscribeSectionBackgroundUpdates(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === SECTION_BACKGROUND_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener(SECTION_BACKGROUND_EVENT, listener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(SECTION_BACKGROUND_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export async function saveBackgroundBlob(blob: Blob): Promise<string> {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `bg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const record: BackgroundBlobRecord = {
    id,
    blob,
    createdAt: Date.now(),
  };

  await runDbRequest("readwrite", (store) => store.put(record));
  return id;
}

export async function readBackgroundBlob(blobId: string): Promise<Blob | null> {
  if (!blobId) return null;
  try {
    const result = await runDbRequest<BackgroundBlobRecord | undefined>("readonly", (store) => store.get(blobId));
    return result?.blob ?? null;
  } catch {
    return null;
  }
}

export async function deleteBackgroundBlob(blobId: string): Promise<void> {
  if (!blobId) return;
  try {
    await runDbRequest("readwrite", (store) => store.delete(blobId));
  } catch {
    // Safe no-op; stale blobs should not break UX.
  }
}
