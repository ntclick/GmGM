# GM Contract Interface

A modern, privacy-focused GM (Good Morning) smart contract interface built with React, TypeScript, and Zama FHEVM technology.

## 🚀 Features

### 🔐 Privacy & Security
- Fully homomorphic encryption (FHE)
- Encrypted on-chain computations
- Zero-knowledge proofs
- Censorship resistance

### ⏰ Smart Time Categories
- GMT+0 timezone based categories
- Real-time clock display
- Automatic category suggestions
- Categories: Morning (6:00-11:59), Afternoon (12:00-17:59), Evening (18:00-23:59), Night (00:00-5:59)

### 📊 GM Streak System
- Daily streak tracking
- Best streak record
- Total GM count
- Today's GM count
- Auto-sync with blockchain data
- Silent background updates

### 🎨 Modern UI/UX
- Clean, minimalist design
- Responsive layout
- Loading indicators
- Network status monitoring
- Auto-reconnect wallet functionality

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Ethereum Sepolia Testnet
- **Encryption**: Zama FHEVM SDK
- **Wallet**: MetaMask Integration
- **Styling**: Tailwind CSS
- **APIs**: Alchemy RPC, Etherscan API

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/ntclick/GmGM.git
cd GmGM
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment (optional)**
Create a `.env` file:
```env
VITE_PRIVATE_KEY=your_private_key_here
VITE_RELAYER_URL=https://relayer.testnet.zama.cloud
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
VITE_ETHERSCAN_API_KEY=your_etherscan_api_key
VITE_FHEVM_CONTRACT_ADDRESS=0x72eEA702E909599bC92f75774c5f1cE41b8B59BA
```

4. **Start development server**
```bash
npm run dev
```

5. **Open browser**
Navigate to http://localhost:3013

## 🔧 Configuration

- **Contract Address**: `0x72eEA702E909599bC92f75774c5f1cE41b8B59BA`
- **Network**: Sepolia Testnet (Chain ID: 11155111)
- **Required**: MetaMask wallet with Sepolia network

## 📊 Smart Contract

### Verified Contract
- **Address**: [0x72eEA702E909599bC92f75774c5f1cE41b8B59BA](https://sepolia.etherscan.io/address/0x72eEA702E909599bC92f75774c5f1cE41b8B59BA)
- **Name**: GMContract
- **Compiler**: v0.8.19
- **Network**: Sepolia Testnet

### Features
- Simple GM submission
- Encrypted GM with categories
- FHE-based privacy protection
- EIP-712 signature support

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Local Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run deploy       # Deploy contract
npm run verify       # Verify contract on Etherscan
npm run compile      # Compile contracts
```

## 🔗 Links

- **🌐 Live Demo**: https://gm-project-nine.vercel.app
- **Contract**: https://sepolia.etherscan.io/address/0x72eEA702E909599bC92f75774c5f1cE41b8B59BA
- **Repository**: https://github.com/ntclick/GmGM.git
- **Author**: **Trung KTS** - [@trungkts29](https://twitter.com/trungkts29)

---

Built with ❤️ using Zama FHEVM technology. 