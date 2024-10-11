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

export const getStringifiedObjectContent = (obj) =>
  Object.entries(obj)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)},`)
    .join("\n");
  
export const getStringifiedArrayContent = (arr) => arr.map(item => `${JSON.stringify(item)},`).join("\n");
