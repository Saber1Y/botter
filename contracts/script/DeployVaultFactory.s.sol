// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployVaultFactory is Script {
    function run() external {
        // Base Sepolia USDC
        address usdc = vm.envOr("USDC_ADDRESS", address(0x036CbD53842c5426634e7929541eC2318f3dCF7e));

        // Agent address (the backend wallet that executes payments)
        address agent = vm.envAddress("AGENT_ADDRESS");

        // Default limits in USDC (6 decimals): $500/tx, $1000/day
        uint256 defaultMaxPerTx = vm.envOr("MAX_PER_TX", uint256(500_000_000));   // 500 USDC
        uint256 defaultDailyLimit = vm.envOr("DAILY_LIMIT", uint256(1000_000_000)); // 1000 USDC

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        VaultFactory factory = new VaultFactory(
            usdc,
            agent,
            defaultMaxPerTx,
            defaultDailyLimit
        );

        vm.stopBroadcast();

        console.log("VaultFactory deployed at:", address(factory));
        console.log("Agent:", agent);
        console.log("USDC:", usdc);
        console.log("Default max per tx:", defaultMaxPerTx / 1e6, "USDC");
        console.log("Default daily limit:", defaultDailyLimit / 1e6, "USDC");
    }
}
