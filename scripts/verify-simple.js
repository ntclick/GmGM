#!/usr/bin/env node

/**
 * Simple Contract Verification Script
 * 
 * This script provides a simple way to verify the FHE GM Contract on Etherscan
 * without requiring additional dependencies.
 */

async function verifyContract() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    const CONTRACT_ADDRESS = process.env.VITE_FHEVM_CONTRACT_ADDRESS || '0x72eEA702E909599bC92f75774c5f1cE41b8B59BA';
    const ETHERSCAN_API_KEY = process.env.VITE_ETHERSCAN_API_KEY;
    
    if (!ETHERSCAN_API_KEY) {
      throw new Error('Missing ETHERSCAN_API_KEY in environment variables');
    }
    
    // Contract information
    const contractInfo = {
      name: 'GMContract',
      compiler: 'v0.7.5+commit.eb77ed04',
      optimization: '0',
      runs: '200',
      evmVersion: 'london',
      license: '3'
    };
    
    // Prepare verification data
    const verificationData = {
      apikey: ETHERSCAN_API_KEY,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: CONTRACT_ADDRESS,
      sourceCode: CONTRACT_SOURCE,
      codeformat: 'solidity-single-file',
      contractname: contractInfo.name,
      compilerversion: contractInfo.compiler,
      optimizationUsed: contractInfo.optimization,
      runs: contractInfo.runs,
      constructorArguements: '',
      evmversion: contractInfo.evmVersion,
      licenseType: contractInfo.license
    };
    
    // Submit verification request
    const response = await fetch('https://api-sepolia.etherscan.io/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(verificationData)
    });
    
    const result = await response.json();
    
    if (result.status === '1') {
      return result.result;
    } else {
      throw new Error(`Verification failed: ${result.result}`);
    }
    
  } catch (error) {
    throw error;
  }
}

// Contract Information
const contractInfo = {
  address: '0x72eEA702E909599bC92f75774c5f1cE41b8B59BA',
  network: 'Sepolia Testnet',
  name: 'FHEGMContract',
  compilerVersion: 'v0.8.19+commit.9804fc96',
  optimization: 'Yes (200 runs)',
  evmVersion: 'paris',
  license: 'MIT License (MIT)'
};

// Run verification
verifyContract().catch(console.error); 