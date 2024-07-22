## Introduction

Welcome to the guide for developing third party extensions in the `create-eth` repository.

Third party extension allows developers to **extend** base instance created by `npx create-eth@latest` and publish the extension to github that can be used by other developers via:

```bash
npx create-eth@latest -e {your-github-userName}/{extension-repo-name}:{extension-branch-name} # extension-branch-name is optional
```

It is important to understand distinction between instance and extension.

- Instance is created by `npx create-eth@latest` and contains full project files.
- Extension does not contain full project files, instead it only contains extra files, extra directories and [`*.args.mjs`](TEMPLATING.md#args-files) files that will added to the base instance created via `npx create-eth@latest` with `-e` flag.

> TIP: Checkout directory structure of `eip-712` extension maintained Scaffold-ETH team at https://github.com/scaffold-eth/create-eth-extensions/tree/eip-712

This document outlines the workflow for creating and testing your extensions.

## Workflow Overview

An developer goes through 2 phases while developing extension:

- **Phase 1**: Initial Setup and Development
  - This phase helps you create your own extension based on the changes you make to instance created by `npx create-eth@latest`
- **Phase 2**: Local Testing and Publishing
  - This phase helps you to try out your extension locally and see how it works when used by other developers before publishing to github

### Phase 1: Initial Setup and Development

1. **Clone the `create-eth` Repository:**

   ```bash
   git clone https://github.com/scaffold-eth/create-eth.git
   cd create-eth
   yarn install
   ```

2. **Run the Build Script:**

   ```bash
   yarn build:dev
   ```

   This creates `cli.js` and `create-extension.js` in the `dist` directory.

3. **Run the CLI to Create a New Instance:**

   ```bash
   yarn cli
   ```

   This command will create a **new base instance** which is similar to running `npx create-eth@latest`

   The name mentioned for "Your project name" question will be used as the **extension name**. For example, if you provide `eip` as value to the question then the final extension name will be `eip`.

4. **Develop the Extension:**

   - CD into the instance directory.
   - Make necessary changes to the instance project.
   - Commit the changes in the instance repository.

   **Some Caveats:**

   - Only adding of new files and new directories is allowed while creating extension. If you try to overwrite existing files, it wont be reflected.
   - `*.args.mjs` files: You might want to add content to existing base instance files. For example, adding a new page link in the Header component. `create-eth` allows injecting additional content into **certain files** with [`*.args.mjs`](TEMPLATING.md#args-files) files.
   - Changes to `package.json` won't be copied directly, instead you should manually create/update `package.json` with only things necessary for the extension inside `create-eth/externalExtensions/${extensionName}` directory. Example checkout this [`package.json`](https://github.com/scaffold-eth/create-eth-extensions/blob/subgraph/extension/packages/nextjs/package.json) from `subgraph` extension which adds extra dependencies to frontend.

> TIP: Next section command should guide you with info when changes to unsupported files are detected or you could inject some content using `*.args.mjs` for the respective file.

5. **Create the Extension:**

   Return to `create-eth` folder.

   ```bash
   yarn create-extension {projectName}
   ```

   Example: `yarn create-extension eip`

   This command gathers all changes from instance and creates an extension in the `create-eth/externalExtensions/${extensionName}` directory. This directory is the actual extension directory (notice it contains only extra files related to your extension changes), which can be published to github and used by others.

### Phase 2: Local Testing and Publishing:

In the previous phase we generated the extension from the base project instance created. In this phase we will actually be invoking/using the extension to see how it works and looks when used by other developers.

1. **Run the CLI in dev mode:**

   ```bash
   yarn cli -e {extensionName} --dev
   ```

   Example: `yarn cli -e eip --dev`

   The `extensionName` should be present in `create-eth/externalExtensions/${extensionName}`

   Lets suppose you named you project as "my-dev-instance". Then this `my-dev-instance` should contain all your extension changes. `--dev` will symlink the extension to the instance project.

2. **Test and Tweak the Extension:**
   Since the instance is symlinked with extension, make necessary changes directly in the symlinked files within `my-dev-instance` and changes should be automatically reflected in `create-eth/externalExtensions/${extensionName}` directory.

3. **Prepare the Extension for publishing:**

   - Go inside the extension directory.
   - Push the extension to GitHub.

   ```bash
   cd create-eth/externalExtensions/${extensionName}
   git init
   git add .
   git commit -m "Initial commit of my extension"
   git remote add origin <remote-repo-url>
   git push -u origin main
   ```

   Now other developer can use your published extension by using:

   ```bash
   npx create-eth@latest -e {your-github-userName}/{extension-repo-name}:{extension-branch-name} # extension-branch-name is optional
   ```
