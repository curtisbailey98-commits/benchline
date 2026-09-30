/**
 * Generates the XLSX calculators (with live formulas) and rate-card CSVs for every
 * Benchline kit into content/products/<kit>/. Run: npm run generate:sheets
 *
 * Output is committed; scripts/pack-kits.mjs then zips content into private/downloads/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = (kit, file) => path.join(root, "content/products", kit, file);

// ---------- styling helpers ----------
const USD = '"$"#,##0.00';
const USD0 = '"$"#,##0';
const PCT = "0%";
const HRS = "0.00";
const INPUT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
const HEAD_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1C2029" } };
const OUT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };

function newBook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Benchline";
  wb.created = new Date("2026-01-01T00:00:00Z");
  wb.modified = new Date("2026-01-01T00:00:00Z");
  wb.calcProperties = { fullCalcOnLoad: true };
  return wb;
}

function sheet(wb, name, title, subtitle, widths = [44, 16, 16, 16, 16, 16, 16, 40]) {
  const ws = wb.addWorksheet(name);
  ws.columns = widths.map((w) => ({ width: w }));
  ws.getCell("A1").value = title;
  ws.getCell("A1").font = { bold: true, size: 14 };
  if (subtitle) {
    ws.getCell("A2").value = subtitle;
    ws.getCell("A2").font = { italic: true, color: { argb: "FF666666" } };
  }
  return ws;
}

/** Set a cell. value: number | string | {f: formula}. opts: {input, out, fmt, bold} */
function put(ws, addr, value, opts = {}) {
  const cell = ws.getCell(addr);
  cell.value = value && typeof value === "object" && "f" in value ? { formula: value.f } : value;
  if (opts.fmt) cell.numFmt = opts.fmt;
  if (opts.input) cell.fill = INPUT_FILL;
  if (opts.out) {
    cell.fill = OUT_FILL;
    cell.font = { bold: true };
  }
  if (opts.bold) cell.font = { bold: true };
  if (opts.list) {
    cell.dataValidation = { type: "list", allowBlank: true, formulae: [opts.list] };
  }
  return cell;
}

function header(ws, row, labels) {
  labels.forEach((label, i) => {
    const cell = ws.getRow(row).getCell(i + 1);
    cell.value = label;
    cell.font = { bold: true, color: { argb: "FFE8A838" } };
    cell.fill = HEAD_FILL;
    cell.alignment = { wrapText: true, vertical: "middle" };
  });
}

function legend(ws, row) {
  put(ws, `A${row}`, "Yellow cells are inputs — change them. Green cells are results (formulas).");
  ws.getCell(`A${row}`).font = { italic: true, color: { argb: "FF666666" } };
}

// ---------- shared: Your Numbers (hourly target) ----------
/** Returns the absolute reference of the target hourly rate cell. */
function yourNumbersSheet(wb, d) {
  const ws = sheet(
    wb,
    "Your Numbers",
    "Your Numbers — what you need to charge per billable hour",
    "Start here. Every other sheet uses the Target hourly rate from this page.",
    [58, 18, 60]
  );
  legend(ws, 3);
  const rows = [
    ["Annual take-home pay goal (what you want to pay yourself)", d.goal, USD0, "input"],
    ["Tax set-aside (% of profit) — ask your accountant", d.tax, PCT, "input"],
    ["Annual business costs (vehicle, insurance, supplies, equipment, software, phone, marketing)", d.costs, USD0, "input"],
    ["Working weeks per year (after vacation, weather, sick days)", d.weeks, "0", "input"],
    ["Billable hours per week (paid, on-site time — not driving or quoting)", d.hours, "0", "input"],
  ];
  rows.forEach(([label, v, fmt], i) => {
    put(ws, `A${5 + i}`, label);
    put(ws, `B${5 + i}`, v, { input: true, fmt });
  });
  // rows 5..9 inputs
  put(ws, "A11", "Profit needed before tax");
  put(ws, "B11", { f: "B5/(1-B6)" }, { fmt: USD0 });
  put(ws, "A12", "Revenue needed per year");
  put(ws, "B12", { f: "B11+B7" }, { fmt: USD0 });
  put(ws, "A13", "Billable hours per year");
  put(ws, "B13", { f: "B8*B9" }, { fmt: "#,##0" });
  put(ws, "A14", "Minimum hourly rate (break-even on your goal)");
  put(ws, "B14", { f: "IF(B13>0,B12/B13,0)" }, { fmt: USD, out: true });
  put(ws, "A15", "Buffer for slow weeks, callbacks, and price creep (%)");
  put(ws, "B15", d.buffer ?? 0.15, { input: true, fmt: PCT });
  put(ws, "A16", "TARGET HOURLY RATE (used by the other sheets)");
  ws.getCell("A16").font = { bold: true };
  put(ws, "B16", { f: "B14*(1+B15)" }, { fmt: USD, out: true });
  put(ws, "A17", "Revenue needed per working week");
  put(ws, "B17", { f: "IF(B8>0,B12/B8,0)" }, { fmt: USD0, out: true });
  put(ws, "C5", d.goalNote ?? "Be honest — this is your salary, not the business's revenue.");
  put(ws, "C9", d.hoursNote ?? "Most solo operators bill 25–32 hours in a 45–50 hour work week.");
  return "'Your Numbers'!$B$16";
}

function rateCardSheet(wb, rows, title) {
  const ws = sheet(wb, "Rate Card", title, "Starting ranges only — prices vary a lot by region. Replace with your local numbers.", [22, 44, 14, 12, 12, 14, 50]);
  header(ws, 4, ["Category", "Item", "Unit", "Low $", "Target $", "Your price $", "Notes"]);
  rows.forEach((r, i) => {
    const row = 5 + i;
    put(ws, `A${row}`, r[0]);
    put(ws, `B${row}`, r[1]);
    put(ws, `C${row}`, r[2]);
    put(ws, `D${row}`, r[3], { fmt: USD });
    put(ws, `E${row}`, r[4], { fmt: USD });
    put(ws, `F${row}`, null, { input: true, fmt: USD });
    put(ws, `G${row}`, r[5]);
  });
}

function writeCsv(file, rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [["category", "item", "unit", "low_usd", "target_usd", "notes"], ...rows].map((r) => r.map(esc).join(","));
  fs.writeFileSync(file, lines.join("\n") + "\n");
}

async function save(wb, file) {
  await wb.xlsx.writeFile(file);
  console.log("Wrote", path.relative(root, file));
}

// =====================================================================
// CLEANING
// =====================================================================
const CLEANING_RATES = [
  ["recurring", "Standard clean — 1 bed / 1 bath", "visit", 100, 140, "Recurring price after first visit"],
  ["recurring", "Standard clean — 2 bed / 2 bath", "visit", 130, 180, "Most common quote; adjust for sq ft and clutter"],
  ["recurring", "Standard clean — 3 bed / 2 bath", "visit", 160, 220, ""],
  ["recurring", "Standard clean — 4 bed / 3 bath", "visit", 200, 280, ""],
  ["first visit", "Deep clean — 2 bed / 2 bath", "job", 250, 350, "Required first visit before recurring service"],
  ["first visit", "Deep clean — 3 bed / 2 bath", "job", 300, 425, ""],
  ["first visit", "Deep clean — 4 bed / 3 bath", "job", 375, 525, ""],
  ["move-out", "Move-out / move-in clean (empty home)", "sq ft", 0.2, 0.35, "See 11-move-out-cleaning-pricing.md"],
  ["move-out", "Move-out minimum", "job", 250, 325, "Never quote a move-out below this"],
  ["hourly", "Hourly rate (solo, after included scope)", "hour", 45, 65, "Use for clutter-heavy or undefined scope"],
  ["add-on", "Inside oven", "each", 30, 50, "~30–45 min"],
  ["add-on", "Inside refrigerator", "each", 30, 50, "Ask client to empty it first"],
  ["add-on", "Inside kitchen cabinets (empty)", "job", 50, 80, ""],
  ["add-on", "Interior windows (glass + sills)", "window", 5, 8, "Tracks extra"],
  ["add-on", "Window tracks", "window", 3, 5, ""],
  ["add-on", "Blinds dusted/wiped", "blind", 5, 10, ""],
  ["add-on", "Baseboards hand-wiped (whole home)", "job", 40, 75, "Included in deep clean"],
  ["add-on", "Wall spot-cleaning", "room", 10, 20, ""],
  ["add-on", "Laundry — wash, dry, fold", "load", 20, 30, ""],
  ["add-on", "Change bed linens", "bed", 8, 15, ""],
  ["add-on", "Garage sweep", "job", 35, 60, ""],
  ["add-on", "Balcony / patio sweep and wipe", "job", 25, 45, ""],
  ["surcharge", "Pet hair (heavy shedding)", "visit", 15, 30, "Or +10% on the visit"],
  ["surcharge", "Same-day / next-day booking", "percent", 20, 30, "Percent of the job"],
  ["policy", "Lockout / late cancellation (under 24h)", "flat", 50, 75, "Or 50% of the visit price"],
];

