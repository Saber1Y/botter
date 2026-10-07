// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
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

contract BotterVaultTest is Test {
    BotterVault public vault;
    MockUSDT public token;

    address public owner = makeAddr("owner");
    address public agent = makeAddr("agent");
    address public recipient = makeAddr("recipient");

    uint256 public constant MAX_PER_TX = 100e6; // 100 USDC
    uint256 public constant DAILY_LIMIT = 500e6; // 500 USDC

    function setUp() public {
        vm.prank(owner);
        token = new MockUSDT();

        vm.prank(owner);
        vault = new BotterVault(
            owner,
            address(token),
            agent,
            MAX_PER_TX,
            DAILY_LIMIT
        );

        // Fund the vault
        token.mint(owner, 1000e6);
        vm.prank(owner);
        token.approve(address(vault), 1000e6);
        vm.prank(owner);
        vault.deposit(1000e6);
    }

    // --- Deposit Tests ---

    function test_deposit_increases_balance() public view {
        assertEq(vault.getBalance(), 1000e6);
    }

    function test_deposit_emits_event() public {
        token.mint(owner, 200e6);
        vm.prank(owner);
        token.approve(address(vault), 200e6);

        vm.expectEmit(true, false, false, true);
        emit BotterVault.Deposit(owner, 200e6);

        vm.prank(owner);
        vault.deposit(200e6);
    }

    // --- Withdraw Tests ---

    function test_withdraw_reduces_balance() public {
        vm.prank(owner);
        vault.withdraw(100e6);

        assertEq(vault.getBalance(), 900e6);
    }

    function test_withdraw_fails_for_non_owner() public {
        vm.prank(agent);
        vm.expectRevert(BotterVault.NotOwner.selector);
        vault.withdraw(100e6);
    }

    // --- Payment Tests ---

    function test_pay_within_limit_auto_approved() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-1"));

        vm.prank(agent);
        vault.pay(recipient, 60e6, paymentId);

        assertEq(token.balanceOf(recipient), 60e6);
        assertTrue(vault.paymentExecuted(paymentId));
    }

    function test_pay_emits_event() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-2"));

        vm.expectEmit(true, true, false, true);
        emit BotterVault.PaymentExecuted(paymentId, recipient, 60e6, block.timestamp);

        vm.prank(agent);
        vault.pay(recipient, 60e6, paymentId);

        assertEq(token.balanceOf(recipient), 60e6);
    }

    function test_pay_reverts_above_max_per_tx() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-3"));

        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(
                BotterVault.ExceedsMaxPerTransaction.selector,
                150e6,
                MAX_PER_TX
            )
        );
        vault.pay(recipient, 150e6, paymentId);
    }

    function test_pay_reverts_daily_limit_exceeded() public {
        // Spend 450 USDC across multiple payments
        for (uint256 i = 0; i < 9; i++) {
            bytes32 pid = keccak256(abi.encodePacked("batch", i));
            vm.prank(agent);
            vault.pay(recipient, 50e6, pid);
        }

        // Now try to spend 60 more (would exceed 500 daily limit)
        bytes32 paymentId = keccak256(abi.encodePacked("payment-last"));
        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(
                BotterVault.DailyLimitExceeded.selector,
                60e6,
                50e6 // 500 - 450 = 50 remaining
            )
        );
        vault.pay(recipient, 60e6, paymentId);
    }

    function test_pay_reverts_duplicate_payment() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-dup"));

        vm.prank(agent);
        vault.pay(recipient, 10e6, paymentId);

        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(
                BotterVault.DuplicatePayment.selector,
                paymentId
            )
        );
        vault.pay(recipient, 10e6, paymentId);
    }

    function test_pay_reverts_from_non_agent() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-4"));

        vm.prank(owner);
        vm.expectRevert(BotterVault.NotAgent.selector);
        vault.pay(recipient, 10e6, paymentId);
    }

    function test_pay_reverts_zero_recipient() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-5"));

        vm.prank(agent);
        vm.expectRevert(BotterVault.InvalidRecipient.selector);
        vault.pay(address(0), 10e6, paymentId);
    }

    function test_pay_reverts_zero_amount() public {
        bytes32 paymentId = keccak256(abi.encodePacked("payment-6"));

        vm.prank(agent);
        vm.expectRevert(BotterVault.InvalidAmount.selector);
        vault.pay(recipient, 0, paymentId);
    }

    // --- Limits Tests ---

    function test_set_limits_updates_state() public {
        vm.prank(owner);
        vault.setLimits(200e6, 1000e6);

        assertEq(vault.maxPerTransaction(), 200e6);
        assertEq(vault.dailyLimit(), 1000e6);
    }

    function test_set_limits_reverts_for_non_owner() public {
        vm.prank(agent);
        vm.expectRevert(BotterVault.NotOwner.selector);
        vault.setLimits(200e6, 1000e6);
    }

    // --- Agent Tests ---

    function test_set_agent_updates_state() public {
        address newAgent = makeAddr("newAgent");

        vm.prank(owner);
        vault.setAgent(newAgent);

        assertEq(vault.agent(), newAgent);
    }

    // --- Daily Reset Tests ---

    function test_daily_reset_after_new_day() public {
        // Spend 450 USDC across multiple payments within the per-tx limit
        for (uint256 i = 0; i < 9; i++) {
            bytes32 pid = keccak256(abi.encodePacked("day1", i));
            vm.prank(agent);
            vault.pay(recipient, 50e6, pid);
        }

        assertEq(vault.spentToday(), 450e6);

        // Fast forward 1 day
        vm.warp(block.timestamp + 1 days);

        // Should be able to spend again after reset
        bytes32 paymentId2 = keccak256(abi.encodePacked("day2"));
        vm.prank(agent);
        vault.pay(recipient, 80e6, paymentId2);

        assertEq(vault.spentToday(), 80e6);
        assertEq(vault.getDailyRemaining(), 420e6);
    }

    // --- Constructor Validation Tests ---

    function test_constructor_reverts_zero_owner() public {
        vm.expectRevert(BotterVault.InvalidRecipient.selector);
        new BotterVault(address(0), address(token), agent, MAX_PER_TX, DAILY_LIMIT);
    }

    function test_constructor_reverts_zero_token() public {
        vm.expectRevert(BotterVault.InvalidRecipient.selector);
        new BotterVault(owner, address(0), agent, MAX_PER_TX, DAILY_LIMIT);
    }

    function test_constructor_reverts_zero_agent() public {
        vm.expectRevert(BotterVault.InvalidRecipient.selector);
        new BotterVault(owner, address(token), address(0), MAX_PER_TX, DAILY_LIMIT);
    }

    function test_constructor_reverts_max_above_daily() public {
        vm.expectRevert(BotterVault.InvalidLimits.selector);
        new BotterVault(owner, address(token), agent, 600e6, DAILY_LIMIT);
    }

    function test_constructor_reverts_zero_max_per_tx() public {
        vm.expectRevert(BotterVault.InvalidLimits.selector);
        new BotterVault(owner, address(token), agent, 0, DAILY_LIMIT);
    }

    function test_setLimits_reverts_max_above_daily() public {
        vm.prank(owner);
        vm.expectRevert(BotterVault.InvalidLimits.selector);
        vault.setLimits(DAILY_LIMIT + 1, DAILY_LIMIT);
    }

    function test_setLimits_reverts_zero_max_per_tx() public {
        vm.prank(owner);
        vm.expectRevert(BotterVault.InvalidLimits.selector);
        vault.setLimits(0, DAILY_LIMIT);
    }

    // --- Payment Accounting Tests ---

    function test_pay_exact_amount_and_daily_remaining() public {
        bytes32 paymentId = keccak256(abi.encodePacked("exact-1"));
        vm.prank(agent);
        vault.pay(recipient, 100e6, paymentId);

        assertEq(token.balanceOf(recipient), 100e6, "recipient got exact amount");
        assertEq(vault.getBalance(), 900e6, "vault debited exactly");
        assertEq(vault.spentToday(), 100e6, "spentToday tracked");
        assertEq(vault.getDailyRemaining(), DAILY_LIMIT - 100e6, "daily remaining reduced");
    }

    function test_pay_reverts_when_vault_empty() public {
        uint256 balance = vault.getBalance();
        vm.prank(owner);
        vault.withdraw(balance);

        bytes32 paymentId = keccak256(abi.encodePacked("empty-vault"));
        vm.prank(agent);
        vm.expectRevert();
        vault.pay(recipient, 10e6, paymentId);
    }

}
