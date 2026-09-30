import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

const ENV = { ...process.env };

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  getUser.mockResolvedValue({ data: { user: null } });
});
afterEach(() => {
  process.env = { ...ENV };
});

const params = (product: string) => ({ params: Promise.resolve({ product }) });

describe("GET /api/downloads/[product]", () => {
  it("404s unknown kits", async () => {
    const { GET } = await import("@/app/api/downloads/[product]/route");
    const res = await GET(new Request("http://x/api/downloads/nope"), params("nope"));
    expect(res.status).toBe(404);
  });
  it.each(["core-kit", "cleaning-kit", "contracts-waivers-pack", "pro-library"])("401s %s without auth", async (key) => {
    const { GET } = await import("@/app/api/downloads/[product]/route");
    const res = await GET(new Request(`http://x/api/downloads/${key}`), params(key));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/checkout", () => {
  const post = (body: unknown) =>
    new Request("http://x/api/checkout", { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
  it("400s unknown products even when Stripe is not configured", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post({ lines: [{ productId: "bogus", quantity: 1 }] }));
    expect(res.status).toBe(400);
  });
  it("503s cleanly for valid carts when Stripe is not configured", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(post({ lines: [{ productId: "updates", quantity: 1 }] }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Stripe is not configured (STRIPE_SECRET_KEY)." });
  });
});

describe("POST /api/analytics", () => {
  it("rejects server-only and cross-origin events, accepts page views", async () => {
    const { POST } = await import("@/app/api/analytics/route");
    const mk = (body: unknown, origin = "http://x") =>
      new Request("http://x/api/analytics", { method: "POST", body: JSON.stringify(body), headers: { origin, host: "x" } });
    expect((await POST(mk({ event: "purchase" }))).status).toBe(400);
    expect((await POST(mk({ event: "page_view", path: "/" }, "http://evil.example"))).status).toBe(403);
    expect((await POST(mk({ event: "page_view", path: "/" }))).status).toBe(204);
  });
});
