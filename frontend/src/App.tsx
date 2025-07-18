import { useState } from "react";
import { fundEscrow, getClearBalance, releaseEscrow } from "./useFheFunding";
import { ethers } from "ethers";
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState("fund");
  const [amount, setAmount] = useState("0.1");
  const [releaseAmount, setReleaseAmount] = useState("0.3");
  const [escrowAddr, setEscrowAddr] = useState("");  // paste after deploy
  const [workerAddr, setWorkerAddr] = useState("");  // wallet address of worker
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState("");

  const tabStyle = (isActive: boolean) => ({
    padding: "10px 20px",
    margin: "0 5px",
    border: "1px solid #ccc",
    backgroundColor: isActive ? "#007bff" : "#f8f9fa",
    color: isActive ? "white" : "black",
    cursor: "pointer",
    borderRadius: "5px 5px 0 0"
  });

  return (
    <main style={{ padding: 32 }}>
      <h1>Confidential Salary Escrow</h1>

      {/* Tab Navigation */}
      <div style={{ marginBottom: 20 }}>
        <button 
          style={tabStyle(activeTab === "fund")}
          onClick={() => setActiveTab("fund")}
        >
          Fund Escrow (Employer)
        </button>
        <button 
          style={tabStyle(activeTab === "release")}
          onClick={() => setActiveTab("release")}
        >
          Release Salary (Worker)
        </button>
      </div>

      {/* Common Fields */}
      <label>Escrow contract:</label>
      <input value={escrowAddr} onChange={e => setEscrowAddr(e.target.value)} />
      <br />

      {/* Fund Tab */}
      {activeTab === "fund" && (
        <div>
          <label>Worker address:</label>
          <input value={workerAddr} onChange={e => setWorkerAddr(e.target.value)} />
          <br />

          <label>Amount (ETH):</label>
          <input value={amount} onChange={e => setAmount(e.target.value)} />
          <br />

          <button
            onClick={async () => {
              setStatus("Encrypting & sending…");
              try {
                const txHash = await fundEscrow(escrowAddr, workerAddr, amount);
                setStatus("✅ Funded!");
                toast.success(
                  <div>
                    Transaction successful! 
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
              } catch (e: any) {
                console.error(e);
                setStatus("❌ Tx failed (see console)");
                toast.error(e.shortMessage || e.message || "Transaction failed");
              }
            }}
          >
            Fund Escrow Confidentially
          </button>
        </div>
      )}

      {/* Release Tab */}
      {activeTab === "release" && (
        <div>
          <label>Release Amount (ETH):</label>
          <input value={releaseAmount} onChange={e => setReleaseAmount(e.target.value)} />
          <br />

          <button
            onClick={async () => {
              setStatus("Encrypting & releasing…");
              try {
                const txHash = await releaseEscrow(escrowAddr, releaseAmount);
                setStatus("✅ Released!");
                toast.success(
                  <div>
                    Release successful! 
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
              } catch (e: any) {
                console.error(e);
                setStatus("❌ Release failed (see console)");
                toast.error(e.shortMessage || e.message || "Release failed");
              }
            }}
          >
            Release Salary Confidentially
          </button>
        </div>
      )}

      <br />

      <button
        onClick={async () => {
          setStatus("Decrypting balance…");
          try {
            const balanceWei = await getClearBalance(escrowAddr);
            const balanceEth = ethers.formatEther(balanceWei);
            setBalance(balanceEth);
            setStatus("✅ Balance decrypted!");
          } catch (e) {
            console.error(e);
            setStatus("❌ Balance decrypt failed (see console)");
          }
        }}
      >
        Decrypt My Balance
      </button>

      <p>{status}</p>
      {balance && <p><strong>Balance: {balance} ETH</strong></p>}
      
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
