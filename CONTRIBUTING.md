# 🤝 Contributing to FHE GM Contract Interface

Thank you for your interest in contributing to our FHE-powered GM (Good Morning) smart contract interface! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [FHE Guidelines](#fhe-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask wallet
- Sepolia testnet ETH
- Basic knowledge of React, TypeScript, and Solidity

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ntclick/GmGM.git
cd GM-Project

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Development Setup

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_CONTRACT_ADDRESS=your_gm_contract_address
VITE_SEPOLIA_RPC_URL=your_sepolia_rpc_url
```

### Contract Deployment

```bash
# Deploy GM Contract
npx hardhat run scripts/deploy-contract.js --network sepolia
```

## 📝 Code Style

### TypeScript/React

- Use TypeScript for all new code
- Follow React functional components with hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

```typescript
/**
 * Encrypts GM message using Zama FHE SDK
 * @param message - The GM message to encrypt
 * @returns Encrypted message with attestation
 */
async function encryptGMMessage(message: string) {
  // Implementation
}
```

### Solidity

- Use Solidity 0.8.20+
- Follow OpenZeppelin patterns
- Add comprehensive NatSpec documentation
- Use meaningful event names

```solidity
/**
 * @notice User submits encrypted GM message
 * @param encryptedMessage - Encrypted message using FHE
 * @param attestation - Cryptographic attestation
 */
function submitEncryptedGM(
    externalEuint32 encryptedMessage, 
    bytes calldata attestation
) external {
    // Implementation
}
```

## 🔐 FHE Guidelines

### Data Types

- Use `euint32` for GM messages and timestamps
- Use `externalEuint32` for encrypted inputs from frontend

### Operations

- Always use FHE operations on encrypted data
- Never mix plain and encrypted operations
- Use `FHE.allow()` to grant decryption permissions
- Use `FHE.allowThis()` for contract decryption

### Security

```solidity
// ✅ Correct - Encrypted operations
euint32 encryptedMessage = FHE.fromExternal(encryptedInput, attestation);

// ❌ Wrong - Mixing plain and encrypted
string message = FHE.fromExternal(encryptedInput, attestation);
```

## 🧪 Testing

### Frontend Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Contract Testing

```bash
# Run Hardhat tests
npx hardhat test

# Run specific test file
npx hardhat test test/GMContract.test.js
```

### FHE Testing

```javascript
// Test encrypted GM submission
describe('FHE GM Operations', () => {
  it('should submit encrypted GM correctly', async () => {
    const encryptedMessage = await sdk.encrypt("GM!", 'euint32');
    const result = await contract.submitEncryptedGM(encryptedMessage, attestation);
    expect(result).to.be.true;
  });
});
```

## 🔄 Pull Request Process

### Before Submitting

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Test thoroughly** on Sepolia testnet

### PR Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what and why, not how
- **FHE Impact**: Document any FHE-related changes
- **Testing**: Include test results and screenshots
- **Breaking Changes**: Clearly mark if breaking

### Example PR Title

```
feat: Add encrypted GM streak tracking

- Implements FHE-based streak calculation
- Adds new encrypted streak algorithm
- Updates frontend to handle encrypted streaks
```

## 🐛 Reporting Issues

### Bug Reports

Use the GitHub issue template and include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Error messages and stack traces

### Feature Requests

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **FHE impact**: How does it affect privacy?
- **Alternatives**: What other approaches were considered?

## 🏗️ Project Structure

```
GM-Project/
├── contracts/           # Smart contracts
│   ├── GMContract.sol
│   └── ZamaConfig.sol
├── src/
│   ├── components/      # React components
│   ├── services/        # API services
│   ├── types/          # TypeScript interfaces
│   └── utils/          # Utility functions
├── scripts/            # Deployment scripts
├── test/              # Contract tests
└── docs/              # Documentation
```

## 🤝 Community

### Communication

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Code Reviews**: Be constructive and helpful

### Code of Conduct

- Be respectful and inclusive
- Help newcomers learn FHE concepts
- Share knowledge about privacy-preserving technologies
- Follow the project's coding standards

## 📚 Resources

### FHE Learning

- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Tutorials](https://docs.zama.ai/fhevm/tutorials)
- [Privacy-Preserving Applications](https://docs.zama.ai/fhevm/applications)

### Development Tools

- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Ethers.js](https://docs.ethers.org/) - Ethereum library
- [Vite](https://vitejs.dev/) - Frontend build tool

## 🎯 Contribution Areas

### High Priority

- **FHE Optimization**: Improve encrypted operation efficiency
- **UI/UX**: Enhance user experience for encrypted GM submission
- **Testing**: Add comprehensive FHE testing
- **Documentation**: Improve FHE concept explanations

### Medium Priority

- **New Features**: Additional privacy-preserving GM features
- **Performance**: Optimize frontend and contract performance
- **Accessibility**: Improve accessibility for all users
- **Internationalization**: Add multi-language support

### Low Priority

- **Cosmetic**: UI improvements and styling
- **Documentation**: Grammar and clarity improvements
- **Examples**: Add more usage examples

## 🏆 Recognition

Contributors will be recognized in:

- **README.md** - Contributors section
- **Release Notes** - Feature and bug fix credits
- **GitHub Profile** - Contribution graph

Thank you for contributing to privacy-preserving blockchain technology! 🔐 