import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ZipArchive } from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "content/products/core-kit");
// Kept outside public/ so the paid ZIP is only served via the auth-gated API route.
const outPath = path.join(root, "private/downloads/benchline-core-kit.zip");

fs.mkdirSync(path.dirname(outPath), { recursive: true });

const output = fs.createWriteStream(outPath);
const archive = new ZipArchive();

await new Promise((resolve, reject) => {
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);
  for (const name of fs.readdirSync(src)) {
    const full = path.join(src, name);
    if (fs.statSync(full).isFile()) {
      archive.file(full, { name: `benchline-core-kit/${name}` });
    }
  }
  archive.finalize();
});

console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
