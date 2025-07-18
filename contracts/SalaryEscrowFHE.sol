// SPDX‑License‑Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

/// @title Confidential Salary Escrow (FHEVM)
/// @notice Employer funds encrypted salary; worker releases milestones without exposing amounts.
contract SalaryEscrowFHE {
    struct Escrow {
        euint64 balance;   // encrypted remaining salary
        address payer;     // employer
    }

    mapping(address => Escrow) private _escrows;

    /*─────────────────────────── Employer functions ─────────────────────────*/

    /// @dev Encrypt amount client‑side → send (ciphertext, proof)
    function fund(address worker, externalEuint64 encAmt, bytes calldata proof) external payable {
        euint64 amt = FHE.fromExternal(encAmt, proof);

        Escrow storage e = _escrows[worker];
        if (e.payer == address(0)) e.payer = msg.sender;
        require(e.payer == msg.sender, "not payer");

        e.balance = FHE.add(e.balance, amt);
        FHE.allow(e.balance, worker);               // worker can decrypt
    }

    /// @dev Cancel escrow and refund remaining encrypted balance to payer
    /// Requires FHE.decrypt(balance) to get the clear amount for refund
    function cancel(address worker) external {
        Escrow storage e = _escrows[worker];
        require(e.payer == msg.sender, "only payer can cancel");
        require(e.payer != address(0), "no escrow found");

        // Decrypt the remaining balance to get clear amount for refund
        uint256 clearBalance = FHE.decrypt(e.balance);
        require(clearBalance > 0, "no balance to refund");

        // Clear the encrypted balance
        e.balance = FHE.asEuint64(0);
        
        // Reset the escrow
        e.payer = address(0);

        // Refund the clear amount to the payer
        (bool ok, ) = msg.sender.call{ value: clearBalance }("");
        require(ok, "refund transfer failed");
    }

    /*─────────────────────────── Worker functions ───────────────────────────*/

    function release(externalEuint64 encAmt, bytes calldata proof, uint256 clearAmt) external {
        Escrow storage e = _escrows[msg.sender];
        require(e.payer != address(0), "no escrow");

        euint64 amt = FHE.fromExternal(encAmt, proof);
        e.balance = FHE.sub(e.balance, amt);        // FHE underflow‑safe
        FHE.allow(e.balance, msg.sender);

        // withdraw ETH using the clear amount (must match encrypted amount)
        (bool ok, ) = msg.sender.call{ value: clearAmt }("");
        require(ok, "transfer failed");
    }

    /*─────────────────────────── View helpers ───────────────────────────────*/

    function encryptedBalance() external view returns (euint64) {
        return _escrows[msg.sender].balance;
    }

    receive() external payable {}
}
