import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: '.env' });

// Debug: Check if environment variables are loaded
console.log('🔍 Environment variables check:');
console.log('VITE_ETHERSCAN_API_KEY:', process.env.VITE_ETHERSCAN_API_KEY ? '✅ Found' : '❌ Not found');
console.log('API Key value:', process.env.VITE_ETHERSCAN_API_KEY ? process.env.VITE_ETHERSCAN_API_KEY.substring(0, 8) + '...' : 'Not found');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contract configuration
const CONTRACT_ADDRESS = "0x72eEA702E909599bC92f75774c5f1cE41b8B59BA";
const NETWORK = "sepolia"; // or "mainnet" for mainnet
const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY || "";

// Compiler versions to try
const COMPILER_VERSIONS = [
    '0.8.19',
    'v0.8.19',
    '0.8.20',
    'v0.8.20',
    '0.8.21',
    'v0.8.21',
    '0.8.22',
    'v0.8.22',
    '0.8.23',
    'v0.8.23'
];

// Contract ABI (simplified for verification)
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "externalEuint64",
        "name": "value",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "attestation",
        "type": "bytes"
      }
    ],
    "name": "gm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "encryptedCount",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "submitEncryptedGMSimple",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getLastError",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "error",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract source code (Solidity) - Simplified version for verification
const CONTRACT_SOURCE = `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint32, externalEuint64, euint32, euint64, ebool, euint8 } from "@fhevm/solidity/lib/FHE.sol";

contract ConfidentialGM {
    
    // ============ ERROR HANDLING ============
    struct LastError {
        euint8 error;      // Encrypted error code
        uint256 timestamp; // Timestamp of the error
    }
    
    // Store the last error for each address
    mapping(address => LastError) private _lastErrors;
    
    // ============ EVENTS ============
    event EncryptedGMSubmitted(
        address indexed user,
        string category,
        bytes32 encryptedCount,
        uint256 timestamp,
        uint256 submissionBlock
    );
    
    // ============ MAIN FUNCTIONS ============
    
    /**
     * @dev Simple GM function
     */
    function gm(
        externalEuint64 value,
        bytes calldata attestation
    ) public {
        // Convert external encrypted value to internal euint64 using FHE.fromExternal
        euint64 v = FHE.fromExternal(value, attestation);
        
        // Simple test - just emit an event
        emit EncryptedGMSubmitted(
            msg.sender,
            "test",
            FHE.toBytes32(v),
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Submit encrypted GM count for a category
     */
    function submitEncryptedGMSimple(
        externalEuint32 encryptedCount,
        bytes calldata inputProof,
        string calldata category,
        string calldata message
    ) external {
        // Convert external encrypted value to internal euint32
        euint32 count = FHE.fromExternal(encryptedCount, inputProof);
        
        // Simple ACL
        FHE.allowThis(count);
        FHE.allow(count, msg.sender);
        
        // Emit event
        emit EncryptedGMSubmitted(
            msg.sender,
            category,
            FHE.toBytes32(count),
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Get the last error for a specific address
     */
    function getLastError(address user) public view returns (euint8 error, uint256 timestamp) {
        LastError memory lastError = _lastErrors[user];
        return (lastError.error, lastError.timestamp);
    }
}`;

async function verifyContract() {
    try {
        console.log('🔍 Starting contract verification...');
        console.log(`Contract Address: ${CONTRACT_ADDRESS}`);
        console.log(`Network: ${NETWORK}`);
        
        if (!ETHERSCAN_API_KEY) {
            console.error('❌ VITE_ETHERSCAN_API_KEY is required. Please set it in your .env file');
            console.log('Get your API key from: https://etherscan.io/apis');
            return;
        }
        
        // Create provider using Alchemy RPC (same as in zamaAPI.ts)
        const provider = new ethers.JsonRpcProvider(
            NETWORK === 'sepolia' 
                ? 'https://eth-sepolia.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_'
                : 'https://eth-mainnet.g.alchemy.com/v2/oppYpzscO7hdTG6hopypG6Opn3Xp7lR_'
        );
        
        // Check if contract exists
        const code = await provider.getCode(CONTRACT_ADDRESS);
        if (code === '0x') {
            console.error('❌ Contract not found at the specified address');
            return;
        }
        
        console.log('✅ Contract found at address');
        
        // Prepare verification data
        const verificationData = {
            apikey: ETHERSCAN_API_KEY,
            module: 'contract',
            action: 'verifysourcecode',
            contractaddress: CONTRACT_ADDRESS,
            sourceCode: CONTRACT_SOURCE,
            codeformat: 'solidity-single-file',
                         contractname: 'ConfidentialGM',
                         compilerversion: '0.8.24',
            optimizationUsed: '1',
            runs: '200',
            constructorArguements: '',
            evmversion: 'paris',
            licenseType: '3' // MIT License
        };
        
        console.log('📤 Submitting verification request to Etherscan...');
        
        // Submit verification
        const etherscanUrl = NETWORK === 'sepolia' 
            ? 'https://api-sepolia.etherscan.io/api'
            : 'https://api.etherscan.io/api';
            
        const response = await fetch(etherscanUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(verificationData)
        });
        
        const result = await response.json();
        
        if (result.status === '1') {
            console.log('✅ Verification submitted successfully!');
            console.log(`GUID: ${result.result}`);
            console.log('⏳ Please wait a few minutes and check the status...');
            
            // Check status after a delay
            setTimeout(async () => {
                await checkVerificationStatus(result.result);
            }, 10000);
            
        } else {
            console.error('❌ Verification failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Error during verification:', error.message);
    }
}

async function checkVerificationStatus(guid) {
    try {
        const etherscanUrl = NETWORK === 'sepolia' 
            ? 'https://api-sepolia.etherscan.io/api'
            : 'https://api.etherscan.io/api';
            
        const response = await fetch(`${etherscanUrl}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`);
        const result = await response.json();
        
        if (result.status === '1') {
            if (result.result === 'OK') {
                console.log('✅ Contract verified successfully!');
                console.log(`View contract: https://${NETWORK === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${CONTRACT_ADDRESS}#code`);
            } else {
                console.log('⏳ Verification still in progress...');
                console.log(`Status: ${result.result}`);
            }
        } else {
            console.error('❌ Error checking status:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Error checking verification status:', error.message);
    }
}

// Run verification
verifyContract(); 