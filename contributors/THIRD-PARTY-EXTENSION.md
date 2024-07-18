## Introduction

Welcome to the guide for developing external extensions in the `create-eth` repository. This document outlines the workflow for creating and testing your extensions.

## Workflow Overview

### Phase 1: Initial Setup and Development

1. **Clone the `create-eth` Repository:**

   ```bash
   git clone https://github.com/scaffold-eth/create-eth.git
   cd create-eth
   ```

2. **Run the Build Script:**

   ```bash
   yarn build:dev
   ```

3. **Run the CLI to Create a New Instance:**

   ```bash
   yarn cli
   ```

   This command will create a **new instance** with similar to running `npx create-eth@latest`

   The name mentioned for "Your project name" question will be used as the **extension name**. For example, if you provide `eip`, the final extension name will be `eip`.

4. **Develop the Extension:**
   Add new files within the instance directory. For example:

   ```bash
   # In new terminal window
   cd eip
   mkdir -p packages/nextjs/app/my-eip
   touch packages/nextjs/app/my-eip/page.tsx
   # add content to my-eip/page.tsx
   ```

   > **NOTE**: Only adding of new files / directories is allowed while creating extension. If you try to overwrite existing files\*, it wont be reflected. The `yarn create-extension {projectName}` should guide you with info for the respective file. Checkout **Special Files** point for more info.

5. **Commit Changes to the Instance Repository:**

   ```bash
   git add .
   git commit -m "Add my-page extension"
   ```

6. **Create the Extension:**

   ```bash
   yarn create-extension {projectName}
   ```

   Example: `yarn create-extension eip`

   This command gathers all changes and creates an extension in the `create-eth/externalExtensions/${extensionName}` directory. This directory is the actual extension directory, which can be published to github and used by others.

7. **Special Files**

   - Changes to `package.json` won't be copied directly, instead you should manually create/update package.json with only things necessary for the extension inside `create-eth/externalExtensions/${extensionName}` directory (the full path hint can be seen while running `yarn create-extension`)
   - You might want to add content to certain files based on your extension. For example adding new page link in Header. `create-eth` allows injecting content to **certain files** with [`*.args.mjs`](TEMPLATING.md#args-files) files, again `create-extension` cli should log an info/warning with path.(TODO: Maybe link to list of args files)

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
   Since the instance is symlinked with extension, Make necessary changes directly in the symlinked files within `my-dev-instance` and changes should be automatically reflected in `create-eth/extensions/${extensionName}` directory.

3. **Prepare the Extension for publishing:**

   - Go inside the extension directory.
   - Push the extension to GitHub.

   ```bash
   cd create-eth/externalExtensions/${extensionName}
   git init
   git add .
   git commit -m "Initial commit of my extension"
   git remote add origin <remote-repo-url>
   git push -u origin master
   ```

   Now other developer can use your published extension by using:

   ```bash
   npx create eth -e {your-github-userName}/{extension-repo-name}
   ```
