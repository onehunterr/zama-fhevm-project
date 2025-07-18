// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Enhanced Confidential Salary Escrow (FHEVM) with ERC-20 Support
/// @notice Supports both ETH and ERC-20 tokens (like USDC) for confidential payroll
contract SalaryEscrowFHEV2 {
    using SafeERC20 for IERC20;

    struct Escrow {
        euint64 balance;        // encrypted remaining salary
        address payer;          // employer
        address token;          // ERC-20 token address (address(0) for ETH)
        uint256 totalFunded;    // total amount funded (for events)
        uint256 totalReleased;  // total amount released (for events)
    }

    mapping(address => Escrow) private _escrows;

    // Events for The Graph subgraph indexing
    event Funded(
        address indexed worker,
        address indexed payer,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 totalFunded
    );

    event Released(
        address indexed worker,
        address indexed token,
        uint256 amount,
        uint256 timestamp,
        uint256 totalReleased,
        uint256 gasUsed
    );

    event MilestoneCompleted(
        address indexed worker,
        uint256 indexed milestoneId,
        uint256 amount,
        string description
    );

    /*─────────────────────────── Employer functions ─────────────────────────*/

    /// @dev Fund with ETH
    function fundETH(address worker, externalEuint64 encAmt, bytes calldata proof) external payable {
        require(msg.value > 0, "No ETH sent");
        
        euint64 amt = FHE.fromExternal(encAmt, proof);
        Escrow storage e = _escrows[worker];
        
        if (e.payer == address(0)) {
            e.payer = msg.sender;
            e.token = address(0); // ETH
        }
        require(e.payer == msg.sender, "not payer");
        require(e.token == address(0), "escrow is for tokens");

        e.balance = FHE.add(e.balance, amt);
        e.totalFunded += msg.value;
        FHE.allow(e.balance, worker);

        emit Funded(worker, msg.sender, address(0), msg.value, block.timestamp, e.totalFunded);
    }

    /// @dev Fund with ERC-20 tokens (e.g., USDC)
    function fundToken(
        address worker,
        address token,
        uint256 amount,
        externalEuint64 encAmt,
        bytes calldata proof
    ) external {
        require(amount > 0, "Amount must be > 0");
        require(token != address(0), "Invalid token");

        euint64 amt = FHE.fromExternal(encAmt, proof);
        Escrow storage e = _escrows[worker];
        
        if (e.payer == address(0)) {
            e.payer = msg.sender;
            e.token = token;
        }
        require(e.payer == msg.sender, "not payer");
        require(e.token == token, "wrong token");

        // Transfer tokens from employer to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        e.balance = FHE.add(e.balance, amt);
        e.totalFunded += amount;
        FHE.allow(e.balance, worker);

        emit Funded(worker, msg.sender, token, amount, block.timestamp, e.totalFunded);
    }

    /*─────────────────────────── Worker functions ───────────────────────────*/

    function releaseETH(externalEuint64 encAmt, bytes calldata proof, uint256 clearAmt) external {
        uint256 gasStart = gasleft();
        
        Escrow storage e = _escrows[msg.sender];
        require(e.payer != address(0), "no escrow");
        require(e.token == address(0), "not ETH escrow");

        euint64 amt = FHE.fromExternal(encAmt, proof);
        e.balance = FHE.sub(e.balance, amt);
        e.totalReleased += clearAmt;
        FHE.allow(e.balance, msg.sender);

        // Transfer ETH to worker
        (bool ok, ) = msg.sender.call{ value: clearAmt }("");
        require(ok, "ETH transfer failed");

        uint256 gasUsed = gasStart - gasleft();
        emit Released(msg.sender, address(0), clearAmt, block.timestamp, e.totalReleased, gasUsed);
    }

    function releaseToken(
        externalEuint64 encAmt,
        bytes calldata proof,
        uint256 clearAmt
    ) external {
        uint256 gasStart = gasleft();
        
        Escrow storage e = _escrows[msg.sender];
        require(e.payer != address(0), "no escrow");
        require(e.token != address(0), "not token escrow");

        euint64 amt = FHE.fromExternal(encAmt, proof);
        e.balance = FHE.sub(e.balance, amt);
        e.totalReleased += clearAmt;
        FHE.allow(e.balance, msg.sender);

        // Transfer tokens to worker
        IERC20(e.token).safeTransfer(msg.sender, clearAmt);

        uint256 gasUsed = gasStart - gasleft();
        emit Released(msg.sender, e.token, clearAmt, block.timestamp, e.totalReleased, gasUsed);
    }

    /// @dev Mark milestone completion with description
    function completeMilestone(
        uint256 milestoneId,
        string calldata description,
        externalEuint64 encAmt,
        bytes calldata proof,
        uint256 clearAmt
    ) external {
        uint256 gasStart = gasleft();
        
        Escrow storage e = _escrows[msg.sender];
        require(e.payer != address(0), "no escrow");

        euint64 amt = FHE.fromExternal(encAmt, proof);
        e.balance = FHE.sub(e.balance, amt);
        e.totalReleased += clearAmt;
        FHE.allow(e.balance, msg.sender);

        // Release payment based on token type
        if (e.token == address(0)) {
            // ETH release
            (bool ok, ) = msg.sender.call{ value: clearAmt }("");
            require(ok, "ETH transfer failed");
        } else {
            // Token release
            IERC20(e.token).safeTransfer(msg.sender, clearAmt);
        }

        uint256 gasUsed = gasStart - gasleft();
        
        // Emit both release and milestone events
        emit Released(msg.sender, e.token, clearAmt, block.timestamp, e.totalReleased, gasUsed);
        emit MilestoneCompleted(msg.sender, milestoneId, clearAmt, description);
    }

    /*─────────────────────────── View helpers ───────────────────────────────*/

    function encryptedBalance() external view returns (euint64) {
        return _escrows[msg.sender].balance;
    }

    function getEscrowInfo(address worker) external view returns (
        address payer,
        address token,
        uint256 totalFunded,
        uint256 totalReleased
    ) {
        Escrow storage e = _escrows[worker];
        return (e.payer, e.token, e.totalFunded, e.totalReleased);
    }

    /// @dev Get current gas price for fee estimation
    function getCurrentGasPrice() external view returns (uint256) {
        return tx.gasprice;
    }

    /// @dev Estimate gas cost for release operation
    function estimateReleaseGas() external pure returns (uint256) {
        return 150000; // Estimated gas for release operation
    }

    receive() external payable {}
}
