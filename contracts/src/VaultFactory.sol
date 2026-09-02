// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {PactVault} from "./PactVault.sol";

/// @title VaultFactory
/// @notice Deploys and tracks per-user PactVault instances.
/// @dev Uses CREATE2 for deterministic vault addresses. Each user gets one vault.
///      The factory owner (Pact backend) sets the agent and default limits.
contract VaultFactory {
    // --- State ---

    address public agent;
    address public usdc;

    uint256 public defaultMaxPerTx;
    uint256 public defaultDailyLimit;

    // User → Vault address
    mapping(address => address) public vaults;

    // Track all deployed vaults
    address[] public allVaults;

    // Deployment salt per user (deterministic)
    mapping(address => bytes32) public userSalts;

    // --- Events ---

    event VaultCreated(
        address indexed user,
        address indexed vault,
        bytes32 salt
    );
    event AgentUpdated(address indexed oldAgent, address indexed newAgent);
    event LimitsUpdated(uint256 maxPerTx, uint256 dailyLimit);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // --- Errors ---

    error VaultAlreadyExists();
    error InvalidAddress();
    error NotOwner();

    // --- Modifiers ---

    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // --- Constructor ---

    constructor(
        address _usdc,
        address _agent,
        uint256 _defaultMaxPerTx,
        uint256 _defaultDailyLimit
    ) {
        if (_usdc == address(0) || _agent == address(0)) revert InvalidAddress();
        owner = msg.sender;
        usdc = _usdc;
        agent = _agent;
        defaultMaxPerTx = _defaultMaxPerTx;
        defaultDailyLimit = _defaultDailyLimit;
    }

    // --- External Functions ---

    /// @notice Deploy a PactVault for the calling user.
    /// @dev Reverts if user already has a vault. Uses CREATE2 for deterministic address.
    function createVault() external {
        if (vaults[msg.sender] != address(0)) revert VaultAlreadyExists();

        bytes32 salt = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        userSalts[msg.sender] = salt;

        PactVault vault = new PactVault{salt: salt}(
            msg.sender,        // owner = the user
            usdc,              // USDC contract
            agent,             // Pact agent
            defaultMaxPerTx,   // max per tx
            defaultDailyLimit  // daily limit
        );

        vaults[msg.sender] = address(vault);
        allVaults.push(address(vault));

        emit VaultCreated(msg.sender, address(vault), salt);
    }

    /// @notice Get the vault address for a user.
    /// @param user The user address.
    /// @return The vault address (address(0) if none).
    function getVault(address user) external view returns (address) {
        return vaults[user];
    }

    /// @notice Get all deployed vault addresses.
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    /// @notice Get total number of deployed vaults.
    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /// @notice Update the authorized agent (owner only).
    /// @param newAgent The new agent address.
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert InvalidAddress();
        emit AgentUpdated(agent, newAgent);
        agent = newAgent;
    }

    /// @notice Update default limits (owner only).
    /// @param _defaultMaxPerTx New max per transaction.
    /// @param _defaultDailyLimit New daily limit.
    function setDefaults(
        uint256 _defaultMaxPerTx,
        uint256 _defaultDailyLimit
    ) external onlyOwner {
        defaultMaxPerTx = _defaultMaxPerTx;
        defaultDailyLimit = _defaultDailyLimit;
        emit LimitsUpdated(_defaultMaxPerTx, _defaultDailyLimit);
    }

    /// @notice Transfer factory ownership (owner only).
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
