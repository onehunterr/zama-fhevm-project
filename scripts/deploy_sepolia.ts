import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying to Sepolia testnet...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)));

  // Deploy Mock USDC first
  console.log("\n📄 Deploying Mock USDC...");
  const mockUSDC = await hre.ethers.deployContract("MockUSDC");
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", usdcAddress);

  // Deploy Enhanced Salary Escrow
  console.log("\n📄 Deploying SalaryEscrowFHEV2...");
  const escrow = await hre.ethers.deployContract("SalaryEscrowFHEV2", [usdcAddress]);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ SalaryEscrowFHEV2 deployed to:", escrowAddress);

  // Mint USDC to test accounts
  console.log("\n💰 Minting test USDC...");
  const testAccounts = [
    deployer.address,
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", // Account #4
  ];

  for (const account of testAccounts) {
    const mintTx = await mockUSDC.mint(account, hre.ethers.parseUnits("10000", 6)); // 10,000 USDC
    await mintTx.wait();
    console.log(`✅ Minted 10,000 USDC to ${account}`);
  }

  // Update frontend configuration
  console.log("\n📝 Contract addresses for frontend:");
  console.log("ESCROW_V2_ADDRESS =", `"${escrowAddress}"`);
  console.log("USDC_ADDRESS =", `"${usdcAddress}"`);

  // Verification info
  console.log("\n🔍 Verification commands:");
  console.log(`npx hardhat verify --network sepolia ${usdcAddress}`);
  console.log(`npx hardhat verify --network sepolia ${escrowAddress} ${usdcAddress}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log("- Mock USDC:", usdcAddress);
  console.log("- Enhanced Escrow:", escrowAddress);
  console.log("- Network: Sepolia Testnet");
  console.log("- Test USDC minted to 5 accounts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
