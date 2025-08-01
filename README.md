# 🔐 FHE GM Contract Interface

A modern, privacy-focused smart contract interface built with React, TypeScript, and Zama FHEVM technology. Features both GM (Good Morning) submission system and Lucky Spin reward system with encrypted user state.

## 🚀 Features

### 🔐 FHE Encryption
- **Fully Homomorphic Encryption** - Privacy-preserving operations
- **Encrypted User State** - Spins, scores, check-in days
- **EIP-712 Signatures** - Secure user authentication
- **WASM Integration** - High-performance encryption
- **Cross-Origin Headers** - Web Worker support

### 📱 Modern UI
- **React 18** + TypeScript + Tailwind CSS
- **Responsive Design** - Mobile-friendly interface
- **Real-time Updates** - Live blockchain data
- **Wallet Integration** - MetaMask support

### 🎰 Lucky Spin System
- **Encrypted Reward Pools** - Configurable with probabilities
- **Daily Check-in** - Receive spins daily
- **Leaderboard** - Public score rankings
- **Admin Management** - Pool and leaderboard control

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

# Deploy contracts
npx hardhat run scripts/deploy-contract.js --network sepolia
npx hardhat run scripts/deploy-lucky-spin.js --network sepolia
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

### 1. GMContract.sol
Original GM submission contract with FHE encryption.

**Key Functions:**
```solidity
function submitGM(string memory message) external
function submitEncryptedGM(externalEuint32 encryptedMessage, bytes calldata attestation) external
function getGMStreak(address user) external view returns (uint256)
```

### 2. LuckySpinFHE.sol
Complete reward system with encrypted user state.

**Key Functions:**
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

## 🔐 FHE Features

### Encrypted Data Types
- **euint8** - Encrypted 8-bit integers (spins, pool indices)
- **euint32** - Encrypted 32-bit integers (scores, check-in days)
- **externalEuint8/32** - External encrypted inputs from frontend

### FHE Operations
- **FHE.add()** - Encrypted addition
- **FHE.sub()** - Encrypted subtraction  
- **FHE.gt()** - Encrypted greater than comparison
- **FHE.select()** - Conditional selection
- **FHE.allow()** - Grant decryption permission
- **FHE.makePubliclyDecryptable()** - Make data public

### Privacy Features
- **User State Encryption** - All user data encrypted on-chain
- **Selective Disclosure** - Users choose what to make public
- **Zero-Knowledge Proofs** - Cryptographic attestations
- **EIP-712 Signatures** - Secure user authentication

## 📱 Usage

### GM System
1. **Connect Wallet** - MetaMask required
2. **Switch to Sepolia** - Testnet network
3. **Submit GM** - Simple or encrypted messages
4. **Track Streaks** - View your GM history

### Lucky Spin System
1. **Daily Check-in** - Receive spins daily
2. **Spin for Rewards** - Win encrypted rewards
3. **View Leaderboard** - See top players
4. **Make Score Public** - Join leaderboard (optional)

### Admin Functions
1. **Manage Pools** - Add/edit/remove reward pools
2. **Submit Scores** - Add public scores to leaderboard
3. **Reset Leaderboard** - Clear all scores

## 🎯 Contract Architecture

### Encrypted User State
```solidity
mapping(address => euint8) public encryptedSpinCount;         // Spins left
mapping(address => euint32) public encryptedScores;           // User scores
mapping(address => euint8) public encryptedLastRewardIndex;   // Last reward
mapping(address => euint32) public encryptedTotalSpins;       // Total spins
mapping(address => euint32) public encryptedCheckInDays;      // Check-in days
```

### Public Data
```solidity
PoolReward[] public poolRewards;        // Reward pools
PublicScore[] public publicLeaderboard;  // Leaderboard
```

### Workflow
1. **Frontend** - Encrypts user inputs using Zama SDK
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