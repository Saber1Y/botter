// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {PactVault} from "../src/PactVault.sol";

contract DeployPactVault is Script {
    function run() external {
        // Base Sepolia USDC
        address usdc = vm.envOr("USDC_ADDRESS", address(0x036CbD53842c5426634e7929541eC2318f3dCF7e));

        // Agent address (the backend wallet that executes payments)
        address agent = vm.envAddress("AGENT_ADDRESS");

        // Limits in USDC (6 decimals): default $500/tx, $1000/day
        uint256 maxPerTx = vm.envOr("MAX_PER_TX", uint256(500_000_000));   // 500 USDC
        uint256 dailyLimit = vm.envOr("DAILY_LIMIT", uint256(1000_000_000)); // 1000 USDC

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        PactVault vault = new PactVault(msg.sender, usdc, agent, maxPerTx, dailyLimit);

        vm.stopBroadcast();

        console.log("PactVault deployed at:", address(vault));
        console.log("Agent:", agent);
        console.log("USDC:", usdc);
        console.log("Max per tx:", maxPerTx / 1e6, "USDC");
        console.log("Daily limit:", dailyLimit / 1e6, "USDC");
    }
}
