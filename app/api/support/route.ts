import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form" }, { status: 400 });
  }

  if (!hasSupabaseAdmin() && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json(
      { error: "Support backend not configured" },
      { status: 503 }
    );
  }

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // optional
  }

  try {
    const client = hasSupabaseAdmin() ? createAdminClient() : await createClient();
    const { error } = await client.from("support_tickets").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      user_id: userId,
      status: "open",
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
