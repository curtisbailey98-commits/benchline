import previews from "@/content/previews.json";

type Row = { label: string; value: string };

function Frame({ title, file, system, children }: { title: string; file: string; system: string; children: React.ReactNode }) {
  return (
    <figure className="card flex flex-col !p-0 overflow-hidden">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="font-mono text-[11px] text-muted">{file}</span>
      </figcaption>
      <div className="relative flex-1 px-4 py-4">{children}</div>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted">
        Partial preview from the real file · <span className="text-amber">{system}</span> · full file in the Core Kit
      </p>
    </figure>
  );
}

function SheetRows({ rows, highlight }: { rows: Row[]; highlight?: (r: Row) => boolean }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => {
          const hi = highlight?.(r);
          return (
            <tr key={r.label} className="border-b border-border/60 last:border-0">
              <td className={`py-1.5 pr-3 ${hi ? "font-semibold text-foreground" : "text-muted"}`}>{r.label}</td>
              <td className={`py-1.5 text-right ${/^[$\d]/.test(r.value) ? "font-mono" : ""} ${hi ? "font-semibold text-amber" : ""}`}>{r.value}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function MdLines({ lines }: { lines: string[] }) {
  return (
    <div className="space-y-1.5 text-sm">
      {lines.map((raw, i) => {
        const l = raw.trimEnd();
        if (!l) return <div key={i} className="h-1" />;
        if (l.startsWith("# ")) return <p key={i} className="text-base font-semibold">{l.slice(2)}</p>;
        if (l.startsWith("## ")) return <p key={i} className="text-xs uppercase tracking-wide text-muted">{l.slice(3)}</p>;
        if (l.startsWith("### ")) return <p key={i} className="pt-1 font-semibold text-amber">{l.slice(4)}</p>;
        if (l.startsWith("- [ ] "))
          return (
            <p key={i} className="flex gap-2 text-muted">
              <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-sm border border-muted" />
              {l.slice(6)}
            </p>
          );
        if (l.startsWith("> "))
          return (
            <p key={i} className="rounded-md border border-border bg-bg px-3 py-2 text-foreground/90">
              {l.slice(2)}
            </p>
          );
        const bold = l.match(/^\*\*(.+)\*\*$/);
        if (bold) return <p key={i} className="pt-1 font-semibold">{bold[1]}</p>;
        return <p key={i} className="text-muted">{l.replace(/\*\*/g, "")}</p>;
      })}
    </div>
  );
}

/** Partial previews generated from the real kit files (scripts/build-previews.mjs). */
export function Previews() {
  const pc = previews.pricingCalculator;
  const md = previews.moneyDashboard;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Frame title="Price a Job — before you say yes" file={pc.file} system={pc.system}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Your inputs (example job)</p>
        <SheetRows rows={pc.inputs.slice(0, 5)} />
        <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted">What the sheet tells you</p>
        <SheetRows rows={pc.outputs} highlight={() => true} />
      </Frame>
      <Frame title="Weekly Money Dashboard" file={md.file} system={md.system}>
        <SheetRows
          rows={md.rows}
          highlight={(r) => /MONEY IN|MONEY OUT|ACTUALLY KEPT|average profit per hour/.test(r.label)}
        />
      </Frame>
      <Frame title="Lead follow-up text scripts" file={previews.followUp.file} system={previews.followUp.system}>
        <MdLines lines={previews.followUp.lines} />
      </Frame>
      <Frame title="On-job checklist" file={previews.checklist.file} system={previews.checklist.system}>
        <MdLines lines={previews.checklist.lines} />
      </Frame>
    </div>
  );
}
