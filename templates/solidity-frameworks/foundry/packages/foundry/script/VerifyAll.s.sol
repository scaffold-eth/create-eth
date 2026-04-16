//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/Vm.sol";
import "solidity-bytes-utils/BytesLib.sol";

/**
 * @dev Temp Vm implementation
 * @notice calls the tryffi function on the Vm contract
 * @notice will be deleted once the forge/std is updated
 */
struct FfiResult {
    int32 exit_code;
    bytes stdout;
    bytes stderr;
}

interface tempVm {
    function tryFfi(string[] calldata) external returns (FfiResult memory);
}

contract VerifyAll is Script {
    uint96 currTransactionIdx;

    function run() external {
        string memory root = vm.projectRoot();
        string memory path =
            string.concat(root, "/broadcast/Deploy.s.sol/", vm.toString(block.chainid), "/run-latest.json");
        string memory content = vm.readFile(path);

        while (nextTransaction(content)) {
            _verifyIfContractDeployment(content);
            currTransactionIdx++;
        }
    }

    function _verifyIfContractDeployment(string memory content) internal {
        string memory txType =
            abi.decode(vm.parseJson(content, searchStr(currTransactionIdx, "transactionType")), (string));
        if (keccak256(bytes(txType)) == keccak256(bytes("CREATE"))) {
            _verifyContract(content);
        }
    }

    function _verifyContract(string memory content) internal {
        string memory contractName =
            abi.decode(vm.parseJson(content, searchStr(currTransactionIdx, "contractName")), (string));
        address contractAddr =
            abi.decode(vm.parseJson(content, searchStr(currTransactionIdx, "contractAddress")), (address));
        bytes memory deployedBytecode =
            abi.decode(vm.parseJson(content, searchStr(currTransactionIdx, "transaction.input")), (bytes));
        bytes memory compiledBytecode =
            abi.decode(vm.parseJson(_getCompiledBytecode(contractName), ".bytecode.object"), (bytes));
        bytes memory constructorArgs =
            BytesLib.slice(deployedBytecode, compiledBytecode.length, deployedBytecode.length - compiledBytecode.length);

        string[] memory inputs = new string[](9);
        inputs[0] = "forge";
        inputs[1] = "verify-contract";
        inputs[2] = vm.toString(contractAddr);
        inputs[3] = contractName;
        inputs[4] = "--chain";
        inputs[5] = vm.toString(block.chainid);
        inputs[6] = "--constructor-args";
        inputs[7] = vm.toString(constructorArgs);
        inputs[8] = "--watch";

        FfiResult memory f = tempVm(address(vm)).tryFfi(inputs);

        if (f.stderr.length != 0) {
            console.logString(string.concat("Submitting verification for contract: ", vm.toString(contractAddr)));
            console.logString(string(f.stderr));
        } else {
            console.logString(string(f.stdout));
        }
        return;
    }

    function nextTransaction(string memory content) internal view returns (bool) {
        string memory hashPath = searchStr(currTransactionIdx, "hash");

        try vm.parseJson(content, hashPath) returns (bytes memory hashBytes) {
            if (hashBytes.length == 0) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    function _getCompiledBytecode(string memory contractName) internal returns (string memory compiledBytecode) {
        string memory root = vm.projectRoot();
        string memory defaultPath = string.concat(root, "/out/", contractName, ".sol/", contractName, ".json");

        try vm.readFile(defaultPath) returns (string memory content) {
            compiledBytecode = content;
        } catch {
            string[] memory inputs = new string[](3);
            inputs[0] = "bash";
            inputs[1] = "-c";
            inputs[2] = string.concat(
                "find '", root, "/out' -name '", contractName, ".json' -not -path '*/build-info/*' -print -quit | tr -d '\\n'"
            );
            FfiResult memory f = tempVm(address(vm)).tryFfi(inputs);
            compiledBytecode = vm.readFile(string(f.stdout));
        }
    }

    function searchStr(uint96 idx, string memory searchKey) internal pure returns (string memory) {
        return string.concat(".transactions[", vm.toString(idx), "].", searchKey);
    }
}