async function cleaning() {
  const kit = "cleaning-kit";
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, { goal: 50000, tax: 0.25, costs: 9000, weeks: 48, hours: 30 });

  // Quote Builder
  const ws = sheet(wb, "Quote Builder", "Cleaning Quote Builder — room-based", "Enter room counts and service type. Time benchmarks are for one experienced cleaner; time yourself and adjust.", [40, 12, 16, 16, 16, 16]);
  legend(ws, 3);
  put(ws, "A5", "Target hourly rate");
  put(ws, "B5", { f: RATE }, { fmt: USD, input: true });
  put(ws, "A6", "Service type");
  put(ws, "B6", "Deep", { input: true, list: '"Standard,Deep,Move-out"' });
  put(ws, "A7", "Condition factor (1.0 tidy · 1.2 average · 1.4 heavy clutter/buildup)");
  put(ws, "B7", 1.0, { input: true, fmt: "0.00" });
  put(ws, "A8", "Pets that shed? (Yes/No)");
  put(ws, "B8", "No", { input: true, list: '"Yes,No"' });
  put(ws, "A9", "Minimum job price");
  put(ws, "B9", 120, { input: true, fmt: USD0 });
  put(ws, "A10", "Round quote up to nearest $");
  put(ws, "B10", 5, { input: true, fmt: USD0 });

  header(ws, 12, ["Area", "Count", "Standard min each", "Deep min each", "Standard min total", "Deep min total"]);
  const rooms = [
    ["Full bathroom", 2, 25, 45],
    ["Half bathroom", 0, 12, 20],
    ["Kitchen", 1, 35, 75],
    ["Bedroom", 2, 15, 30],
    ["Living / family room", 1, 20, 35],
    ["Dining room", 1, 10, 20],
    ["Office / den", 0, 12, 25],
    ["Hallway / stairs (per floor)", 1, 8, 15],
    ["Laundry room", 1, 8, 15],
    ["Entry / mudroom", 1, 5, 10],
  ];
  rooms.forEach(([name, n, s, d], i) => {
    const r = 13 + i;
    put(ws, `A${r}`, name);
    put(ws, `B${r}`, n, { input: true });
    put(ws, `C${r}`, s, { input: true });
    put(ws, `D${r}`, d, { input: true });
    put(ws, `E${r}`, { f: `B${r}*C${r}` });
    put(ws, `F${r}`, { f: `B${r}*D${r}` });
  });
  // rows 13..22 ; totals 23
  put(ws, "A23", "Total minutes", { bold: true });
  put(ws, "E23", { f: "SUM(E13:E22)" }, { bold: true });
  put(ws, "F23", { f: "SUM(F13:F22)" }, { bold: true });

  put(ws, "A25", "Pet factor");
  put(ws, "B25", { f: 'IF(B8="Yes",1.1,1)' }, { fmt: "0.00" });
  put(ws, "A26", "Estimated minutes for this visit");
  put(ws, "B26", { f: 'IF(B6="Standard",E23,IF(B6="Deep",F23,F23*1.15))*B7*B25' }, { fmt: "0" });
  put(ws, "A27", "Estimated hours");
  put(ws, "B27", { f: "B26/60" }, { fmt: HRS, out: true });
  put(ws, "A28", "Labor price (hours × rate)");
  put(ws, "B28", { f: "B27*B5" }, { fmt: USD });

  header(ws, 30, ["Add-on", "Qty", "Price each", "Line total"]);
  const addons = [
    ["Inside oven", 0, 40],
    ["Inside refrigerator", 0, 40],
    ["Interior windows (per window)", 0, 6],
    ["Blinds (per blind)", 0, 8],
    ["Inside kitchen cabinets", 0, 60],
    ["Baseboards hand-wiped (standard visits)", 0, 60],
    ["Laundry wash & fold (per load)", 0, 25],
    ["Change bed linens (per bed)", 0, 10],
    ["Wall spot-cleaning (per room)", 0, 15],
    ["Garage sweep", 0, 40],
  ];
  addons.forEach(([name, q, p], i) => {
    const r = 31 + i;
    put(ws, `A${r}`, name);
    put(ws, `B${r}`, q, { input: true });
    put(ws, `C${r}`, p, { input: true, fmt: USD });
    put(ws, `D${r}`, { f: `B${r}*C${r}` }, { fmt: USD });
  });
  // rows 31..40
  put(ws, "A41", "Add-ons total", { bold: true });
  put(ws, "D41", { f: "SUM(D31:D40)" }, { fmt: USD, bold: true });

  put(ws, "A43", "QUOTED PRICE — this visit", { bold: true });
  put(ws, "B43", { f: "CEILING(MAX(B9,B28+D41),B10)" }, { fmt: USD, out: true });
  put(ws, "A44", "Effective hourly (check vs target)");
  put(ws, "B44", { f: "IF(B27>0,B43/B27,0)" }, { fmt: USD, out: true });

  put(ws, "A46", "Recurring pricing (based on Standard time for these rooms)", { bold: true });
  header(ws, 47, ["Frequency", "Discount", "Per-visit price", "Visits / year", "Annual value"]);
  const freq = [
    ["Weekly", 0.15, 52],
    ["Every 2 weeks", 0.1, 26],
    ["Every 4 weeks", 0.05, 13],
  ];
  freq.forEach(([name, disc, visits], i) => {
    const r = 48 + i;
    put(ws, `A${r}`, name);
    put(ws, `B${r}`, disc, { input: true, fmt: PCT });
    put(ws, `C${r}`, { f: `CEILING(MAX($B$9,E$23*$B$7*$B$25/60*$B$5)*(1-B${r}),$B$10)` }, { fmt: USD, out: true });
    put(ws, `D${r}`, visits);
    put(ws, `E${r}`, { f: `C${r}*D${r}` }, { fmt: USD0 });
  });
  put(ws, "A52", "Tip: quote the first visit as Deep, then recurring at the per-visit price above.");

  // Move-Out Pricing
  const mo = sheet(wb, "Move-Out Pricing", "Move-Out / Move-In Pricing", "Quotes by square footage AND by time, then uses whichever is higher.", [44, 16, 18, 18]);
  legend(mo, 3);
  put(mo, "A5", "Target hourly rate");
  put(mo, "B5", { f: RATE }, { fmt: USD, input: true });
  put(mo, "A6", "Home square footage");
  put(mo, "B6", 1400, { input: true, fmt: "#,##0" });
  put(mo, "A7", "Condition (Light / Average / Heavy)");
  put(mo, "B7", "Average", { input: true, list: '"Light,Average,Heavy"' });
  put(mo, "A8", "Home empty of furniture? (Yes/No)");
  put(mo, "B8", "Yes", { input: true, list: '"Yes,No"' });
  put(mo, "A9", "Minimum move-out price");
  put(mo, "B9", 250, { input: true, fmt: USD0 });
  header(mo, 11, ["Condition", "Sq ft per hour (solo)", "Price per sq ft"]);
  [
    ["Light", 450, 0.2],
    ["Average", 350, 0.27],
    ["Heavy", 250, 0.38],
  ].forEach(([c, sph, pps], i) => {
    const r = 12 + i;
    put(mo, `A${r}`, c);
    put(mo, `B${r}`, sph, { input: true });
    put(mo, `C${r}`, pps, { input: true, fmt: USD });
  });
  put(mo, "A16", "Estimated hours (base clean)");
  put(mo, "B16", { f: 'B6/VLOOKUP(B7,$A$12:$C$14,2,FALSE)*IF(B8="Yes",1,1.25)' }, { fmt: HRS });
  put(mo, "A17", "Price by square footage");
  put(mo, "B17", { f: "B6*VLOOKUP(B7,$A$12:$C$14,3,FALSE)" }, { fmt: USD });
  put(mo, "A18", "Price by time");
  put(mo, "B18", { f: "B16*B5" }, { fmt: USD });
  put(mo, "A19", "Base price (higher of the two)");
  put(mo, "B19", { f: "MAX(B17,B18)" }, { fmt: USD, bold: true });
  header(mo, 21, ["Add-on", "Qty", "Price each", "Minutes each", "Line total", "Line minutes"]);
  [
    ["Inside oven", 1, 45, 45],
    ["Inside refrigerator", 1, 40, 30],
    ["Inside all cabinets & drawers", 1, 75, 60],
    ["Interior windows + tracks (per window)", 10, 8, 8],
    ["Blinds (per blind)", 0, 8, 5],
    ["Wall washing (per room)", 0, 25, 30],
    ["Garage sweep", 0, 40, 30],
    ["Balcony / patio", 0, 35, 20],
  ].forEach(([n, q, p, m], i) => {
    const r = 22 + i;
    put(mo, `A${r}`, n);
    put(mo, `B${r}`, q, { input: true });
    put(mo, `C${r}`, p, { input: true, fmt: USD });
    put(mo, `D${r}`, m, { input: true });
    put(mo, `E${r}`, { f: `B${r}*C${r}` }, { fmt: USD });
    put(mo, `F${r}`, { f: `B${r}*D${r}` });
  });
  // rows 22..29
  put(mo, "A30", "Add-ons total", { bold: true });
  put(mo, "E30", { f: "SUM(E22:E29)" }, { fmt: USD, bold: true });
  put(mo, "F30", { f: "SUM(F22:F29)" }, { bold: true });
  put(mo, "A32", "QUOTED MOVE-OUT PRICE", { bold: true });
  put(mo, "B32", { f: "CEILING(MAX(B9,B19+E30),5)" }, { fmt: USD, out: true });
  put(mo, "A33", "Total estimated hours (incl. add-ons)");
  put(mo, "B33", { f: "B16+F30/60" }, { fmt: HRS, out: true });
  put(mo, "A34", "Effective hourly");
  put(mo, "B34", { f: "IF(B33>0,B32/B33,0)" }, { fmt: USD, out: true });

  rateCardSheet(wb, CLEANING_RATES, "Cleaning Rate Card");
  await save(wb, out(kit, "02-cleaning-pricing-calculator.xlsx"));
  writeCsv(out(kit, "03-cleaning-rate-card.csv"), CLEANING_RATES);
}

// =====================================================================
// HANDYMAN
// =====================================================================
const HANDYMAN_TASKS = [
  // task, category, hrs low, hrs typical, typical materials, notes
  ["TV mount — up to 65in, drywall/studs", "Mounting", 0.75, 1.25, 0, "Client supplies mount; cord concealment extra"],
  ["TV mount — cord concealment kit (in-wall rated)", "Mounting", 0.75, 1, 30, "Use an in-wall rated kit; no extension cords in walls"],
  ["Hang shelves (per 3 shelves)", "Mounting", 0.5, 1, 0, "Anchors vs studs changes time"],
  ["Hang pictures / mirrors (per 5 items)", "Mounting", 0.5, 1, 5, "Heavy mirrors: French cleat"],
  ["Curtain rods (per window)", "Mounting", 0.33, 0.5, 0, ""],
  ["Blinds install (per window, inside mount)", "Mounting", 0.33, 0.5, 0, ""],
  ["Furniture assembly — small (nightstand, chair)", "Assembly", 0.5, 0.75, 0, ""],
  ["Furniture assembly — large (dresser, bed frame)", "Assembly", 1.5, 2.5, 0, "Wardrobes/PAX-style: 3–5 hrs"],
  ["Drywall patch — small (under 6in)", "Drywall & paint", 0.75, 1, 10, "Needs a second visit or fast-set compound"],
  ["Drywall patch — medium (6–16in)", "Drywall & paint", 1.5, 2.5, 20, "Often 2 visits for mud + paint"],
  ["Touch-up paint (per wall)", "Drywall & paint", 0.75, 1, 0, "Client supplies paint; color match not guaranteed"],
  ["Caulk tub or shower surround", "Bath & kitchen", 1, 1.5, 15, "Old caulk removal is most of the time"],
  ["Replace toilet fill valve / flapper", "Bath & kitchen", 0.5, 0.75, 20, "Check your state's plumbing license limits"],
  ["Replace kitchen/bath faucet (same footprint)", "Bath & kitchen", 1, 1.5, 0, "Client supplies faucet; seized nuts add time"],
  ["Replace garbage disposal (like for like)", "Bath & kitchen", 1, 1.5, 0, "Check license limits"],
  ["Replace toilet (like for like)", "Bath & kitchen", 1.5, 2, 15, "Wax ring/bolts; haul-away extra"],
  ["Regrout small area (under 10 sq ft)", "Bath & kitchen", 2, 3, 20, ""],
  ["Swap light fixture (existing box)", "Electrical (where allowed)", 0.75, 1, 0, "Many states require a licensed electrician — check first"],
  ["Swap ceiling fan (existing fan-rated box)", "Electrical (where allowed)", 1, 1.5, 0, "Confirm box is fan-rated"],
  ["Replace smoke/CO detectors (per unit)", "Electrical (where allowed)", 0.25, 0.33, 0, "Battery units; hardwired = check license"],
  ["Replace interior door hardware (per door)", "Doors & windows", 0.33, 0.5, 0, ""],
  ["Hang pre-hung interior door", "Doors & windows", 2, 3, 0, "Door supplied by client; trim extra"],
  ["Adjust sticking door / strike plate", "Doors & windows", 0.5, 0.75, 5, ""],
  ["Weatherstrip exterior door", "Doors & windows", 0.75, 1, 25, ""],
  ["Replace window screen (rescreen)", "Doors & windows", 0.33, 0.5, 10, ""],
  ["Gutter cleaning — 1 story (per 100 lf)", "Exterior", 1, 1.25, 0, "Ladder safety; 2-story needs a second person"],
  ["Fence board / picket repair (per 5 boards)", "Exterior", 0.75, 1, 25, ""],
  ["Deck board replacement (per board)", "Exterior", 0.5, 0.75, 20, "Check joists while you're there"],
  ["Pressure-treat / seal small deck (per 100 sq ft)", "Exterior", 1, 1.5, 25, ""],
  ["Baby-proofing package (gates, latches, anchors)", "Misc", 1.5, 2.5, 0, "Client supplies products"],
];

