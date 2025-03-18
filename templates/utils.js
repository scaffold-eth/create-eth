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


const addComments = (val, comments = {}) => {
  let str = inspect(val, { 
    depth: null, 
    compact: false,
    maxArrayLength: null, 
    maxStringLength: null
  });
  
  // Add comments above their respective properties
  if (Object.keys(comments).length > 0) {
    // Create a map of all property paths in the object
    const pathMap = new Map();
    
    // Process flat properties first
    Object.keys(comments).filter(key => !key.includes('.')).forEach(prop => {
      const regex = new RegExp(`(^|\\n)(\\s*)(${prop}):\\s`, 'g');
      let match;
      
      while ((match = regex.exec(str)) !== null) {
        // Verify this is a top-level property (indentation level check)
        if (match[2].length === 2) {
          const position = match.index + (match[1] ? match[1].length : 0);
          pathMap.set(prop, {
            position,
            indent: match[2],
            comment: comments[prop]
          });
        }
      }
    });
    
    // Process nested properties
    Object.keys(comments).filter(key => key.includes('.')).forEach(path => {
      const parts = path.split('.');
      
      // Start by finding the top-level object
      let currentPath = parts[0];
      let regex = new RegExp(`(^|\\n)(\\s*)(${currentPath}):\\s*\\{`, 'g');
      let match = regex.exec(str);
      
      if (!match) return; // Top object not found
      
      let position = match.index + match[0].length;
      let baseIndent = match[2];
      
      // Navigate through each nested level
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const expectedIndent = baseIndent + '  '.repeat(i);
        
        // Look for this property at the correct indentation level
        regex = new RegExp(`(\\n)(${expectedIndent})(${part}):\\s`, 'g');
        regex.lastIndex = position; // Start search from current position
        
        match = regex.exec(str);
        if (!match) break; // Property not found at this level
        
        // If this is the target property (last in path), store its info
        if (i === parts.length - 1) {
          // The position should be right after the newline character
          const exactPosition = match.index + match[1].length;
          pathMap.set(path, {
            position: exactPosition,
            indent: match[2],
            comment: comments[path]
          });
        } else {
          // Otherwise, continue down the path
          position = match.index + match[0].length;
        }
      }
    });
    
    // Apply comments in reverse order of position (to maintain correct indices)
    const sortedPaths = Array.from(pathMap.entries())
      .sort((a, b) => b[1].position - a[1].position);
    
    for (const [path, info] of sortedPaths) {
      const { position, indent, comment } = info;
      const commentBlock = comment.split('\n')
        .map(line => `${indent}// ${line}`)
        .join('\n');
      
      // Insert the comment before the property, ensuring it's on a new line
      str = str.slice(0, position) + commentBlock + '\n' + str.slice(position);
    }
  }
  return str;
}

const prepareVariables = (str) => {
  return str
    .replace(/"\$\$([^"]+)\$\$"/g, '$1')
    .replace(/'\$\$([^']+)\$\$'/g, '$1')
    .replace(/(['"])(.*?\$\{.*?\}.*?)\1/g, '`$2`');
}

export const stringify = (val, comments = {}) => prepareVariables(addComments(val, comments));
