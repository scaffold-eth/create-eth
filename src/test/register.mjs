import { register } from "node:module";

// Registers the extensionless-import resolver for the test run.
register("./ts-extension-resolver.mjs", import.meta.url);
