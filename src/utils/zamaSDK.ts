import { ethers } from 'ethers';

// Import Zama SDK using bundled version for better compatibility
let fheInstance: any = null;

// Load SDK from bundled version with timeout
const loadZamaSDK = async () => {
  return new Promise<boolean>((resolve, reject) => {
    // Check if SDK is already loaded
    if (typeof window !== 'undefined' && (window as any).fhevm) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.zama.ai/fhevm/bundle.js';
    script.type = 'text/javascript';
    
    // Add timeout
    const timeout = setTimeout(() => {
      script.onerror?.('Script loading failed');
    }, 10000);
    
    script.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };
    
    script.onerror = () => {
      clearTimeout(timeout);
      // Fallback to CDN version
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.zama.ai/relayer-sdk-js/0.1.0/relayer-sdk-js.umd.cjs';
      fallbackScript.type = 'text/javascript';
      
      const fallbackTimeout = setTimeout(() => {
        reject(new Error('Failed to load SDK from all sources'));
      }, 8000);
      
      fallbackScript.onload = () => {
        clearTimeout(fallbackTimeout);
        resolve(true);
      };
      
      fallbackScript.onerror = () => {
        clearTimeout(fallbackTimeout);
        reject(new Error('Failed to load SDK from all sources'));
      };
      
      document.head.appendChild(fallbackScript);
    };
    
    document.head.appendChild(script);
  });
};

export async function initializeFheInstance() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }

    // Check if ethereum provider is available
    if (typeof window.ethereum === 'undefined') {
      return null;
    }

    // Load SDK from bundled version
    await loadZamaSDK();
    
    // Try bundled version first, then fallback to CDN
    let sdk = (window as any).fhevm;
    if (!sdk) {
      sdk = (window as any).relayerSDK;
    }
    
    if (!sdk) {
      throw new Error('SDK not found in window object');
    }
    
    // Use bundled version approach if available
    if ((window as any).fhevm) {
      await (window as any).fhevm.initSDK(); // load wasm needed
      const config = { 
        network: window.ethereum,
        relayerUrl: import.meta.env.VITE_RELAYER_URL || 'https://relayer.testnet.zama.cloud'
      };
      fheInstance = await (window as any).fhevm.createInstance(config);
    } else {
      // Fallback to CDN approach
      const { initSDK, createInstance, SepoliaConfig } = sdk;
      
      await initSDK(); // Loads WASM
      const config = {
        ...SepoliaConfig,
        network: window.ethereum,
        relayerUrl: import.meta.env.VITE_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
        contractAddress: import.meta.env.VITE_FHEVM_CONTRACT_ADDRESS || "0x72eEA702E909599bC92f75774c5f1cE41b8B59BA"
      };
      try {
        fheInstance = await createInstance(config);
      } catch (instanceError: any) {
        throw new Error(`Failed to create SDK instance: ${instanceError.message}`);
      }
    }
    
    return fheInstance;
    
  } catch (error) {
    console.error('❌ SDK initialization failed:', error);
    console.log('⚠️ Cannot initialize real Zama SDK');
    
    // Create a mock SDK for development/testing
    const mockSDK = {
      createEncryptedInput: (_contractAddress: string, _userAddress: string) => {
        return {
          add32: (value: number) => console.log('🔧 Mock SDK: add32', value),
          add64: (value: number) => console.log('🔧 Mock SDK: add64', value),
          encrypt: async () => {
            console.log('🔧 Mock SDK: encrypt called');
            return {
              handles: ['0x' + '0'.repeat(64)],
              inputProof: '0x' + '0'.repeat(128)
            };
          }
        };
      },
      generateKeypair: () => ({ publicKey: 'mock-key' }),
      createEIP712: () => ({ domain: {}, types: {}, message: {} })
    };
    
    return mockSDK;
  }
}

export function getFheInstance() {
  return fheInstance;
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

// Global variables for SDK instance (for backward compatibility)
let isInitializing = false;

// Initialize Zama SDK with proper configuration (for backward compatibility)
export const initializeZamaSDK = async (): Promise<ZamaInstance | null> => {
  if (fheInstance) {
    return fheInstance;
  }

  if (isInitializing) {
    return null;
  }

  isInitializing = true;
  const result = await initializeFheInstance();
  isInitializing = false;
  return result;
};

// Get the current Zama instance (for backward compatibility)
export const getZamaInstance = (): ZamaInstance | null => {
  return fheInstance;
};

// Check if SDK is available (for backward compatibility)
export const isZamaSDKAvailable = (): boolean => {
  return !!fheInstance;
};

// Create EIP-712 signature for user decryption
export const createEIP712Signature = async (instance: any, signer: any): Promise<string> => {
  try {
    // Generate keypair
    const keypair = instance.generateKeypair();
    
    // Create EIP-712 data
    const eip712 = instance.createEIP712(keypair.publicKey, [], Date.now(), 365);
    
    // Sign with ethers (remove EIP712Domain from types for ethers)
    const typesForEthers = { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification };
    const signature = await signer.signTypedData(
      eip712.domain,
      typesForEthers,
      eip712.message
    );
    
    return signature;
  } catch (error) {
    console.error('❌ Failed to create EIP-712 signature:', error);
    throw error;
  }
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