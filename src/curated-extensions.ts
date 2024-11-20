import { ExternalExtension } from "./types";
import extensions from "./extensions.json";

interface ExternalExtensionWithName extends ExternalExtension {
  name: string;
}

const CURATED_EXTENSIONS: { [key: string]: ExternalExtension } = extensions.map((extension: ExternalExtensionWithName) => {
  return {
    [extension.name]: {
      repository: extension.repository,
      branch: extension.branch,
      description: extension.description,
      installCommand: extension.installCommand,
      builder: extension.builder,
      coBuilders: extension.coBuilders,
    },
  };
}).reduce((acc, extension) => {
  return { ...acc, ...extension };
});

export { CURATED_EXTENSIONS };
