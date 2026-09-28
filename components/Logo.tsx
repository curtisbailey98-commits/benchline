export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="36" height="36" rx="10" fill="#1c2029" stroke="#e8a838" strokeWidth="2" />
      <path
        d="M10 26V14h4.2c2.4 0 3.9 1.3 3.9 3.2 0 1.2-.6 2.2-1.7 2.7 1.4.4 2.3 1.6 2.3 3.1 0 2.1-1.6 3.5-4.2 3.5H10zm2.3-6.7h1.8c1.2 0 1.9-.6 1.9-1.5s-.7-1.5-1.9-1.5h-1.8v3zm0 5h2.1c1.4 0 2.2-.7 2.2-1.7s-.8-1.7-2.2-1.7h-2.1v3.4zM22.2 26V14h6.8v2.1h-4.5v2.8h4.1v2h-4.1V26h-2.3z"
        fill="#e8a838"
      />
      <path d="M8 30h24" stroke="#e8a838" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function LogoMark({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo className="h-8 w-8" />
      {withWordmark ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Bench<span className="text-amber">line</span>
        </span>
      ) : null}
    </span>
  );
}
