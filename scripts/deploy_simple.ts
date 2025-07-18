import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Simple Salary Escrow to Sepolia testnet...");

  // Deploy Mock USDC for testing
  console.log("📄 Deploying Mock USDC...");
  const usdc = await ethers.deployContract("MockUSDC");
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Mock USDC deployed to:", usdcAddress);

  // Deploy Simple Salary Escrow
  console.log("📄 Deploying SalaryEscrowSimple...");
  const escrow = await ethers.deployContract("SalaryEscrowSimple");
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ SalaryEscrowSimple deployed to:", escrowAddress);

  // Get deployer address for minting tokens
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Mint some USDC to test accounts
  console.log("💰 Minting test USDC...");
  const accounts = await ethers.getSigners();
  for (let i = 0; i < 5; i++) {
    const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC (6 decimals)
    await usdc.mint(accounts[i].address, mintAmount);
    console.log(`   Minted 10,000 USDC to ${accounts[i].address}`);
  }

  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Mock USDC:", usdcAddress);
  console.log("Simple Escrow:", escrowAddress);
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend to use new contract addresses");
  console.log("2. Test ETH and USDC funding/releases");
  console.log("3. Test milestone completion");
  console.log("4. No FHE encryption - plaintext amounts for Sepolia testing");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
