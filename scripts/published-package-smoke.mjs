import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

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
