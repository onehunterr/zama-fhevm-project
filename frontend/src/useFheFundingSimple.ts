import { ethers } from "ethers";
import EscrowAbi from "../../artifacts/contracts/SalaryEscrowSimple.sol/SalaryEscrowSimple.json";
import USDCAbi from "../../artifacts/contracts/MockUSDC.sol/MockUSDC.json";

// Contract addresses - Sepolia Testnet (Simple Version with Cancel Functionality)
export const ESCROW_ADDRESS = "0x01953BA70f844E87802F7124413d34BAFD4e120d";
export const USDC_ADDRESS = "0xF4F56D0d85F1eaEe0f99C2079aBb54a621BF46D4";

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
  const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, provider);
  
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
  const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, provider);
  
  try {
    const [payer, token, totalFunded, totalReleased] = await escrow.getEscrowInfo(workerAddress);
    
    return {
      payer,
      token,
      totalFunded: totalFunded.toString(),
      totalReleased: totalReleased.toString(),
      isETH: token === ethers.ZeroAddress
    };
  } catch (error) {
    // Return empty escrow info if no escrow exists
    return {
      payer: ethers.ZeroAddress,
      token: ethers.ZeroAddress,
      totalFunded: "0",
      totalReleased: "0",
      isETH: true
    };
  }
}

// Get USDC balance
export async function getUSDCBalance(address: string): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const usdc = new ethers.Contract(USDC_ADDRESS, USDCAbi.abi, provider);
  
  const balance = await usdc.balanceOf(address);
  return ethers.formatUnits(balance, 6); // USDC has 6 decimals
}

// Fund with ETH (simplified - no encryption)
export async function fundEscrowETH(
  workerAddr: string,
  ethAmount: string
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);

    const amount = ethers.parseEther(ethAmount);

    const tx = await escrow.fundETH(workerAddr, amount, {
      value: amount,
    });
    await tx.wait();
    
    console.log("ETH funding successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("ETH funding failed:", error);
    throw error;
  }
}

// Fund with USDC (simplified - no encryption)
export async function fundEscrowUSDC(
  workerAddr: string,
  usdcAmount: string
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDCAbi.abi, signer);

    const amount = ethers.parseUnits(usdcAmount, 6); // USDC has 6 decimals

    // First approve the escrow contract to spend USDC
    console.log("Approving USDC spending...");
    const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
    await approveTx.wait();

    // Then fund the escrow
    const tx = await escrow.fundToken(workerAddr, USDC_ADDRESS, amount);
    await tx.wait();
    
    console.log("USDC funding successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("USDC funding failed:", error);
    throw error;
  }
}

