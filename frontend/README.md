# 🎨 FHE Payment Vault - Frontend

A modern React frontend for the FHE Payment Vault system, providing an intuitive interface for privacy-preserving payments on blockchain.

## 🌟 Features

### 🔐 Privacy-First Design
- **Encrypted Balance Display**: View your private vault amounts without revealing them on-chain
- **Secure Transaction Flow**: Guided interface for FHE-encrypted payments
- **Privacy Indicators**: Clear visual feedback about encryption status

### 💻 Modern User Experience
- **Tab-Based Navigation**: Organized interface for different payment operations
- **Real-Time Updates**: Live balance checking and transaction status
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark/Light Theme**: Adaptive interface design

### ⚡ Advanced Functionality
- **Multi-Token Support**: Switch between ETH and USDC payments
- **Gas Fee Estimation**: Real-time gas price and cost calculation
- **Network Detection**: Automatic network switching and validation
- **Transaction Tracking**: Direct Etherscan integration

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- npm >= 8
- MetaMask browser extension

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
# http://localhost:5173
```

### 🌐 Network Setup

The frontend automatically detects and switches to the correct network:

1. **Sepolia Testnet** (Current): Chain ID 11155111
2. **Zama Testnet** (Future): Ready for migration

## 📁 Project Structure

```
frontend/
├── src/
│   ├── AppV2.tsx                 # Main application component
│   ├── useFheFunding.ts          # FHE contract interactions (Zama)
│   ├── useFheFundingSimple.ts    # Simple contract interactions (Sepolia)
│   ├── networkConfig.ts          # Network configuration
│   ├── main.tsx                  # Application entry point
│   └── assets/                   # Static assets
├── public/
│   └── vite.svg                  # App icon
├── package.json                  # Dependencies and scripts
├── vite.config.ts               # Vite configuration
└── tsconfig.json                # TypeScript configuration
```

## 🎯 Core Components

### AppV2.tsx - Main Interface
The primary React component providing:
- **Tab Navigation**: Fund, Claim, Milestones, Vesting, Airdrops
- **Network Status**: Real-time network detection and switching
- **Balance Display**: Encrypted vault balance visualization
- **Transaction Management**: Complete payment flow handling

### useFheFunding.ts - FHE Integration
Handles all FHE-specific operations:
```typescript
// Fund with encrypted amounts
export async function fundEscrow(escrowAddr: string, worker: string, ethAmount: string)

// Release encrypted payments
export async function releaseEscrow(ethAmount: string)

// Complete milestones with encrypted rewards
export async function completeMilestone(milestoneId: number, description: string, amount: string)
```

### useFheFundingSimple.ts - Sepolia Version
Simplified version for Sepolia testnet:
- **Plain-text amounts**: For testing and demonstration
- **Multi-token support**: ETH and USDC operations
- **Error handling**: Comprehensive error messages and debugging

### networkConfig.ts - Network Management
Handles network detection and switching:
```typescript
export const TARGET_NETWORK = {
  name: "Sepolia",
  chainId: 11155111,
  rpcUrl: "https://sepolia.infura.io/v3/..."
}
```

## 🎨 User Interface

### 🏠 Main Dashboard
- **Network Status Panel**: Shows current network and connection status
- **Gas Fee Display**: Real-time gas price and cost estimation
- **Contract Information**: Deployed contract addresses and details
- **Vault Statistics**: Encrypted balance and transaction history

### 💰 Fund Vault Tab
- **Token Selection**: Choose between ETH and USDC
- **Recipient Input**: Enter worker/receiver address
- **Amount Input**: Specify payment amount
- **Encryption Status**: Visual feedback on FHE operations

### 💸 Claim Payment Tab
- **Balance Check**: View encrypted vault balances
- **Max Button**: Automatically set full vault balance
- **Token Switching**: Switch between ETH and USDC claims
- **Transaction Confirmation**: Clear success/error feedback

### 🎯 Milestone Tab
- **Milestone Management**: Create and complete project milestones
- **Progress Tracking**: Visual milestone completion status
- **Encrypted Rewards**: Release payments upon milestone completion

### ⏰ Vesting Tab (Coming Soon)
- **Schedule Setup**: Configure time-based payment releases
- **Progress Visualization**: Track vesting progress over time
- **Automated Releases**: Set up automatic payment distributions

### 🪂 Airdrop Tab (Coming Soon)
- **Bulk Operations**: Handle multiple recipients efficiently
- **CSV Upload**: Import recipient lists
- **Privacy Protection**: Keep individual amounts confidential

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```env
# Network Configuration
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_ZAMA_RPC_URL=https://devnet.zama.ai

# Contract Addresses (Sepolia)
VITE_ESCROW_ADDRESS=0x01953BA70f844E87802F7124413d34BAFD4e120d
VITE_USDC_ADDRESS=0xF4F56D0d85F1eaEe0f99C2079aBb54a621BF46D4

