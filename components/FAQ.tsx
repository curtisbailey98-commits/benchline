const FAQS = [
  {
    q: "Who is Benchline for?",
    a: "Solo home-service operators — cleaners, handymen, lawn care, pressure washing, HVAC helpers, detailers — who are skilled at the trade but want clearer intake, pricing, closeout, and reviews.",
  },
  {
    q: "What format are the files?",
    a: "Markdown (Notion / Obsidian / Docs compatible), printable checklists, and a CSV pricing sheet. You get a ZIP download after purchase for the Core Kit.",
  },
  {
    q: "Is this a course or coaching?",
    a: "No. It's an operating kit of scripts and SOPs you can run the same week. Updates membership adds monthly playbook drops — still no fluff video library.",
  },
  {
    q: "How does delivery work?",
    a: "Digital only. After Stripe confirms payment, your account unlocks auth-gated download links. Membership drops are delivered by email and in the member area.",
  },
  {
    q: "Can I get a refund?",
    a: "See our Refunds policy. Because these are digital downloads, refunds are limited once files are accessed — we still make things right if delivery fails.",
  },
  {
    q: "Do you reuse templates from other brands?",
    a: "No. Benchline content is original. We study operator problems and principles — never copy brands, assets, or code from other products.",
  },
];

export function FAQ() {
  return (
    <div className="space-y-3">
      {FAQS.map((item) => (
        <details
          key={item.q}
          className="group card !py-4 transition open:border-amber/30"
        >
          <summary className="cursor-pointer list-none font-medium marker:content-none">
            <span className="flex items-center justify-between gap-4">
              {item.q}
              <span className="text-amber transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
