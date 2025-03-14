import { inspect } from "util";
import createDeepMerge from "@fastify/deepmerge";

// https://github.com/fastify/deepmerge?tab=readme-ov-file#mergearray Example 1
const replaceByClonedSource = (options) => {
  const clone = options.clone
  return  (_target, source) => {
    return clone(source)
  }
}

const deepMergeWithoutKeysOrder = createDeepMerge({ mergeArray: replaceByClonedSource });

export const deepMerge = (...args) => {
  const mergedConfig = deepMergeWithoutKeysOrder(...args);
  const finalConfig = {};
  for (const key of Object.keys(args[0])) {
    finalConfig[key] = mergedConfig[key];
  }
  for (const key of Object.keys(mergedConfig)) {
    if (!(key in finalConfig)) {
      finalConfig[key] = mergedConfig[key];
    }
  }
  return finalConfig;
}

export const withDefaults =
  (template, expectedArgsDefaults, debug = false) =>
  (receivedArgs) => {
    const argsWithDefault = Object.fromEntries(
      Object.entries(expectedArgsDefaults)
      .map(([argName, argDefault]) => [argName, receivedArgs[argName] ?? [argDefault]])
    );

    if (debug) {
      console.log(argsWithDefault, expectedArgsDefaults, receivedArgs);
    }

    const expectedArgsNames = Object.keys(expectedArgsDefaults)
    Object.keys(receivedArgs).forEach((receivedArgName) => {
      if (!expectedArgsNames.includes(receivedArgName)) {
        throw new Error(
          `Templated received unexpected argument \`${receivedArgName}\`. Expecting only ${
            expectedArgsNames.map(name => `\`${name}\``).join(", ")
          }`
        );
      }
    });

    return template(argsWithDefault);
  };

export const stringify = val => {
  const str = inspect(val, { depth: null, compact: true, maxArrayLength: null, maxStringLength: null });
  return str
    .replace(/"\$\$([^"]+)\$\$"/g, '$1')
    .replace(/'\$\$([^']+)\$\$'/g, '$1')
    .replace(/(['"])(.*?\$\{.*?\}.*?)\1/g, '`$2`');
};
