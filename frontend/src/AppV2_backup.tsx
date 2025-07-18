import { useState, useEffect } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from 'react-hot-toast';
import {
  fundEscrowETH,
  fundEscrowUSDC,
  releaseEscrowETH,
  releaseEscrowUSDC,
  completeMilestone,
  cancelEscrow,
  getWorkerBalance,
  getWorkerETHBalance,
  getWorkerUSDCBalance,
  getGasEstimate,
  getEscrowInfo,
  getUSDCBalance,
  ESCROW_ADDRESS,
  USDC_ADDRESS,
  type GasEstimate,
  type EscrowInfo
} from "./useFheFundingSimple";
import {
  switchToTargetNetwork,
  checkNetwork,
  getCurrentNetwork,
  TARGET_NETWORK
} from "./networkConfig";

export default function AppV2() {
  const [activeTab, setActiveTab] = useState("fund");
  const [paymentMode, setPaymentMode] = useState("ETH");
  const [releaseMode, setReleaseMode] = useState("ETH");
  
  // Form states
  const [amount, setAmount] = useState("0.1");
  const [releaseAmount, setReleaseAmount] = useState("0.3");
  const [workerAddr, setWorkerAddr] = useState("0x1Be5Bb48d675BD26cB42b408010761F1Af582300");
  const [milestoneId, setMilestoneId] = useState("1");
  const [milestoneDesc, setMilestoneDesc] = useState("Frontend development completed");
  
  // Status and data states
  const [status, setStatus] = useState("");
  const [ethBalance, setEthBalance] = useState("");
  const [usdcEscrowBalance, setUsdcEscrowBalance] = useState("");
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [escrowInfo, setEscrowInfo] = useState<EscrowInfo | null>(null);
  const [usdcBalance, setUsdcBalance] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    checkNetworkStatus();
  }, []);

  const loadInitialData = async () => {
    try {
      // Get user address
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);

      // Load gas estimates
      const gas = await getGasEstimate();
      setGasEstimate(gas);

      // Load USDC balance
      const usdcBal = await getUSDCBalance(address);
      setUsdcBalance(usdcBal);

      // Load escrow info for current user (as worker)
      const info = await getEscrowInfo(address);
      setEscrowInfo(info);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      const network = await getCurrentNetwork();
      const isCorrect = await checkNetwork();
      setCurrentNetwork(network);
      setIsCorrectNetwork(isCorrect);
    } catch (error) {
      console.error("Failed to check network:", error);
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToTargetNetwork();
      toast.success("Network switched successfully!");
      await checkNetworkStatus();
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      toast.error(error.message || "Failed to switch network");
    }
  };

  const tabStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    margin: "0 5px",
    border: "1px solid #ccc",
    backgroundColor: isActive ? "#007bff" : "#f8f9fa",
    color: isActive ? "white" : "black",
    cursor: "pointer",
    borderRadius: "5px 5px 0 0"
  });

  const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    margin: "10px 0",
    backgroundColor: "#f9f9f9"
  };

  const handleFund = async () => {
    setStatus("Encrypting & sending…");
    try {
      let txHash: string;
      if (paymentMode === "ETH") {
        txHash = await fundEscrowETH(workerAddr, amount);
      } else {
        txHash = await fundEscrowUSDC(workerAddr, amount);
      }
      
      setStatus("✅ Funded!");
      toast.success(
        <div>
          {paymentMode} funding successful! 
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline', marginLeft: '5px' }}
          >
            View on Etherscan
          </a>
        </div>
      );
      
      // Reload data
      loadInitialData();
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Funding failed");
      toast.error(e.shortMessage || e.message || "Funding failed");
    }
  };

  const handleRelease = async () => {
    setStatus("Releasing funds…");
    try {
      let txHash: string;
      if (releaseMode === "ETH") {
        txHash = await releaseEscrowETH(releaseAmount);
      } else {
        txHash = await releaseEscrowUSDC(releaseAmount);
      }
      
      setStatus("✅ Released!");
      toast.success(
        <div>
          {releaseMode} release successful! 
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline', marginLeft: '5px' }}
          >
            View on Etherscan
          </a>
        </div>
      );
      
      // Reload data
      loadInitialData();
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Release failed");
      toast.error(e.shortMessage || e.message || "Release failed");
    }
  };

  const handleMilestone = async () => {
    setStatus("Completing milestone…");
    try {
      const txHash = await completeMilestone(
        parseInt(milestoneId),
        milestoneDesc,
        releaseAmount,
        escrowInfo?.isETH || true
      );
      
      setStatus("✅ Milestone completed!");
      toast.success(
        <div>
          Milestone completed! 
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline', marginLeft: '5px' }}
          >
            View on Etherscan
          </a>
        </div>
      );
      
      // Reload data
      loadInitialData();
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Milestone failed");
      toast.error(e.shortMessage || e.message || "Milestone completion failed");
    }
  };

  const handleCancel = async () => {
    setStatus("Cancelling escrow…");
    try {
      const txHash = await cancelEscrow(workerAddr);
      
      setStatus("✅ Escrow cancelled!");
      toast.success(
        <div>
          Escrow cancelled and refunded! 
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'underline', marginLeft: '5px' }}
          >
            View on Etherscan
          </a>
        </div>
      );
      
      // Reload data
      loadInitialData();
    } catch (e: any) {
      console.error(e);
      setStatus("❌ Cancellation failed");
      toast.error(e.shortMessage || e.message || "Escrow cancellation failed");
    }
  };

  return (
    <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <h1>🔐 FHE Payment Vault</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        A privacy-preserving payment system built on Zama's FHEVM. Keep every payout—salary, bonus, or bulk airdrop—visible only to sender and receiver, without revealing amounts on-chain.
      </p>
      <p style={{ color: "#888", fontSize: "0.9em", marginBottom: 20 }}>
        Perfect for employers, DAOs, and individual payers funding encrypted balances for monthly salaries, freelance invoices, grant disbursements, and token airdrops.
      </p>

      {/* Network Status */}
      <div style={{
        ...cardStyle,
        backgroundColor: isCorrectNetwork ? "#d4edda" : "#f8d7da",
        borderColor: isCorrectNetwork ? "#c3e6cb" : "#f5c6cb"
      }}>
        <h3>🌐 Network Status</h3>
        <p><strong>Current Network:</strong> {currentNetwork?.name || "Unknown"} (Chain ID: {currentNetwork?.chainId || "Unknown"})</p>
        <p><strong>Target Network:</strong> {TARGET_NETWORK.name} (Chain ID: {TARGET_NETWORK.chainId})</p>
        <p><strong>Status:</strong> {isCorrectNetwork ? "✅ Connected to correct network" : "❌ Wrong network"}</p>
        {!isCorrectNetwork && (
          <div>
            <button 
              onClick={handleSwitchNetwork}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px"
              }}
            >
              Switch to {TARGET_NETWORK.name}
            </button>
            <details style={{ marginTop: "10px" }}>
              <summary style={{ cursor: "pointer", color: "#007bff" }}>
                Manual Setup Instructions
              </summary>
              <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                <p><strong>If automatic switching fails, manually add this network to MetaMask:</strong></p>
                <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
                  <li><strong>Network Name:</strong> {TARGET_NETWORK.name}</li>
                  <li><strong>RPC URL:</strong> {TARGET_NETWORK.rpcUrl}</li>
                  <li><strong>Chain ID:</strong> {TARGET_NETWORK.chainId}</li>
                  <li><strong>Currency Symbol:</strong> {TARGET_NETWORK.nativeCurrency.symbol}</li>
                </ul>
                <p style={{ fontSize: "0.9em", color: "#666" }}>
                  Go to MetaMask → Settings → Networks → Add Network → Add a network manually
                </p>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Contract Info */}
      <div style={cardStyle}>
        <h3>📋 Contract Information</h3>
        <p><strong>FHE Payment Vault:</strong> {ESCROW_ADDRESS}</p>
        <p><strong>Mock USDC Token:</strong> {USDC_ADDRESS}</p>
        <p><strong>Your Address:</strong> {userAddress}</p>
        <p><strong>Your USDC Balance:</strong> {usdcBalance} USDC</p>
      </div>

      {/* Gas Fee Info */}
      {gasEstimate && (
        <div style={cardStyle}>
          <h3>⛽ Gas Fee Awareness</h3>
          <p><strong>Current Gas Price:</strong> {ethers.formatUnits(gasEstimate.gasPrice, "gwei")} gwei</p>
          <p><strong>Estimated Gas:</strong> {gasEstimate.estimatedGas.toString()}</p>
          <p><strong>Estimated Cost:</strong> {gasEstimate.estimatedCostETH} ETH (~${gasEstimate.estimatedCostUSD})</p>
        </div>
      )}

      {/* Vault Info */}
      {escrowInfo && (
        <div style={cardStyle}>
          <h3>📊 Payment Vault Statistics</h3>
          <p><strong>Payer:</strong> {escrowInfo.payer}</p>
          <p><strong>Payment Type:</strong> {escrowInfo.isETH ? "ETH" : "USDC"}</p>
          <p><strong>Token Address:</strong> {escrowInfo.token}</p>
          <p><strong>Total Funded:</strong> {escrowInfo.isETH 
            ? ethers.formatEther(escrowInfo.totalFunded) + " ETH"
            : ethers.formatUnits(escrowInfo.totalFunded, 6) + " USDC"
          }</p>
          <p><strong>Total Claimed:</strong> {escrowInfo.isETH 
            ? ethers.formatEther(escrowInfo.totalReleased) + " ETH"
            : ethers.formatUnits(escrowInfo.totalReleased, 6) + " USDC"
          }</p>
          
          {/* Debug Info */}
          <details style={{ marginTop: "10px" }}>
            <summary style={{ cursor: "pointer", color: "#007bff" }}>🔍 Debug Info</summary>
            <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", fontSize: "0.9em" }}>
              <p><strong>Raw Total Funded:</strong> {escrowInfo.totalFunded}</p>
              <p><strong>Raw Total Released:</strong> {escrowInfo.totalReleased}</p>
              <p><strong>Is ETH:</strong> {escrowInfo.isETH.toString()}</p>
              <p><strong>Zero Address:</strong> {ethers.ZeroAddress}</p>
              <p><strong>USDC Address:</strong> {USDC_ADDRESS}</p>
            </div>
          </details>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button 
          style={tabStyle(activeTab === "fund")}
          onClick={() => setActiveTab("fund")}
        >
          💰 Fund Vault (Payer)
        </button>
        <button 
          style={tabStyle(activeTab === "release")}
          onClick={() => setActiveTab("release")}
        >
          💸 Claim Payment (Receiver)
        </button>
        <button 
          style={tabStyle(activeTab === "vesting")}
          onClick={() => setActiveTab("vesting")}
        >
          ⏰ Vesting Schedule
        </button>
        <button 
          style={tabStyle(activeTab === "milestone")}
          onClick={() => setActiveTab("milestone")}
        >
          🎯 Complete Milestone
        </button>
        <button 
          style={tabStyle(activeTab === "airdrop")}
          onClick={() => setActiveTab("airdrop")}
        >
          🪂 Prepare Airdrop
        </button>
      </div>

      {/* Fund Tab */}
      {activeTab === "fund" && (
        <div style={cardStyle}>
          <h3>💰 Fund Payment Vault</h3>
          
          <label>Payment Token:</label>
          <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
            <option value="ETH">ETH (Native)</option>
            <option value="USDC">USDC (Stablecoin)</option>
          </select>
          <br />

          <label>Receiver address:</label>
          <input 
            value={workerAddr} 
            onChange={e => setWorkerAddr(e.target.value)}
            onBlur={() => workerAddr && getEscrowInfo(workerAddr).then(setEscrowInfo)}
            placeholder="0x... (employee, contractor, grantee, etc.)"
          />
          <br />

          <label>Amount ({paymentMode}):</label>
          <input 
            value={amount} 
            onChange={e => setAmount(e.target.value)}
            placeholder="e.g., 0.5 for salary, 1000 for grant"
          />
          <br />

          <button onClick={handleFund}>
            Fund Vault with {paymentMode}
          </button>

          {/* Cancel Escrow - Only show if escrow exists and no releases have been made */}
          {escrowInfo && escrowInfo.payer !== ethers.ZeroAddress && escrowInfo.totalReleased === "0" && (
            <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", border: "1px solid #ffeaa7", borderRadius: "4px" }}>
              <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>⚠️ Cancel Escrow</h4>
              <p style={{ margin: "0 0 10px 0", fontSize: "0.9em", color: "#856404" }}>
                <strong>Warning:</strong> This will cancel the escrow and refund all funds to the payer. 
                Only available if no releases have been made yet.
              </p>
              <button 
                onClick={handleCancel}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                🚫 Cancel Escrow & Refund
              </button>
            </div>
          )}
        </div>
      )}

      {/* Release Tab */}
      {activeTab === "release" && (
        <div style={cardStyle}>
          <h3>💸 Claim Payment</h3>
          
          <label>Payment Token:</label>
          <select value={releaseMode} onChange={e => setReleaseMode(e.target.value)}>
            <option value="ETH">ETH (Native)</option>
            <option value="USDC">USDC (Stablecoin)</option>
          </select>
          <br />

          <label>Claim Amount ({releaseMode}):</label>
          <input 
            value={releaseAmount} 
            onChange={e => setReleaseAmount(e.target.value)}
            placeholder="e.g., 0.5 for partial, full amount for complete"
          />
          <br />

          <button onClick={handleRelease}>
            Claim {releaseMode} Payment
          </button>
          
          <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#e7f3ff", border: "1px solid #b3d9ff", borderRadius: "4px" }}>
            <p style={{ margin: "0", fontSize: "0.9em", color: "#0066cc" }}>
              💡 <strong>Tip:</strong> Make sure you have an active vault with {releaseMode} funds before claiming. 
              Check your vault balances below to see available funds.
            </p>
          </div>
        </div>
      )}

      {/* Vesting Tab */}
      {activeTab === "vesting" && (
        <div style={cardStyle}>
          <h3>⏰ Vesting Schedule</h3>
          
          <div style={{ padding: "20px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "4px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#6c757d" }}>🚧 Coming Soon</h4>
            <p style={{ margin: "0", color: "#6c757d" }}>
              Set up time-based payment releases with customizable vesting schedules for long-term contracts and employee compensation.
            </p>
            <div style={{ marginTop: "15px", fontSize: "0.9em", color: "#868e96" }}>
              <p><strong>Features in development:</strong></p>
              <ul style={{ textAlign: "left", margin: "10px 0", paddingLeft: "20px" }}>
                <li>Linear vesting schedules</li>
                <li>Cliff periods</li>
                <li>Custom release intervals</li>
                <li>Multi-beneficiary vesting</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Tab */}
      {activeTab === "milestone" && (
        <div style={cardStyle}>
          <h3>🎯 Complete Milestone</h3>
          
          <label>Milestone ID:</label>
          <input value={milestoneId} onChange={e => setMilestoneId(e.target.value)} />
          <br />

          <label>Description:</label>
          <input 
            value={milestoneDesc} 
            onChange={e => setMilestoneDesc(e.target.value)}
            placeholder="e.g., Frontend development completed"
          />
          <br />

          <label>Release Amount ({escrowInfo?.isETH ? "ETH" : "USDC"}):</label>
          <input value={releaseAmount} onChange={e => setReleaseAmount(e.target.value)} />
          <br />

          <button onClick={handleMilestone}>
            Complete Milestone & Release Payment
          </button>
        </div>
      )}

      {/* Airdrop Tab */}
      {activeTab === "airdrop" && (
        <div style={cardStyle}>
          <h3>🪂 Prepare Airdrop</h3>
          
          <div style={{ padding: "20px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "4px", textAlign: "center" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#6c757d" }}>🚧 Coming Soon</h4>
            <p style={{ margin: "0", color: "#6c757d" }}>
              Prepare confidential bulk airdrops with encrypted amounts for token distributions, rewards, and community incentives.
            </p>
            <div style={{ marginTop: "15px", fontSize: "0.9em", color: "#868e96" }}>
              <p><strong>Features in development:</strong></p>
              <ul style={{ textAlign: "left", margin: "10px 0", paddingLeft: "20px" }}>
                <li>CSV upload for bulk recipients</li>
                <li>Encrypted amount distribution</li>
                <li>Batch processing optimization</li>
                <li>Airdrop analytics dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Balance Check */}
      <div style={cardStyle}>
        <h3>🔍 Vault Balance Check</h3>
        <button
          onClick={async () => {
            setStatus("Getting vault balances…");
            try {
              const ethBal = await getWorkerETHBalance();
              const usdcBal = await getWorkerUSDCBalance();
              setEthBalance(ethBal);
              setUsdcEscrowBalance(usdcBal);
              setStatus("✅ Vault balances retrieved!");
            } catch (e) {
              console.error(e);
              setStatus("❌ Balance retrieval failed");
            }
          }}
        >
          Check My Vault Balances
        </button>
        
        <div style={{ marginTop: "10px" }}>
          <p><strong>ETH Vault Balance:</strong> {ethBalance || "0"} ETH</p>
          <p><strong>USDC Vault Balance:</strong> {usdcEscrowBalance || "0"} USDC</p>
        </div>
        
        <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f0f8ff", border: "1px solid #b3d9ff", borderRadius: "4px" }}>
          <p style={{ margin: "0", fontSize: "0.9em", color: "#0066cc" }}>
            🔐 <strong>Privacy Note:</strong> These balances are encrypted on-chain. Only you and the payer can see the actual amounts.
          </p>
        </div>
      </div>

      <p style={{ marginTop: 20 }}><strong>Status:</strong> {status}</p>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 8000,
            iconTheme: {
              primary: '#4aed88',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: '#fff',
            },
          },
        }}
      />
    </main>
  );
}
