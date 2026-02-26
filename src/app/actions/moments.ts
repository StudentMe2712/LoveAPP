"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { saveFileToSharedFolder } from "@/lib/media/sharedStorage";

type TimeMachineMoment = {
  id: string;
  sender_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
};

function interleaveBySender(moments: TimeMachineMoment[]): TimeMachineMoment[] {
  const buckets = new Map<string, TimeMachineMoment[]>();
  for (const moment of moments) {
    const senderBucket = buckets.get(moment.sender_id);
    if (senderBucket) {
      senderBucket.push(moment);
      continue;
    }
    buckets.set(moment.sender_id, [moment]);
  }

  if (buckets.size <= 1) return moments;

  const queues = Array.from(buckets.values()).map((list) => [...list]);
  const interleaved: TimeMachineMoment[] = [];

  let hasItems = true;
  while (hasItems) {
    hasItems = false;
    for (const queue of queues) {
      const nextItem = queue.shift();
      if (nextItem) {
        interleaved.push(nextItem);
        hasItems = true;
      }
    }
  }

  return interleaved;
}

function rotateByDailySeed<T>(items: T[]): T[] {
  if (items.length <= 1) return items;

  const seed = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  const offset = hash % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export async function createMomentAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Необходима авторизация" };
    }

    const photo = formData.get("photo") as File | null;
    const caption = formData.get("caption") as string | null;

    if (!photo) return { error: "Фото обязательно" };
    if (!photo.type.startsWith("image/")) {
      return { error: "Можно загрузить только изображение" };
    }

    let publicUrl = "";

    try {
      const saved = await saveFileToSharedFolder({
        file: photo,
        ownerId: user.id,
        prefix: "moment",
        routeBase: "/api/images",
      });
      publicUrl = saved.publicUrl;
    } catch (error) {
      console.error("Local file write error", error);
      return { error: "Ошибка сохранения файла на сервере" };
    }

    const { error: insertError } = await supabase.from("moments").insert({
      sender_id: user.id,
      photo_url: publicUrl,
      caption: caption || null,
    });

    if (insertError) {
      console.error("DB insert error", insertError);
      return { error: "Ошибка сохранения момента" };
    }

    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("createMomentAction exception", err);
    return { error: "Внутренняя ошибка сервера" };
  }
}

export async function getTimeMachineMomentAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { moment: null, moments: [] as TimeMachineMoment[] };

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const { data, error } = await supabase
      .from("moments")
      .select("id, sender_id, photo_url, caption, created_at")
      .lt("created_at", pastDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return { moment: null, moments: [] as TimeMachineMoment[] };
    }

    const interleaved = interleaveBySender(data as TimeMachineMoment[]);
    const ordered = rotateByDailySeed(interleaved);
    const moments = ordered.slice(0, 24);

    return {
      moment: moments[0] ?? null,
      moments,
    };
  } catch {
    return { moment: null, moments: [] as TimeMachineMoment[] };
  }
}

export async function toggleLikeMomentAction(id: string, liked: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };
  const { error } = await supabase.from("moments").update({ is_liked: liked }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gallery");
  return { success: true };
}

export async function toggleFavoriteMomentAction(id: string, favorited: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };
  const { error } = await supabase.from("moments").update({ is_favorited: favorited }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gallery");
  return { success: true };
}

export async function updateMomentCaptionAction(id: string, caption: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };
  const { error } = await supabase.from("moments").update({ caption: caption.trim() || null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/gallery");
  return { success: true };
}
