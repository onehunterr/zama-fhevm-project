import { ethers } from "ethers";
import EscrowAbi from "../../artifacts/contracts/SalaryEscrowFHE.sol/SalaryEscrowFHE.json";

export async function getClearBalance(escrowAddr: string): Promise<string> {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const escrow = new ethers.Contract(escrowAddr, EscrowAbi.abi, signer);
  
  const cipher = await escrow.encryptedBalance();
  return await (window as any).fhevm.decrypt(cipher); // returns wei as string
}

export async function releaseEscrow(
  escrowAddr: string,
  ethAmount: string        // e.g. "0.3"
): Promise<string> {
  try {
    // 1. Ask MetaMask for provider + signer
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    // 2. For local development, create mock encrypted data
    // In a real implementation, this would use proper FHE encryption
    const mockEncryptedAmount = ethers.randomBytes(32); // Mock encrypted data
    const mockProof = ethers.randomBytes(64); // Mock proof

    // 3. Call release() with mock data
    const escrow = new ethers.Contract(escrowAddr, EscrowAbi.abi, signer);
    const tx = await escrow.release(
      mockEncryptedAmount,
      mockProof,
      ethers.parseEther(ethAmount) // clearAmt parameter
    );
    await tx.wait();
    
    console.log("Release transaction successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Release transaction failed:", error);
    throw error;
  }
}

export async function fundEscrow(
  escrowAddr: string,
  worker: string,
  ethAmount: string        // e.g. "0.5"
): Promise<string> {
  try {
    // 1. Ask MetaMask for provider + signer
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();

    // 2. For local development, create mock encrypted data
    // In a real implementation, this would use proper FHE encryption
    const mockEncryptedAmount = ethers.randomBytes(32); // Mock encrypted data
    const mockProof = ethers.randomBytes(64); // Mock proof

    // 3. Call fund() with mock data
    const escrow = new ethers.Contract(escrowAddr, EscrowAbi.abi, signer);
    const tx = await escrow.fund(
      worker,
      mockEncryptedAmount,
      mockProof,
      {
        value: ethers.parseEther(ethAmount),
      }
    );
    await tx.wait();
    
    console.log("Transaction successful:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