async function handyman() {
  const kit = "handyman-kit";
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, { goal: 65000, tax: 0.25, costs: 20000, weeks: 48, hours: 28 });

  const ws = sheet(wb, "Task Pricing", "Handyman Task Pricing Library", "Edit hours to match YOUR pace. Price = typical hours × rate + materials × (1 + markup).", [50, 24, 12, 12, 14, 14, 16, 52]);
  legend(ws, 3);
  put(ws, "A4", "Target hourly rate");
  put(ws, "B4", { f: RATE }, { fmt: USD, input: true });
  put(ws, "A5", "Materials markup (covers pickup time, returns, waste)");
  put(ws, "B5", 0.2, { fmt: PCT, input: true });
  put(ws, "A6", "Minimum per-visit charge");
  put(ws, "B6", 150, { fmt: USD0, input: true });
  put(ws, "A7", "Supply-run / trip charge (if you buy materials)");
  put(ws, "B7", 25, { fmt: USD0, input: true });
  header(ws, 9, ["Task", "Category", "Hours (low)", "Hours (typical)", "Typical materials $", "Labor price", "Price incl. materials", "Notes"]);
  const first = 10;
  HANDYMAN_TASKS.forEach(([t, c, lo, typ, mat, note], i) => {
    const r = first + i;
    put(ws, `A${r}`, t);
    put(ws, `B${r}`, c);
    put(ws, `C${r}`, lo, { input: true, fmt: HRS });
    put(ws, `D${r}`, typ, { input: true, fmt: HRS });
    put(ws, `E${r}`, mat, { input: true, fmt: USD });
    put(ws, `F${r}`, { f: `D${r}*$B$4` }, { fmt: USD });
    put(ws, `G${r}`, { f: `F${r}+E${r}*(1+$B$5)` }, { fmt: USD, out: true });
    put(ws, `H${r}`, note);
  });
  const last = first + HANDYMAN_TASKS.length - 1;
  const TBL = `'Task Pricing'!$A$${first}:$H$${last}`;

  const q = sheet(wb, "Quote Builder", "Handyman Quote Builder", "Pick tasks from the dropdown, enter quantities. Minimum visit charge applies.", [52, 8, 12, 14, 14, 14]);
  legend(q, 3);
  header(q, 5, ["Task (pick from list)", "Qty", "Hours", "Labor $", "Materials $", "Line total $"]);
  for (let i = 0; i < 12; i++) {
    const r = 6 + i;
    const pre = [
      ["TV mount — up to 65in, drywall/studs", 1],
      ["Hang shelves (per 3 shelves)", 1],
      ["Caulk tub or shower surround", 1],
    ][i];
    put(q, `A${r}`, pre ? pre[0] : null, { input: true, list: `'Task Pricing'!$A$${first}:$A$${last}` });
    put(q, `B${r}`, pre ? pre[1] : null, { input: true });
    put(q, `C${r}`, { f: `IF(A${r}="","",VLOOKUP(A${r},${TBL},4,FALSE)*B${r})` }, { fmt: HRS });
    put(q, `D${r}`, { f: `IF(A${r}="","",C${r}*'Task Pricing'!$B$4)` }, { fmt: USD });
    put(q, `E${r}`, { f: `IF(A${r}="","",VLOOKUP(A${r},${TBL},5,FALSE)*B${r}*(1+'Task Pricing'!$B$5))` }, { fmt: USD });
    put(q, `F${r}`, { f: `IF(A${r}="","",D${r}+E${r})` }, { fmt: USD });
  }
  // rows 6..17
  put(q, "A19", "Total hours");
  put(q, "C19", { f: "SUM(C6:C17)" }, { fmt: HRS, bold: true });
  put(q, "A20", "Tasks subtotal");
  put(q, "F20", { f: "SUM(F6:F17)" }, { fmt: USD, bold: true });
  put(q, "A21", "Supply-run charge? (Yes/No)");
  put(q, "B21", "No", { input: true, list: '"Yes,No"' });
  put(q, "F21", { f: `IF(B21="Yes",'Task Pricing'!$B$7,0)` }, { fmt: USD });
  put(q, "A22", "Rush / after-hours uplift (%)");
  put(q, "B22", 0, { input: true, fmt: PCT });
  put(q, "F22", { f: "SUM(D6:D17)*B22" }, { fmt: USD });
  put(q, "A24", "QUOTED PRICE", { bold: true });
  put(q, "F24", { f: `CEILING(MAX('Task Pricing'!$B$6,F20+F21+F22),5)` }, { fmt: USD, out: true });
  put(q, "A25", "Effective hourly (check vs target)");
  put(q, "F25", { f: "IF(C19>0,F24/C19,0)" }, { fmt: USD, out: true });
  put(q, "A26", "Status");
  put(q, "F26", { f: `IF(C19=0,"",IF(F25<'Task Pricing'!$B$4,"Below target — check hours","OK"))` }, { bold: true });

  // Task prices as part of a visit; a standalone small task still pays the minimum visit charge.
  const rates = HANDYMAN_TASKS.map(([t, c, lo, typ, mat, note]) => [
    c,
    t,
    "task (min. visit charge applies)",
    Math.round((lo * 85) / 5) * 5 + mat,
    Math.round((typ * 95) / 5) * 5 + mat,
    note,
  ]);
  const HANDYMAN_RATES = [
    ["rates", "Minimum per-visit charge (includes first hour)", "visit", 125, 175, "Protects you on tiny jobs"],
    ["rates", "Hourly labor after first hour", "hour", 65, 110, "Solo handyman"],
    ["rates", "Supply run / materials pickup", "trip", 20, 40, "Plus materials at cost + markup"],
    ["rates", "Materials markup", "percent", 15, 25, "Percent over receipt"],
    ["rates", "Haul-away (small load)", "load", 40, 90, "Dump fees vary"],
    ...rates,
  ];
  rateCardSheet(wb, HANDYMAN_RATES, "Handyman Rate Card");
  await save(wb, out(kit, "02-handyman-pricing-calculator.xlsx"));
  writeCsv(out(kit, "03-handyman-rate-card.csv"), HANDYMAN_RATES);
}

// =====================================================================
// LAWN CARE
// =====================================================================
const LAWN_RATES = [
  ["mowing", "Mow/trim/edge/blow — under 5,000 sq ft lot", "visit", 35, 50, "Weekly price; biweekly +15–25%"],
  ["mowing", "Mow/trim/edge/blow — 5,000–10,000 sq ft", "visit", 45, 65, ""],
  ["mowing", "Mow/trim/edge/blow — 10,000–15,000 sq ft", "visit", 55, 80, ""],
  ["mowing", "Mow/trim/edge/blow — 1/2 acre", "visit", 70, 100, ""],
  ["mowing", "Mow/trim/edge/blow — 1 acre", "visit", 100, 160, "Needs a 48in+ mower to be profitable"],
  ["mowing", "Overgrown first cut", "percent", 50, 100, "Percent on top of normal visit price"],
  ["cleanup", "Spring cleanup (small yard)", "job", 150, 275, "Beds, sticks, first mow, edging"],
  ["cleanup", "Fall leaf cleanup (small yard)", "job", 175, 350, "Price per visit; heavy trees = more visits"],
  ["cleanup", "Leaf removal hourly", "man-hour", 50, 75, "Plus disposal"],
  ["beds", "Bed weeding", "man-hour", 45, 65, ""],
  ["beds", "Mulch install (labor)", "cubic yard", 50, 90, "Plus mulch at cost + markup"],
  ["beds", "Bed edging (spade/redefine)", "linear ft", 1, 2, ""],
  ["shrubs", "Hedge / shrub trimming", "man-hour", 50, 75, "Or per shrub $8–$20"],
  ["turf", "Core aeration — up to 5,000 sq ft", "job", 80, 130, "Rental cost if you don't own one"],
  ["turf", "Overseeding (with aeration)", "1,000 sq ft", 15, 30, "Seed cost extra"],
  ["turf", "Dethatching (small lawn)", "job", 120, 220, ""],
  ["turf", "Fertilizer / weed control", "application", 45, 75, "Many states require a pesticide applicator license — check before offering"],
  ["misc", "Gutter cleaning — 1 story", "job", 100, 175, ""],
  ["misc", "Storm cleanup / brush haul", "man-hour", 55, 80, "Plus dump fees"],
  ["policy", "Rain delay", "policy", 0, 0, "Next dry day; no charge"],
];

