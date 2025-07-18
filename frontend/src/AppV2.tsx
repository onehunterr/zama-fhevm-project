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
    <main style={{ padding: 32, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header Section */}
      <div style={{ 
        border: "3px solid #dc3545", 
        borderRadius: "8px", 
        padding: "20px", 
        marginBottom: "20px",
        backgroundColor: "#fff"
      }}>
        <h1 style={{ margin: "0 0 15px 0", display: "flex", alignItems: "center", gap: "10px" }}>
          🔐 FHE Payment Vault
        </h1>
        <p style={{ color: "#666", marginBottom: 10, fontSize: "1.1em" }}>
          A privacy-preserving payment system built on Zama's FHEVM. Keep every payout—salary, bonus, or bulk airdrop—visible only to sender and receiver, without revealing amounts on-chain.
        </p>
        <p style={{ color: "#888", fontSize: "0.95em", margin: 0 }}>
          Perfect for employers, DAOs, and individual payers funding encrypted balances for monthly salaries, freelance invoices, grant disbursements, and token airdrops.
        </p>
      </div>

      {/* Top Row - Network Status and Gas Fee */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Network Status */}
        <div style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          backgroundColor: isCorrectNetwork ? "#d4edda" : "#f8d7da",
          borderColor: isCorrectNetwork ? "#c3e6cb" : "#f5c6cb"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>🌐 Network Status</h3>
          <p style={{ margin: "5px 0" }}><strong>Current Network:</strong> {currentNetwork?.name || "Unknown"} (Chain ID: {currentNetwork?.chainId || "Unknown"})</p>
          <p style={{ margin: "5px 0" }}><strong>Target Network:</strong> {TARGET_NETWORK.name} (Chain ID: {TARGET_NETWORK.chainId})</p>
          <p style={{ margin: "5px 0" }}><strong>Status:</strong> {isCorrectNetwork ? "✅ Connected to correct network" : "❌ Wrong network"}</p>
          {!isCorrectNetwork && (
            <button 
              onClick={handleSwitchNetwork}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px"
              }}
            >
              Switch to {TARGET_NETWORK.name}
            </button>
          )}
        </div>

        {/* Gas Fee Info */}
        {gasEstimate && (
          <div style={{
            border: "2px solid #007bff",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#fff",
            minWidth: "300px"
          }}>
            <h3 style={{ margin: "0 0 10px 0" }}>⛽ Gas Fee Awareness</h3>
            <p style={{ margin: "5px 0" }}><strong>Current Gas Price:</strong> {ethers.formatUnits(gasEstimate.gasPrice, "gwei")} gwei</p>
            <p style={{ margin: "5px 0" }}><strong>Estimated Gas:</strong> {gasEstimate.estimatedGas.toString()}</p>
            <p style={{ margin: "5px 0" }}><strong>Estimated Cost:</strong> {gasEstimate.estimatedCostETH} ETH (~${gasEstimate.estimatedCostUSD})</p>
          </div>
        )}
      </div>

      {/* Second Row - Contract Info and Vault Statistics */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Contract Info */}
        <div style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          backgroundColor: "#f9f9f9"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>📋 Contract Information</h3>
          <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>FHE Payment Vault:</strong> {ESCROW_ADDRESS}</p>
          <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Mock USDC Token:</strong> {USDC_ADDRESS}</p>
          <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Your Address:</strong> {userAddress}</p>
          <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Your USDC Balance:</strong> {usdcBalance} USDC</p>
        </div>

        {/* Vault Statistics */}
        {escrowInfo && (
          <div style={{
            flex: 1,
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#f9f9f9"
          }}>
            <h3 style={{ margin: "0 0 10px 0" }}>📊 Payment Vault Statistics</h3>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Payer:</strong> {escrowInfo.payer}</p>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Payment Type:</strong> {escrowInfo.isETH ? "ETH" : "USDC"}</p>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Token Address:</strong> {escrowInfo.token}</p>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Total Funded:</strong> {escrowInfo.isETH 
              ? ethers.formatEther(escrowInfo.totalFunded) + " ETH"
              : ethers.formatUnits(escrowInfo.totalFunded, 6) + " USDC"
            }</p>
            <p style={{ margin: "5px 0", fontSize: "0.9em" }}><strong>Total Claimed:</strong> {escrowInfo.isETH 
              ? ethers.formatEther(escrowInfo.totalReleased) + " ETH"
              : ethers.formatUnits(escrowInfo.totalReleased, 6) + " USDC"
            }</p>
            
            {/* Contract Limitation Warning */}
            <div style={{ 
              marginTop: "10px", 
              padding: "8px", 
              backgroundColor: "#fff3cd", 
              border: "1px solid #ffeaa7", 
              borderRadius: "4px",
              fontSize: "0.8em"
            }}>
              <p style={{ margin: "0", color: "#856404" }}>
                ⚠️ <strong>Note:</strong> This contract supports only one token type per user. 
                Funding with a different token will overwrite the previous escrow type.
              </p>
            </div>
            
            {/* Debug Info */}
            <details style={{ marginTop: "10px" }}>
              <summary style={{ cursor: "pointer", color: "#007bff", fontSize: "0.9em" }}>🔍 Debug Info</summary>
              <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "4px", fontSize: "0.8em" }}>
                <p><strong>Raw Total Funded:</strong> {escrowInfo.totalFunded}</p>
                <p><strong>Raw Total Released:</strong> {escrowInfo.totalReleased}</p>
                <p><strong>Is ETH:</strong> {escrowInfo.isETH.toString()}</p>
                <p><strong>Zero Address:</strong> {ethers.ZeroAddress}</p>
                <p><strong>USDC Address:</strong> {USDC_ADDRESS}</p>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Main Content Area - Side by Side Layout */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        {/* Left Side - Tab Navigation and Content */}
        <div style={{ flex: 2 }}>
          {/* Tab Navigation */}
          <div style={{ 
            border: "2px solid #007bff", 
            borderRadius: "8px", 
            padding: "0", 
            backgroundColor: "#fff",
            marginBottom: "0"
          }}>
            <div style={{ 
              display: "flex", 
              borderBottom: "1px solid #007bff",
              backgroundColor: "#f8f9fa"
            }}>
              <button 
                style={{
                  ...tabStyle(activeTab === "fund"),
                  borderRadius: "0",
                  border: "none",
                  borderRight: "1px solid #ccc"
                }}
                onClick={() => setActiveTab("fund")}
              >
                💰 Fund Vault (Payer)
              </button>
              <button 
                style={{
                  ...tabStyle(activeTab === "release"),
                  borderRadius: "0",
                  border: "none",
                  borderRight: "1px solid #ccc"
                }}
                onClick={() => setActiveTab("release")}
              >
                💸 Claim Payment (Receiver)
              </button>
              <button 
                style={{
                  ...tabStyle(activeTab === "vesting"),
                  borderRadius: "0",
                  border: "none",
                  borderRight: "1px solid #ccc"
                }}
                onClick={() => setActiveTab("vesting")}
              >
                ⏰ Vesting Schedule
              </button>
              <button 
                style={{
                  ...tabStyle(activeTab === "milestone"),
                  borderRadius: "0",
                  border: "none",
                  borderRight: "1px solid #ccc"
                }}
                onClick={() => setActiveTab("milestone")}
              >
                🎯 Complete Milestone
              </button>
              <button 
                style={{
                  ...tabStyle(activeTab === "airdrop"),
                  borderRadius: "0",
                  border: "none"
                }}
                onClick={() => setActiveTab("airdrop")}
              >
                🪂 Prepare Airdrop
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ padding: "20px" }}>
              {/* Fund Tab */}
              {activeTab === "fund" && (
                <div>
                  <h3 style={{ margin: "0 0 15px 0" }}>💰 Fund Payment Vault</h3>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Payment Token:</label>
                    <select 
                      value={paymentMode} 
                      onChange={e => setPaymentMode(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="ETH">ETH (Native)</option>
                      <option value="USDC">USDC (Stablecoin)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Receiver address:</label>
                    <input 
                      value={workerAddr} 
                      onChange={e => setWorkerAddr(e.target.value)}
                      onBlur={() => workerAddr && getEscrowInfo(workerAddr).then(setEscrowInfo)}
                      placeholder="0x... (employee, contractor, grantee, etc.)"
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Amount ({paymentMode}):</label>
                    <input 
                      value={amount} 
                      onChange={e => setAmount(e.target.value)}
                      placeholder="e.g., 0.5 for salary, 1000 for grant"
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>

                  <button 
                    onClick={handleFund}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1em",
                      fontWeight: "bold"
                    }}
                  >
                    Fund Vault with {paymentMode}
                  </button>
                </div>
              )}

              {/* Release Tab */}
              {activeTab === "release" && (
                <div>
                  <h3 style={{ margin: "0 0 15px 0" }}>💸 Claim Payment</h3>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Payment Token:</label>
                    <select 
                      value={releaseMode} 
                      onChange={e => setReleaseMode(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    >
                      <option value="ETH">ETH (Native)</option>
                      <option value="USDC">USDC (Stablecoin)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Claim Amount ({releaseMode}):</label>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input 
                        value={releaseAmount} 
                        onChange={e => setReleaseAmount(e.target.value)}
                        placeholder="e.g., 0.5 for partial, full amount for complete"
                        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                      />
                      <button
                        onClick={async () => {
                          try {
                            setStatus("Fetching max balance...");
                            const maxBalance = releaseMode === "ETH" 
                              ? await getWorkerETHBalance()
                              : await getWorkerUSDCBalance();
                            
                            if (maxBalance && parseFloat(maxBalance) > 0) {
                              setReleaseAmount(maxBalance);
                              setStatus(`✅ Max balance set: ${maxBalance} ${releaseMode}`);
                            } else {
                              setStatus(`❌ No ${releaseMode} balance found`);
                            }
                          } catch (error) {
                            console.error("Failed to fetch max balance:", error);
                            setStatus("❌ Failed to fetch balance");
                          }
                        }}
                        style={{
                          backgroundColor: "#ffc107",
                          color: "black",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.9em",
                          fontWeight: "bold",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Max
                      </button>
                    </div>
                    <p style={{ margin: "5px 0 0 0", fontSize: "0.8em", color: "#666" }}>
                      💡 Click "Max" to automatically set your full vault balance
                    </p>
                  </div>

                  <button 
                    onClick={handleRelease}
                    style={{
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1em",
                      fontWeight: "bold"
                    }}
                  >
                    Claim {releaseMode} Payment
                  </button>
                </div>
              )}

              {/* Vesting Tab */}
              {activeTab === "vesting" && (
                <div>
                  <h3 style={{ margin: "0 0 15px 0" }}>⏰ Vesting Schedule</h3>
                  
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
                <div>
                  <h3 style={{ margin: "0 0 15px 0" }}>🎯 Complete Milestone</h3>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Milestone ID:</label>
                    <input 
                      value={milestoneId} 
                      onChange={e => setMilestoneId(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Description:</label>
                    <input 
                      value={milestoneDesc} 
                      onChange={e => setMilestoneDesc(e.target.value)}
                      placeholder="e.g., Frontend development completed"
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Release Amount ({escrowInfo?.isETH ? "ETH" : "USDC"}):</label>
                    <input 
                      value={releaseAmount} 
                      onChange={e => setReleaseAmount(e.target.value)}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                  </div>

                  <button 
                    onClick={handleMilestone}
                    style={{
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1em",
                      fontWeight: "bold"
                    }}
                  >
                    Complete Milestone & Release Payment
                  </button>
                </div>
              )}

              {/* Airdrop Tab */}
              {activeTab === "airdrop" && (
                <div>
                  <h3 style={{ margin: "0 0 15px 0" }}>🪂 Prepare Airdrop</h3>
                  
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
            </div>
          </div>
        </div>

        {/* Right Side - Balance Check */}
        <div style={{ flex: 1 }}>
          <div style={{
            border: "1px solid #28a745",
            borderRadius: "8px",
            padding: "15px",
            backgroundColor: "#fff"
          }}>
            <h3 style={{ margin: "0 0 15px 0" }}>🔍 Vault Balance Check</h3>
            
            <div style={{
              backgroundColor: "#d4edda",
              border: "1px solid #c3e6cb",
              borderRadius: "4px",
              padding: "10px",
              marginBottom: "15px",
              textAlign: "center"
            }}>
              <p style={{ margin: "0", fontWeight: "bold", color: "#155724" }}>Status: ✅</p>
              <p style={{ margin: "5px 0 0 0", fontSize: "0.9em", color: "#155724" }}>Vault balances retrieved!</p>
            </div>

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
              style={{
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                width: "100%",
                marginBottom: "15px"
              }}
            >
              Check My Vault Balances
            </button>
            
            <div style={{ marginBottom: "15px" }}>
              <p style={{ margin: "5px 0", fontWeight: "bold" }}>ETH Vault Balance: {ethBalance || "0"} ETH</p>
              <p style={{ margin: "5px 0", fontWeight: "bold" }}>USDC Vault Balance: {usdcEscrowBalance || "0"} USDC</p>
            </div>
            
            <div style={{ padding: "10px", backgroundColor: "#f0f8ff", border: "1px solid #b3d9ff", borderRadius: "4px" }}>
              <p style={{ margin: "0", fontSize: "0.9em", color: "#0066cc" }}>
                🔐 <strong>Privacy Note:</strong> These balances are encrypted on-chain. Only you and the payer can see the actual amounts.
              </p>
            </div>
          </div>
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
