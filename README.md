# 🔐 FHE GM Contract Interface

A modern, privacy-focused GM (Good Morning) smart contract interface built with React, TypeScript, and Zama FHEVM technology.

## 🚀 Features

### 🔐 FHE Encryption
- **Fully Homomorphic Encryption** - Privacy-preserving operations
- **Encrypted GM Messages** - Private message submission
- **EIP-712 Signatures** - Secure user authentication
- **WASM Integration** - High-performance encryption
- **Cross-Origin Headers** - Web Worker support

### 📱 Modern UI
- **React 18** + TypeScript + Tailwind CSS
- **Responsive Design** - Mobile-friendly interface
- **Real-time Updates** - Live blockchain data
- **Wallet Integration** - MetaMask support

### 📊 GM Streak Tracking
- **Streak Analytics** - GM submission history
- **Encrypted Messages** - Privacy-preserving GM
- **Network Support** - Sepolia Testnet

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js v6
- **FHE**: Zama FHE Relayer SDK
- **Network**: Sepolia Testnet
- **Deployment**: Vercel
- **Smart Contracts**: Solidity with FHEVM

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/ntclick/GmGM.git
cd GM-Project

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy contract
npx hardhat run scripts/deploy-contract.js --network sepolia
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to GitHub:**
   ```bash
   git add .
   git commit -m "Update documentation"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Deploy with one click!

### Manual Deployment

```bash
# Build project
npm run build

# Deploy to any static hosting
# (Netlify, GitHub Pages, etc.)
```

## 🎰 Smart Contracts

### GMContract.sol
GM submission contract with FHE encryption for privacy-preserving messages.

**Key Functions:**
```solidity
function submitGM(string memory message) external
function submitEncryptedGM(externalEuint32 encryptedMessage, bytes calldata attestation) external
function getGMStreak(address user) external view returns (uint256)
```

## 🔐 FHE Features

### Encrypted Data Types
- **euint32** - Encrypted 32-bit integers (GM messages)
- **externalEuint32** - External encrypted inputs from frontend

### FHE Operations
- **FHE.fromExternal()** - Convert external encrypted input
- **FHE.allow()** - Grant decryption permission
- **FHE.allowThis()** - Grant contract decryption permission

### Privacy Features
- **Message Encryption** - GM messages encrypted on-chain
- **Selective Disclosure** - Users choose what to make public
- **Zero-Knowledge Proofs** - Cryptographic attestations
- **EIP-712 Signatures** - Secure user authentication

## 📱 Usage

### GM System
1. **Connect Wallet** - MetaMask required
2. **Switch to Sepolia** - Testnet network
3. **Submit GM** - Simple or encrypted messages
4. **Track Streaks** - View your GM history

## 🎯 Contract Architecture

### Encrypted User State
```solidity
mapping(address => euint32) public encryptedGMCount;    // GM count
mapping(address => euint32) public encryptedLastGM;     // Last GM timestamp
```

### Public Data
```solidity
uint256 public totalGMs;                    // Total GMs submitted
mapping(address => uint256) public gmStreak; // Public GM streaks
```

### Workflow
1. **Frontend** - Encrypts GM message using Zama SDK
2. **Contract** - Processes encrypted data with FHE operations
3. **User** - Decrypts their own data using FHE.allow()
4. **Public** - Optional disclosure via makePubliclyDecryptable()

## 🔗 Links

- **Live Demo**: [Vercel Production](https://gm-project-ea66mwcf5-trungkts-projects.vercel.app)
- **GitHub Repo**: [ntclick/GmGM](https://github.com/ntclick/GmGM)
- **Contract**: [Sepolia Etherscan]
- **Documentation**: [Zama FHE Docs](https://docs.zama.ai/fhevm)

## 👨‍💻 Author

**Trung KTS** - [@trungkts29](https://x.com/trungkts29)

Built with ❤️ using Zama FHE technology.

## 📄 License

MIT License - see LICENSE file for details. 