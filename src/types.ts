import type { Question } from "inquirer";

export type Args = string[];

export type SolidityFramework = "hardhat" | "foundry";

type BaseOptions = {
  project: string | null;
  install: boolean | null;
  dev: boolean;
  externalExtension: ExternalExtension | ExternalExtensionNameDev | null;
  solidityFramework: SolidityFramework | "none" | null;
};

export type ExternalExtension = {
  repository: string;
  branch?: string | null;
};

export type ExternalExtensionNameDev = string;

export type RawOptions = BaseOptions & {
  help: boolean;
};

type MergedOptions = {
  [Prop in keyof Omit<BaseOptions, "externalExtension" | "solidityFramework">]: NonNullable<BaseOptions[Prop]>;
} & {
  externalExtension: RawOptions["externalExtension"];
  solidityFramework: SolidityFramework | null;
};

export type Options = MergedOptions;

type NullExtension = null;

export type SolidityFrameworkOrNull = SolidityFramework | NullExtension;
// corresponds to inquirer question types:
//  - multi-select -> checkbox
//  - single-select -> list
type QuestionType = "multi-select" | "single-select";
interface SolidityFrameworkQuestion<T extends SolidityFrameworkOrNull[] = SolidityFrameworkOrNull[]> {
  type: QuestionType;
  extensions: T;
  name: string;
  message: Question["message"];
  default?: T[number];
}

export const isSolidityFramework = (item: SolidityFrameworkOrNull): item is SolidityFramework => item !== null;

/**
 * This function makes sure that the `T` generic type is narrowed down to
 * whatever `extensions` are passed in the question prop. That way we can type
 * check the `default` prop is not using any valid extension, but only one
 * already provided in the `extensions` prop.
 *
 * Questions can be created without this function, just using a normal object,
 * but `default` type will be any valid Extension.
 */
export const typedQuestion = <T extends SolidityFrameworkOrNull[]>(question: SolidityFrameworkQuestion<T>) => question;
export type Config = {
  questions: SolidityFrameworkQuestion[];
};

export const isDefined = <T>(item: T | undefined | null): item is T => item !== undefined && item !== null;

export type SolidityFrameworkDescriptor = {
  name: string;
  value: SolidityFramework;
  path: string;
};

export type SolidityFrameworkDict = {
  [extension in SolidityFramework]: SolidityFrameworkDescriptor;
};

export type TemplateDescriptor = {
  path: string;
  fileUrl: string;
  relativePath: string;
  source: string;
};
