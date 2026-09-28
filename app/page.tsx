import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, formatPrice } from "@/lib/products";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--amber-soft),_transparent_55%)]" />
        <div className="container-page relative grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="badge">For solo home-service operators</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              The operating system for{" "}
              <span className="text-amber">solo trades</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              You&apos;re excellent at the work. Benchline covers the paperwork —
              intake, estimates, job closeout, Google reviews, and a weekly money
              review — so jobs turn into a business you can run.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop/core-kit" className="btn btn-primary">
                Get Core Kit — {formatPrice(19900)}
              </Link>
              <Link href="/shop" className="btn btn-secondary">
                Browse shop
              </Link>
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-muted sm:grid-cols-2">
              {[
                "Original scripts & SOPs — not recycled fluff",
                "Notion-ready Markdown + printable PDFs",
                "Instant download after Stripe checkout",
                "No fake testimonials or vanity counters",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-amber">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card relative border-amber/25 bg-gradient-to-br from-bg-card to-bg-elevated">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">
              What you install
            </p>
            <ol className="mt-6 space-y-4">
              {[
                ["Intake", "Qualify jobs in under 4 minutes"],
                ["Estimate", "Quotes with margin guardrails"],
                ["Job checklist", "Arrival → closeout on paper"],
                ["Follow-up + reviews", "SMS scripts + Google ask flow"],
                ["Weekly money", "30-minute cash in / cash out SOP"],
              ].map(([title, desc], i) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-soft text-sm font-semibold text-amber">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="container-page py-20" id="products">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Products</h2>
            <p className="mt-2 text-muted">One-time kit, monthly drops, or the bundle that saves money.</p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-amber hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-bg-elevated py-20" id="how-it-works">
        <div className="container-page">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "1. Buy the kit",
                d: "Checkout with Stripe. Core Kit is a one-time purchase; Updates is monthly; Bundle pairs both.",
              },
              {
                t: "2. Download & customize",
                d: "Auth-gated ZIP lands in your account. Paste into Notion, print checklists, edit the CSV for your trade.",
              },
              {
                t: "3. Run jobs with systems",
                d: "Use intake → estimate → checklist → SMS → review ask → weekly money. Optional Updates keep the playbooks fresh.",
              },
            ].map((s) => (
              <div key={s.t} className="card">
                <h3 className="font-semibold text-amber">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20" id="faq">
        <h2 className="mb-8 text-3xl font-semibold tracking-tight">FAQ</h2>
        <FAQ />
      </section>

      <section className="container-page pb-24">
        <div className="card flex flex-col items-start gap-6 border-amber/30 bg-amber-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Ready to stop improvising paperwork?</h2>
            <p className="mt-2 text-muted">
              Start with Core Kit — install this week, not someday.
            </p>
          </div>
          <Link href="/shop/core-kit" className="btn btn-primary shrink-0">
            Get Core Kit
          </Link>
        </div>
      </section>
    </>
  );
}
