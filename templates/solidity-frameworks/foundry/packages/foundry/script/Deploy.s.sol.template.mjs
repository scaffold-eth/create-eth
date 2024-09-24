import { withDefaults } from "../../../../../utils.js";

const content = ({ deploymentsScriptsImports, deploymentsLogic }) => `//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { DeployYourContract } from "./00_deploy_your_contract.s.sol";
${deploymentsScriptsImports.filter(Boolean).join("\n")}

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployYourContract deployYourContract = new DeployYourContract();
    deployYourContract.run();

    ${deploymentsLogic.filter(Boolean).join("\n")}
  }
}`;

export default withDefaults(content, {
  deploymentsScriptsImports: "",
  deploymentsLogic: "",
});
