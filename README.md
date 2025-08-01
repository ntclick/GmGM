# 🔐 FHE GM Contract Interface

A modern, privacy-focused Good Morning (GM) check-in smart contract interface built with React, TypeScript, and Zama FHEVM.

## 🚀 Features

- **🔐 FHE Encryption**: All GM data is fully homomorphically encrypted (FHE).
- **📱 Modern UI**: React 18 + TypeScript + Tailwind CSS.
- **🔗 Wallet Integration**: MetaMask support.
- **📊 Streak Tracking**: GM check-in history and analytics.
- **⚡ Real-time Updates**: Live blockchain data.
- **🌐 Sepolia Testnet**: Deployed for testing.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Ethers.js v6
- **FHE**: Zama FHE Relayer SDK
- **Network**: Sepolia Testnet
- **Smart Contracts**: Solidity + FHEVM

## 📦 Installation

```bash
git clone https://github.com/ntclick/GmGM.git
cd GM-Project
npm install
npm run dev
```

## 🔧 Development

```bash
npm run dev         # Start dev server
npm run build       # Build for production
npm run preview     # Preview production build
npx hardhat run scripts/deploy-contract.js --network sepolia  # Deploy contract
```

## 🎰 Smart Contract

### GMContract.sol

The GM check-in contract, privacy-preserving with FHE.

**Key Functions:**
```solidity
function submitGM(string memory message) external
function submitEncryptedGM(externalEuint32 encryptedMessage, bytes calldata attestation) external
function getGMStreak(address user) external view returns (uint256)
```

### Storage Architecture

```solidity
mapping(address => euint32) public encryptedGMCount;    // Encrypted GM count
mapping(address => euint32) public encryptedLastGM;     // Encrypted last GM timestamp
uint256 public totalGMs;                                // Total GMs
mapping(address => uint256) public gmStreak;            // Public GM streaks
```

## 🔐 FHE Features

- **euint32**: All GM data is fully encrypted.
- **FHE.fromExternal()**: Accepts encrypted input from frontend.
- **FHE.allow()**: Allows users to decrypt their own data.
- **EIP-712**: Secure user authentication.

## 📱 Usage

1. Connect your MetaMask wallet.
2. Switch to the Sepolia network.
3. Submit your GM (plain or encrypted).
4. View your streak history.

## 🔗 Links

- **Live Demo**: [https://gm-project-nine.vercel.app/](https://gm-project-nine.vercel.app/)
- **GitHub Repo**: [ntclick/GmGM](https://github.com/ntclick/GmGM)
- **FHE Documentation**: [Zama FHE Docs](https://docs.zama.ai/fhevm)

## 👨‍💻 Author

**Trung KTS** - [@trungkts29](https://x.com/trungkts29)

---

**Note:**  
The Lucky Spin feature will be developed in a separate project and is not included in this repository.

---

Let me know if you want a CONTRIBUTING.md or more detailed instructions! 