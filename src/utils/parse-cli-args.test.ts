import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseCliArgs } from "./parse-cli-args.ts";

const argv = (...args: string[]) => ["node", "create-eth", ...args];

describe("parseCliArgs", () => {
  it("returns defaults with no args", () => {
    const r = parseCliArgs(argv());
    assert.equal(r.project, null);
    assert.equal(r.dev, false);
    assert.equal(r.help, false);
    assert.equal(r.skipInstall, null);
    assert.equal(r.extensionName, undefined);
    assert.equal(r.solidityFramework, null);
  });

  it("parses the project name positional", () => {
    assert.equal(parseCliArgs(argv("my-app")).project, "my-app");
  });

  it("parses --skip-install and its --skip alias", () => {
    assert.equal(parseCliArgs(argv("--skip-install")).skipInstall, true);
    assert.equal(parseCliArgs(argv("--skip")).skipInstall, true);
  });

  it("parses -s / --solidity-framework and lowercases known values", () => {
    assert.equal(parseCliArgs(argv("-s", "Hardhat")).solidityFramework, "hardhat");
    assert.equal(parseCliArgs(argv("--solidity-framework", "foundry")).solidityFramework, "foundry");
    assert.equal(parseCliArgs(argv("-s", "none")).solidityFramework, "none");
  });

  it("returns null solidityFramework for an unknown value (prompt later)", () => {
    assert.equal(parseCliArgs(argv("-s", "truffle")).solidityFramework, null);
  });

  it("parses -e / --extension", () => {
    assert.equal(parseCliArgs(argv("-e", "owner/repo")).extensionName, "owner/repo");
  });

  it("parses --dev and -h", () => {
    assert.equal(parseCliArgs(argv("--dev")).dev, true);
    assert.equal(parseCliArgs(argv("-h")).help, true);
  });
});