async function lawn() {
  const kit = "lawn-care-kit";
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, {
    goal: 55000, tax: 0.25, costs: 22000, weeks: 36, hours: 35,
    hoursNote: "Mowing season weeks only. Winter work (snow, holiday lights) is a bonus, not a plan.",
  });

  const ws = sheet(wb, "Mow Pricing", "Mowing Price per Visit — by lot size", "Time = turf ÷ your mowing rate + trim/edge/blow + setup. Time your own routes and update the yellow cells.", [36, 14, 12, 14, 12, 14, 12, 16]);
  legend(ws, 3);
  put(ws, "A4", "Target hourly rate");
  put(ws, "B4", { f: RATE }, { fmt: USD, input: true });
  put(ws, "A5", "Mowing rate (turf sq ft per hour)");
  put(ws, "B5", 20000, { input: true, fmt: "#,##0" });
  put(ws, "C5", "Rough guide: 21in push ~8–12k · 36in walk-behind ~20–30k · 48–52in stand-on ~45–70k (time yours)");
  put(ws, "A6", "Trim/edge/blow minutes per 1,000 sq ft turf");
  put(ws, "B6", 1.0, { input: true });
  put(ws, "A7", "Setup minutes per stop (unload, load, gate)");
  put(ws, "B7", 8, { input: true });
  put(ws, "A8", "Minimum price per visit");
  put(ws, "B8", 40, { input: true, fmt: USD0 });
  put(ws, "A9", "Round up to nearest $");
  put(ws, "B9", 5, { input: true, fmt: USD0 });
  header(ws, 11, ["Lot", "Lot sq ft", "Turf % of lot", "Turf sq ft", "Mow min", "Trim/blow min", "Total min", "Price / visit"]);
  const lots = [
    ["Small lot", 4000, 0.6],
    ["6,000 sq ft", 6000, 0.6],
    ["8,000 sq ft", 8000, 0.65],
    ["10,000 sq ft", 10000, 0.65],
    ["13,000 sq ft", 13000, 0.7],
    ["17,000 sq ft", 17000, 0.7],
    ["1/2 acre", 21780, 0.75],
    ["3/4 acre", 32670, 0.8],
    ["1 acre", 43560, 0.8],
    ["YOUR PROPERTY →", 9000, 0.6],
  ];
  lots.forEach(([n, sq, pct], i) => {
    const r = 12 + i;
    const isCustom = i === lots.length - 1;
    put(ws, `A${r}`, n, isCustom ? { bold: true } : {});
    put(ws, `B${r}`, sq, { input: true, fmt: "#,##0" });
    put(ws, `C${r}`, pct, { input: true, fmt: PCT });
    put(ws, `D${r}`, { f: `B${r}*C${r}` }, { fmt: "#,##0" });
    put(ws, `E${r}`, { f: `D${r}/$B$5*60` }, { fmt: "0" });
    put(ws, `F${r}`, { f: `D${r}/1000*$B$6` }, { fmt: "0" });
    put(ws, `G${r}`, { f: `E${r}+F${r}+$B$7` }, { fmt: "0" });
    put(ws, `H${r}`, { f: `CEILING(MAX($B$8,G${r}/60*$B$4),$B$9)` }, { fmt: USD, out: true });
  });
  // custom row = 21
  put(ws, "A23", "Biweekly uplift (longer grass takes longer)");
  put(ws, "B23", 0.2, { input: true, fmt: PCT });
  put(ws, "A24", "Your property — biweekly price");
  put(ws, "H24", { f: "CEILING(H21*(1+B23),$B$9)" }, { fmt: USD, out: true });

  // Seasonal Contract
  const sc = sheet(wb, "Seasonal Contract", "Seasonal Contract Calculator", "Sell the season, bill it evenly. Adjust visits per month for your climate.", [16, 14, 34, 14, 16]);
  legend(sc, 3);
  put(sc, "A4", "Price per mowing visit");
  put(sc, "B4", { f: "'Mow Pricing'!H21" }, { fmt: USD, input: true });
  header(sc, 6, ["Month", "Mow visits", "Included service", "Service price", "Month total"]);
  const months = [
    ["Jan", 0, "", 0], ["Feb", 0, "", 0], ["Mar", 2, "Spring cleanup", 225], ["Apr", 4, "", 0],
    ["May", 5, "Bed edging + mulch labor (2 yd)", 160], ["Jun", 4, "", 0], ["Jul", 4, "Shrub trim", 120], ["Aug", 5, "", 0],
    ["Sep", 4, "Core aeration + overseed", 180], ["Oct", 4, "Fall cleanup #1", 225], ["Nov", 2, "Fall cleanup #2 / leaves", 250], ["Dec", 0, "", 0],
  ];
  months.forEach(([m, v, s, p], i) => {
    const r = 7 + i;
    put(sc, `A${r}`, m);
    put(sc, `B${r}`, v, { input: true });
    put(sc, `C${r}`, s, { input: true });
    put(sc, `D${r}`, p, { input: true, fmt: USD });
    put(sc, `E${r}`, { f: `B${r}*$B$4+D${r}` }, { fmt: USD });
  });
  // rows 7..18
  put(sc, "A19", "Season", { bold: true });
  put(sc, "B19", { f: "SUM(B7:B18)" }, { bold: true });
  put(sc, "E19", { f: "SUM(E7:E18)" }, { fmt: USD, out: true });
  put(sc, "A21", "Billing months (e.g. 8 for Apr–Nov, 12 for year-round)");
  put(sc, "B21", 8, { input: true });
  put(sc, "A22", "Monthly payment");
  put(sc, "B22", { f: "CEILING(E19/B21,1)" }, { fmt: USD, out: true });
  put(sc, "A23", "Prepay-in-full discount (%)");
  put(sc, "B23", 0.05, { input: true, fmt: PCT });
  put(sc, "A24", "Prepay price");
  put(sc, "B24", { f: "CEILING(E19*(1-B23),5)" }, { fmt: USD, out: true });

  // Route Planner
  const rp = sheet(wb, "Route Planner", "Route Planner — revenue per hour including drive time", "Example rows are placeholders — replace with your clients. Keep each day's stops in one zone.", [26, 12, 12, 14, 14, 16]);
  legend(rp, 3);
  put(rp, "A4", "Target hourly rate");
  put(rp, "B4", { f: RATE }, { fmt: USD, input: true });
  header(rp, 6, ["Client", "Service day", "Zone", "Visit price", "On-site min", "Drive min from prev."]);
  const stops = [
    ["Example client 1", "Mon", "North", 50, 35, 15], ["Example client 2", "Mon", "North", 55, 40, 5], ["Example client 3", "Mon", "North", 45, 30, 4],
    ["Example client 4", "Mon", "North", 65, 50, 6], ["Example client 5", "Tue", "East", 50, 35, 20], ["Example client 6", "Tue", "East", 60, 45, 8],
    ["Example client 7", "Tue", "West", 45, 30, 25],
  ];
  for (let i = 0; i < 40; i++) {
    const r = 7 + i;
    const s = stops[i];
    put(rp, `A${r}`, s ? s[0] : null, { input: true });
    put(rp, `B${r}`, s ? s[1] : null, { input: true, list: '"Mon,Tue,Wed,Thu,Fri,Sat"' });
    put(rp, `C${r}`, s ? s[2] : null, { input: true });
    put(rp, `D${r}`, s ? s[3] : null, { input: true, fmt: USD });
    put(rp, `E${r}`, s ? s[4] : null, { input: true });
    put(rp, `F${r}`, s ? s[5] : null, { input: true });
  }
  // rows 7..46
  header(rp, 49, ["Day", "Stops", "Revenue", "On-site hrs", "Drive hrs", "Revenue / total hr", "Drive % of day", "vs target"]);
  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d, i) => {
    const r = 50 + i;
    put(rp, `A${r}`, d);
    put(rp, `B${r}`, { f: `COUNTIF($B$7:$B$46,A${r})` });
    put(rp, `C${r}`, { f: `SUMIF($B$7:$B$46,A${r},$D$7:$D$46)` }, { fmt: USD });
    put(rp, `D${r}`, { f: `SUMIF($B$7:$B$46,A${r},$E$7:$E$46)/60` }, { fmt: HRS });
    put(rp, `E${r}`, { f: `SUMIF($B$7:$B$46,A${r},$F$7:$F$46)/60` }, { fmt: HRS });
    put(rp, `F${r}`, { f: `IF(D${r}+E${r}>0,C${r}/(D${r}+E${r}),0)` }, { fmt: USD, out: true });
    put(rp, `G${r}`, { f: `IF(D${r}+E${r}>0,E${r}/(D${r}+E${r}),0)` }, { fmt: PCT });
    put(rp, `H${r}`, { f: `IF(B${r}=0,"",IF(F${r}<$B$4,"Below target","OK"))` });
  });
  put(rp, "A57", "Rule of thumb: if drive time is over ~20% of the day, tighten zones before adding clients.");

  rateCardSheet(wb, LAWN_RATES, "Lawn Care Rate Card");
  await save(wb, out(kit, "02-lawn-care-pricing-calculator.xlsx"));
  writeCsv(out(kit, "03-lawn-care-rate-card.csv"), LAWN_RATES);
}

// =====================================================================
// PRESSURE WASHING
// =====================================================================
const PW_SURFACES = [
  // surface, unit, low, target, production units/hr, notes
  ["Concrete driveway / sidewalk", "sq ft", 0.15, 0.25, 800, "Surface cleaner; pre-treat + post-rinse"],
  ["Concrete patio", "sq ft", 0.18, 0.3, 600, "More edges and furniture moving"],
  ["Pavers — clean only", "sq ft", 0.25, 0.4, 400, "Low pressure; joint sand loss likely"],
  ["Pavers — clean + polymeric sand", "sq ft", 0.9, 1.5, 150, "Sand material extra"],
  ["House soft wash — vinyl siding", "sq ft wall", 0.12, 0.2, 1200, "Wall area ≈ house sq ft × 1.3–1.5 per story"],
  ["House soft wash — stucco / brick", "sq ft wall", 0.15, 0.25, 900, "Porous; more chem and rinse time"],
  ["Wood deck — clean + brighten", "sq ft", 0.4, 0.75, 250, "Low pressure; raised grain risk"],
  ["Fence — per side", "linear ft", 1, 2, 80, "6ft privacy fence, one side"],
  ["Roof soft wash (trained only)", "sq ft", 0.25, 0.45, 800, "Check insurance coverage for roof work"],
  ["Gutter face brightening", "linear ft", 1, 1.75, 100, "Tiger stripes; no guarantee of full removal"],
  ["Pool deck", "sq ft", 0.2, 0.35, 600, ""],
  ["Garage floor", "sq ft", 0.2, 0.35, 500, "Drainage plan needed"],
  ["Dumpster pad (commercial)", "each", 75, 125, 2, "Degreaser; wastewater rules apply"],
  ["Rust / oil stain treatment", "each", 25, 75, 3, "Improvement, not guaranteed removal"],
];

