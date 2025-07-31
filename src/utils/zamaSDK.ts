// Không import npm SDK nữa!
import { ethers } from "ethers";

let instance: any = null;

export async function initializeZamaSDK() {
  if (instance) return instance;
  try {
    const sdk = (window as any).relayerSDK;
    if (!sdk) throw new Error('Zama SDK not found in window object. Make sure UMD CDN script is loaded.');
    const { initSDK, createInstance, SepoliaConfig } = sdk;
    await initSDK();
    const config = { ...SepoliaConfig, network: window.ethereum };
    instance = await createInstance(config);
    return instance;
  } catch (e) {
    instance = null;
    return null;
  }
}

// EIP-712 signature cho user decryption (tạm thời skip do SDK bug)
export async function createEIP712Signature(sdk: any, _signer: any) {
  try {
    const { publicKey } = sdk.generateKeypair();
    return { signature: '0x', publicKey };
  } catch (error) {
    return { signature: '0x', publicKey: '' };
  }
}

// Manual EIP-712 signature for user decryption
export async function createManualEIP712Signature(sdk: any, signer: any) {
  try {
    const { publicKey } = sdk.generateKeypair();
    
    const domain = {
      name: 'Zama FHE',
      version: '1',
      chainId: 11155111,
      verifyingContract: '0x0000000000000000000000000000000000000000'
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