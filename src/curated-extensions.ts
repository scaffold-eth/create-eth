import { ExternalExtension } from "./types";
import extensions from "./extensions.json";

interface ExternalExtensionWithName extends ExternalExtension {
  name: string;
}

const CURATED_EXTENSIONS: { [key: string]: ExternalExtension } = extensions
  .map((extension: ExternalExtensionWithName) => {
    return {
      [extension.name]: {
        repository: extension.repository,
        branch: extension.branch,
      },
    };
  })
  .reduce((acc, extension) => {
    return { ...acc, ...extension };
  });

export { CURATED_EXTENSIONS };
