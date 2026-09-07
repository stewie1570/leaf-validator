const packageRoot = new URL("../", import.meta.url);

async function assertNodeCanImportPackage() {
  const { get, Leaf, createManagedContext } = await import(
    new URL("../dist/esm/index.js", import.meta.url).href
  );

  if (typeof get !== "function" || typeof Leaf !== "function" || typeof createManagedContext !== "function") {
    throw new Error("ESM entry did not export the expected members");
  }

  if (get("person.name").from({ person: { name: "Stewart" } }) !== "Stewart") {
    throw new Error("ESM get() did not resolve a nested value");
  }
}

async function assertExtensionlessImportsAreGone() {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const esmRoot = fileURLToPath(new URL("../dist/esm", import.meta.url));
  const specifierPattern = /(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g;

  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

  const offenders = [];
  for (const file of walk(esmRoot).filter((path) => path.endsWith(".js") || path.endsWith(".d.ts"))) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(specifierPattern)) {
      const specifier = match[1];
      if (specifier.startsWith(".") && !specifier.endsWith(".js")) {
        offenders.push(`${file}: ${specifier}`);
      }
    }
  }

  if (offenders.length) {
    throw new Error(`Extensionless ESM specifiers remain:\n${offenders.join("\n")}`);
  }
}

await assertExtensionlessImportsAreGone();
await assertNodeCanImportPackage();
console.log(`Verified ESM package for ${packageRoot.pathname}`);