# Analytics (Optional)
VITE_ANALYTICS_ID=your_analytics_id
```

### Vite Configuration
The project uses Vite for fast development and building:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true
  }
})
```

## 🧪 Testing

### Component Testing
```bash
# Run component tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### E2E Testing
```bash
# Run end-to-end tests
npm run test:e2e

# Run in headless mode
npm run test:e2e:headless
```

### Manual Testing Checklist
- [ ] **Network Switching**: Verify automatic network detection
- [ ] **MetaMask Integration**: Test wallet connection and signing
- [ ] **Balance Display**: Confirm encrypted balance retrieval
- [ ] **Transaction Flow**: Complete fund → claim cycle
- [ ] **Error Handling**: Test invalid inputs and network errors
- [ ] **Responsive Design**: Check mobile and desktop layouts

## 🎨 Styling & Theming

### CSS Architecture
- **Inline Styles**: Component-specific styling for rapid development
- **Responsive Design**: Mobile-first approach with flexible layouts
- **Color Scheme**: Professional blue/green palette with accessibility focus

### Key Design Principles
- **Clarity**: Clear visual hierarchy and information architecture
- **Privacy**: Visual indicators for encrypted vs. plain-text data
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Performance**: Optimized for fast loading and smooth interactions

## 🔍 Debugging

### Browser Console
The frontend provides extensive console logging:
```javascript
// Balance checking
console.log("ETH Balance Check - Escrow info:", info);
console.log("Raw balance:", balance.toString());

// Transaction status
console.log("All checks passed, executing release...");
console.log("ETH release successful:", tx.hash);
```

### Debug Panel
Built-in debug information panel shows:
- **Raw Contract Values**: Unformatted blockchain data
- **Token Addresses**: Contract address verification
- **Boolean Flags**: State validation
- **Balance Formatting**: Decimal conversion verification

### Common Issues & Solutions

#### MetaMask Connection
```javascript
// Check if MetaMask is installed
if (typeof window.ethereum === 'undefined') {
  console.error('MetaMask not detected');
}

// Request account access
await window.ethereum.request({ method: 'eth_requestAccounts' });
```

#### Network Switching
```javascript
// Switch to Sepolia
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
});
```

#### Transaction Errors
- **"Missing revert data"**: Check contract state and balance
- **"User rejected"**: User cancelled transaction in MetaMask
- **"Insufficient funds"**: Not enough ETH for gas fees

## 📱 Mobile Optimization

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Touch-Friendly Design
- **Button Sizing**: Minimum 44px touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Gestures**: Swipe navigation for tab switching

### Performance Optimization
- **Code Splitting**: Lazy loading for non-critical components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Size**: Optimized for fast mobile loading

## 🚀 Deployment

### Build for Production
```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Analyze bundle size
npm run analyze
```

### Deployment Options

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
```bash
# Build command: npm run build
# Publish directory: dist
```

#### IPFS (Decentralized)
```bash
# Build and upload to IPFS
npm run build
ipfs add -r dist/
```

## 🔮 Future Enhancements

### Phase 1: UX Improvements
- [ ] **Dark Mode Toggle**: User preference persistence
- [ ] **Transaction History**: Complete payment timeline
- [ ] **Notification System**: Real-time transaction updates
- [ ] **Multi-language Support**: Internationalization

### Phase 2: Advanced Features
- [ ] **Mobile App**: React Native version
- [ ] **Offline Support**: PWA capabilities
- [ ] **Advanced Analytics**: Payment insights dashboard
- [ ] **Integration APIs**: Third-party service connections

### Phase 3: Enterprise Features
- [ ] **Admin Dashboard**: Multi-user management
- [ ] **Bulk Operations UI**: CSV import/export
- [ ] **Compliance Tools**: Audit trail visualization
- [ ] **White-label Options**: Customizable branding

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Develop** with hot reload: `npm run dev`
4. **Test** thoroughly: `npm run test`
5. **Build** for production: `npm run build`
6. **Submit** pull request

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Airbnb configuration with React hooks
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality assurance

### Component Guidelines
- **Functional Components**: Use React hooks
- **TypeScript**: Proper type definitions
- **Error Boundaries**: Graceful error handling
- **Accessibility**: ARIA labels and semantic HTML

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Ethers.js Documentation](https://docs.ethers.org/)

### FHE Resources
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [TFHE Library](https://docs.zama.ai/tfhe)
- [FHE Development Guide](https://docs.zama.ai/fhevm/getting_started)

### Web3 Integration
- [MetaMask Documentation](https://docs.metamask.io/)
- [WalletConnect](https://docs.walletconnect.com/)
- [Web3Modal](https://docs.walletconnect.com/web3modal/about)

---

**Built with React, TypeScript, and Vite for the future of private payments** 🚀
