import Link from "next/link";
import { PricingViewTracker } from "@/components/Analytics";
import { BuyNowButton } from "@/components/BuyNowButton";
import { FAQ, getFaqs } from "@/components/FAQ";
import { FitSection } from "@/components/FitSection";
import { HowItWorks } from "@/components/HowItWorks";
import { Previews } from "@/components/Previews";
import { PricingCards } from "@/components/PricingCards";
import { SystemsGrid } from "@/components/SystemsGrid";
import previews from "@/content/previews.json";
import { formatPrice, getProductById } from "@/lib/products";
import { TRADES } from "@/lib/trades";

const PRO_EXAMPLES = [
  "New pricing calculators",
  "Seasonal pricing tools",
  "Customer and upsell scripts",
  "Quote templates",
  "Expense and profit tools",
  "Service-specific workflows",
  "Customer-acquisition playbooks",
  "Operational checklists",
  "Updated versions of existing templates",
];

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {sub ? <p className="mt-3 text-muted">{sub}</p> : null}
    </div>
  );
}

export default function HomePage() {
  const core = getProductById("core-kit")!;
  const pc = previews.pricingCalculator;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: getFaqs().map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.text },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HERO */}
      <section className="border-b border-border">
        <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
              For solo home-service operators
            </p>
            <h1 className="mt-4 text-[2.1rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.3rem]">
              You started a service business to do the work—not paperwork.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Benchline gives solo home-service operators the pricing tools, estimate templates,
              follow-up systems, job checklists, review workflows, and money trackers needed to run the
              business side professionally.
            </p>
            <p className="mt-4 max-w-xl text-sm text-foreground/80">
              Built for cleaners, pressure washers, lawn-care operators, mobile detailers, handymen, and
              similar businesses.
            </p>
            <div className="mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:items-start">
              <div className="sm:flex-1">
                <BuyNowButton productId={core.id} valueCents={core.priceCents} label={`Get Benchline — ${formatPrice(core.priceCents)}`} />
              </div>
              <Link href="#systems" className="btn btn-secondary">
                See what&apos;s inside
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted">
              One purchase. Instant access. No complicated software to learn.
            </p>
          </div>

          <figure className="card !p-0 overflow-hidden">
            <figcaption className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="text-sm font-semibold">Price a Job — before you say yes</span>
              <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">XLSX</span>
            </figcaption>
            <table className="w-full text-sm">
              <tbody>
                {pc.inputs.slice(0, 3).map((r) => (
                  <tr key={r.label} className="border-b border-border/60">
                    <td className="px-5 py-2 text-muted">{r.label}</td>
                    <td className="bg-amber/10 px-5 py-2 text-right font-mono">{r.value}</td>
                  </tr>
                ))}
                {pc.outputs.map((r) => (
                  <tr key={r.label} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2 font-medium">{r.label}</td>
                    <td className={`px-5 py-2 text-right font-semibold text-amber ${/^[$\d]/.test(r.value) ? "font-mono" : "text-sm"}`}>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-5 py-2.5 text-xs text-muted">
              Real output from the Core Kit pricing calculator, using its example job.
            </p>
          </figure>
        </div>
      </section>

      {/* 7 SYSTEMS */}
      <section className="container-page scroll-mt-20 py-16 sm:py-20" id="systems">
        <SectionHead
          eyebrow="The Core Kit"
          title="Seven business systems, ready to use"
          sub="Each system is a set of real files — guides, scripts, templates, and spreadsheets — that handle one part of running the business."
        />
        <SystemsGrid />
      </section>

      {/* HOW IT WORKS */}
      <section className="scroll-mt-20 border-y border-border bg-bg-elevated py-16 sm:py-20" id="how-it-works">
        <div className="container-page">
          <SectionHead
            eyebrow="How Benchline works"
            title="From first call to money in the bank"
            sub="Every job follows the same path. Benchline gives you a system for each step."
          />
          <HowItWorks />
        </div>
      </section>

      {/* PREVIEWS */}
      <section className="container-page scroll-mt-20 py-16 sm:py-20" id="previews">
        <SectionHead
          eyebrow="Look inside"
          title="See the actual files"
          sub="These are excerpts pulled from the Core Kit files themselves — not mockups."
        />
        <Previews />
      </section>

      {/* FIT */}
      <section className="scroll-mt-20 border-y border-border bg-bg-elevated py-16 sm:py-20" id="fit">
        <div className="container-page">
          <SectionHead eyebrow="Honest fit check" title="Is Benchline for me?" />
          <FitSection />
        </div>
      </section>

      {/* PRICING */}
      <section className="container-page py-16 sm:py-20">
        <PricingViewTracker id="pricing">
          <SectionHead
            eyebrow="Pricing"
            title="Pick how you want to start"
            sub="One-time purchases, plus an optional monthly membership. No hidden fees."
          />
          <PricingCards />
        </PricingViewTracker>
      </section>

      {/* PRO */}
      <section className="scroll-mt-20 border-y border-border bg-bg-elevated py-16 sm:py-20" id="pro">
        <div className="container-page grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">Benchline Pro</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Benchline keeps getting smarter as your business grows.
            </h2>
            <p className="mt-4 text-muted">
              Pro members get the Pro Library — today that&apos;s a seasonal pricing planner spreadsheet and an
              upsell &amp; add-on script library — and every tool we add to it while their membership is active.
            </p>
            <p className="mt-4 text-sm text-muted">
              $29/month, renews monthly until you cancel. Cancel anytime from your account.
            </p>
            <Link href="/shop/updates" className="btn btn-secondary mt-6">
              About Benchline Pro
            </Link>
          </div>
          <div className="card">
            <p className="text-sm font-semibold">Examples of what we plan to add</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {PRO_EXAMPLES.map((e) => (
                <li key={e} className="flex gap-2 text-sm text-muted">
                  <span className="text-amber" aria-hidden>+</span>
                  {e}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Planned, not scheduled: we don&apos;t promise a specific file on a specific date.
            </p>
          </div>
        </div>
      </section>

      {/* TRADE KITS (secondary) */}
      <section className="container-page py-16 sm:py-20" id="trades">
        <SectionHead
          eyebrow="Optional add-on"
          title="Want it written for your trade?"
          sub="Trade Kits add trade-specific pricing calculators, service agreements, and checklists on top of the Core Kit."
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TRADES.map((t) => (
            <li key={t.id}>
              <Link href={`/for/${t.landingSlug}`} className="card flex h-full items-center justify-between gap-3 !py-4 hover:border-amber/60">
                <span className="font-medium">{t.name}</span>
                <span className="text-amber" aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="container-page scroll-mt-20 pb-16 sm:pb-20" id="faq">
        <SectionHead eyebrow="Questions" title="FAQ" />
        <FAQ />
      </section>

      {/* FINAL CTA */}
      <section className="container-page pb-8">
        <div className="card flex flex-col items-start gap-6 border-amber/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Get the business side handled this week.</h2>
            <p className="mt-2 text-muted">One purchase. Instant access. No complicated software to learn.</p>
          </div>
          <div className="w-full sm:w-auto">
            <BuyNowButton productId={core.id} valueCents={core.priceCents} label={`Get Benchline — ${formatPrice(core.priceCents)}`} className="btn btn-primary w-full sm:w-auto" />
          </div>
        </div>
      </section>
    </>
  );
}
