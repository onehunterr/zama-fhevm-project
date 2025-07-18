import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Enhanced Salary Escrow with ERC-20 support...");

  // Deploy Mock USDC for testing
  console.log("📄 Deploying Mock USDC...");
  const usdc = await ethers.deployContract("MockUSDC");
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Mock USDC deployed to:", usdcAddress);

  // Deploy Enhanced Salary Escrow
  console.log("📄 Deploying SalaryEscrowFHEV2...");
  const escrowV2 = await ethers.deployContract("SalaryEscrowFHEV2");
  await escrowV2.waitForDeployment();
  const escrowV2Address = await escrowV2.getAddress();
  console.log("✅ SalaryEscrowFHEV2 deployed to:", escrowV2Address);

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
  console.log("Enhanced Escrow:", escrowV2Address);
  console.log("\n📋 Next Steps:");
  console.log("1. Update frontend to use new contract addresses");
  console.log("2. Test ERC-20 funding and releases");
  console.log("3. Monitor events for The Graph integration");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
