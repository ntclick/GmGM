// Contract Configuration
export const CONTRACT_CONFIG = {
  // Main FHE GM Contract
  FHE_GM_CONTRACT: {
    address: import.meta.env.VITE_FHEVM_CONTRACT_ADDRESS || "0x72eEA702E909599bC92f75774c5f1cE41b8B59BA",
    name: "FHE GM Contract",
    network: "Sepolia"
  },
  
  // Standard Zama Contracts
  ZAMA_STANDARD: {
    address: import.meta.env.VITE_ZAMA_STANDARD_CONTRACT_ADDRESS || "0x62c1E5607077dfaB9Fee425a70707b545F565620",
    name: "Zama Standard Contract",
    network: "Sepolia"
  },
  
  ZAMA_FHEVM_STANDARD: {
    address: import.meta.env.VITE_ZAMA_FHEVM_STANDARD_CONTRACT_ADDRESS || "0xf72e7a878eCbF1d7C5aBbd283c10e82ddA58A721",
    name: "Zama FHEVM Standard Contract", 
    network: "Sepolia"
  }
};

// Contract ABI
export const CONTRACT_ABI = [
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

// Helper functions
export const getContractAddress = (contractType: keyof typeof CONTRACT_CONFIG) => {
  return CONTRACT_CONFIG[contractType].address;
};

export const validateContractAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}; 