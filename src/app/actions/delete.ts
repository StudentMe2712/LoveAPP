"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMomentAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };

  const { error } = await supabase.from("moments").delete().eq("id", id).eq("sender_id", user.id);

  if (error) {
    console.error("Delete moment error", error);
    return { error: "Не удалось удалить момент" };
  }

  revalidatePath("/gallery");
  revalidatePath("/");
  return { success: true };
}

export async function deleteWishlistItemAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };

  const { error } = await supabase.from("wishlist").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    console.error("Delete wishlist err", error);
    return { error: "Не удалось удалить желание" };
  }

  revalidatePath("/wishlist");
  return { success: true };
}

export async function deletePlanAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Необходима авторизация" };

  const { error } = await supabase.from("plans").delete().eq("id", id).eq("creator_id", user.id);

  if (error) {
    console.error("Delete plan error", error);
    return { error: "Не удалось отменить план" };
  }

  revalidatePath("/plans");
  return { success: true };
}