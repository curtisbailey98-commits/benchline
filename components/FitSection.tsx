const FOR_YOU = [
  "You run a cleaning, pressure washing, lawn-care, detailing, handyman, or similar service business — mostly on your own or with a helper.",
  "You price jobs by gut feel and aren't sure every job pays you enough.",
  "Estimates, follow-ups, and review requests happen when you remember — not every time.",
  "You want simple files you can use today, not another app to learn.",
  "You'd like to see what you actually kept each week.",
];

const NOT_FOR_YOU = [
  "You need full accounting, payroll, or tax software.",
  "You want a CRM or scheduling app that runs everything automatically.",
  "You run a multi-crew company with an office manager and existing systems.",
  "You're looking for a course, coaching, or guaranteed income.",
];

export function FitSection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="card">
        <h3 className="text-lg font-semibold">Benchline is built for you if…</h3>
        <ul className="mt-4 space-y-3">
          {FOR_YOU.map((t) => (
            <li key={t} className="flex gap-3 text-sm leading-relaxed">
              <span className="text-success" aria-hidden>✓</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3 className="text-lg font-semibold">It probably isn&apos;t for you if…</h3>
        <ul className="mt-4 space-y-3">
          {NOT_FOR_YOU.map((t) => (
            <li key={t} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="text-danger" aria-hidden>✕</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
