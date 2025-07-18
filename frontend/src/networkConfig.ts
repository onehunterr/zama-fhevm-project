export const NETWORKS = {
  LOCALHOST: {
    chainId: 31337,
    name: "Hardhat Local",
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: null, // No block explorer for local
  },
  SEPOLIA: {
    chainId: 11155111,
    name: "Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

export const TARGET_NETWORK = NETWORKS.SEPOLIA; // Change this for different environments

// Function to add/switch to the correct network in MetaMask
export async function switchToTargetNetwork() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const chainIdHex = `0x${TARGET_NETWORK.chainId.toString(16)}`;
  console.log(`Attempting to switch to chain ID: ${chainIdHex} (${TARGET_NETWORK.chainId})`);

  try {
    // Try to switch to the target network first
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    console.log("Successfully switched to network");
  } catch (switchError: any) {
    console.log("Switch failed, attempting to add network:", switchError);
    
    // If the network doesn't exist (error 4902) or is unrecognized, add it
    if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain ID")) {
      try {
        const networkParams = {
          chainId: chainIdHex,
          chainName: TARGET_NETWORK.name,
          rpcUrls: [TARGET_NETWORK.rpcUrl],
          nativeCurrency: TARGET_NETWORK.nativeCurrency,
        };
        
        console.log("Adding network with params:", networkParams);
        
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [networkParams],
        });
        
        console.log("Network added successfully");
      } catch (addError: any) {
        console.error("Failed to add network:", addError);
        throw new Error(`Failed to add network: ${addError.message || addError}`);
      }
    } else {
      console.error("Unexpected switch error:", switchError);
      throw new Error(`Failed to switch network: ${switchError.message || switchError}`);
    }
  }
}

// Function to check if we're on the correct network
export async function checkNetwork() {
  if (!(window as any).ethereum) {
    return false;
  }

  try {
    const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId, 16);
    return currentChainId === TARGET_NETWORK.chainId;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
}

// Function to get current network info
export async function getCurrentNetwork() {
  if (!(window as any).ethereum) {
    return null;
  }

  try {
    const chainId = await (window as any).ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId, 16);
    
    if (currentChainId === NETWORKS.LOCALHOST.chainId) {
      return NETWORKS.LOCALHOST;
    } else if (currentChainId === NETWORKS.SEPOLIA.chainId) {
      return NETWORKS.SEPOLIA;
    } else {
      return {
        chainId: currentChainId,
        name: `Unknown Network (${currentChainId})`,
        rpcUrl: "Unknown",
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      };
    }
  } catch (error) {
    console.error("Error getting current network:", error);
    return null;
  }
}
