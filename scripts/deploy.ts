import { ethers } from "hardhat";

async function main() {
  const counter = await ethers.deployContract("FHECounter");
  await counter.waitForDeployment();

  console.log("FHECounter deployed to:", counter.target);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
