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
const CONTRACT_ADDRESS = "0x72eEA702E909599bC92f75774c5f1cE41b8B59BA";
const NETWORK = "sepolia";
const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY || "";

// Read actual contract source code
const CONTRACT_SOURCE_PATH = path.join(__dirname, '..', 'contracts', 'GMContract.sol');
const ZAMA_CONFIG_PATH = path.join(__dirname, '..', 'contracts', 'ZamaConfig.sol');

async function verifyWithActualSource() {
    try {
        // Load environment variables
        require('dotenv').config();
        
        const CONTRACT_ADDRESS = process.env.VITE_FHEVM_CONTRACT_ADDRESS || '0x72eEA702E909599bC92f75774c5f1cE41b8B59BA';
        const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY;
        const NETWORK = 'sepolia';
        
        if (!ETHERSCAN_API_KEY) {
          throw new Error('Missing ETHERSCAN_API_KEY in environment variables');
        }
        
        // Load contract source code
        const fs = require('fs');
        const path = require('path');
        
        const contractSourcePath = path.join(__dirname, '..', 'contracts', 'GMContract.sol');
        if (!fs.existsSync(contractSourcePath)) {
          throw new Error('Contract source file not found');
        }
        
        const contractSource = fs.readFileSync(contractSourcePath, 'utf8');
        
        // Prepare verification data
        const verificationData = {
          apikey: ETHERSCAN_API_KEY,
          module: 'contract',
          action: 'verifysourcecode',
          contractaddress: CONTRACT_ADDRESS,
          sourceCode: contractSource,
          codeformat: 'solidity-single-file',
          contractname: 'GMContract',
          compilerversion: 'v0.7.5+commit.eb77ed04',
          optimizationUsed: '0',
          runs: '200',
          constructorArguements: '',
          evmversion: 'london',
          licenseType: '3'
        };
        
        // Submit verification request
        const response = await fetch(`https://api-sepolia.etherscan.io/api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(verificationData)
        });
        
        const result = await response.json();
        
        if (result.status === '1') {
          // Verification submitted successfully
          return result.result;
        } else {
          throw new Error(`Verification failed: ${result.result}`);
        }
        
    } catch (error) {
        throw error;
    }
}

async function checkVerificationStatus(guid) {
  try {
    const response = await fetch(`https://api-sepolia.etherscan.io/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`);
    const result = await response.json();
    
    if (result.status === '1') {
      if (result.result === 'OK') {
        // Contract verified successfully
        return true;
      } else if (result.result === 'Pending in queue') {
        // Still in progress
        return false;
      } else {
        // Verification failed
        throw new Error(`Verification failed: ${result.result}`);
      }
    } else {
      throw new Error(`Status check failed: ${result.message}`);
    }
  } catch (error) {
    throw error;
  }
}

// Run verification
verifyWithActualSource(); 