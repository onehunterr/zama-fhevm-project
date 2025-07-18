import { ethers } from "ethers";
import { createInstance } from "fhevmjs";
import EscrowAbi from "../../artifacts/contracts/SalaryEscrowFHEV2.sol/SalaryEscrowFHEV2.json";
import USDCAbi from "../../artifacts/contracts/MockUSDC.sol/MockUSDC.json";

// Contract addresses - Sepolia Testnet
export const ESCROW_V2_ADDRESS = "0xb64b8E92ac75E7D396020f1f978B9Cc5644f8a06";
export const USDC_ADDRESS = "0xB7E6c224dF6Fe43b9911346a06C5d4fFb77d6d25";

export interface GasEstimate {
  gasPrice: bigint;
  estimatedGas: bigint;
  estimatedCostETH: string;
  estimatedCostUSD: string;
}

export interface EscrowInfo {
  payer: string;
  token: string;
  totalFunded: string;
  totalReleased: string;
  isETH: boolean;
}

// Get gas price and estimate costs
export async function getGasEstimate(): Promise<GasEstimate> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, provider);
  
  const gasPrice = await escrow.getCurrentGasPrice();
  const estimatedGas = await escrow.estimateReleaseGas();
  const estimatedCostWei = gasPrice * estimatedGas;
  const estimatedCostETH = ethers.formatEther(estimatedCostWei);
  
  // Mock ETH price for USD calculation (in real app, fetch from API)
  const ethPriceUSD = 2500;
  const estimatedCostUSD = (parseFloat(estimatedCostETH) * ethPriceUSD).toFixed(2);
  
  return {
    gasPrice,
    estimatedGas,
    estimatedCostETH,
    estimatedCostUSD
  };
}

// Get escrow information
export async function getEscrowInfo(workerAddress: string): Promise<EscrowInfo> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, provider);
  
  const [payer, token, totalFunded, totalReleased] = await escrow.getEscrowInfo(workerAddress);
  
  return {
    payer,
    token,
    totalFunded: totalFunded.toString(),
    totalReleased: totalReleased.toString(),
    isETH: token === ethers.ZeroAddress
  };
}

// Get USDC balance
export async function getUSDCBalance(address: string): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDCAbi.abi, provider);
  
  const balance = await usdc.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDC has 6 decimals
}

// Fund with ETH
export async function fundEscrowETH(
  workerAddr: string,
  ethAmount: string
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);

    // Mock encrypted data for local development
    const mockEncryptedAmount = ethers.randomBytes(32);
    const mockProof = ethers.randomBytes(64);

    const tx = await escrow.fundETH(
      workerAddr,
      mockEncryptedAmount,
      mockProof,
      {
        value: ethers.parseEther(ethAmount),
      }
    );
    await tx.wait();
    
    console.log("ETH funding successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("ETH funding failed:", error);
    throw error;
  }
}

// Fund with USDC
export async function fundEscrowUSDC(
  workerAddr: string,
  usdcAmount: string
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDCAbi.abi, signer);

    const amount = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

    // First approve the escrow contract to spend USDC
    console.log("Approving USDC spending...");
    const approveTx = await usdc.approve(ESCROW_V2_ADDRESS, amount);
    await approveTx.wait();

    // Mock encrypted data for local development
    const mockEncryptedAmount = ethers.randomBytes(32);
    const mockProof = ethers.randomBytes(64);

    // Then fund the escrow
    const tx = await escrow.fundToken(
      workerAddr,
      USDC_ADDRESS,
      amount,
      mockEncryptedAmount,
      mockProof
    );
    await tx.wait();
    
    console.log("USDC funding successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("USDC funding failed:", error);
    throw error;
  }
}

// Release ETH
export async function releaseEscrowETH(ethAmount: string): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);

    const mockEncryptedAmount = ethers.randomBytes(32);
    const mockProof = ethers.randomBytes(64);

    const tx = await escrow.releaseETH(
      mockEncryptedAmount,
      mockProof,
      ethers.parseEther(ethAmount)
    );
    await tx.wait();
    
    console.log("ETH release successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("ETH release failed:", error);
    throw error;
  }
}

// Release USDC
export async function releaseEscrowUSDC(usdcAmount: string): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);

    const mockEncryptedAmount = ethers.randomBytes(32);
    const mockProof = ethers.randomBytes(64);

    const tx = await escrow.releaseToken(
      mockEncryptedAmount,
      mockProof,
      ethers.parseUnits(usdcAmount, 6)
    );
    await tx.wait();
    
    console.log("USDC release successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("USDC release failed:", error);
    throw error;
  }
}

// Complete milestone
export async function completeMilestone(
  milestoneId: number,
  description: string,
  amount: string,
  isETH: boolean
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);

    const mockEncryptedAmount = ethers.randomBytes(32);
    const mockProof = ethers.randomBytes(64);

    const clearAmount = isETH 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, 6);

    const tx = await escrow.completeMilestone(
      milestoneId,
      description,
      mockEncryptedAmount,
      mockProof,
      clearAmount
    );
    await tx.wait();
    
    console.log("Milestone completion successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Milestone completion failed:", error);
    throw error;
  }
}

// Get encrypted balance (same as before)
export async function getClearBalance(): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const escrow = new ethers.Contract(ESCROW_V2_ADDRESS, EscrowAbi.abi, signer);
  
  const cipher = await escrow.encryptedBalance();
  return await (window as any).fhevm.decrypt(cipher);
}
