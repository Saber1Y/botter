// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployVaultFactory is Script {
    function run() external {
        // BOT Chain Testnet USDT
        address token = vm.envOr("TOKEN_ADDRESS", address(0x75edC9335175Fc0552D51D48439F229c10420fe3));

        // Agent address (the backend wallet that executes payments)
        address agent = vm.envAddress("AGENT_ADDRESS");

        // Default limits in USDT (6 decimals): $500/tx, $1000/day
        uint256 defaultMaxPerTx = vm.envOr("MAX_PER_TX", uint256(500_000_000));   // 500 USDT
        uint256 defaultDailyLimit = vm.envOr("DAILY_LIMIT", uint256(1000_000_000)); // 1000 USDT

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        VaultFactory factory = new VaultFactory(
            token,
            agent,
            defaultMaxPerTx,
            defaultDailyLimit
        );

        vm.stopBroadcast();

        console.log("VaultFactory deployed at:", address(factory));
        console.log("Agent:", agent);
        console.log("USDT:", token);
        console.log("Default max per tx:", defaultMaxPerTx / 1e6, "USDT");
        console.log("Default daily limit:", defaultDailyLimit / 1e6, "USDT");
    }
}
