#!/usr/bin/env node

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract configuration
const NETWORK = "sepolia";
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_';
const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY || "SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6";

// Read actual contract source code
const CONTRACT_SOURCE_PATH = path.join(__dirname, '..', 'contracts', 'GMContract.sol');

async function deployContract() {
    try {
        console.log('🚀 Starting contract deployment...');
        console.log(`Network: ${NETWORK}`);
        console.log(`RPC URL: ${RPC_URL}`);
        
        // Check if private key is available
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            console.error('❌ PRIVATE_KEY is required. Please set it in your .env file');
            console.log('Add your private key to .env file: PRIVATE_KEY=your_private_key_here');
            return;
        }
        
        // Read contract source code
        if (!fs.existsSync(CONTRACT_SOURCE_PATH)) {
            console.error('❌ Contract source file not found:', CONTRACT_SOURCE_PATH);
            return;
        }
        
        const contractSource = fs.readFileSync(CONTRACT_SOURCE_PATH, 'utf8');
        console.log('✅ Contract source code loaded');
        console.log(`Source code length: ${contractSource.length} characters`);
        
        // Create provider and wallet
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        console.log('🔗 Connected wallet:', wallet.address);
        
        // Get current balance
        const balance = await provider.getBalance(wallet.address);
        console.log('💰 Balance:', ethers.formatEther(balance), 'ETH');
        
        if (balance === 0n) {
            console.error('❌ Insufficient balance for deployment');
            return;
        }
        
        // Create contract factory
        console.log('📦 Creating contract factory...');
        
        // Note: This is a simplified deployment
        // For actual deployment, you would need to compile the contract first
        // and use the bytecode and ABI
        
        console.log('⚠️  Note: This is a simplified deployment script');
        console.log('For actual deployment, you need to:');
        console.log('1. Compile the contract with Hardhat or Truffle');
        console.log('2. Use the compiled bytecode and ABI');
        console.log('3. Deploy with proper constructor parameters');
        
        // Example deployment (commented out as it requires compilation)
        /*
        const ContractFactory = new ethers.ContractFactory(
            contractABI,
            contractBytecode,
            wallet
        );
        
        console.log('🚀 Deploying contract...');
        const contract = await ContractFactory.deploy();
        await contract.waitForDeployment();
        
        const contractAddress = await contract.getAddress();
        console.log('✅ Contract deployed successfully!');
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Transaction Hash: ${contract.deploymentTransaction().hash}`);
        console.log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
        */
        
        console.log('📋 Next steps for deployment:');
        console.log('1. Install Hardhat: npm install --save-dev hardhat');
        console.log('2. Initialize Hardhat: npx hardhat init');
        console.log('3. Copy contracts to contracts/ folder');
        console.log('4. Configure hardhat.config.js for Sepolia');
        console.log('5. Compile: npx hardhat compile');
        console.log('6. Deploy: npx hardhat run scripts/deploy.js --network sepolia');
        
    } catch (error) {
        console.error('❌ Error during deployment:', error.message);
    }
}

// Run deployment
deployContract(); 