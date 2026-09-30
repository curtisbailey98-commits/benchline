import { KITS } from "@/lib/kits";
import { CORE_SYSTEMS } from "@/lib/products";

/** The 7 Core Kit systems, each with the real files that make it up. */
export function SystemsGrid() {
  const files = KITS["core-kit"].files;
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CORE_SYSTEMS.map((s, i) => {
        const parts = files.filter((f) => f.system === s.name);
        return (
          <li key={s.name} className="card flex flex-col">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-semibold text-amber">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-semibold leading-snug">{s.name}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.outcome}</p>
            <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted">
              {parts.map((f) => (
                <li key={f.file} className="flex gap-2">
                  <span className="shrink-0 font-mono text-amber/80">
                    {f.file.endsWith(".xlsx") ? "XLSX" : f.file.endsWith(".csv") ? "CSV" : "MD"}
                  </span>
                  <span>{f.summary}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
      <li className="card flex flex-col justify-center border-dashed">
        <p className="text-sm font-semibold">Plus: Start Here guide</p>
        <p className="mt-2 text-sm text-muted">
          A day-by-day first week that walks you through setting up all seven systems.
        </p>
      </li>
    </ol>
  );
}
