---
"create-eth": major
---

This update replaces most of the built-in UI components from Scaffold-ETH 2 codebase with the new [Scaffold-UI](https://github.com/scaffold-eth/scaffold-ui) library.

[Scaffold-UI](https://github.com/scaffold-eth/scaffold-ui) provides a clean set of reusable components + hooks that expose everything you need to build ethereum components.

### For Extension Developers

If your extension previously imported components directly from Scaffold-ETH 2, you'll need to update those import paths.

To help with the migration, we've released a **codemod**:

```
cd your-extension-directory
npx create-eth-codemod migrate-scaffold-ui-imports .
```

This should automatically refactor your imports to use scaffold-ui where appropriate.
