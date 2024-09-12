// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-1006086291
(BigInt.prototype.toJSON = function () {
  return this.toString();
});


export const withDefaults =
  (template, expectedArgsDefaults, debug = false) =>
  (receivedArgs) => {
    const argsWithDefault = Object.fromEntries(
      Object.entries(expectedArgsDefaults)
        .map(([argName, argDefault]) => [
          argName,
          (receivedArgs[argName] ?? [argDefault])
            .map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg))
        ]
    ));

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
