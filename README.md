# 🔐 FHE GM Contract Interface

A modern, privacy-focused GM (Good Morning) smart contract interface built with React, TypeScript, and Zama FHEVM technology.

## 🚀 Features

- **🔐 FHE Encryption** - Fully Homomorphic Encryption for privacy
- **📱 Modern UI** - React 18 + TypeScript + Tailwind CSS
- **🔗 Wallet Integration** - MetaMask support
- **📊 Streak Tracking** - GM streak analytics
- **⚡ Real-time Updates** - Live blockchain data
- **🌐 Sepolia Network** - Testnet deployment
- **🎰 Lucky Spin System** - Encrypted reward system with leaderboard

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js v6
- **FHE**: Zama FHE Relayer SDK
- **Network**: Sepolia Testnet
- **Deployment**: Vercel

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/gm-contract-interface.git
cd gm-contract-interface

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
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
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

## 🔐 FHE Features

- **Encrypted GM Submission** - Privacy-preserving messages
- **EIP-712 Signatures** - Secure user authentication
- **WASM Integration** - High-performance encryption
- **Cross-Origin Headers** - Web Worker support
- **Lucky Spin System** - Encrypted reward pools and leaderboard

## 🎰 Lucky Spin System

### Smart Contracts

1. **GMContract.sol** - Original GM submission contract
2. **LuckySpinFHE.sol** - New reward system contract

### Features

- **🔐 Encrypted User State** - Spins, scores, check-in days
- **🎯 Reward Pools** - Configurable rewards with probabilities
- **📊 Leaderboard** - Public score rankings
- **✅ Daily Check-in** - Receive spins daily
- **🎲 Random Spins** - Frontend-controlled randomness

### Contract Functions

```solidity
// User Actions
function checkIn(externalEuint8 encryptedSpins, bytes attestation) external
function spinAndClaimReward(externalEuint8 poolIndex, externalEuint32 points, ...) external
function makeScorePublic() external

// Admin Functions
function addPool(string name, string imageUrl, uint256 value, uint256 probability) external
function submitPublicScore(address user, uint32 score, ...) external

// View Functions
function getPools() external view returns (PoolReward[])
function getLeaderboard() external view returns (PublicScore[])
```

## 📱 Usage

1. **Connect Wallet** - MetaMask required
2. **Switch to Sepolia** - Testnet network
3. **Submit GM** - Simple or encrypted
4. **Track Streaks** - View your GM history
5. **Daily Check-in** - Receive spins
6. **Spin for Rewards** - Win encrypted rewards
7. **View Leaderboard** - See top players

## 🔗 Links

- **Live Demo**: [Your Vercel URL]
- **Contract**: [Sepolia Etherscan]
- **Documentation**: [Zama FHE Docs]

## 👨‍💻 Author

**Trung KTS** - [@trungkts29](https://x.com/trungkts29)

Built with ❤️ using Zama FHE technology.

## 📄 License

MIT License - see LICENSE file for details. 