async function pressure() {
  const kit = "pressure-washing-kit";
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, { goal: 60000, tax: 0.25, costs: 20000, weeks: 40, hours: 25 });

  const m = sheet(wb, "Surface Matrix", "Surface Pricing Matrix", "Rates are starting points. Production rate = units you clean per hour including setup and rinse.", [38, 12, 10, 12, 16, 50]);
  legend(m, 3);
  header(m, 5, ["Surface", "Unit", "Low $", "Target $", "Units per hour", "Notes"]);
  PW_SURFACES.forEach(([s, u, lo, t, prod, n], i) => {
    const r = 6 + i;
    put(m, `A${r}`, s);
    put(m, `B${r}`, u);
    put(m, `C${r}`, lo, { input: true, fmt: USD });
    put(m, `D${r}`, t, { input: true, fmt: USD });
    put(m, `E${r}`, prod, { input: true, fmt: "#,##0" });
    put(m, `F${r}`, n);
  });
  const mLast = 6 + PW_SURFACES.length - 1;
  const MT = `'Surface Matrix'!$A$6:$F$${mLast}`;
  put(m, `A${mLast + 2}`, "Condition multipliers", { bold: true });
  header(m, mLast + 3, ["Condition", "Multiplier"]);
  const cStart = mLast + 4;
  [["Light", 1], ["Moderate", 1.2], ["Heavy", 1.4]].forEach(([c, x], i) => {
    put(m, `A${cStart + i}`, c);
    put(m, `B${cStart + i}`, x, { input: true, fmt: "0.00" });
  });
  const CT = `'Surface Matrix'!$A$${cStart}:$B$${cStart + 2}`;

  const q = sheet(wb, "Quote Builder", "Pressure Washing Quote Builder", "Pick surfaces, enter measured quantity and condition. Multiplier raises both price and time.", [38, 12, 12, 12, 14, 12]);
  legend(q, 3);
  put(q, "A4", "Target hourly rate");
  put(q, "B4", { f: RATE }, { fmt: USD, input: true });
  put(q, "A5", "Minimum job price");
  put(q, "B5", 175, { fmt: USD0, input: true });
  put(q, "A6", "Chemical + fuel cost per job hour");
  put(q, "B6", 12, { fmt: USD, input: true });
  header(q, 8, ["Surface (pick)", "Quantity", "Condition", "Rate", "Line total", "Est. hours"]);
  const pre = [
    ["Concrete driveway / sidewalk", 700, "Moderate"],
    ["House soft wash — vinyl siding", 2600, "Light"],
    ["Rust / oil stain treatment", 1, "Heavy"],
  ];
  for (let i = 0; i < 10; i++) {
    const r = 9 + i;
    const p = pre[i];
    put(q, `A${r}`, p ? p[0] : null, { input: true, list: `'Surface Matrix'!$A$6:$A$${mLast}` });
    put(q, `B${r}`, p ? p[1] : null, { input: true, fmt: "#,##0" });
    put(q, `C${r}`, p ? p[2] : null, { input: true, list: '"Light,Moderate,Heavy"' });
    put(q, `D${r}`, { f: `IF(A${r}="","",VLOOKUP(A${r},${MT},4,FALSE)*VLOOKUP(IF(C${r}="","Light",C${r}),${CT},2,FALSE))` }, { fmt: USD });
    put(q, `E${r}`, { f: `IF(A${r}="","",B${r}*D${r})` }, { fmt: USD });
    put(q, `F${r}`, { f: `IF(A${r}="","",B${r}/VLOOKUP(A${r},${MT},5,FALSE)*VLOOKUP(IF(C${r}="","Light",C${r}),${CT},2,FALSE))` }, { fmt: HRS });
  }
  // rows 9..18
  put(q, "A20", "Subtotal");
  put(q, "E20", { f: "SUM(E9:E18)" }, { fmt: USD, bold: true });
  put(q, "F20", { f: "SUM(F9:F18)+0.5" }, { fmt: HRS, bold: true });
  put(q, "G20", "← includes 0.5 hr setup/breakdown");
  put(q, "A21", "Bundle discount for 3+ services (%)");
  put(q, "B21", 0, { input: true, fmt: PCT });
  put(q, "A23", "QUOTED PRICE", { bold: true });
  put(q, "E23", { f: "CEILING(MAX(B5,E20*(1-B21)),5)" }, { fmt: USD, out: true });
  put(q, "A24", "Est. chemical + fuel cost");
  put(q, "E24", { f: "F20*B6" }, { fmt: USD });
  put(q, "A25", "Effective hourly after chemicals");
  put(q, "E25", { f: "IF(F20>0,(E23-E24)/F20,0)" }, { fmt: USD, out: true });
  put(q, "A26", "Status");
  put(q, "E26", { f: 'IF(F20<=0.5,"",IF(E25<B4,"Below target — raise price or check production rates","OK"))' }, { bold: true });

  const rates = [
    ["policy", "Minimum job", "job", 150, 200, "Covers setup, water, travel"],
    ...PW_SURFACES.map(([s, u, lo, t, , n]) => ["surface", s, u, lo, t, n]),
    ["policy", "Water not available on site", "job", 50, 100, "If you must bring water"],
  ];
  rateCardSheet(wb, rates, "Pressure Washing Rate Card");
  await save(wb, out(kit, "02-pressure-washing-pricing-calculator.xlsx"));
  writeCsv(out(kit, "03-pressure-washing-rate-card.csv"), rates);
}

// =====================================================================
// DETAILING
// =====================================================================
const DETAIL_PACKAGES = [
  ["Maintenance wash", 75, 1, "Hand wash, wheels/tires, windows, quick vacuum, wipe-down"],
  ["Interior detail", 185, 2.5, "Full vacuum, plastics, leather/fabric clean, glass, door jambs"],
  ["Exterior detail", 150, 2, "Foam wash, decon, wheels/wells, spray sealant, tire dressing"],
  ["Full detail", 295, 4, "Interior detail + exterior detail"],
  ["Paint enhancement", 450, 6, "Full detail exterior + 1-step polish + sealant"],
  ["Ceramic coating (trained only)", 900, 10, "Decon + polish + coating install; price by product"],
];
const DETAIL_SIZES = [
  ["Coupe / sedan", 1],
  ["Small SUV / crossover", 1.15],
  ["Mid-size SUV / crew-cab pickup", 1.25],
  ["Full-size SUV / minivan / 3-row", 1.4],
  ["Oversized / work van", 1.6],
];
const DETAIL_ADDONS = [
  ["Pet hair removal", 60, 0.75],
  ["Seat shampoo / hot-water extraction", 90, 1],
  ["Carpet & mat extraction", 60, 0.75],
  ["Leather clean & condition", 60, 0.5],
  ["Engine bay clean", 60, 0.5],
  ["Headlight restoration (pair)", 90, 0.75],
  ["Odor treatment (enzyme + ozone)", 90, 0.5],
  ["Clay bar + iron decon (add to wash)", 70, 0.75],
  ["Sand / salt / heavy soil surcharge", 50, 0.5],
];

async function detailing() {
  const kit = "detailing-kit";
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, { goal: 50000, tax: 0.25, costs: 14000, weeks: 46, hours: 28 });

  const m = sheet(wb, "Package Menu", "Detail Package Menu — base prices (sedan)", "Edit to match your menu. Size and condition multipliers apply to price AND time.", [36, 14, 12, 64]);
  legend(m, 3);
  header(m, 5, ["Package", "Base price", "Base hours", "Includes"]);
  DETAIL_PACKAGES.forEach(([p, price, h, inc], i) => {
    const r = 6 + i;
    put(m, `A${r}`, p);
    put(m, `B${r}`, price, { input: true, fmt: USD });
    put(m, `C${r}`, h, { input: true, fmt: HRS });
    put(m, `D${r}`, inc);
  });
  const pLast = 6 + DETAIL_PACKAGES.length - 1;
  const sHead = pLast + 2;
  header(m, sHead, ["Vehicle size", "Multiplier"]);
  DETAIL_SIZES.forEach(([s, x], i) => {
    put(m, `A${sHead + 1 + i}`, s);
    put(m, `B${sHead + 1 + i}`, x, { input: true, fmt: "0.00" });
  });
  const sFirst = sHead + 1;
  const sLast = sHead + DETAIL_SIZES.length;
  const cHead = sLast + 2;
  header(m, cHead, ["Condition", "Multiplier"]);
  [["Normal", 1], ["Dirty", 1.2], ["Extreme", 1.5]].forEach(([c, x], i) => {
    put(m, `A${cHead + 1 + i}`, c);
    put(m, `B${cHead + 1 + i}`, x, { input: true, fmt: "0.00" });
  });
  const cFirst = cHead + 1;
  const cLast = cHead + 3;

  const q = sheet(wb, "Quote Builder", "Mobile Detailing Quote Builder", "Pick package, size, condition, add-ons.", [40, 12, 12, 12, 12]);
  legend(q, 3);
  put(q, "A4", "Target hourly rate");
  put(q, "B4", { f: RATE }, { fmt: USD, input: true });
  put(q, "A5", "Package");
  put(q, "B5", "Full detail", { input: true, list: `'Package Menu'!$A$6:$A$${pLast}` });
  put(q, "A6", "Vehicle size");
  put(q, "B6", "Small SUV / crossover", { input: true, list: `'Package Menu'!$A$${sFirst}:$A$${sLast}` });
  put(q, "A7", "Condition");
  put(q, "B7", "Normal", { input: true, list: `'Package Menu'!$A$${cFirst}:$A$${cLast}` });
  put(q, "A8", "Travel fee (outside free radius)");
  put(q, "B8", 0, { input: true, fmt: USD });
  put(q, "A10", "Size multiplier");
  put(q, "B10", { f: `VLOOKUP(B6,'Package Menu'!$A$${sFirst}:$B$${sLast},2,FALSE)` }, { fmt: "0.00" });
  put(q, "A11", "Condition multiplier");
  put(q, "B11", { f: `VLOOKUP(B7,'Package Menu'!$A$${cFirst}:$B$${cLast},2,FALSE)` }, { fmt: "0.00" });
  put(q, "A12", "Package price (adjusted)");
  put(q, "B12", { f: `VLOOKUP(B5,'Package Menu'!$A$6:$C$${pLast},2,FALSE)*B10*B11` }, { fmt: USD });
  put(q, "A13", "Package hours (adjusted)");
  put(q, "B13", { f: `VLOOKUP(B5,'Package Menu'!$A$6:$C$${pLast},3,FALSE)*B10*B11` }, { fmt: HRS });
  header(q, 15, ["Add-on", "Qty (0/1)", "Price", "Hours", "Line $", "Line hrs"]);
  DETAIL_ADDONS.forEach(([a, p, h], i) => {
    const r = 16 + i;
    put(q, `A${r}`, a);
    put(q, `B${r}`, 0, { input: true });
    put(q, `C${r}`, p, { input: true, fmt: USD });
    put(q, `D${r}`, h, { input: true, fmt: HRS });
    put(q, `E${r}`, { f: `B${r}*C${r}` }, { fmt: USD });
    put(q, `F${r}`, { f: `B${r}*D${r}` }, { fmt: HRS });
  });
  const aLast = 16 + DETAIL_ADDONS.length - 1;
  const t = aLast + 2;
  put(q, `A${t}`, "QUOTED PRICE", { bold: true });
  put(q, `B${t}`, { f: `CEILING(B12+SUM(E16:E${aLast})+B8,5)` }, { fmt: USD, out: true });
  put(q, `A${t + 1}`, "Estimated hours");
  put(q, `B${t + 1}`, { f: `B13+SUM(F16:F${aLast})` }, { fmt: HRS, out: true });
  put(q, `A${t + 2}`, "Effective hourly");
  put(q, `B${t + 2}`, { f: `IF(B${t + 1}>0,B${t}/B${t + 1},0)` }, { fmt: USD, out: true });
  put(q, `A${t + 3}`, "Status");
  put(q, `B${t + 3}`, { f: `IF(B${t + 2}<B4,"Below target — add size/condition surcharge or raise base price","OK")` }, { bold: true });

  const rates = [
    ...DETAIL_PACKAGES.map(([p, price, , inc]) => ["package (sedan)", p, "vehicle", Math.round(price * 0.8 / 5) * 5, price, inc]),
    ...DETAIL_SIZES.slice(1).map(([s, x]) => ["size multiplier", s, "multiplier", "", "", `Multiply package price by ${x}`]),
    ...DETAIL_ADDONS.map(([a, p]) => ["add-on", a, "each", Math.round(p * 0.75 / 5) * 5, p, ""]),
    ["policy", "Travel fee beyond free radius", "trip", 15, 35, "Free radius typically 10–15 miles"],
    ["policy", "Maintenance plan (every 2–4 weeks)", "visit", 60, 90, "Only after an initial full or interior detail"],
  ];
  rateCardSheet(wb, rates, "Mobile Detailing Rate Card");
  await save(wb, out(kit, "02-detailing-pricing-calculator.xlsx"));
  writeCsv(out(kit, "03-detailing-rate-card.csv"), rates);
}

