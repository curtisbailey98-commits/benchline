/**
 * Zips every kit in content/products/<key>/ into private/downloads/benchline-<key>.zip.
 *
 * private/ is outside public/, so the ZIPs are never statically served — only the
 * auth + entitlement gated route /api/downloads/[key] can stream them.
 *
 * Usage: node scripts/pack-kits.mjs [key ...]   (no args = all kits)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const contentRoot = path.join(root, "content/products");
const outDir = path.join(root, "private/downloads");
// Fixed entry timestamp so rebuilding unchanged content produces identical ZIPs.
const ENTRY_DATE = new Date("2026-01-01T00:00:00Z");

const requested = process.argv.slice(2);
const keys = fs
  .readdirSync(contentRoot)
  .filter((name) => fs.statSync(path.join(contentRoot, name)).isDirectory())
  .filter((name) => requested.length === 0 || requested.includes(name))
  .sort();

if (keys.length === 0) {
  console.error("No kits found to pack.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const key of keys) {
  const src = path.join(contentRoot, key);
  const outPath = path.join(outDir, `benchline-${key}.zip`);
  const output = fs.createWriteStream(outPath);
  const archive = new ZipArchive();

  await new Promise((resolve, reject) => {
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    for (const name of fs.readdirSync(src).sort()) {
      const full = path.join(src, name);
      if (fs.statSync(full).isFile()) {
        archive.file(full, { name: `benchline-${key}/${name}`, date: ENTRY_DATE });
      }
    }
    archive.finalize();
  });

  console.log(`Wrote ${path.relative(root, outPath)} (${fs.statSync(outPath).size} bytes)`);
}
