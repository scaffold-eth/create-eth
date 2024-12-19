import { inspect } from "util";

export function stringify(val, runtimeVariables = undefined, options = {}) {
  const { handleRuntimeVars = true } = options;
  
  if (!handleRuntimeVars) {
    return inspect(val, { 
      depth: null, 
      compact: true,
      maxArrayLength: null, 
      maxStringLength: null 
    });
  }
  // First convert to string with normal inspect
  let str = inspect(val, { 
    depth: null, 
    compact: true,
    maxArrayLength: null, 
    maxStringLength: null 
  });
  // Then replace runtime variables with template literals
  runtimeVariables?.forEach(varName => {
    const regex = new RegExp(`(['"])\\$\\{"${varName}"\\}\\1`, 'g');
    str = str.replace(regex, '`${' + varName + '}`');

    // Also replace any remaining occurrences of the variable name
    const remainingRegex = new RegExp(`(['"])${varName}\\1`, 'g');
    str = str.replace(remainingRegex, '`${' + varName + '}`');
  });
  return str;
}

export const withDefaults = (template, expectedArgsDefaults, debug = false) => {
  return (receivedArgs = {}) => {
    // Handle args with defaults
    const argsWithDefault = Object.fromEntries(
      Object.entries(expectedArgsDefaults)
        .map(([argName, argDefault]) => [
          argName, 
          receivedArgs[argName] ?? [argDefault]
        ])
    );

    const expectedArgsNames = Object.keys(expectedArgsDefaults);
    Object.keys(receivedArgs).forEach((receivedArgName) => {
      if (!expectedArgsNames.includes(receivedArgName)) {
        throw new Error(
          `Template received unexpected argument \`${receivedArgName}\`. Expecting only ${
            expectedArgsNames.map(name => `\`${name}\``).join(", ")
          }`
        );
      }
    });

    if (debug) {
      console.log('Template debug:');
      console.log('- Default args:', expectedArgsDefaults);
      console.log('- Received args:', receivedArgs);
      console.log('- Processed args:', argsWithDefault);
    }

    return template(argsWithDefault);
  };
};
