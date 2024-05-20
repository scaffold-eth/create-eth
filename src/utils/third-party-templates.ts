import { RawOptions } from "../types";

// Gets the data from the argument passed to the `--template` option.
// e.g. owner/project:branch => { githubBranchUrl, githubUrl, branch, owner, project }
export const getDataFromTemplateArgument = (template: string) => {
  // Check format: owner/project:branch (branch is optional)
  const regex = /^[^/]+\/[^/]+(:[^/]+)?$/;
  if (!regex.test(template)) {
    throw new Error(
      `Invalid template format. Use "owner/project" or "owner/project:branch"`
    );
  }

  // Extract owner, project and branch
  const owner = template.split("/")[0];
  const project = template.split(":")[0].split("/")[1];
  const branch = template.split(":")[1];

  // Check if the repo exists.
  const githubUrl = `https://github.com/${owner}/${project}`;
  let githubBranchUrl;
  if (branch) {
    githubBranchUrl = `https://github.com/${owner}/${project}/tree/${branch}`;
  }

  return {
    githubBranchUrl: githubBranchUrl ?? githubUrl,
    githubUrl,
    branch,
    owner,
    project,
  };
}

// Parse the template object into a argument string.
// e.g. { repository: "owner/project", branch: "branch" } => "owner/project:branch"
export const getArgumentFromTemplateOption = (templateOption: RawOptions["template"]) => {
  const { repository, branch } = templateOption || {};

  const owner = repository?.split("/")[3];
  const project = repository?.split("/")[4];

  return `${owner}/${project}${branch ? `:${branch}` : ""}`;
}
