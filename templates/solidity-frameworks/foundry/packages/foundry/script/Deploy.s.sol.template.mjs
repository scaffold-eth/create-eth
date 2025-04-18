import { withDefaults } from "../../../../../utils.js";

const content = ({ preConfigContent, deploymentsLogic }) => `//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
${preConfigContent.filter(Boolean).join("\n")}

/**
 * @notice Main deployment script for all contracts
 * @dev Run this when you want to deploy multiple contracts at once
 *
 * Example: yarn deploy # runs this script(without\`--file\` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    // Deploys all your contracts sequentially
    // Add new deployments here when needed

    ${deploymentsLogic.filter(Boolean).join("\n")}

    // Deploy another contract
    // DeployMyContract myContract = new DeployMyContract();
    // myContract.run();
  }
}`;

export default withDefaults(content, {
  preConfigContent: `import { DeployYourContract } from "./DeployYourContract.s.sol";`,
  deploymentsLogic: `
    DeployYourContract deployYourContract = new DeployYourContract();
    deployYourContract.run();
  `,
});