// =====================================================================
// ADD-ON: PRICING CALCULATOR PACK
// =====================================================================
async function pricingPack() {
  const kit = "pricing-calculator-pack";
  const wb = newBook();

  // 1. Hourly Target (detailed)
  const h = sheet(wb, "Hourly Target", "1 · Hourly Target — from your life to your rate", "Fill in monthly costs, your pay goal, and realistic billable hours.", [52, 16, 16, 50]);
  legend(h, 3);
  header(h, 5, ["Monthly business cost", "Monthly $", "Annual $", "Notes"]);
  const costs = [
    ["Vehicle payment or depreciation", 450, "Truck/van"],
    ["Fuel", 350, ""],
    ["Vehicle insurance + maintenance", 250, "Commercial auto if required"],
    ["General liability insurance", 80, "Get a real quote"],
    ["Supplies / chemicals / consumables", 200, ""],
    ["Equipment repair + replacement fund", 150, "Mowers, washers, vacuums wear out"],
    ["Phone + software (scheduling, invoicing)", 90, ""],
    ["Marketing (ads, cards, yard signs, website)", 150, ""],
    ["Accounting, bank, and card fees (non-transaction)", 60, ""],
    ["Health insurance", 400, "If you pay your own"],
    ["Retirement savings", 300, "Pay future-you"],
    ["Other", 0, ""],
  ];
  costs.forEach(([n, v, note], i) => {
    const r = 6 + i;
    put(h, `A${r}`, n);
    put(h, `B${r}`, v, { input: true, fmt: USD0 });
    put(h, `C${r}`, { f: `B${r}*12` }, { fmt: USD0 });
    put(h, `D${r}`, note);
  });
  // 6..17
  put(h, "A18", "Total business costs", { bold: true });
  put(h, "B18", { f: "SUM(B6:B17)" }, { fmt: USD0, bold: true });
  put(h, "C18", { f: "SUM(C6:C17)" }, { fmt: USD0, bold: true });
  put(h, "A20", "Take-home pay goal (per year)");
  put(h, "B20", 55000, { input: true, fmt: USD0 });
  put(h, "A21", "Tax set-aside (% of profit)");
  put(h, "B21", 0.25, { input: true, fmt: PCT });
  put(h, "A22", "Working weeks per year");
  put(h, "B22", 47, { input: true });
  put(h, "A23", "Billable hours per week");
  put(h, "B23", 28, { input: true });
  put(h, "A24", "Non-billable hours per week (driving, quoting, admin)");
  put(h, "B24", 14, { input: true });
  put(h, "A26", "Revenue needed per year");
  put(h, "B26", { f: "B20/(1-B21)+C18" }, { fmt: USD0, out: true });
  put(h, "A27", "Minimum rate per billable hour");
  put(h, "B27", { f: "IF(B22*B23>0,B26/(B22*B23),0)" }, { fmt: USD, out: true });
  put(h, "A28", "Buffer (%)");
  put(h, "B28", 0.15, { input: true, fmt: PCT });
  put(h, "A29", "TARGET RATE per billable hour", { bold: true });
  put(h, "B29", { f: "B27*(1+B28)" }, { fmt: USD, out: true });
  put(h, "A30", "What you actually earn per hour worked (incl. non-billable)");
  put(h, "B30", { f: "IF(B22*(B23+B24)>0,B20/(B22*(B23+B24)),0)" }, { fmt: USD, out: true });
  put(h, "A31", "Billable share of your working time");
  put(h, "B31", { f: "IF(B23+B24>0,B23/(B23+B24),0)" }, { fmt: PCT, out: true });

  // 2. Job Profit Check
  const j = sheet(wb, "Job Profit Check", "2 · Job Profit Check — run before you send a quote", "", [52, 16, 50]);
  legend(j, 3);
  const jr = [
    ["Quoted price", 350, USD],
    ["On-site hours (you)", 3.5, HRS],
    ["Drive time, round trip (hours)", 0.75, HRS],
    ["Materials / supplies for this job", 25, USD],
    ["Disposal / dump / rental fees", 0, USD],
    ["Round-trip miles", 18, "0"],
    ["Vehicle cost per mile", 0.7, USD],
    ["Card processing %", 0.029, "0.0%"],
    ["Card processing fixed fee", 0.3, USD],
    ["Helper hours", 0, HRS],
    ["Helper loaded cost per hour", 24, USD],
    ["Your target rate per hour", { f: "'Hourly Target'!B29" }, USD],
  ];
  jr.forEach(([n, v, fmt], i) => {
    put(j, `A${5 + i}`, n);
    put(j, `B${5 + i}`, v, { input: true, fmt });
  });
  // rows 5..16
  put(j, "C11", "Use your real cost, or the current IRS standard mileage rate as a proxy.");
  put(j, "A18", "Direct costs (materials + fees + vehicle + card + helper)");
  put(j, "B18", { f: "B8+B9+B10*B11+B5*B12+B13+B14*B15" }, { fmt: USD });
  put(j, "A19", "Gross profit");
  put(j, "B19", { f: "B5-B18" }, { fmt: USD, out: true });
  put(j, "A20", "Gross margin");
  put(j, "B20", { f: "IF(B5>0,B19/B5,0)" }, { fmt: PCT, out: true });
  put(j, "A21", "Profit per hour of YOUR time (incl. drive)");
  put(j, "B21", { f: "IF(B6+B7>0,B19/(B6+B7),0)" }, { fmt: USD, out: true });
  put(j, "A22", "Verdict");
  put(j, "B22", { f: 'IF(B21>=B16,"Take it",IF(B21>=B16*0.85,"Borderline — tighten scope or raise price","Raise the price or pass"))' }, { bold: true });
  put(j, "A23", "Price needed to hit your target");
  put(j, "B23", { f: "CEILING(((B16*(B6+B7))+B8+B9+B10*B11+B13+B14*B15)/(1-B12),5)" }, { fmt: USD, out: true });

  // 3. Drive Time Cost
  const d = sheet(wb, "Drive Time Cost", "3 · Drive Time Cost — what a trip really costs", "Use this to set trip fees and a service radius.", [30, 14, 14, 16, 16, 16]);
  legend(d, 3);
  put(d, "A4", "Your target rate per hour");
  put(d, "B4", { f: "'Hourly Target'!B29" }, { fmt: USD, input: true });
  put(d, "A5", "Vehicle cost per mile");
  put(d, "B5", 0.7, { fmt: USD, input: true });
  put(d, "A6", "Free-travel allowance (round-trip minutes)");
  put(d, "B6", 30, { input: true });
  header(d, 8, ["Zone", "Round-trip miles", "Round-trip min", "Trip cost", "Cost beyond free", "Suggested trip fee"]);
  [["Zone 1 (home base)", 10, 25], ["Zone 2", 20, 40], ["Zone 3", 30, 60], ["Zone 4", 45, 85]].forEach(([z, mi, mn], i) => {
    const r = 9 + i;
    put(d, `A${r}`, z, { input: true });
    put(d, `B${r}`, mi, { input: true });
    put(d, `C${r}`, mn, { input: true });
    put(d, `D${r}`, { f: `B${r}*$B$5+C${r}/60*$B$4` }, { fmt: USD });
    put(d, `E${r}`, { f: `MAX(0,D${r}-$B$6/60*$B$4-$B$6/C${r}*B${r}*$B$5)` }, { fmt: USD });
    put(d, `F${r}`, { f: `CEILING(E${r},5)` }, { fmt: USD, out: true });
  });

  // 4. Break-Even
  const b = sheet(wb, "Break-Even", "4 · Break-Even — jobs needed per month", "", [52, 16]);
  legend(b, 3);
  put(b, "A5", "Monthly business costs");
  put(b, "B5", { f: "'Hourly Target'!B18" }, { fmt: USD0, input: true });
  put(b, "A6", "Monthly pay goal (before tax)");
  put(b, "B6", { f: "'Hourly Target'!B20/(1-'Hourly Target'!B21)/12" }, { fmt: USD0, input: true });
  put(b, "A7", "Average job price");
  put(b, "B7", 225, { fmt: USD0, input: true });
  put(b, "A8", "Variable cost per job (materials, fuel, fees)");
  put(b, "B8", 30, { fmt: USD0, input: true });
  put(b, "A10", "Contribution per job");
  put(b, "B10", { f: "B7-B8" }, { fmt: USD, out: true });
  put(b, "A11", "Jobs per month to cover business costs");
  put(b, "B11", { f: "IF(B10>0,CEILING(B5/B10,1),0)" }, { out: true });
  put(b, "A12", "Jobs per month to cover costs + your pay");
  put(b, "B12", { f: "IF(B10>0,CEILING((B5+B6)/B10,1),0)" }, { out: true });
  put(b, "A13", "…which is this many per week (4.33 wks/mo)");
  put(b, "B13", { f: "B12/4.33" }, { fmt: "0.0", out: true });

  // 5. Price Increase
  const p = sheet(wb, "Price Increase", "5 · Price Increase Planner", "How many clients could you lose and still come out ahead?", [52, 16]);
  legend(p, 3);
  put(p, "A5", "Active recurring clients");
  put(p, "B5", 40, { input: true });
  put(p, "A6", "Average price per visit");
  put(p, "B6", 150, { input: true, fmt: USD });
  put(p, "A7", "Visits per client per year");
  put(p, "B7", 20, { input: true });
  put(p, "A8", "Planned increase (%)");
  put(p, "B8", 0.08, { input: true, fmt: PCT });
  put(p, "A9", "Clients you expect to lose (%)");
  put(p, "B9", 0.05, { input: true, fmt: PCT });
  put(p, "A11", "Current annual revenue from these clients");
  put(p, "B11", { f: "B5*B6*B7" }, { fmt: USD0 });
  put(p, "A12", "New price per visit");
  put(p, "B12", { f: "B6*(1+B8)" }, { fmt: USD, out: true });
  put(p, "A13", "Projected annual revenue after increase + losses");
  put(p, "B13", { f: "B5*(1-B9)*B12*B7" }, { fmt: USD0, out: true });
  put(p, "A14", "Net change per year");
  put(p, "B14", { f: "B13-B11" }, { fmt: USD0, out: true });
  put(p, "A15", "Revenue-neutral client loss (you break even if you lose this %)");
  put(p, "B15", { f: "B8/(1+B8)" }, { fmt: "0.0%", out: true });
  put(p, "A16", "Hours freed per year by clients who leave (at 1 visit ≈ hours below)");
  put(p, "B16", 2.5, { input: true, fmt: HRS });
  put(p, "A17", "Hours freed");
  put(p, "B17", { f: "B5*B9*B7*B16" }, { fmt: "0", out: true });

  await save(wb, out(kit, "01-benchline-pricing-calculators.xlsx"));
}

