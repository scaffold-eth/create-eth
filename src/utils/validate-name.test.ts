import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateNpmName } from "./validate-name.ts";

describe("validateNpmName", () => {
  it("accepts a valid package name", () => {
    assert.deepEqual(validateNpmName("my-dapp-example"), { valid: true });
  });

  it("rejects names with uppercase letters and reports problems", () => {
    const result = validateNpmName("MyDapp");
    assert.equal(result.valid, false);
    assert.ok(result.valid === false && result.problems.length > 0);
  });

  it("uses the basename of a path", () => {
    assert.deepEqual(validateNpmName("some/nested/my-dapp"), { valid: true });
  });
});
