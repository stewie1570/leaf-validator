import { createRequire } from "node:module";
import { appendFileSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import * as esbuild from "esbuild";

const require = createRequire(import.meta.url);

const functionExports = [
  "Leaf",
  "formWithVirtualNestability",
  "inputWithFormSelectionOnFocus",
  "submitButtonWithFormSelectionOnClick",
  "useValidationModel",
  "useLoadingState",
  "useDeferredEffect",
  "useMountedOnlyState",
  "useErrorHandler",
  "useLocalStorageState",
  "get",
  "set",
  "createManagedContext",
];

const diffExports = ["diff", "leafDiff", "normalizedLeafDiff", "normalizedDiff"];

function assertExports(label, moduleNamespace) {
  const problems = [
    ...functionExports.flatMap((name) => {
      if (!(name in moduleNamespace)) return [`${name} is missing`];
      if (typeof moduleNamespace[name] !== "function") {
        return [`${name} is ${typeof moduleNamespace[name]}, expected function`];
      }
      return [];
    }),
    ...diffExports.flatMap((name) => {
      const value = moduleNamespace[name];
      if (typeof value?.from !== "function") {
        return [`${name}.from is ${typeof value?.from}, expected function`];
      }
      return [];
    }),
  ];

  if (problems.length) {
    throw new Error(`${label} export check failed:\n${problems.join("\n")}`);
  }
}

function assertGet(label, get) {
  const value = get("person.name").from({ person: { name: "Stewart" } });
  if (value !== "Stewart") {
    throw new Error(`${label} get() returned ${JSON.stringify(value)}`);
  }
}

function assertSet(label, set) {
  const updated = set("person.name").to("Ada").in({ person: { name: "Stewart" } });
  if (updated?.person?.name !== "Ada") {
    throw new Error(`${label} set() returned ${JSON.stringify(updated)}`);
  }
}

function assertDiff(label, diff) {
  const changes = diff.from(1).to(2);
  const expected = JSON.stringify([{ location: "", updatedValue: 2 }]);
  if (JSON.stringify(changes) !== expected) {
    throw new Error(`${label} diff() returned ${JSON.stringify(changes)}`);
  }
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

for (const [label, api] of [
  ["ESM", esm],
  ["CJS", cjs],
]) {
  assertExports(label, api);
  assertGet(label, api.get);
  assertSet(label, api.set);
  assertDiff(label, api.diff);
}

console.log(
  `leaf-validator@${pkg.version}: imported ${functionExports.length + diffExports.length} exports via ESM and CJS`
);

const exportNames = Object.keys(esm)
  .filter((name) => name !== "default" && name !== "__esModule")
  .sort();

const sizes = [];
for (const name of exportNames) {
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

sizes.sort((left, right) => right.bytes - left.bytes || left.name.localeCompare(right.name));

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
