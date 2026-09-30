const STEPS: Array<{ step: string; system: string; detail: string }> = [
  { step: "Customer inquiry", system: "Follow-Up System", detail: "Reply fast with the first-response or missed-call text." },
  { step: "Intake", system: "Customer Intake System", detail: "Ask the questions that decide the price and the job." },
  { step: "Price the job", system: "Job Pricing System", detail: "Check the price against your real hourly target." },
  { step: "Send the estimate", system: "Fast Estimate System", detail: "Written scope, exclusions, and terms in minutes." },
  { step: "Follow up", system: "Follow-Up System", detail: "Day 1, 3, and 7 texts and emails for quotes that go quiet." },
  { step: "Complete the job", system: "Job Execution Checklists", detail: "Arrival to closeout without forgetting a step." },
  { step: "Request a review", system: "5-Star Review Engine", detail: "Ask at the right moment, only after a clear win." },
  { step: "Track the money", system: "Weekly Money Dashboard", detail: "See what came in, what went out, and what you kept." },
];

/** Visual inquiry → money flow. Vertical timeline on mobile, 4×2 grid on desktop. */
export function HowItWorks() {
  return (
    <ol className="relative grid gap-0 md:grid-cols-4 md:gap-4">
      {STEPS.map((s, i) => (
        <li key={s.step} className="relative flex gap-4 pb-6 md:flex-col md:gap-3 md:rounded-lg md:border md:border-border md:bg-bg-card md:p-4 md:pb-4">
          {/* connector line (mobile) */}
          {i < STEPS.length - 1 ? (
            <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-border md:hidden" />
          ) : null}
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber bg-bg font-mono text-sm font-semibold text-amber">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold">{s.step}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-amber/90">{s.system}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{s.detail}</p>
          </div>
          {i < STEPS.length - 1 && (i + 1) % 4 !== 0 ? (
            <span aria-hidden className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-amber md:block">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
