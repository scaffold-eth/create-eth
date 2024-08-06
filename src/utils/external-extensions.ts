import { ExternalExtension, RawOptions, SolidityFramework } from "../types";
import { CURATED_EXTENSIONS } from "../curated-extensions";
import { SOLIDITY_FRAMEWORKS } from "./consts";

// Gets the data from the argument passed to the `--extension` option.
// e.g. owner/project:branch => { githubBranchUrl, githubUrl, branch, owner, project }
export const getDataFromExternalExtensionArgument = (externalExtension: string) => {
  if (CURATED_EXTENSIONS[externalExtension]) {
    externalExtension = getArgumentFromExternalExtensionOption(CURATED_EXTENSIONS[externalExtension]);
  }

  // Check format: owner/project:branch (branch is optional)
  const regex = /^[^/]+\/[^/]+(:[^/]+)?$/;
  if (!regex.test(externalExtension)) {
    throw new Error(`Invalid extension format. Use "owner/project" or "owner/project:branch"`);
  }

  // Extract owner, project and branch
  const owner = externalExtension.split("/")[0];
  const project = externalExtension.split(":")[0].split("/")[1];
  const branch = externalExtension.split(":")[1];

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
};

// Parse the externalExtensionOption object into a argument string.
// e.g. { repository: "owner/project", branch: "branch" } => "owner/project:branch"
export const getArgumentFromExternalExtensionOption = (externalExtensionOption: RawOptions["externalExtension"]) => {
  const { repository, branch } = (externalExtensionOption as ExternalExtension) || {};

  const owner = repository?.split("/")[3];
  const project = repository?.split("/")[4];

  return `${owner}/${project}${branch ? `:${branch}` : ""}`;
};

// Gets the solidity framework directories from the external extension repository
export const getSolidityFrameworkDirsFromExternalExtension = async ({
  repositoryURL,
  branch,
}: {
  repositoryURL: string;
  branch?: string;
}) => {
  const splitUrl = repositoryURL.split("/");
  const ownerName = splitUrl[splitUrl.length - 2];
  const repoName = splitUrl[splitUrl.length - 1];
  const githubApiUrl = `https://api.github.com/repos/${ownerName}/${repoName}/contents/extension/packages${branch ? `?ref=${branch}` : ""}`;
  const res = await fetch(githubApiUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch the githubApiUrl ${githubApiUrl}`);
  }
  const listOfContents = (await res.json()) as { name: string; type: "dir" | "file" }[];
  const directories = listOfContents.filter(item => item.type === "dir").map(dir => dir.name);
  // filter out the directories which are not solidity frameworks
  const soliidtyFrameworks = Object.values(SOLIDITY_FRAMEWORKS);
  const filteredSolidityFrameworkdDirs = directories.filter(dir =>
    soliidtyFrameworks.includes(dir as SolidityFramework),
  );

  return filteredSolidityFrameworkdDirs;
};
