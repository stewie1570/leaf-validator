import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const esmRoot = resolve("dist/esm");
const specifierPattern = /((?:from|import)\s*\(?\s*)(['"])(\.[^'"]+)\2/g;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function resolveSpecifier(specifier, fromFile) {
  if (!specifier.startsWith(".")) {
    return specifier;
  }
  if (extname(specifier)) {
    return specifier;
  }

  const absolute = resolve(dirname(fromFile), specifier);
  if (existsSync(`${absolute}.js`) || existsSync(`${absolute}.d.ts`)) {
    return `${specifier}.js`;
  }
  if (existsSync(join(absolute, "index.js")) || existsSync(join(absolute, "index.d.ts"))) {
    return `${specifier}/index.js`;
  }

  throw new Error(`Cannot add an ESM extension for "${specifier}" from ${fromFile}`);
}

const files = walk(esmRoot).filter((file) => file.endsWith(".js") || file.endsWith(".d.ts"));

for (const file of files) {
  const original = readFileSync(file, "utf8");
  const updated = original.replace(specifierPattern, (match, prefix, quote, specifier) => {
    return `${prefix}${quote}${resolveSpecifier(specifier, file)}${quote}`;
  });

  if (updated !== original) {
    writeFileSync(file, updated);
  }
}
