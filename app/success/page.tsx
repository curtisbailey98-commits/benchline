import type { Metadata } from "next";
import Link from "next/link";
import { classifyCheckoutSession, isValidSessionId, type CheckoutVerification } from "@/lib/checkout-verify";
import { decodeLinesMetadata } from "@/lib/checkout";
import { getProductById, type Product } from "@/lib/products";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ session_id?: string }> };

async function verify(sessionId: string | undefined): Promise<{
  state: CheckoutVerification | "unavailable";
  products: Product[];
  email: string | null;
}> {
  const empty = { products: [] as Product[], email: null };
  if (!process.env.STRIPE_SECRET_KEY) return { state: "unavailable", ...empty };
  if (!isValidSessionId(sessionId)) return { state: "not_confirmed", ...empty };
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
    const state = classifyCheckoutSession(session as Parameters<typeof classifyCheckoutSession>[0]);
    const products = decodeLinesMetadata(session.metadata as Record<string, string> | null)
      .map((l) => getProductById(l.productId))
      .filter((p): p is Product => Boolean(p));
    return { state, products, email: session.customer_details?.email ?? null };
  } catch {
    return { state: "not_confirmed", ...empty };
  }
}

function SupportLine() {
  return (
    <p className="mt-6 text-sm text-muted">
      Questions or trouble downloading? <Link href="/contact" className="text-steel underline">Contact support</Link>{" "}
      with the email you used at checkout.
    </p>
  );
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;
  const { state, products, email } = await verify(session_id);

  if (state !== "confirmed") {
    const processing = state === "processing";
    return (
      <div className="container-page py-16">
        <div className="card mx-auto max-w-xl">
          <h1 className="text-2xl font-semibold">
            {processing ? "Your payment is processing" : "We couldn't confirm this order yet"}
          </h1>
          <p className="mt-3 text-muted">
            {processing
              ? "Stripe is still confirming your payment. Your downloads will appear in your account as soon as it clears — we'll use the email you entered at checkout."
              : "This page couldn't verify a completed checkout. If you just paid, your order may still be finishing up: sign in to your account in a minute to check your downloads. If you haven't paid, nothing was charged."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/account" className="btn btn-primary">Go to your account</Link>
            <Link href="/#pricing" className="btn btn-secondary">View pricing</Link>
          </div>
          <SupportLine />
        </div>
      </div>
    );
  }

  const hasPro = products.some((p) => p.billing === "recurring" || (p.proMonths ?? 0) > 0);
  const hasCore = products.some((p) => p.downloadKeys.includes("core-kit"));

  const steps: Array<[string, string]> = [
    ["Now", `Sign in to your account${email ? ` with ${email}` : " with the email you used at checkout"} and download your ZIP. We'll email you a sign-in link — no password needed.`],
    ...(hasCore
      ? ([
          ["Day 1", "Open 00-START-HERE.md, then set your prices with the Job Pricing Calculator (about 45 minutes)."],
          ["Day 2", "Set up your estimate template with your business name, terms, and payment methods."],
          ["Day 3", "Save the follow-up texts on your phone and follow up on every open quote."],
          ["Day 4–5", "Turn the intake script into a booking form, print the job checklist, and set up your review link."],
          ["End of week", "Log the week in the Weekly Money Dashboard and see what you actually kept."],
        ] as Array<[string, string]>)
      : ([["Next", "Open the START-HERE file in each ZIP — it tells you what to do first."]] as Array<[string, string]>)),
  ];

  return (
    <div className="container-page py-16">
      <div className="card mx-auto max-w-2xl">
        <p className="badge">Payment confirmed</p>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Your back office is ready.</h1>
        {products.length > 0 ? (
          <p className="mt-3 text-muted">You bought: {products.map((p) => p.name).join(", ")}.</p>
        ) : null}
        {hasPro ? (
          <p className="mt-2 text-sm text-muted">
            Your Benchline Pro access shows on your account page. The Pro Library download appears there while Pro is active.
          </p>
        ) : null}
        <ol className="mt-8 space-y-4">
          {steps.map(([when, what]) => (
            <li key={when} className="flex gap-4">
              <span className="w-24 shrink-0 font-mono text-sm font-semibold text-steel">{when}</span>
              <span className="text-sm leading-relaxed">{what}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/account" className="btn btn-primary">Go to your downloads</Link>
          <Link href="/shop" className="btn btn-secondary">Browse trade kits</Link>
        </div>
        <p className="mt-6 text-xs text-muted">
          Downloads unlock as soon as Stripe notifies us of your payment — usually within seconds. If they&apos;re not there yet, refresh your account page in a minute.
        </p>
        <SupportLine />
      </div>
    </div>
  );
}
