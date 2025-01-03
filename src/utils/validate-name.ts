import validateProjectName from "validate-npm-package-name";

type ValidateNpmNameResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      problems: string[];
    };

export function validateNpmName(name: string): ValidateNpmNameResult {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const nameValidation = validateProjectName(name);
  if (nameValidation.validForNewPackages) {
    return { valid: true };
  }

  return {
    valid: false,
    problems: [...(nameValidation.errors || []), ...(nameValidation.warnings || [])],
  };
}