// =====================================================================
// ADD-ON: FIRST HELPER
// =====================================================================
async function helperPack() {
  const kit = "first-helper-pack";
  const wb = newBook();
  const l = sheet(wb, "Loaded Cost", "Helper Loaded Cost — what an hour of help really costs", "Estimates only. Payroll tax and workers' comp rates vary by state and job class — confirm with your accountant and insurer.", [60, 16, 56]);
  legend(l, 3);
  const rows = [
    ["Hourly wage", 18, USD, "Check local minimum wage and what similar jobs pay"],
    ["Hours per week", 25, "0", ""],
    ["Weeks worked per year", 46, "0", ""],
    ["Employer payroll taxes (% of wages) — FICA 7.65% + unemployment", 0.1, "0.0%", "Estimate; your payroll provider will give exact numbers"],
    ["Workers' comp (% of wages)", 0.06, "0.0%", "Varies a lot by state and trade class — get a quote"],
    ["Payroll service (per month)", 50, USD, ""],
    ["Uniform, PPE, tools per year", 300, USD, ""],
    ["Extra vehicle / fuel cost per week", 25, USD, "If they ride along or drive a second vehicle"],
  ];
  rows.forEach(([n, v, fmt, note], i) => {
    put(l, `A${5 + i}`, n);
    put(l, `B${5 + i}`, v, { input: true, fmt });
    put(l, `C${5 + i}`, note);
  });
  // 5..12
  put(l, "A14", "Annual wages");
  put(l, "B14", { f: "B5*B6*B7" }, { fmt: USD0 });
  put(l, "A15", "Annual payroll taxes + workers' comp");
  put(l, "B15", { f: "B14*(B8+B9)" }, { fmt: USD0 });
  put(l, "A16", "Annual overhead (payroll service, gear, vehicle)");
  put(l, "B16", { f: "B10*12+B11+B12*B7" }, { fmt: USD0 });
  put(l, "A17", "TOTAL annual cost", { bold: true });
  put(l, "B17", { f: "B14+B15+B16" }, { fmt: USD0, out: true });
  put(l, "A18", "Loaded cost per paid hour");
  put(l, "B18", { f: "IF(B6*B7>0,B17/(B6*B7),0)" }, { fmt: USD, out: true });
  put(l, "A19", "Loaded cost per week");
  put(l, "B19", { f: "IF(B7>0,B17/B7,0)" }, { fmt: USD0, out: true });

  const d = sheet(wb, "Does It Pay", "Does a Helper Pay for Themselves?", "", [60, 16, 56]);
  legend(d, 3);
  const dr = [
    ["Revenue you bill per labor hour (your job price ÷ labor hours)", 60, USD],
    ["Helper productivity vs. you (first 3 months)", 0.6, PCT],
    ["Helper productivity vs. you (after 3 months)", 0.8, PCT],
    ["Helper hours per week", { f: "'Loaded Cost'!B6" }, "0"],
    ["Helper loaded cost per hour", { f: "'Loaded Cost'!B18" }, USD],
    ["Can you book enough extra work to fill their hours? (Yes/No)", "Yes", null],
  ];
  dr.forEach(([n, v, fmt], i) => {
    put(d, `A${5 + i}`, n);
    put(d, `B${5 + i}`, v, { input: true, fmt: fmt ?? undefined, list: i === 5 ? '"Yes,No"' : undefined });
  });
  // 5..10
  put(d, "A12", "Added revenue per week — first 3 months");
  put(d, "B12", { f: 'IF(B10="Yes",B8*B6*B5,0)' }, { fmt: USD0 });
  put(d, "A13", "Added revenue per week — after 3 months");
  put(d, "B13", { f: 'IF(B10="Yes",B8*B7*B5,0)' }, { fmt: USD0 });
  put(d, "A14", "Helper cost per week");
  put(d, "B14", { f: "B8*B9" }, { fmt: USD0 });
  put(d, "A15", "Net per week — first 3 months");
  put(d, "B15", { f: "B12-B14" }, { fmt: USD0, out: true });
  put(d, "A16", "Net per week — after 3 months");
  put(d, "B16", { f: "B13-B14" }, { fmt: USD0, out: true });
  put(d, "A17", "Break-even productivity (helper must produce at least this % of you)");
  put(d, "B17", { f: "IF(B5>0,B9/B5,0)" }, { fmt: PCT, out: true });
  put(d, "A18", "Verdict");
  put(d, "B18", { f: 'IF(B10="No","Not yet — fill the calendar first",IF(B16>0,IF(B15>=0,"Pays from month one","Pays after ramp-up"),"Raise prices before hiring"))' }, { bold: true });

  const t = sheet(wb, "Team Job Pricing", "Team Job Pricing — keep the price, shorten the job", "Two people rarely finish in exactly half the time. Price the job, not the head count.", [60, 16]);
  legend(t, 3);
  put(t, "A5", "Job price (same as solo)");
  put(t, "B5", 300, { input: true, fmt: USD });
  put(t, "A6", "Your solo hours for this job");
  put(t, "B6", 4, { input: true, fmt: HRS });
  put(t, "A7", "Team speed-up factor (1.6 = two people finish 1.6× faster)");
  put(t, "B7", 1.6, { input: true, fmt: "0.0" });
  put(t, "A8", "Helper loaded cost per hour");
  put(t, "B8", { f: "'Loaded Cost'!B18" }, { input: true, fmt: USD });
  put(t, "A10", "Team hours on site (each person)");
  put(t, "B10", { f: "B6/B7" }, { fmt: HRS, out: true });
  put(t, "A11", "Helper cost for this job");
  put(t, "B11", { f: "B10*B8" }, { fmt: USD, out: true });
  put(t, "A12", "Your earnings per hour — solo");
  put(t, "B12", { f: "B5/B6" }, { fmt: USD, out: true });
  put(t, "A13", "Your earnings per hour — with helper");
  put(t, "B13", { f: "(B5-B11)/B10" }, { fmt: USD, out: true });
  put(t, "A14", "Hours of your day freed for another job");
  put(t, "B14", { f: "B6-B10" }, { fmt: HRS, out: true });

  await save(wb, out(kit, "08-helper-cost-calculator.xlsx"));
}


