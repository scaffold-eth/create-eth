import { describe, it } from "node:test";
import assert from "node:assert/strict";
// templates/utils.js is plain JS shipped into generated apps and evaluated at template time.
import {
  upperCaseFirstLetter,
  deepMerge,
  withDefaults,
  stringify,
  GLOBAL_ARGS_DEFAULTS as templatesGlobalArgsDefaults,
} from "../templates/utils.js";
import { GLOBAL_ARGS_DEFAULTS as srcGlobalArgsDefaults } from "./utils/consts.ts";

describe("upperCaseFirstLetter", () => {
  it("capitalizes the first letter", () => {
    assert.equal(upperCaseFirstLetter("hello"), "Hello");
  });
});

describe("deepMerge", () => {
  it("merges objects, second wins on conflicts", () => {
    assert.deepEqual(deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 }), { a: 1, b: 3, c: 4 });
  });

  it("replaces arrays instead of concatenating", () => {
    assert.deepEqual(deepMerge({ arr: [1, 2] }, { arr: [3] }), { arr: [3] });
  });
});

describe("stringify", () => {
  it("unwraps $$...$$ markers into raw expressions", () => {
    const out = stringify({ x: "$$someVar$$" });
    assert.match(out, /x:\s*someVar/);
  });

  it("converts strings containing template placeholders into template literals", () => {
    const out = stringify({ x: "a${b}c" });
    assert.match(out, /`a\$\{b\}c`/);
  });
});

describe("withDefaults", () => {
  // Each global arg default (e.g. solidityFramework) must be supplied as a single-element array.
  const globals = { solidityFramework: ["hardhat"] };

  it("passes received args through to the template", () => {
    const tmpl = withDefaults((args: Record<string, string[]>) => args.foo[0], { foo: "default" });
    assert.equal(tmpl({ foo: ["x"], ...globals }), "x");
  });

  it("applies defaults for missing args", () => {
    const tmpl = withDefaults((args: Record<string, string[]>) => args.foo[0], { foo: "default" });
    assert.equal(tmpl({ ...globals }), "default");
  });

  it("throws on unexpected args", () => {
    const tmpl = withDefaults((args: Record<string, string[]>) => args.foo[0], { foo: "default" });
    assert.throws(() => tmpl({ foo: ["x"], bar: ["y"], ...globals }), /unexpected argument/);
  });
});

describe("GLOBAL_ARGS_DEFAULTS", () => {
  it("stays in sync between src/utils/consts and templates/utils", () => {
    assert.deepEqual(templatesGlobalArgsDefaults, srcGlobalArgsDefaults);
  });
});
