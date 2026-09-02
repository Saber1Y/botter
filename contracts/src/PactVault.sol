// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title PactVault
/// @notice Holds USDC and authorizes agent payments with enforced spending limits.
/// @dev The owner deposits funds and configures limits. The authorized agent can
///      execute payments up to the configured limits. Daily limits reset at the
///      start of each UTC day.
contract PactVault {
    using SafeERC20 for IERC20;

    // --- State ---

    address public owner;
    address public agent;

    IERC20 public usdc;

    uint256 public maxPerTransaction;
    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public lastReset;

    // Track individual payments by ID to prevent replay
    mapping(bytes32 => bool) public paymentExecuted;

    // --- Events ---

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event LimitsUpdated(uint256 maxPerTransaction, uint256 dailyLimit);
    event PaymentExecuted(
        bytes32 indexed paymentId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    event DailyLimitReset(uint256 timestamp);

    // --- Errors ---

    error NotOwner();
    error NotAgent();
    error InsufficientBalance(uint256 requested, uint256 available);
    error ExceedsMaxPerTransaction(uint256 amount, uint256 max);
    error DailyLimitExceeded(uint256 amount, uint256 remaining);
    error InvalidRecipient();
    error InvalidAmount();
    error DuplicatePayment(bytes32 paymentId);
    error TransferFailed();
    error ResetFailed();

    // --- Modifiers ---

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    // --- Constructor ---

    constructor(
        address _owner,
        address _usdc,
        address _agent,
        uint256 _maxPerTransaction,
        uint256 _dailyLimit
    ) {
        owner = _owner;
        agent = _agent;
        usdc = IERC20(_usdc);
        maxPerTransaction = _maxPerTransaction;
        dailyLimit = _dailyLimit;
        lastReset = block.timestamp;
    }

    // --- External Functions ---

    /// @notice Deposit USDC into the vault.
    /// @param amount The amount of USDC (6 decimals) to deposit.
    function deposit(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposit(msg.sender, amount);
    }

    /// @notice Withdraw USDC from the vault (owner only).
    /// @param amount The amount of USDC (6 decimals) to withdraw.
    function withdraw(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        if (amount > usdc.balanceOf(address(this))) {
            revert InsufficientBalance(amount, usdc.balanceOf(address(this)));
        }
        usdc.safeTransfer(owner, amount);
        emit Withdraw(owner, amount);
    }

    /// @notice Set the authorized agent address (owner only).
    /// @param newAgent The new agent address.
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert InvalidRecipient();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice Update spending limits (owner only).
    /// @param _maxPerTransaction Maximum per-transaction amount in USDC (6 decimals).
    /// @param _dailyLimit Maximum total daily spending in USDC (6 decimals).
    function setLimits(
        uint256 _maxPerTransaction,
        uint256 _dailyLimit
    ) external onlyOwner {
        maxPerTransaction = _maxPerTransaction;
        dailyLimit = _dailyLimit;
        emit LimitsUpdated(_maxPerTransaction, _dailyLimit);
    }

    /// @notice Execute a payment (agent only).
    /// @param recipient The address to pay.
    /// @param amount The amount of USDC (6 decimals) to send.
    /// @param paymentId Unique ID for this payment to prevent replays.
    function pay(
        address recipient,
        uint256 amount,
        bytes32 paymentId
    ) external onlyAgent {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (paymentExecuted[paymentId]) revert DuplicatePayment(paymentId);

        // Reset daily spending if a new day has started
        _resetDailyIfNeeded();

        // Validate limits
        if (amount > maxPerTransaction) {
            revert ExceedsMaxPerTransaction(amount, maxPerTransaction);
        }
        if (spentToday + amount > dailyLimit) {
            revert DailyLimitExceeded(
                amount,
                dailyLimit - spentToday
            );
        }

        // Execute payment
        paymentExecuted[paymentId] = true;
        spentToday += amount;

        usdc.safeTransfer(recipient, amount);

        emit PaymentExecuted(
            paymentId,
            recipient,
            amount,
            block.timestamp
        );
    }

    // --- View Functions ---

    /// @notice Get the vault's USDC balance.
    function getBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /// @notice Get remaining daily budget.
    function getDailyRemaining() external view returns (uint256) {
        if (spentToday >= dailyLimit) return 0;
        return dailyLimit - spentToday;
    }

    /// @notice Reset daily spending if a new day has started.
    function resetDaily() external {
        _resetDailyIfNeeded();
    }

    // --- Internal ---

    function _resetDailyIfNeeded() internal {
        uint256 today = block.timestamp / 1 days;
        uint256 lastDay = lastReset / 1 days;

        if (today > lastDay) {
            spentToday = 0;
            lastReset = block.timestamp;
            emit DailyLimitReset(block.timestamp);
        }
    }
}
