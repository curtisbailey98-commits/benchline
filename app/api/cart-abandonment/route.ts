import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  consent: z.literal(true),
  cart: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().min(1),
    })
  ),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email and consent are required" },
      { status: 400 }
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  try {
    const client = hasSupabaseAdmin() ? createAdminClient() : await createClient();
    const { error } = await client.from("cart_abandonment").insert({
      email: parsed.data.email,
      consent: true,
      cart_snapshot: parsed.data.cart,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
