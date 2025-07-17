# Zama FHEVM Project

A Hardhat-based project for developing FHEVM (Fully Homomorphic Encryption Virtual Machine) Solidity smart contracts with **fixed TypeScript imports** and proper test configuration.

## 🎯 Project Overview

This project demonstrates how to build and test FHEVM smart contracts using Zama's technology. It includes:

- **FHECounter**: A simple counter contract using encrypted values
- **Counter**: A basic counter for comparison
- **Comprehensive test suite** with proper TypeScript configuration
- **Fixed TypeScript import issues** that commonly occur in FHEVM projects

## ✅ Key Fixes Implemented

### Original Problem Solved
- **Fixed**: `Cannot find module '../types' or its corresponding type declarations.` error
- **Solution**: Proper TypeChain configuration and FHEVM plugin setup

### Technical Improvements
- ✅ Resolved TypeScript import errors in test files
- ✅ Configured FHEVM Hardhat plugin with correct version (`@fhevm/hardhat-plugin@0.0.1-3`)
- ✅ Generated proper TypeChain types for contract interaction
- ✅ Fixed Windows-specific path issues with FHEVM configuration
- ✅ Implemented proper test structure following Zama documentation

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- npm >= 7.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/onehunterr/zama-fhevm-project.git
cd zama-fhevm-project

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

## 📁 Project Structure

```
├── contracts/
│   ├── Counter.sol          # Basic counter contract
│   └── FHECounter.sol       # FHEVM encrypted counter
├── test/
│   ├── Counter.ts           # Tests for basic counter
│   └── FHECounter.ts        # Tests for FHEVM counter
├── scripts/
│   └── deploy.ts            # Deployment script
├── tasks/
│   └── accounts.ts          # Hardhat tasks
└── types/                   # Generated TypeChain types
```

## 🧪 Testing

The project includes comprehensive tests for both regular and FHEVM contracts:

### Run All Tests
```bash
npm test
```

### Run Specific Tests
```bash
# Test basic counter
npx hardhat test test/Counter.ts

# Test FHEVM counter
npx hardhat test test/FHECounter.ts
```

### Test Results
```
✔ Counter tests - All passing
✔ FHECounter deployment - Working
✔ FHECounter basic functionality - Working
⚠ FHECounter encryption/decryption - Requires additional FHEVM setup
```

## 🔧 FHEVM Runtime Modes

The FHEVM Hardhat plugin supports three runtime modes:

1. **Hardhat (In-Memory)** - Mock encryption for fast testing
2. **Hardhat Node** - Mock encryption with persistent state
3. **Sepolia Testnet** - Real encryption on testnet

### Running Tests in Different Modes

```bash
# Default mode (in-memory mock encryption)
npx hardhat test

# Hardhat network mode
npx hardhat test --network hardhat

# Local node mode
npx hardhat node
npx hardhat test --network localhost

# Sepolia testnet (requires setup)
npx hardhat test --network sepolia
```

## 📝 Smart Contracts

### FHECounter.sol
A counter contract that uses FHEVM for encrypted operations:
- `increment(encryptedValue, proof)` - Increment by encrypted amount
- `decrement(encryptedValue, proof)` - Decrement by encrypted amount  
- `getCount()` - Get current encrypted count

### Counter.sol
A basic counter for comparison:
- `increment()` - Increment by 1
- `decrement()` - Decrement by 1
- `getCount()` - Get current count

## 🛠 Development Scripts

```bash
# Clean build artifacts
npm run clean

# Compile contracts
npm run compile

# Run linting
npm run lint

# Format code
npm run prettier:write

# Generate TypeChain types
npm run typechain

# Build TypeScript
npm run build:ts
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### TypeScript Import Errors
- **Problem**: `Cannot find module '../types'`
- **Solution**: Run `npm run compile` to generate TypeChain types

#### FHEVM Plugin Issues
- **Problem**: Plugin compatibility errors
- **Solution**: Use exact version `@fhevm/hardhat-plugin@0.0.1-3`

#### Windows Path Issues
- **Problem**: Invalid import paths with backslashes
- **Solution**: The project includes fixes for Windows path handling

## 📚 Documentation

- [Zama FHEVM Documentation](https://docs.zama.ai/protocol)
- [Hardhat Documentation](https://hardhat.org/docs)
- [TypeChain Documentation](https://github.com/dethcrypto/TypeChain)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zama](https://zama.ai/) for FHEVM technology
- Original FHEVM Hardhat template
- Community contributions and bug reports

## 🔗 Links

- [Zama Protocol](https://docs.zama.ai/protocol)
- [FHEVM Solidity Library](https://github.com/zama-ai/fhevm-solidity)
- [Hardhat](https://hardhat.org/)

---

**Note**: This project successfully resolves common TypeScript import issues in FHEVM development and provides a solid foundation for building encrypted smart contracts.
