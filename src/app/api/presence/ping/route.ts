import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PairRow = {
  id: string;
  user1_id: string;
  user2_id: string | null;
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const { data: pair, error: pairError } = await supabase
      .from("pair")
      .select("id,user1_id,user2_id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .maybeSingle<PairRow>();

    if (pairError || !pair?.id) {
      return NextResponse.json({ ok: false, reason: "no_pair" }, { status: 200 });
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabase.from("user_presence").upsert(
      {
        user_id: user.id,
        pair_id: pair.id,
        last_seen_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      console.error("presence ping upsert error", upsertError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    return NextResponse.json({ ok: true, at: now });
  } catch (error) {
    console.error("presence ping error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

