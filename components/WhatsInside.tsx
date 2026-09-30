import { KITS } from "@/lib/kits";

function typeLabel(file: string) {
  return file.endsWith(".xlsx") ? "XLSX" : file.endsWith(".csv") ? "CSV" : "MD";
}

/** "What's inside" generated from the real kit registry (tested against the files on disk). */
export function WhatsInside({ downloadKeys }: { downloadKeys: string[] }) {
  return (
    <div className="space-y-6">
      {downloadKeys.map((key) => {
        const kit = KITS[key];
        if (!kit) return null;
        return (
          <div key={key} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">What&apos;s inside: {kit.name}</h2>
              <span className="text-xs text-muted">{kit.files.length} files · ZIP</span>
            </div>
            <ul className="mt-4 divide-y divide-border/60">
              {kit.files.map((f) => (
                <li key={f.file} className="flex gap-3 py-2.5 text-sm">
                  <span className="w-11 shrink-0 font-mono text-xs leading-5 text-amber">{typeLabel(f.file)}</span>
                  <div className="min-w-0">
                    <p className="break-words font-mono text-xs text-foreground/80">{f.file}</p>
                    <p className="text-muted">{f.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
