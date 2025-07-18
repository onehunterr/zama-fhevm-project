import { ethers } from "hardhat";

async function main() {
  const escrow = await ethers.deployContract("SalaryEscrowFHE");
  await escrow.waitForDeployment();
  console.log("SalaryEscrowFHE deployed to:", await escrow.getAddress());
}

main().catch((e) => { console.error(e); process.exit(1); });
