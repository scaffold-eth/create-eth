# Extension Migration Guide

This guide helps you migrate your existing create-eth extensions from the current format to the new beta format.

## Migration Script

We've created a migration script that automatically detects differences between your current extension and the beta format. The script can:

- **Detect renamed arguments** (e.g., `menuIconImports` → `preContent`)
- **Find new beta arguments** that need to be added
- **Identify removed arguments** that are no longer used
- **Detect missing files** that exist in beta but not in your extension
- **Find extra files** that exist in your extension but not in beta
- **Automatically fix simple issues** like argument renames

## Usage

### Basic Analysis

To analyze your extension and see what needs to be migrated:

```bash
yarn migrate-to-beta path/to/your/extension
```

### Dry Run

To see what changes would be made without actually modifying files:

```bash
yarn migrate-to-beta path/to/your/extension --dry-run
```

### Auto-fix

To automatically fix simple issues (like argument renames):

```bash
yarn migrate-to-beta path/to/your/extension --fix
```

### Auto-fix with Dry Run

To see what would be fixed without making changes:

```bash
yarn migrate-to-beta path/to/your/extension --fix --dry-run
```

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

After running the migration script, you may need to manually:

1. **Review removed arguments**: The script will tell you which arguments were removed. You'll need to migrate their functionality to the new argument structure.

2. **Update custom logic**: If your args files contain complex logic, you may need to adapt it to the new structure.

3. **Test your extension**: Always test your extension after migration to ensure everything works correctly.

4. **Create missing files**: For files that exist in beta but not in your extension, create them using the beta examples as templates.

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

- [ ] Run `yarn migrate-to-beta your-extension-path` to analyze differences
- [ ] Review all reported issues and understand the changes needed
- [ ] Run `yarn migrate-to-beta your-extension-path --fix` to auto-fix simple issues
- [ ] Manually migrate complex argument logic to new structure
- [ ] Create any missing files using beta examples as templates
- [ ] Remove any files that are no longer needed in beta
- [ ] Test your extension thoroughly
- [ ] Update your extension's documentation if needed