// =====================================================================
// CORE KIT: Job Pricing Calculator + Weekly Money Dashboard
// =====================================================================
async function coreKit() {
  const kit = "core-kit";

  // ---- Job Pricing Calculator
  const wb = newBook();
  const RATE = yourNumbersSheet(wb, { goal: 55000, tax: 0.25, costs: 15000, weeks: 47, hours: 28 });
  const j = sheet(wb, "Price a Job", "Price a Job — before you say yes", "Enter your estimate of the job. The sheet tells you the minimum price and whether a quoted price works.", [58, 18, 50]);
  legend(j, 3);
  const rows = [
    ["Your target hourly rate", { f: RATE }, USD],
    ["Estimated on-site hours (you)", 3, HRS],
    ["Round-trip drive time (hours)", 0.5, HRS],
    ["Materials / supplies for this job", 20, USD],
    ["Disposal, dump, rental, or parking fees", 0, USD],
    ["Round-trip miles", 16, "0"],
    ["Vehicle cost per mile", 0.7, USD],
    ["Card processing %", 0.029, "0.0%"],
    ["Your minimum job price", 125, USD0],
    ["Price you're thinking of quoting", 300, USD],
  ];
  rows.forEach(([n, v, fmt], i) => {
    put(j, `A${5 + i}`, n);
    put(j, `B${5 + i}`, v, { input: true, fmt });
  });
  // 5..14
  put(j, "C11", "Your real cost per mile, or the current IRS standard mileage rate as a proxy.");
  put(j, "A16", "Direct costs (materials + fees + mileage)");
  put(j, "B16", { f: "B8+B9+B10*B11" }, { fmt: USD });
  put(j, "A17", "PRICE NEEDED to hit your target", { bold: true });
  put(j, "B17", { f: "CEILING(MAX(B13,((B6+B7)*B5+B16)/(1-B12)),5)" }, { fmt: USD, out: true });
  put(j, "A18", "Profit per hour of your time at the price you're thinking of");
  put(j, "B18", { f: "IF(B6+B7>0,(B14*(1-B12)-B16)/(B6+B7),0)" }, { fmt: USD, out: true });
  put(j, "A19", "Verdict");
  put(j, "B19", { f: 'IF(B14<B13,"Below your minimum job price",IF(B18>=B5,"Good price — send it",IF(B18>=B5*0.85,"Borderline — tighten scope or raise","Too low — raise the price or pass")))' }, { bold: true });
  rateCardSheet(wb, [
    ["cleaning", "Standard home clean (2 bed / 2 bath)", "job", 120, 180, "Add rooms"],
    ["cleaning", "Deep clean", "job", 220, 350, "First visit or move-out"],
    ["handyman", "Service call minimum (first hour)", "job", 95, 150, ""],
    ["handyman", "Hourly labor", "hour", 65, 95, "Materials separate"],
    ["lawn care", "Weekly mow — small lot", "visit", 35, 55, "Under 5k sq ft"],
    ["lawn care", "Seasonal cleanup", "job", 150, 300, ""],
    ["pressure washing", "Driveway (2-car)", "job", 150, 250, "Oil stains extra"],
    ["pressure washing", "House soft wash (1 story)", "job", 250, 450, ""],
    ["detailing", "Interior detail (sedan)", "job", 125, 200, "Pet hair extra"],
    ["detailing", "Full detail (sedan)", "job", 200, 350, ""],
    ["any trade", "Same-day rush", "percent", 20, 35, "Percent on labor"],
    ["any trade", "Late cancellation (under 24h)", "flat", 50, 100, ""],
  ], "Starting Rates (from pricing-sheets.csv)");
  await save(wb, out(kit, "08-job-pricing-calculator.xlsx"));

  // ---- Weekly Money Dashboard
  const mw = newBook();
  const jl = sheet(mw, "Job Log", "Job Log — every job, every week", "One row per job. Profit per hour is what you actually earned for your time on that job.", [12, 22, 22, 12, 12, 12, 10, 10, 14, 14]);
  legend(jl, 3);
  header(jl, 5, ["Date", "Customer", "Service", "Price charged", "Materials $", "Other job costs $", "On-site hrs", "Drive hrs", "Job profit", "Profit / hour"]);
  const ex = [
    ["2026-01-05", "Example — replace", "Standard clean", 180, 8, 0, 3, 0.5],
    ["2026-01-06", "Example — replace", "Deep clean", 340, 15, 0, 5.5, 0.6],
  ];
  for (let i = 0; i < 60; i++) {
    const r = 6 + i;
    const e = ex[i];
    put(jl, `A${r}`, e ? e[0] : null, { input: true });
    put(jl, `B${r}`, e ? e[1] : null, { input: true });
    put(jl, `C${r}`, e ? e[2] : null, { input: true });
    put(jl, `D${r}`, e ? e[3] : null, { input: true, fmt: USD });
    put(jl, `E${r}`, e ? e[4] : null, { input: true, fmt: USD });
    put(jl, `F${r}`, e ? e[5] : null, { input: true, fmt: USD });
    put(jl, `G${r}`, e ? e[6] : null, { input: true, fmt: HRS });
    put(jl, `H${r}`, e ? e[7] : null, { input: true, fmt: HRS });
    put(jl, `I${r}`, { f: `IF(D${r}="","",D${r}-E${r}-F${r})` }, { fmt: USD });
    put(jl, `J${r}`, { f: `IF(OR(D${r}="",G${r}+H${r}=0),"",I${r}/(G${r}+H${r}))` }, { fmt: USD });
  }
  // rows 6..65
  const exs = sheet(mw, "Expenses", "Business Expenses", "Everything the business spent this period that isn't tied to one job.", [12, 30, 22, 14]);
  legend(exs, 3);
  header(exs, 5, ["Date", "What", "Category", "Amount"]);
  const cats = '"Fuel,Vehicle,Insurance,Supplies,Equipment,Software/phone,Marketing,Fees,Helper pay,Other"';
  const exRows = [["2026-01-05", "Fuel — example", "Fuel", 60], ["2026-01-06", "Supplies restock — example", "Supplies", 45]];
  for (let i = 0; i < 60; i++) {
    const r = 6 + i;
    const e = exRows[i];
    put(exs, `A${r}`, e ? e[0] : null, { input: true });
    put(exs, `B${r}`, e ? e[1] : null, { input: true });
    put(exs, `C${r}`, e ? e[2] : null, { input: true, list: cats });
    put(exs, `D${r}`, e ? e[3] : null, { input: true, fmt: USD });
  }
  const d = sheet(mw, "Dashboard", "Weekly Money Dashboard", "Fill in the Job Log and Expenses tabs; this page updates itself. Clear the example rows first.", [52, 18, 44]);
  legend(d, 3);
  put(d, "A5", "Tax set-aside (% of profit) — ask your accountant");
  put(d, "B5", 0.25, { input: true, fmt: PCT });
  put(d, "A6", "Your target profit per hour (from the Job Pricing Calculator)");
  put(d, "B6", 75, { input: true, fmt: USD });
  put(d, "A8", "MONEY IN (jobs)", { bold: true });
  put(d, "B8", { f: "SUM('Job Log'!D6:D65)" }, { fmt: USD, out: true });
  put(d, "A9", "Jobs completed");
  put(d, "B9", { f: "COUNT('Job Log'!D6:D65)" }, { out: true });
  put(d, "A10", "Average job price");
  put(d, "B10", { f: "IF(B9>0,B8/B9,0)" }, { fmt: USD });
  put(d, "A12", "Job costs (materials + other job costs)");
  put(d, "B12", { f: "SUM('Job Log'!E6:F65)" }, { fmt: USD });
  put(d, "A13", "Business expenses");
  put(d, "B13", { f: "SUM(Expenses!D6:D65)" }, { fmt: USD });
  put(d, "A14", "MONEY OUT (total)", { bold: true });
  put(d, "B14", { f: "B12+B13" }, { fmt: USD, out: true });
  put(d, "A16", "Profit before tax");
  put(d, "B16", { f: "B8-B14" }, { fmt: USD, out: true });
  put(d, "A17", "Set aside for taxes");
  put(d, "B17", { f: "MAX(0,B16*B5)" }, { fmt: USD });
  put(d, "A18", "WHAT YOU ACTUALLY KEPT", { bold: true });
  put(d, "B18", { f: "B16-B17" }, { fmt: USD, out: true });
  put(d, "A20", "Hours worked on jobs (on-site + drive)");
  put(d, "B20", { f: "SUM('Job Log'!G6:H65)" }, { fmt: HRS });
  put(d, "A21", "Job profitability: average profit per hour");
  put(d, "B21", { f: "IF(B20>0,SUM('Job Log'!I6:I65)/B20,0)" }, { fmt: USD, out: true });
  put(d, "A22", "Jobs below your target profit per hour");
  put(d, "B22", { f: "COUNTIF('Job Log'!J6:J65,\"<\"&B6)" }, { out: true });
  put(d, "A23", "Best job (highest profit per hour)");
  put(d, "B23", { f: "IF(B9>0,MAX('Job Log'!J6:J65),0)" }, { fmt: USD });
  put(d, "A24", "Worst job (lowest profit per hour)");
  put(d, "B24", { f: "IF(B9>0,MIN('Job Log'!J6:J65),0)" }, { fmt: USD });
  put(d, "C22", "Re-price or re-scope these next time.");
  header(d, 26, ["Expenses by category", "Amount"]);
  ["Fuel", "Vehicle", "Insurance", "Supplies", "Equipment", "Software/phone", "Marketing", "Fees", "Helper pay", "Other"].forEach((c, i) => {
    put(d, `A${27 + i}`, c);
    put(d, `B${27 + i}`, { f: `SUMIF(Expenses!$C$6:$C$65,A${27 + i},Expenses!$D$6:$D$65)` }, { fmt: USD });
  });
  // make Dashboard the first tab
  const want = ["Dashboard", "Job Log", "Expenses"];
  mw.worksheets.forEach((w) => {
    w.orderNo = want.indexOf(w.name);
  });
  await save(mw, out(kit, "10-weekly-money-dashboard.xlsx"));
}

// ---------- Pro Library ----------
async function proLibrary() {
  const kit = "pro-library";
  const wb = newBook();
  const ws = sheet(wb, "Seasonal Planner", "Seasonal Pricing Planner", "Plan your year: when to hold price, when to raise it, and what to do in slow months.", [16, 16, 16, 16, 16, 18, 48]);
  legend(ws, 3);
  put(ws, "A5", "Base price for your typical job");
  put(ws, "D5", 200, { input: true, fmt: USD });
  put(ws, "A6", "Jobs per week when fully booked");
  put(ws, "D6", 15, { input: true, fmt: "0" });
  put(ws, "A7", "Working weeks per month (average)");
  put(ws, "D7", 4.3, { input: true, fmt: "0.0" });
  header(ws, 9, ["Demand level", "Price change", "What to do"]);
  const levels = [
    ["Slow", 0, "Hold price. Run a prepay or rebook offer to existing customers; do maintenance and marketing."],
    ["Normal", 0, "Standard pricing. Ask every happy customer for a review and a rebook."],
    ["Busy", 0.05, "Raise new-customer prices a little. Book further out; stop discounting."],
    ["Peak", 0.1, "Highest prices of the year for new customers. Protect regulars' slots first."],
  ];
  levels.forEach(([lvl, adj, note], i) => {
    const r = 10 + i;
    put(ws, `A${r}`, lvl, { bold: true });
    put(ws, `B${r}`, adj, { input: true, fmt: PCT });
    put(ws, `C${r}`, note);
  });
  // 10..13
  header(ws, 16, ["Month", "Demand level", "% booked", "Jobs / week", "Price per job", "Projected revenue", "Plan"]);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const demand = ["Slow", "Slow", "Normal", "Busy", "Peak", "Peak", "Busy", "Busy", "Normal", "Busy", "Normal", "Slow"];
  const booked = [0.5, 0.5, 0.7, 0.9, 1, 1, 0.9, 0.85, 0.75, 0.85, 0.7, 0.55];
  months.forEach((m, i) => {
    const r = 17 + i;
    put(ws, `A${r}`, m, { bold: true });
    put(ws, `B${r}`, demand[i], { input: true, list: '"Slow,Normal,Busy,Peak"' });
    put(ws, `C${r}`, booked[i], { input: true, fmt: PCT });
    put(ws, `D${r}`, { f: `ROUND($D$6*C${r},1)` }, { fmt: "0.0" });
    put(ws, `E${r}`, { f: `CEILING($D$5*(1+IFERROR(VLOOKUP(B${r},$A$10:$B$13,2,FALSE),0)),5)` }, { fmt: USD });
    put(ws, `F${r}`, { f: `D${r}*E${r}*$D$7` }, { fmt: USD0, out: true });
    put(ws, `G${r}`, { f: `IFERROR(VLOOKUP(B${r},$A$10:$C$13,3,FALSE),"")` });
  });
  // 17..28
  put(ws, "A30", "Projected year", { bold: true });
  put(ws, "F30", { f: "SUM(F17:F28)" }, { fmt: USD0, out: true });
  put(ws, "A31", "Average month");
  put(ws, "F31", { f: "AVERAGE(F17:F28)" }, { fmt: USD0 });
  put(ws, "A32", "Slowest month");
  put(ws, "F32", { f: "INDEX(A17:A28,MATCH(MIN(F17:F28),F17:F28,0))" });
  put(ws, "A33", "Busiest month");
  put(ws, "F33", { f: "INDEX(A17:A28,MATCH(MAX(F17:F28),F17:F28,0))" });
  put(ws, "A34", "Gap between busiest and slowest month");
  put(ws, "F34", { f: "MAX(F17:F28)-MIN(F17:F28)" }, { fmt: USD0 });
  put(ws, "A35", "Save this much each busy month to cover slow months");
  put(ws, "F35", { f: 'SUMPRODUCT((F17:F28<F31)*(F31-F17:F28))/MAX(1,COUNTIF(F17:F28,">="&F31))' }, { fmt: USD0, out: true });
  put(ws, "A37", "Projections are planning estimates from your own inputs, not predictions.");
  ws.getCell("A37").font = { italic: true, color: { argb: "FF666666" } };
  await save(wb, out(kit, "01-seasonal-pricing-planner.xlsx"));
}

for (const kit of ["core-kit", "cleaning-kit", "handyman-kit", "lawn-care-kit", "pressure-washing-kit", "detailing-kit", "pricing-calculator-pack", "first-helper-pack", "pro-library"]) {
  fs.mkdirSync(path.join(root, "content/products", kit), { recursive: true });
}
await coreKit();
await cleaning();
await handyman();
await lawn();
await pressure();
await detailing();
await pricingPack();
await helperPack();
await proLibrary();
