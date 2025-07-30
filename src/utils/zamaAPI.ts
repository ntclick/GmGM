import { ethers } from 'ethers';

// Import environment variables
// const RELAYER_URL = import.meta.env.VITE_RELAYER_URL || "https://relayer.testnet.zama.cloud";
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || "";
const ETHERSCAN_API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY || "";
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || "";

// Create provider using Alchemy RPC
export const createProvider = () => {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
};

// Create signer with private key
export const createSigner = () => {
  const provider = createProvider();
  return new ethers.Wallet(PRIVATE_KEY, provider);
};

// Get contract instance
export const getContract = (contractAddress: string, abi: any) => {
  const signer = createSigner();
  return new ethers.Contract(contractAddress, abi, signer);
};

// Get provider for read-only operations
export const getReadOnlyProvider = () => {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
};

// Get contract instance for read-only operations
export const getReadOnlyContract = (contractAddress: string, abi: any) => {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(contractAddress, abi, provider);
};

// Fetch transaction data from Etherscan API
export const fetchTransactionData = async (txHash: string) => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching transaction data:', error);
    return null;
  }
};

// Fetch transaction receipt from Etherscan API
export const fetchTransactionReceipt = async (txHash: string) => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching transaction receipt:', error);
    return null;
  }
};

// Get block information
export const fetchBlockData = async (blockNumber: string) => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${blockNumber}&boolean=false&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching block data:', error);
    return null;
  }
};

// Get account transactions
export const fetchAccountTransactions = async (address: string, startBlock: string = "0", endBlock: string = "latest") => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    return [];
  }
};

// Get contract events (if available)
export const fetchContractEvents = async (contractAddress: string, fromBlock: string = "0", toBlock: string = "latest") => {
  try {
    const response = await fetch(
      `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${contractAddress}&startblock=${fromBlock}&endblock=${toBlock}&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching contract events:', error);
    return [];
  }
};

// Utility function to format transaction data
export const formatTransactionData = (txData: any) => {
  if (!txData) return null;
  
  return {
    hash: txData.hash,
    blockNumber: parseInt(txData.blockNumber, 16),
    timestamp: new Date().getTime(), // We'll need to fetch block data for actual timestamp
    from: txData.from,
    to: txData.to,
    value: txData.value,
    gas: txData.gas,
    gasPrice: txData.gasPrice,
    nonce: txData.nonce,
    input: txData.input
  };
};

// Get current gas price
export const getCurrentGasPrice = async () => {
  try {
    const provider = getReadOnlyProvider();
    const gasPrice = await provider.getFeeData();
    return gasPrice;
  } catch (error) {
    console.error('Error getting gas price:', error);
    return null;
  }
};

// Estimate gas for transaction
export const estimateGas = async (contractAddress: string, abi: any, method: string, params: any[] = []) => {
  try {
    const contract = getReadOnlyContract(contractAddress, abi);
    const gasEstimate = await contract[method].estimateGas(...params);
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    return null;
  }
}; 