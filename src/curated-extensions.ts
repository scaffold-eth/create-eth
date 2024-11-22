import { ExternalExtension } from "./types";
import extensions from "./extensions.json";

interface ExternalExtensionWithName extends ExternalExtension {
  name?: string;
}

const CURATED_EXTENSIONS: { [key: string]: ExternalExtension } = extensions
  .map((extension: ExternalExtensionWithName) => {
    let name = extension.name;
    if (!name && extension.branch) {
      name = extension.branch;
    }
    if (!name) {
      throw new Error("Extension must have a name or branch");
    }
    return {
      [name]: {
        repository: extension.repository,
        branch: extension.branch,
      },
    };
  })
  .reduce((acc, extension) => {
    return { ...acc, ...extension };
  });

export { CURATED_EXTENSIONS };
