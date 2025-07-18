import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { SalaryEscrowFHE } from "../types";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("SalaryEscrowFHE", () => {
  let employer: any, worker: any, escrow: SalaryEscrowFHE;
  let escrowAddress: string;

  before(async () => {
    [employer, worker] = await ethers.getSigners();
    escrow = await (await ethers.getContractFactory("SalaryEscrowFHE")).deploy();
    escrowAddress = await escrow.getAddress();
  });

  it("fund → release keeps encrypted balance", async () => {
    /* employer funds 1 ETH (1e18 wei) */
    const fundAmount = ethers.parseEther("1").toString();
    const fundCipher = await fhevm
      .createEncryptedInput(escrowAddress, employer.address)
      .add64(BigInt(fundAmount))
      .encrypt();
    
    await escrow.connect(employer).fund(
      worker.address, 
      fundCipher.handles[0], 
      fundCipher.inputProof, 
      { value: ethers.parseEther("1") }
    );

    /* worker releases 0.3 ETH */
    const releaseAmount = ethers.parseEther("0.3").toString();
    const relCipher = await fhevm
      .createEncryptedInput(escrowAddress, worker.address)
      .add64(BigInt(releaseAmount))
      .encrypt();
    
    await escrow.connect(worker).release(
      relCipher.handles[0], 
      relCipher.inputProof, 
      ethers.parseEther("0.3")
    );

    /* decrypted balance should be 0.7 ETH */
    const encryptedBalance = await escrow.connect(worker).encryptedBalance();
    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      escrowAddress,
      worker,
    );
    expect(clearBalance.toString()).to.equal(ethers.parseEther("0.7").toString());
  });
});
