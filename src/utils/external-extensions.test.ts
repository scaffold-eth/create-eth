import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDataFromExternalExtensionArgument, getArgumentFromExternalExtensionOption } from "./external-extensions.ts";

describe("getDataFromExternalExtensionArgument", () => {
  it("parses owner/project", () => {
    const data = getDataFromExternalExtensionArgument("owner/project");
    assert.equal(data.owner, "owner");
    assert.equal(data.project, "project");
    assert.equal(data.branch, undefined);
    assert.equal(data.githubUrl, "https://github.com/owner/project");
    assert.equal(data.githubBranchUrl, "https://github.com/owner/project");
  });

  it("parses owner/project:branch", () => {
    const data = getDataFromExternalExtensionArgument("owner/project:dev");
    assert.equal(data.owner, "owner");
    assert.equal(data.project, "project");
    assert.equal(data.branch, "dev");
    assert.equal(data.githubBranchUrl, "https://github.com/owner/project/tree/dev");
  });

  it("parses a plain github url", () => {
    const data = getDataFromExternalExtensionArgument("https://github.com/foo/bar");
    assert.equal(data.owner, "foo");
    assert.equal(data.project, "bar");
    assert.equal(data.branch, undefined);
    assert.equal(data.githubUrl, "https://github.com/foo/bar");
  });

  it("parses a github url with tree/branch", () => {
    const data = getDataFromExternalExtensionArgument("https://github.com/foo/bar/tree/feat");
    assert.equal(data.owner, "foo");
    assert.equal(data.project, "bar");
    assert.equal(data.branch, "feat");
    assert.equal(data.githubBranchUrl, "https://github.com/foo/bar/tree/feat");
  });

  it("resolves a curated extension flag to its repository", () => {
    const data = getDataFromExternalExtensionArgument("subgraph");
    assert.equal(data.owner, "scaffold-eth");
    assert.equal(data.project, "create-eth-extensions");
    assert.equal(data.branch, "subgraph");
  });

  it("throws on invalid format", () => {
    assert.throws(() => getDataFromExternalExtensionArgument("notvalid"), /Invalid extension format/);
  });
});

describe("getArgumentFromExternalExtensionOption", () => {
  it("rebuilds owner/project from repository url", () => {
    const arg = getArgumentFromExternalExtensionOption({
      repository: "https://github.com/scaffold-eth/create-eth-extensions",
    });
    assert.equal(arg, "scaffold-eth/create-eth-extensions");
  });

  it("appends the branch when present", () => {
    const arg = getArgumentFromExternalExtensionOption({
      repository: "https://github.com/scaffold-eth/create-eth-extensions",
      branch: "subgraph",
    });
    assert.equal(arg, "scaffold-eth/create-eth-extensions:subgraph");
  });

  it("round-trips with getDataFromExternalExtensionArgument", () => {
    const data = getDataFromExternalExtensionArgument("owner/project:dev");
    const arg = getArgumentFromExternalExtensionOption({ repository: data.githubUrl, branch: data.branch });
    assert.equal(arg, "owner/project:dev");
  });
});
