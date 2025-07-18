// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SalaryEscrowSimple
 * @dev A simplified salary escrow contract for Sepolia testnet without FHE encryption
 * This version stores amounts in plaintext for testing purposes
 */
contract SalaryEscrowSimple is ReentrancyGuard {
    struct Escrow {
        address payer;
        address token; // address(0) for ETH, token address for ERC20
        uint256 totalFunded;
        uint256 totalReleased;
        bool exists;
    }

    struct Milestone {
        uint256 id;
        string description;
        uint256 amount;
        bool completed;
        uint256 timestamp;
    }

    mapping(address => Escrow) public escrows; // worker => escrow
    mapping(address => Milestone[]) public milestones; // worker => milestones
    mapping(address => uint256) public balances; // worker => available balance

    event EscrowFunded(address indexed worker, address indexed payer, address token, uint256 amount);
    event EscrowReleased(address indexed worker, uint256 amount, address token);
    event MilestoneCompleted(address indexed worker, uint256 milestoneId, string description, uint256 amount);
    event EscrowCancelled(address indexed worker, address indexed payer, uint256 refundAmount, address token);

    /**
     * @dev Fund escrow with ETH
     */
    function fundETH(address worker, uint256 amount) external payable nonReentrant {
        require(msg.value == amount, "ETH amount mismatch");
        require(worker != address(0), "Invalid worker address");

        if (!escrows[worker].exists) {
            escrows[worker] = Escrow({
                payer: msg.sender,
                token: address(0),
                totalFunded: 0,
                totalReleased: 0,
                exists: true
            });
        }

        escrows[worker].totalFunded += amount;
        balances[worker] += amount;

        emit EscrowFunded(worker, msg.sender, address(0), amount);
    }

    /**
     * @dev Fund escrow with ERC20 token
     */
    function fundToken(address worker, address token, uint256 amount) external nonReentrant {
        require(worker != address(0), "Invalid worker address");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        if (!escrows[worker].exists) {
            escrows[worker] = Escrow({
                payer: msg.sender,
                token: token,
                totalFunded: 0,
                totalReleased: 0,
                exists: true
            });
        }

        escrows[worker].totalFunded += amount;
        balances[worker] += amount;

        emit EscrowFunded(worker, msg.sender, token, amount);
    }

    /**
     * @dev Release ETH to worker
     */
    function releaseETH(uint256 amount) external nonReentrant {
        require(escrows[msg.sender].exists, "No escrow found");
        require(escrows[msg.sender].token == address(0), "Not an ETH escrow");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        escrows[msg.sender].totalReleased += amount;

        payable(msg.sender).transfer(amount);

        emit EscrowReleased(msg.sender, amount, address(0));
    }

    /**
     * @dev Release ERC20 tokens to worker
     */
    function releaseToken(uint256 amount) external nonReentrant {
        require(escrows[msg.sender].exists, "No escrow found");
        require(escrows[msg.sender].token != address(0), "Not a token escrow");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        address token = escrows[msg.sender].token;
        balances[msg.sender] -= amount;
        escrows[msg.sender].totalReleased += amount;

        IERC20(token).transfer(msg.sender, amount);

        emit EscrowReleased(msg.sender, amount, token);
    }

    /**
     * @dev Complete milestone and release payment
     */
    function completeMilestone(
        uint256 milestoneId,
        string memory description,
        uint256 amount
    ) external nonReentrant {
        require(escrows[msg.sender].exists, "No escrow found");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Add milestone
        milestones[msg.sender].push(Milestone({
            id: milestoneId,
            description: description,
            amount: amount,
            completed: true,
            timestamp: block.timestamp
        }));

        // Release payment
        balances[msg.sender] -= amount;
        escrows[msg.sender].totalReleased += amount;

        if (escrows[msg.sender].token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(escrows[msg.sender].token).transfer(msg.sender, amount);
        }

        emit MilestoneCompleted(msg.sender, milestoneId, description, amount);
        emit EscrowReleased(msg.sender, amount, escrows[msg.sender].token);
    }

    /**
     * @dev Cancel escrow and refund remaining balance to payer
     * Only allowed if worker hasn't started releases (totalReleased == 0)
     */
    function cancelEscrow(address worker) external nonReentrant {
        require(escrows[worker].exists, "No escrow found");
        require(escrows[worker].payer == msg.sender, "Only payer can cancel");
        require(escrows[worker].totalReleased == 0, "Cannot cancel after releases started");
        require(balances[worker] > 0, "No balance to refund");

        uint256 refundAmount = balances[worker];
        address token = escrows[worker].token;

        // Clear the balance
        balances[worker] = 0;
        
        // Mark escrow as cancelled by setting exists to false
        escrows[worker].exists = false;

        // Refund the payer
        if (token == address(0)) {
            // Refund ETH
            payable(msg.sender).transfer(refundAmount);
        } else {
            // Refund ERC20 tokens
            IERC20(token).transfer(msg.sender, refundAmount);
        }

        emit EscrowCancelled(worker, msg.sender, refundAmount, token);
    }

    /**
     * @dev Get escrow information
     */
    function getEscrowInfo(address worker) external view returns (
        address payer,
        address token,
        uint256 totalFunded,
        uint256 totalReleased
    ) {
        require(escrows[worker].exists, "No escrow found");
        Escrow memory escrow = escrows[worker];
        return (escrow.payer, escrow.token, escrow.totalFunded, escrow.totalReleased);
    }

    /**
     * @dev Get worker's available balance
     */
    function getBalance(address worker) external view returns (uint256) {
        return balances[worker];
    }

    /**
     * @dev Get milestones for worker
     */
    function getMilestones(address worker) external view returns (Milestone[] memory) {
        return milestones[worker];
    }

    /**
     * @dev Get current gas price (for gas estimation)
     */
    function getCurrentGasPrice() external view returns (uint256) {
        return tx.gasprice;
    }

    /**
     * @dev Estimate gas for release operation
     */
    function estimateReleaseGas() external pure returns (uint256) {
        return 50000; // Estimated gas for release operation
    }
}
