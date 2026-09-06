import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";

const asJson = process.argv.includes("--json");
const dir = "build/assets";
const files = readdirSync(dir)
  .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
  .sort();

if (files.length === 0) {
  throw new Error(`No built assets found in ${dir}. Run npm run build first.`);
}

const report = files.map((file) => {
  const path = `${dir}/${file}`;
  const bytes = readFileSync(path);
  return {
    file,
    bytes: statSync(path).size,
    gzip: gzipSync(bytes).length,
  };
});

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const { file, bytes, gzip } of report) {
    console.log(`${file}\t${bytes} bytes\t${gzip} gzip`);
  }
}
