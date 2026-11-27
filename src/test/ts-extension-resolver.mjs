// Resolve hook used only by `yarn test`.
// The CLI source is bundled by rollup, so it uses extensionless relative
// imports (e.g. `./consts`, `../extensions`). Node's ESM resolver needs an
// explicit extension, so we map extensionless relative specifiers to their
// `.ts` (or directory `index.ts`) counterpart. No runtime dependency.
export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith(".");
  const hasKnownExtension = /\.([mc]?[jt]sx?|json)$/.test(specifier);

  if (isRelative && !hasKnownExtension) {
    for (const candidate of [`${specifier}.ts`, `${specifier}/index.ts`]) {
      try {
        return await nextResolve(candidate, context);
      } catch {
        // try the next candidate
      }
    }
  }

  return nextResolve(specifier, context);
}
