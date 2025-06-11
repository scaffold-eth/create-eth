# Extension Migration Guide

This guide helps you migrate your existing create-eth extensions from the current format to the new beta format.

## Migration Script

We've created a migration script that automatically detects differences between your current extension and the beta format. The script can:

- **Detect renamed arguments** (e.g., `menuIconImports` → `preContent`)
- **Find new beta arguments** that need to be added
- **Identify removed arguments** that are no longer used
- **Find extra files** that exist in your extension but not in beta

## Usage

To analyze your extension and see what needs to be migrated:

```bash
yarn migrate-to-beta path/to/your/extension
```

**Note**: You only need to provide the base path to your extension directory. The script will automatically look for the `/extension` subdirectory.

For example:

- `yarn migrate-to-beta externalExtensions/my-extension` (script looks for `externalExtensions/my-extension/extension`)
- `yarn migrate-to-beta externalExtensions/se-2-challenges` (script looks for `externalExtensions/se-2-challenges/extension`)

The script will analyze all `.args.mjs` files in your extension and compare them with the beta format, showing you exactly what needs to be changed.

## Major Changes in Beta

### Template Argument Changes

The beta version introduces significant changes to how template arguments work:

#### 1. Renamed Arguments

- `preConfigContent` → `preContent`
- `extraContent` → `extraContents`
- `menuIconImports` → `preContent` (Header.tsx specific)
- `menuObjects` → `extraMenuLinksObjects` (Header.tsx specific)

#### 2. New Unified Structure

Many template files now use a more consistent argument structure:

- **`preContent`**: Content to inject before the main template content
- **`postContent`**: Content to inject after the main template content
- **`configOverrides`**: Object to override configuration values
- **`fullContentOverride`**: Complete replacement of template content

#### 3. Enhanced Customization

- **`metadataOverrides`**: Override specific metadata fields
- **`extraProviders`**: Add custom providers to React component trees
- **`htmlClassNames`**: Add custom CSS classes to HTML elements

### File Changes

#### New Files in Beta

- `packages/hardhat/tsconfig.json.args.mjs`
- `packages/nextjs/next.config.ts.args.mjs` (replaces `.js` version)
- `packages/nextjs/services/web3/wagmiConfig.tsx.args.mjs`
- `packages/nextjs/tailwind.config.js.args.mjs`

#### Updated Files

All `.args.mjs` files have been updated with new argument structures. Check the beta examples:

- [scaffold.config.ts.args.mjs](https://github.com/scaffold-eth/create-eth-extensions/blob/example-beta/extension/packages/nextjs/scaffold.config.ts.args.mjs)
- [hardhat.config.ts.args.mjs](https://github.com/scaffold-eth/create-eth-extensions/blob/example-beta/extension/packages/hardhat/hardhat.config.ts.args.mjs)
- [page.tsx.args.mjs](https://github.com/scaffold-eth/create-eth-extensions/blob/example-beta/extension/packages/nextjs/app/page.tsx.args.mjs)
- And many more...

## Manual Migration Steps

After running the migration script, you'll need to manually:

1. **Review removed arguments**: The script will tell you which arguments were removed. You'll need to migrate their functionality to the new argument structure.

2. **Add new arguments**: For new arguments shown by the script, refer to the beta examples to understand their usage and add them to your files.

3. **Update custom logic**: If your args files contain complex logic, you may need to adapt it to the new structure.

4. **Test your extension**: Always test your extension after migration to ensure everything works correctly.

## Example Migration

Here's an example of how a `Header.tsx.args.mjs` file changes:

### Before (Current)

```javascript
export const menuIconImports = `import { BanknotesIcon } from "@heroicons/react/24/outline";`;
export const menuObjects = `{
  label: "Example (ERC-20)",
  href: "/example",
  icon: <BanknotesIcon className="h-4 w-4" />,
}`;

export const logoTitle = "Create-eth";
export const logoSubtitle = "Extension example (ERC-20)";
```

### After (Beta)

```javascript
export const preContent = `import { BanknotesIcon } from "@heroicons/react/24/outline";`;

export const extraMenuLinksObjects = [
  {
    label: "Example (ERC-20)",
    href: "/example",
    icon: '$$<BanknotesIcon className="h-4 w-4" />$$',
  },
];

export const logoTitle = "Create-eth";
export const logoSubtitle = "Extension example (ERC-20)";
```

## Getting Help

If you encounter issues during migration:

1. Check the [beta examples](https://github.com/scaffold-eth/create-eth-extensions/tree/example-beta/extension) for reference
2. Review the [templating documentation](../contributors/TEMPLATING.md)
3. Use the migration script's detailed output to understand what needs to be changed
4. Open an issue if you need assistance

## Migration Checklist

- [ ] Run `yarn migrate-to-beta your-extension-base-path` to analyze differences
- [ ] Review all reported issues and understand the changes needed
- [ ] Add new arguments shown by the script to your `.args.mjs` files
- [ ] Remove or update arguments that were removed in beta
- [ ] Manually migrate complex argument logic to new structure
- [ ] Remove any files that are no longer needed in beta
- [ ] Test your extension thoroughly
- [ ] Update your extension's documentation if needed
