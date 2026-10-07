// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {BotterVault} from "../src/BotterVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @dev Minimal mock USDC for testing (6 decimals)
contract MockUSDT {
    string public name = "USD Coin";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "no allowance");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract VaultFactoryTest is Test {
    VaultFactory public factory;
    MockUSDT public token;

    address public factoryOwner = makeAddr("factoryOwner");
    address public agent = makeAddr("agent");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public recipient = makeAddr("recipient");

    uint256 public constant DEFAULT_MAX_PER_TX = 500e6;   // 500 USDC
    uint256 public constant DEFAULT_DAILY_LIMIT = 1000e6;  // 1000 USDC

    function setUp() public {
        vm.prank(factoryOwner);
        token = new MockUSDT();

        vm.prank(factoryOwner);
        factory = new VaultFactory(
            address(token),
            agent,
            DEFAULT_MAX_PER_TX,
            DEFAULT_DAILY_LIMIT
        );
    }

    // --- Deployment Tests ---

    function test_createVault_deploys_vault_for_user() public {
        vm.prank(alice);
        factory.createVault();

        address vaultAddr = factory.getVault(alice);
        assertTrue(vaultAddr != address(0), "vault should exist");

        BotterVault vault = BotterVault(vaultAddr);
        assertEq(vault.owner(), alice, "owner should be alice");
        assertEq(vault.agent(), agent, "agent should match");
    }

    function test_createVault_emits_event() public {
        vm.prank(alice);
        // Just verify VaultCreated was emitted (user is alice)
        vm.expectEmit(true, false, false, false);
        emit VaultFactory.VaultCreated(alice, address(0), bytes32(0));
        factory.createVault();
    }

    function test_createVault_reverts_if_exists() public {
        vm.prank(alice);
        factory.createVault();

        vm.prank(alice);
        vm.expectRevert(VaultFactory.VaultAlreadyExists.selector);
        factory.createVault();
    }

    function test_createVault_multiple_users() public {
        vm.prank(alice);
        factory.createVault();

        vm.prank(bob);
        factory.createVault();

        address aliceVault = factory.getVault(alice);
        address bobVault = factory.getVault(bob);

        assertTrue(aliceVault != address(0));
        assertTrue(bobVault != address(0));
        assertTrue(aliceVault != bobVault, "vaults should be different");
    }

    function test_vaultCount_increments() public {
        assertEq(factory.vaultCount(), 0);

        vm.prank(alice);
        factory.createVault();
        assertEq(factory.vaultCount(), 1);

        vm.prank(bob);
        factory.createVault();
        assertEq(factory.vaultCount(), 2);
    }

    function test_getAllVaults() public {
        vm.prank(alice);
        factory.createVault();

        vm.prank(bob);
        factory.createVault();

        address[] memory vaults = factory.getAllVaults();
        assertEq(vaults.length, 2);
    }

    // --- Vault Functionality Tests ---

    function test_user_can_deposit_to_vault() public {
        vm.prank(alice);
        factory.createVault();

        address vaultAddr = factory.getVault(alice);

        // Mint USDC to alice and deposit
        token.mint(alice, 1000e6);
        vm.prank(alice);
        token.approve(vaultAddr, 1000e6);
        vm.prank(alice);
        BotterVault(vaultAddr).deposit(1000e6);

        assertEq(BotterVault(vaultAddr).getBalance(), 1000e6);
    }

    function test_agent_can_pay_from_user_vault() public {
        vm.prank(alice);
        factory.createVault();

        address vaultAddr = factory.getVault(alice);

        // Fund vault
        token.mint(alice, 1000e6);
        vm.prank(alice);
        token.approve(vaultAddr, 1000e6);
        vm.prank(alice);
        BotterVault(vaultAddr).deposit(1000e6);

        // Agent pays
        bytes32 paymentId = keccak256(abi.encodePacked("test-payment-1"));
        vm.prank(agent);
        BotterVault(vaultAddr).pay(recipient, 100e6, paymentId);

        assertEq(token.balanceOf(recipient), 100e6);
        assertEq(BotterVault(vaultAddr).getBalance(), 900e6);
    }

    function test_user_can_withdraw_from_own_vault() public {
        vm.prank(alice);
        factory.createVault();

        address vaultAddr = factory.getVault(alice);

        // Fund vault
        token.mint(alice, 1000e6);
        vm.prank(alice);
        token.approve(vaultAddr, 1000e6);
        vm.prank(alice);
        BotterVault(vaultAddr).deposit(1000e6);

        // Alice withdraws
        vm.prank(alice);
        BotterVault(vaultAddr).withdraw(200e6);

        assertEq(BotterVault(vaultAddr).getBalance(), 800e6);
        assertEq(token.balanceOf(alice), 200e6);
    }

    function test_user_cannot_withdraw_from_other_vault() public {
        vm.prank(alice);
        factory.createVault();

        address aliceVault = factory.getVault(alice);

        // Fund vault
        token.mint(alice, 1000e6);
        vm.prank(alice);
        token.approve(aliceVault, 1000e6);
        vm.prank(alice);
        BotterVault(aliceVault).deposit(1000e6);

        // Bob tries to withdraw from Alice's vault
        vm.prank(bob);
        vm.expectRevert(BotterVault.NotOwner.selector);
        BotterVault(aliceVault).withdraw(100e6);
    }

    // --- Admin Tests ---

    function test_setAgent_updates() public {
        address newAgent = makeAddr("newAgent");

        vm.prank(factoryOwner);
        factory.setAgent(newAgent);

        assertEq(factory.agent(), newAgent);
    }

    function test_setAgent_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert(VaultFactory.NotOwner.selector);
        factory.setAgent(makeAddr("newAgent"));
    }

    function test_setDefaults_updates() public {
        vm.prank(factoryOwner);
        factory.setDefaults(200e6, 800e6);

        assertEq(factory.defaultMaxPerTx(), 200e6);
        assertEq(factory.defaultDailyLimit(), 800e6);
    }

    function test_transferOwnership() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(factoryOwner);
        factory.transferOwnership(newOwner);

        assertEq(factory.owner(), newOwner);
    }

    function test_transferOwnership_reverts_for_non_owner() public {
        vm.prank(alice);
        vm.expectRevert(VaultFactory.NotOwner.selector);
        factory.transferOwnership(makeAddr("newOwner"));
    }

    // --- Deterministic Address Tests ---

    function test_createVault_address_is_deterministic() public {
        bytes memory initCode = abi.encodePacked(
            type(BotterVault).creationCode,
            abi.encode(
                alice,
                address(token),
                agent,
                DEFAULT_MAX_PER_TX,
                DEFAULT_DAILY_LIMIT
            )
        );
        bytes32 salt = keccak256(abi.encodePacked(alice));
        address predicted = vm.computeCreate2Address(
            salt,
            keccak256(initCode),
            address(factory)
        );

        vm.prank(alice);
        factory.createVault();

        assertEq(
            factory.getVault(alice),
            predicted,
            "vault address must match deterministic CREATE2 address"
        );
        assertEq(
            factory.userSalts(alice),
            salt,
            "salt must not depend on block state"
        );
    }

    // --- Constructor Validation Tests ---

    function test_constructor_reverts_zero_token() public {
        vm.expectRevert(VaultFactory.InvalidAddress.selector);
        new VaultFactory(address(0), agent, DEFAULT_MAX_PER_TX, DEFAULT_DAILY_LIMIT);
    }

    function test_constructor_reverts_zero_agent() public {
        vm.expectRevert(VaultFactory.InvalidAddress.selector);
        new VaultFactory(address(token), address(0), DEFAULT_MAX_PER_TX, DEFAULT_DAILY_LIMIT);
    }

    function test_constructor_reverts_max_above_daily() public {
        vm.expectRevert(VaultFactory.InvalidLimits.selector);
        new VaultFactory(address(token), agent, 2000e6, DEFAULT_DAILY_LIMIT);
    }

    function test_constructor_reverts_zero_max_per_tx() public {
        vm.expectRevert(VaultFactory.InvalidLimits.selector);
        new VaultFactory(address(token), agent, 0, DEFAULT_DAILY_LIMIT);
    }

    function test_setDefaults_reverts_max_above_daily() public {
        vm.prank(factoryOwner);
        vm.expectRevert(VaultFactory.InvalidLimits.selector);
        factory.setDefaults(DEFAULT_DAILY_LIMIT + 1, DEFAULT_DAILY_LIMIT);
    }

    function test_setDefaults_reverts_zero_max_per_tx() public {
        vm.prank(factoryOwner);
        vm.expectRevert(VaultFactory.InvalidLimits.selector);
        factory.setDefaults(0, DEFAULT_DAILY_LIMIT);
    }

}