// Release ETH (simplified - no encryption)
export async function releaseEscrowETH(ethAmount: string): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
    const address = await signer.getAddress();

    // Pre-flight checks
    console.log("Checking escrow status for ETH release...");
    
    // Check if escrow exists
    try {
      const escrowInfo = await getEscrowInfo(address);
      console.log("Escrow info:", escrowInfo);
      
      if (escrowInfo.payer === ethers.ZeroAddress) {
        throw new Error("No escrow found for your address. You need to have funds deposited first.");
      }
      
      if (!escrowInfo.isETH) {
        throw new Error("This escrow is for USDC, not ETH. Please switch to USDC mode.");
      }
    } catch (error: any) {
      if (error.message.includes("No escrow found")) {
        throw new Error("No escrow found for your address. You need to have funds deposited first.");
      }
      throw error;
    }

    // Check balance
    const balance = await escrow.getBalance(address);
    const requestedAmount = ethers.parseEther(ethAmount);
    
    console.log("Current balance:", ethers.formatEther(balance), "ETH");
    console.log("Requested amount:", ethAmount, "ETH");
    
    if (balance < requestedAmount) {
      throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} ETH but requested ${ethAmount} ETH`);
    }

    console.log("All checks passed, executing release...");
    const tx = await escrow.releaseETH(requestedAmount);
    await tx.wait();
    
    console.log("ETH release successful:", tx.hash);
    return tx.hash;
  } catch (error: any) {
    console.error("ETH release failed:", error);
    
    // Provide more helpful error messages
    if (error.message.includes("No escrow found")) {
      throw new Error("No escrow found. Please ask someone to fund your vault first.");
    } else if (error.message.includes("Not an ETH escrow")) {
      throw new Error("This vault is for USDC, not ETH. Please switch to USDC mode.");
    } else if (error.message.includes("Insufficient balance")) {
      throw new Error(error.message);
    } else if (error.message.includes("missing revert data")) {
      throw new Error("Transaction failed. Please check that you have an active ETH escrow with sufficient balance.");
    }
    
    throw error;
  }
}

// Release USDC (simplified - no encryption)
export async function releaseEscrowUSDC(usdcAmount: string): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
    const address = await signer.getAddress();

    // Pre-flight checks
    console.log("Checking escrow status for USDC release...");
    
    // Check if escrow exists
    try {
      const escrowInfo = await getEscrowInfo(address);
      console.log("Escrow info:", escrowInfo);
      
      if (escrowInfo.payer === ethers.ZeroAddress) {
        throw new Error("No escrow found for your address. You need to have funds deposited first.");
      }
      
      if (escrowInfo.isETH) {
        throw new Error("This escrow is for ETH, not USDC. Please switch to ETH mode.");
      }
    } catch (error: any) {
      if (error.message.includes("No escrow found")) {
        throw new Error("No escrow found for your address. You need to have funds deposited first.");
      }
      throw error;
    }

    // Check balance
    const balance = await escrow.getBalance(address);
    const requestedAmount = ethers.parseUnits(usdcAmount, 6);
    
    console.log("Current balance:", ethers.formatUnits(balance, 6), "USDC");
    console.log("Requested amount:", usdcAmount, "USDC");
    
    if (balance < requestedAmount) {
      throw new Error(`Insufficient balance. You have ${ethers.formatUnits(balance, 6)} USDC but requested ${usdcAmount} USDC`);
    }

    console.log("All checks passed, executing release...");
    const tx = await escrow.releaseToken(requestedAmount);
    await tx.wait();
    
    console.log("USDC release successful:", tx.hash);
    return tx.hash;
  } catch (error: any) {
    console.error("USDC release failed:", error);
    
    // Provide more helpful error messages
    if (error.message.includes("No escrow found")) {
      throw new Error("No escrow found. Please ask someone to fund your vault first.");
    } else if (error.message.includes("Not a token escrow")) {
      throw new Error("This vault is for ETH, not USDC. Please switch to ETH mode.");
    } else if (error.message.includes("Insufficient balance")) {
      throw new Error(error.message);
    } else if (error.message.includes("missing revert data")) {
      throw new Error("Transaction failed. Please check that you have an active USDC escrow with sufficient balance.");
    }
    
    throw error;
  }
}

// Complete milestone (simplified - no encryption)
export async function completeMilestone(
  milestoneId: number,
  description: string,
  amount: string,
  isETH: boolean
): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);

    const clearAmount = isETH 
      ? ethers.parseEther(amount)
      : ethers.parseUnits(amount, 6);

    const tx = await escrow.completeMilestone(milestoneId, description, clearAmount);
    await tx.wait();
    
    console.log("Milestone completion successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Milestone completion failed:", error);
    throw error;
  }
}

// Cancel escrow and refund remaining balance to payer
export async function cancelEscrow(workerAddr: string): Promise<string> {
  try {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);

    const tx = await escrow.cancelEscrow(workerAddr);
    await tx.wait();
    
    console.log("Escrow cancellation successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Escrow cancellation failed:", error);
    throw error;
  }
}

// Get worker balance (simplified - no encryption)
export async function getWorkerBalance(): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
  
  const address = await signer.getAddress();
  const balance = await escrow.getBalance(address);
  return ethers.formatEther(balance);
}

// Get worker ETH escrow balance
export async function getWorkerETHBalance(): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
  
  const address = await signer.getAddress();
  
  try {
    // Check if user has an escrow and what type it is
    const info = await getEscrowInfo(address);
    console.log("ETH Balance Check - Escrow info:", info);
    
    if (info.payer !== ethers.ZeroAddress) {
      const balance = await escrow.getBalance(address);
      console.log("Raw balance:", balance.toString());
      
      if (info.isETH) {
        // This is an ETH escrow, return the balance
        return ethers.formatEther(balance);
      } else {
        // This is a USDC escrow, but user is asking for ETH balance
        console.log("Warning: User has USDC escrow but asking for ETH balance");
        return "0";
      }
    }
    return "0";
  } catch (error) {
    console.log("ETH balance check error:", error);
    return "0";
  }
}

// Get worker USDC escrow balance
export async function getWorkerUSDCBalance(): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const escrow = new ethers.Contract(ESCROW_ADDRESS, EscrowAbi.abi, signer);
  
  const address = await signer.getAddress();
  
  try {
    // Check if user has an escrow and what type it is
    const info = await getEscrowInfo(address);
    console.log("USDC Balance Check - Escrow info:", info);
    
    if (info.payer !== ethers.ZeroAddress) {
      const balance = await escrow.getBalance(address);
      console.log("Raw balance:", balance.toString());
      
      if (!info.isETH) {
        // This is a USDC escrow, return the balance
        return ethers.formatUnits(balance, 6); // USDC has 6 decimals
      } else {
        // This is an ETH escrow, but user is asking for USDC balance
        console.log("Warning: User has ETH escrow but asking for USDC balance");
        return "0";
      }
    }
    return "0";
  } catch (error) {
    console.log("USDC balance check error:", error);
    return "0";
  }
}
