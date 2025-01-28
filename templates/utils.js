import { inspect } from "util";
import createDeepMerge from "@fastify/deepmerge";

export const deepMerge = createDeepMerge();

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
    .replace(/"\$\$\$([^"]+)"/g, '$1')
    .replace(/'\$\$\$([^']+)'/g, '$1')
    .replace(/(['"])(.*?\$\{.*?\}.*?)\1/g, '`$2`');
};
