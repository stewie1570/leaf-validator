import { createRequire } from "node:module";
import { appendFileSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import * as esbuild from "esbuild";

const require = createRequire(import.meta.url);

function namedExports(moduleNamespace) {
  return Object.keys(moduleNamespace)
    .filter((name) => name !== "default" && name !== "__esModule")
    .sort();
}

const esm = await import("leaf-validator");
const cjs = require("leaf-validator");
const pkg = JSON.parse(
  readFileSync(new URL("./node_modules/leaf-validator/package.json", import.meta.url), "utf8")
);
const requested = process.env.PACKAGE_VERSION;
const versionLine = requested
  ? `Downloaded leaf-validator@${pkg.version} (requested ${requested})`
  : `Downloaded leaf-validator@${pkg.version}`;
console.log(versionLine);

const esmExports = namedExports(esm);
const cjsExports = namedExports(cjs);
if (esmExports.length === 0) {
  throw new Error("leaf-validator ESM entry has no named exports");
}

const missingFromCjs = esmExports.filter((name) => !Object.hasOwn(cjs, name));
const missingFromEsm = cjsExports.filter((name) => !Object.hasOwn(esm, name));
if (missingFromCjs.length || missingFromEsm.length) {
  const problems = [
    ...missingFromCjs.map((name) => `${name} is exported by ESM but not CJS`),
    ...missingFromEsm.map((name) => `${name} is exported by CJS but not ESM`),
  ];
  throw new Error(`ESM and CJS exports differ:\n${problems.join("\n")}`);
}

console.log(
  `leaf-validator@${pkg.version}: imported ${esmExports.length} exports via ESM and CJS`
);

const sizes = [];
for (const name of esmExports) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
    throw new Error(`Cannot measure export ${name}: name is not an identifier`);
  }
  const result = await esbuild.build({
    stdin: {
      contents: `export { ${name} } from "leaf-validator";\n`,
      resolveDir: process.cwd(),
      sourcefile: `${name}.js`,
    },
    bundle: true,
    format: "esm",
    minify: true,
    write: false,
    legalComments: "none",
    logLevel: "silent",
    external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  });
  sizes.push({ name, bytes: gzipSync(result.outputFiles[0].contents).length });
}

sizes.sort((left, right) => left.name.localeCompare(right.name, "en"));

const maxBytes = Math.max(...sizes.map((row) => row.bytes), 1);
const nameWidth = Math.max(...sizes.map((row) => row.name.length));
const sizeWidth = Math.max(...sizes.map((row) => String(row.bytes).length));
const barWidth = 24;
const bars = sizes.map((row) => {
  const filled = Math.round((row.bytes / maxBytes) * barWidth);
  return "█".repeat(filled) + "░".repeat(barWidth - filled);
});
const chart = sizes
  .map((row, index) => `${row.name.padEnd(nameWidth)}  ${String(row.bytes).padStart(sizeWidth)} B  ${bars[index]}`)
  .join("\n");
const markdownTable = [
  "| Export | Gzip | Bar |",
  "| --- | ---: | --- |",
  ...sizes.map((row, index) => `| \`${row.name}\` | ${row.bytes} B | \`${bars[index]}\` |`),
].join("\n");

const title = `leaf-validator@${pkg.version} exports (minified gzip bytes)`;
console.log(`${title}\n${chart}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### ${versionLine}\n\n### ${title}\n\n${markdownTable}\n`
  );
}
