#!/usr/bin/env node
/**
 * Builds content/previews.json — the partial previews shown on the marketing
 * pages — from the REAL kit files, so previews can never drift from what buyers get.
 *
 *  - Spreadsheet previews: the XLSX is recalculated by LibreOffice (soffice must
 *    be installed locally) and the first rows of one tab are captured.
 *  - Document previews: the first section(s) of a Markdown file.
 *
 * Only small excerpts are published; full files stay behind the paid download route.
 * Run: node scripts/build-previews.mjs   (re-run after editing kit content)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const kitDir = (kit) => path.join(root, "content/products", kit);

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function sheetRows(kit, file, sheet) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "bl-prev-"));
  execFileSync("soffice", [
    "--headless", "--convert-to",
    // formatted values, all sheets as separate CSV files
    "csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1",
    "--outdir", tmp, path.join(kitDir(kit), file),
  ], { stdio: "ignore" });
  const base = file.replace(/\.xlsx$/, "");
  const csv = fs.readFileSync(path.join(tmp, `${base}-${sheet}.csv`), "utf8");
  fs.rmSync(tmp, { recursive: true, force: true });
  return parseCsv(csv);
}

/** Label/value rows between two labels (inclusive), dropping blank rows. */
function labelValueRows(rows, fromLabel, toLabel, valueCol = 1) {
  const start = rows.findIndex((r) => r[0] === fromLabel);
  const end = rows.findIndex((r) => r[0] === toLabel);
  if (start < 0 || end < 0) throw new Error(`Labels not found: ${fromLabel} / ${toLabel}`);
  return rows
    .slice(start, end + 1)
    .filter((r) => r[0])
    .map((r) => ({ label: r[0], value: r[valueCol] ?? "" }));
}

function markdownExcerpt(kit, file, maxLines) {
  const lines = fs.readFileSync(path.join(kitDir(kit), file), "utf8").split("\n");
  const out = [];
  for (const l of lines) {
    if (out.length >= maxLines) break;
    if (/^---\s*$/.test(l)) continue;
    out.push(l);
  }
  while (out.length && !out[out.length - 1].trim()) out.pop();
  return out;
}

const pricing = sheetRows("core-kit", "08-job-pricing-calculator.xlsx", "Price a Job");
const money = sheetRows("core-kit", "10-weekly-money-dashboard.xlsx", "Dashboard");

const previews = {
  generatedFrom: "content/products/core-kit (scripts/build-previews.mjs)",
  pricingCalculator: {
    file: "08-job-pricing-calculator.xlsx",
    tab: "Price a Job",
    system: "Job Pricing System",
    inputs: labelValueRows(pricing, "Estimated on-site hours (you)", "Price you're thinking of quoting"),
    outputs: labelValueRows(pricing, "PRICE NEEDED to hit your target", "Verdict"),
  },
  moneyDashboard: {
    file: "10-weekly-money-dashboard.xlsx",
    tab: "Dashboard",
    system: "Weekly Money Dashboard",
    rows: labelValueRows(money, "MONEY IN (jobs)", "Jobs below your target profit per hour"),
  },
  followUp: {
    file: "09-lead-follow-up-system.md",
    system: "Lead-to-Customer Follow-Up System",
    lines: (() => {
      const all = fs.readFileSync(path.join(kitDir("core-kit"), "09-lead-follow-up-system.md"), "utf8").split("\n");
      const i = all.findIndex((l) => l.startsWith("## Text scripts"));
      return all.slice(i + 2, i + 10).filter((l) => !/^---/.test(l));
    })(),
  },
  checklist: {
    file: "03-job-checklist.md",
    system: "Job Execution Checklists",
    lines: markdownExcerpt("core-kit", "03-job-checklist.md", 17),
  },
};

fs.writeFileSync(path.join(root, "content/previews.json"), JSON.stringify(previews, null, 2) + "\n");
console.log("Wrote content/previews.json");
