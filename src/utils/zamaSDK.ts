import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { ethers } from 'ethers';

let instance: any = null;

// Initialize the Zama FHE Relayer SDK singleton
export async function initializeZamaSDK() {
  if (instance) return instance;
  
  try {
    // Load WASM & SDK (bundle version) — no global needed
    // initSDK & createInstance come from the ESM bundle import
    
    // Step 1: Load WASM first with retry
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await initSDK();
        break;
      } catch (wasmError) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`WASM initialization failed after ${maxRetries} attempts`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Step 2: Create instance with proper config
    const config = { 
      ...SepoliaConfig, 
      network: window.ethereum 
    };
    instance = await createInstance(config);
    return instance;
  } catch (e) {
    console.error("❌ Failed to initialize Zama SDK:", e);
    instance = null;
    return null;
  }
}

// Manual EIP-712 signature for user decryption
export async function createManualEIP712Signature(sdk: any, signer: any) {
  try {
    const { publicKey } = sdk.generateKeypair();
    
    // Manual EIP-712 structure for Zama FHE
    const domain = {
      name: 'Zama FHE',
      version: '1',
      chainId: 11155111, // Sepolia chain ID
      verifyingContract: '0x0000000000000000000000000000000000000000' // Placeholder
    };
    
    const types = {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      DecryptRequest: [
        { name: 'publicKey', type: 'bytes' },
        { name: 'user', type: 'address' }
      ]
    };
    
    const message = {
      publicKey: publicKey,
      user: signer.address
    };
    
    const signature = await signer.signTypedData(
      domain,
      types,
      message
    );
    
    return { signature, publicKey };
  } catch (error) {
    console.error('❌ Manual EIP-712 signature failed:', error);
    throw error;
  }
}

// EIP-712 signature for user decryption (if needed)
export async function createEIP712Signature(sdk: any, signer: any) {
  try {
    // Temporary: Skip EIP-712 due to SDK bug
    const { publicKey } = sdk.generateKeypair();
    
    // Return dummy signature for now
    return { signature: '0x', publicKey };
    
    /* Original code (commented due to SDK bug):
    // Try manual approach first
    try {
      return await createManualEIP712Signature(sdk, signer);
    } catch (manualError) {
      console.warn('⚠️ Manual EIP-712 failed, trying SDK method:', manualError);
      
      // Fallback to SDK method
      const eip712 = sdk.createEIP712(publicKey, signer.address);
      
      const signature = await signer.signTypedData(
        eip712.domain,
        eip712.types,
        eip712.message
      );
      
      return { signature, publicKey };
    }
    */
  } catch (error) {
    console.error('❌ EIP-712 signature failed:', error);
    throw error;
  }
}

// Extend Window interface for ethereum and fhevm
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    ethereum?: any;
    relayerSDK?: any;
    fhevm?: any;
  }
}

// Zama SDK types - using any for now to avoid type conflicts
type ZamaInstance = any;

// Get the current Zama instance (for backward compatibility)
export const getZamaInstance = (): ZamaInstance | null => {
  return instance;
};

// Check if SDK is available (for backward compatibility)
export const isZamaSDKAvailable = (): boolean => {
  return !!instance;
};

// Initialize FHE instance (for backward compatibility)
export const initializeFheInstance = async (): Promise<ZamaInstance | null> => {
  return await initializeZamaSDK();
};

// Get FHE instance (for backward compatibility)
export const getFheInstance = (): ZamaInstance | null => {
  return instance;
};

// Validate contract address format
export const validateContractAddress = (address: string): boolean => {
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Check if it's a valid Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return false;
    }
    
    // Use ethers to get checksum address
    const checksumAddress = ethers.getAddress(address);
    const isValid = checksumAddress === address || checksumAddress.toLowerCase() === address.toLowerCase();
    return isValid;
  } catch (error) {
    return false;
  }
}; 