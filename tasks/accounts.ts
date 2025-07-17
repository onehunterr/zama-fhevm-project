import { task } from "hardhat/config";

task("accounts", "Print the list of signers", async (_, { ethers }) => {
  const signers = await ethers.getSigners();
  for (const s of signers) {
    console.log(s.address);
  }
});
