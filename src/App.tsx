import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { ethers } from 'ethers';
import { initializeZamaSDK, createEIP712Signature } from './utils/zamaSDK';
import './utils/clearCache';
import { VERSION } from './utils/version';
import { CONTRACT_ABI, getContractAddress } from './config/contracts';
import GMStreak from './components/GMStreak';
import { GMStreakData } from './types/gmStreak';

// TypeScript types for window.ethereum
declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    ethereum?: any;
    relayerSDK?: any;
    fhevm?: any;
  }
}

// Main FHE GM Interface Component
const FHEGMInterface = () => {
  const [userAddress, setUserAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('🔗 Connect your wallet to start');
  const [gmCount, setGmCount] = useState<number>(1);
  const [category, setCategory] = useState<string>('morning');
  const [message, setMessage] = useState<string>('GM');
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false);

  const [isFHEReady, setIsFHEReady] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [streakData, setStreakData] = useState<GMStreakData>({
    currentStreak: 0,
    bestStreak: 0,
    totalGMs: 0,
    todayGMs: 0,
    lastGMDay: '',
    lastGMTime: 0,
    lastCategory: '',
    lastSync: 0,
    onchainEvents: 0
  });

  // Get current time-based category (GMT+0)
  const getCurrentTimeCategory = () => {
    const now = new Date();
    const gmtHour = now.getUTCHours(); // Get UTC hour (GMT+0)
    
    if (gmtHour >= 6 && gmtHour < 12) return 'morning';
    if (gmtHour >= 12 && gmtHour < 18) return 'afternoon';
    if (gmtHour >= 18 && gmtHour < 24) return 'evening';
    return 'night'; // 0:00 - 5:59 GMT
  };

  // Set initial category based on current time
  useEffect(() => {
    setCategory(getCurrentTimeCategory());
  }, []);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString());
    };
    
    updateTime(); // Update immediately
    const interval = setInterval(updateTime, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);

  // Force check FHE status when wallet connects
  useEffect(() => {
    if (isConnected && !isFHEReady) {
      const checkFHE = async () => {
        const sdk = await initializeZamaSDK();
        if (sdk) {
          setIsFHEReady(true);
        }
      };
      checkFHE();
    }
  }, [isConnected]);

  // Initialize FHE once on mount
  useEffect(() => {
    const initFHE = async () => {
      try {
        const sdk = await initializeZamaSDK();
        if (sdk) {
          setIsFHEReady(true);
        }
      } catch (error) {
        console.error('❌ FHE initialization failed on mount:', error);
      }
    };
    initFHE();
  }, []);

  // Check previous connection on mount
  useEffect(() => {
    checkPreviousConnection();
    loadStreakData();
  }, []);

  // Load streak data from localStorage
  const loadStreakData = () => {
    try {
      const saved = localStorage.getItem('gm-streak-data');
      if (saved) {
        const data = JSON.parse(saved);
        setStreakData(data);
      }
    } catch (error) {
      // console.error('Failed to load streak data:', error);
    }
  };

  // Update streak data
  const updateStreakData = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastGM = streakData.lastGMDay;
    
    let newStreak = streakData.currentStreak;
    let newTotalGMs = streakData.totalGMs + 1;
    let newTodayGMs = streakData.todayGMs + 1;
    let newLongestStreak = streakData.bestStreak;

    // Check if this is the first GM of the day
    if (lastGM !== today) {
      // Check if streak should continue or reset
      if (lastGM) {
        const lastGMDate = new Date(lastGM);
        const daysDiff = Math.floor((now.getTime() - lastGMDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day - continue streak
          newStreak += 1;
        } else if (daysDiff > 1) {
          // Missed a day - reset streak
          newStreak = 1;
        } else {
          // Same day - don't change streak
          newStreak = streakData.currentStreak;
        }
      } else {
        // First GM ever
        newStreak = 1;
      }
      
      newTodayGMs = 1; // Reset today's count
    }

    // Update longest streak
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
    }

    const newData: GMStreakData = {
      currentStreak: newStreak,
      totalGMs: newTotalGMs,
      todayGMs: newTodayGMs,
      lastGMDay: today,
      bestStreak: newLongestStreak,
      lastGMTime: Date.now(),
      lastCategory: category,
      lastSync: Date.now(),
      onchainEvents: 0
    };

    // Save to localStorage
    try {
      localStorage.setItem('gm-streak-data', JSON.stringify(newData));
      setStreakData(newData);
    } catch (error) {
      // console.error('Failed to save streak data:', error);
    }

    // Sync to API
    if (userAddress) {
              // GM Streak will be handled by the component
    }
  };

  // Check if current network is Sepolia
  const checkNetwork = async () => {
    try {
      if (window.ethereum) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainId = '0xaa36a7';
        setIsCorrectNetwork(chainId === sepoliaChainId);
      }
    } catch (error) {
      // console.error('Failed to check network:', error);
      setIsCorrectNetwork(false);
    }
  };

  // Listen for network and account changes
  useEffect(() => {
    if (window.ethereum) {
      checkNetwork();
      
      const handleChainChanged = () => {
        checkNetwork();
      };

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected from MetaMask
          disconnectWallet();
        } else if (isConnected && accounts[0].toLowerCase() !== userAddress.toLowerCase()) {
          // User switched accounts
          setUserAddress(accounts[0]);
          localStorage.setItem('wallet-address', accounts[0]);
          // console.log('🔄 Account changed to:', accounts[0]);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isConnected, userAddress]);

  // Check and switch to Sepolia network
  const checkAndSwitchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7'; // Sepolia chain ID in hex
      
      // console.log('Current chainId:', chainId);
      // console.log('Expected Sepolia chainId:', sepoliaChainId);
      
      if (chainId !== sepoliaChainId) {
        // console.log('🔄 Wrong network detected, switching to Sepolia...');
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
          // console.log('✅ Successfully switched to Sepolia');
          return true;
        } catch (switchError: any) {
          // console.log('Switch error:', switchError);
          // If Sepolia is not added to MetaMask, add it
          if (switchError.code === 4902) {
            // console.log('➕ Sepolia not in MetaMask, adding it...');
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: sepoliaChainId,
                  chainName: 'Sepolia',
                  nativeCurrency: {
                    name: 'Sepolia Ether',
                    symbol: 'SEP',
                    decimals: 18,
                  },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
              });
              // console.log('✅ Successfully added Sepolia network');
              return true;
            } catch (addError: any) {
              // console.error('❌ Failed to add Sepolia network:', addError);
              return false;
            }
          }
          // console.error('❌ Failed to switch to Sepolia network:', switchError);
          return false;
        }
      } else {
        // console.log('✅ Already on Sepolia network');
      }
      return true;
    } catch (error: any) {
      // console.error('❌ Failed to check network:', error);
      return false;
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        setStatus('❌ MetaMask not found. Please install MetaMask.');
        return;
      }

      // Check and switch to Sepolia network
      const networkSwitched = await checkAndSwitchNetwork();
      if (!networkSwitched) {
        setStatus('❌ Please switch to Sepolia network to use this app');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      setUserAddress(address);
      setIsConnected(true);
      setStatus('✅ Wallet connected successfully to Sepolia');
      
      // Save connection state to localStorage
      localStorage.setItem('wallet-connected', 'true');
      localStorage.setItem('wallet-address', address);
      
      // console.log('🔗 Connected to wallet:', address);
    } catch (error: any) {
      console.error('❌ Wallet connection error:', error);
      
      // Handle specific MetaMask errors
      if (error.message.includes('MetaMask extension not found')) {
        setStatus('❌ MetaMask extension not found. Please install MetaMask.');
      } else if (error.message.includes('user rejected')) {
        setStatus('❌ Connection rejected by user.');
      } else if (error.message.includes('network')) {
        setStatus('❌ Network error. Please check your connection.');
      } else {
        setStatus('❌ Failed to connect wallet: ' + error.message);
      }
    }
  }, [checkAndSwitchNetwork]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setUserAddress('');
    setIsConnected(false);
    setStatus('🔗 Connect your wallet to start');
    
    // Clear connection state from localStorage
    localStorage.removeItem('wallet-connected');
    localStorage.removeItem('wallet-address');
    
    // console.log('🔌 Disconnected wallet');
  }, []);

  // Check if wallet was previously connected
  const checkPreviousConnection = useCallback(async () => {
    try {
      const wasConnected = localStorage.getItem('wallet-connected');
      const savedAddress = localStorage.getItem('wallet-address');
      
      if (wasConnected === 'true' && savedAddress && window.ethereum) {
        // Check if MetaMask is still available and connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
            setUserAddress(savedAddress);
            setIsConnected(true);
            setStatus('✅ Wallet reconnected automatically');
            // console.log('🔗 Auto-reconnected to wallet:', savedAddress);
          } else {
            // Clear invalid saved state
            localStorage.removeItem('wallet-connected');
            localStorage.removeItem('wallet-address');
          }
        } catch (metamaskError) {
          console.error('❌ MetaMask error during auto-reconnect:', metamaskError);
          // Clear invalid saved state
          localStorage.removeItem('wallet-connected');
          localStorage.removeItem('wallet-address');
        }
      }
    } catch (error) {
      console.error('❌ Failed to check previous connection:', error);
      // Clear invalid saved state
      localStorage.removeItem('wallet-connected');
      localStorage.removeItem('wallet-address');
    }
  }, []);

  // Submit simple GM
  const submitSimpleGM = useCallback(async () => {
    if (!isConnected) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      setStatus('❌ Please switch to Sepolia network first');
      return;
    }

    setIsLoading(true);
    setStatus('🔧 Submitting simple GM...');
    
    try {
      // Initialize Zama SDK first
      const sdk = await initializeZamaSDK();
      if (!sdk) {
        throw new Error('FHE SDK not ready. Please wait or refresh FHE status.');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(getContractAddress('FHE_GM_CONTRACT'), CONTRACT_ABI, signer);
      
      // Create encrypted input
      const ciphertext = await sdk.createEncryptedInput(getContractAddress('FHE_GM_CONTRACT'), userAddress);
      ciphertext.add64(gmCount);
      const { handles, inputProof } = await ciphertext.encrypt();
      
      // Create EIP-712 signature
      setStatus('🔧 Creating EIP-712 signature...');
      console.log('🔐 About to create EIP-712 signature...');
      const eip712Result = await createEIP712Signature(sdk, signer);
      console.log('✅ EIP-712 signature result:', eip712Result);
      
      // Submit transaction using the correct 'gm' function (like old code)
      const tx = await contract.gm!(
        handles[0], 
        inputProof,
        {
          gasLimit: 1000000,
          maxFeePerGas: ethers.parseUnits("30", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("5", "gwei")
        }
      );
      
      await tx.wait();
      
      // Update streak data
      updateStreakData();
      
      setStatus(`✅ Simple GM submitted successfully! Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`);
      
      // console.log('✅ Simple GM submitted:', tx.hash);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('GM Submitted!', {
          body: `Simple GM transaction submitted successfully!\nHash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error: any) {
      setStatus('❌ Failed to submit GM: ' + error.message);
      // console.error('❌ GM submission error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isCorrectNetwork, gmCount, userAddress, updateStreakData]);

  // Submit encrypted GM with category
  const submitEncryptedGM = useCallback(async () => {
    // Prevent multiple simultaneous submissions
    if (isLoading) {
      // console.log('⏸️ Submission already in progress, skipping...');
      return;
    }
    
    if (!isConnected) {
      setStatus('❌ Please connect your wallet first');
      return;
    }

    if (!isCorrectNetwork) {
      setStatus('❌ Please switch to Sepolia network first');
      return;
    }

    if (!category.trim()) {
      setStatus('❌ Please select a category');
      return;
    }

    // Use "GM" as default message if empty
    const finalMessage = message.trim() || 'GM';

    setIsLoading(true);
    setStatus('🔧 Initializing FHE SDK...');
    
    try {
      // Initialize Zama SDK with timeout and progress updates
      setStatus('🔧 Loading FHE SDK (this may take 10-15 seconds)...');
      const sdk = await Promise.race([
        initializeZamaSDK(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SDK initialization timeout - please try again')), 60000)
        )
      ]);
      
      if (!sdk) {
        throw new Error('Failed to initialize FHE SDK');
      }
      
      setStatus('🔧 Creating encrypted input...');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(getContractAddress('FHE_GM_CONTRACT'), CONTRACT_ABI, signer);
      
      // Create encrypted input with timeout
      setStatus('🔧 Preparing encryption data...');
      const ciphertext = await Promise.race([
        sdk.createEncryptedInput(getContractAddress('FHE_GM_CONTRACT'), userAddress),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encrypted input creation timeout')), 15000)
        )
      ]);
      
      ciphertext.add32(gmCount);
      
      setStatus('🔧 Encrypting data (this may take 5-10 seconds)...');
      const { handles, inputProof } = await Promise.race([
        ciphertext.encrypt(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Encryption timeout - please try again')), 15000)
        )
      ]);
      
      setStatus('🔧 Creating signature...');
      // Create EIP-712 signature with timeout
      await Promise.race([
        createEIP712Signature(sdk, signer),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Signature creation timeout')), 10000)
        )
      ]);
      
      setStatus('🔧 Submitting transaction to blockchain...');
      
      // Debug: Log the parameters being sent
      // console.log('🔧 Transaction parameters:', {
      //   handles: handles,
      //   inputProof: inputProof,
      //   category: category,
      //   finalMessage: finalMessage,
      //   handlesLength: handles.length,
      //   inputProofType: typeof inputProof
      // });
      
      // Submit transaction with reasonable gas settings
      const tx = await contract.submitEncryptedGMSimple!(
        handles[0], 
        inputProof, 
        category, 
        finalMessage,
        {
          gasLimit: 600000, // Reasonable gas limit
          maxFeePerGas: ethers.parseUnits("30", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("5", "gwei")
        }
      );
      
      setStatus('🔧 Waiting for blockchain confirmation...');
      await tx.wait();
      
      // Update streak data
      updateStreakData();
      
      setStatus(`✅ Encrypted GM submitted successfully! Hash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`);
      
      // Reset form
      setCategory(getCurrentTimeCategory());
      setMessage('GM');
      
      // console.log('✅ Encrypted GM submitted:', tx.hash);
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Encrypted GM Submitted!', {
          body: `Encrypted GM transaction submitted successfully!\nHash: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}\nCategory: ${category}\nMessage: ${finalMessage}`,
          icon: '/favicon.ico'
        });
      }
    } catch (error: any) {
      // console.error('❌ Encrypted GM submission error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to submit encrypted GM';
      if (error.message.includes('timeout')) {
        errorMessage = 'Operation timed out. Please try again.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fee.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('SDK')) {
        errorMessage = 'FHE SDK error. Please refresh the page and try again.';
      } else {
        errorMessage = error.message;
      }
      
      setStatus(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, isCorrectNetwork, gmCount, category, message, userAddress, updateStreakData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-3xl">🐧</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                🔐 FHE GM Contract
              </h1>
              <p className="text-gray-600">
                Submit encrypted GM messages using Fully Homomorphic Encryption
              </p>
            </div>
          </div>
                     <p className="text-sm text-gray-500 mt-2">
             🌍 Current GMT Time: {currentTime ? currentTime.slice(17, 22) : new Date().toUTCString().slice(17, 22)} | 
             📅 {currentTime ? currentTime.slice(0, 16) : new Date().toUTCString().slice(0, 16)} |
             🕐 Categories based on GMT+0 timezone | 
             🚀 Version: {VERSION} | 
             ⚡ Optimized for stability
           </p>
           <div className="mt-3">
             <a 
               href="https://x.com/trungkts29" 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
             >
               <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
               </svg>
               @trungkts29
             </a>
           </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                System Status
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600">{status}</p>
                <p className={`text-sm font-medium ${
                  isFHEReady ? 'text-green-600' : 'text-red-600'
                }`}>
                  🔐 FHE Status: {isFHEReady ? '✅ Ready' : '❌ Not Ready'} {!isFHEReady && '(Waiting for initialization...)'}
                </p>
                {userAddress && (
                  <p className="text-sm text-gray-500">
                    Address: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                  </p>
                )}
                <div className="flex space-x-2 mt-2">
                  {!isFHEReady && (
                    <button
                      onClick={async () => {
                        console.log('🔄 Manual FHE check...');
                        const sdk = await initializeZamaSDK();
                        console.log('🔍 Manual check result:', sdk);
                        setIsFHEReady(!!sdk);
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      🔄 Check FHE
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      console.log('🔍 Debug FHE State:', {
                        isFHEReady,
                        isConnected,
                        isCorrectNetwork,
                        isLoading
                      });
                      console.log('🔍 Window SDK:', (window as any).relayerSDK);
                      const sdk = await initializeZamaSDK();
                      console.log('🔍 SDK Test:', sdk);
                      setIsFHEReady(!!sdk);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs"
                  >
                    🔍 Debug FHE
                  </button>
                </div>
              </div>
              {isConnected && !isCorrectNetwork && (
                <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Wrong network detected. Please switch to Sepolia.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {isConnected && !isCorrectNetwork && (
                <button
                  onClick={async () => {
                    // console.log('🔄 Manual network switch requested...');
                    await checkAndSwitchNetwork();
                    // console.log('Network switch result:', result);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  🔄 Switch to Sepolia
                </button>
              )}
              {isConnected ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={disconnectWallet}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    🔌 Disconnect Wallet
                  </button>
                  <p className="text-xs text-green-600 font-medium">
                    ✅ Connected to Sepolia
                  </p>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  🔗 Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FHE Warning */}
        {isConnected && !isFHEReady && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  🔐 FHE SDK Not Ready
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>FHE SDK is required for encrypted operations. Please wait for initialization.</p>
                  <p className="mt-1 font-medium">GM submission buttons will be enabled once FHE SDK is ready.</p>
                </div>
                <div className="mt-4 flex gap-2">
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  ⚠️ Wrong Network Detected
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>This app requires Sepolia testnet. Please switch to Sepolia network to continue.</p>
                  <p className="mt-1 font-medium">You cannot load data from blockchain or submit GM until you switch networks.</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={checkAndSwitchNetwork}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700"
                  >
                    🔄 Switch to Sepolia
                  </button>
                  <button
                    onClick={async () => {
                      // console.log('🔄 Manual network switch requested...');
                      await checkAndSwitchNetwork();
                      // console.log('Network switch result:', result);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    🔧 Manual Switch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GM Submission Forms */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Simple GM Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🚀 Simple GM
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GM Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={gmCount}
                  onChange={(e) => setGmCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={submitSimpleGM}
                disabled={!isConnected || !isCorrectNetwork || isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Submitting...' : '📤 Submit Simple GM'}
              </button>
            </div>
          </div>

          {/* Encrypted GM Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🔐 Encrypted GM
            </h3>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ⏱️ <strong>Note:</strong> Encrypted GM submission may take 15-30 seconds due to FHE encryption processing. 
                Please be patient and don't close the browser during submission.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GM Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={gmCount}
                  onChange={(e) => setGmCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">🌅 Morning (6:00 - 11:59 GMT)</option>
                  <option value="afternoon">☀️ Afternoon (12:00 - 17:59 GMT)</option>
                  <option value="evening">🌙 Evening (18:00 - 23:59 GMT)</option>
                  <option value="night">🌃 Night (00:00 - 5:59 GMT)</option>
                  <option value="general">📝 General</option>
                  <option value="tech">💻 Tech</option>
                  <option value="crypto">₿ Crypto</option>
                  <option value="work">💼 Work</option>
                  <option value="personal">👤 Personal</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Current GMT time: {currentTime ? currentTime.slice(17, 22) : new Date().toUTCString().slice(17, 22)} | 
                  Suggested: {getCurrentTimeCategory() === 'morning' ? '🌅 Morning' : 
                    getCurrentTimeCategory() === 'afternoon' ? '☀️ Afternoon' : 
                    getCurrentTimeCategory() === 'evening' ? '🌙 Evening' : '🌃 Night'}
                </p>
                <button
                  onClick={() => setCategory(getCurrentTimeCategory())}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  🔄 Update to current time
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="GM (default message)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Leave empty or type "GM" for default message
                </p>
              </div>
                             <button
                 onClick={submitEncryptedGM}
                 disabled={!isConnected || !isCorrectNetwork || !isFHEReady || isLoading}
                 className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
               >
                 {isLoading ? '⏳ Submitting...' : '🔐 Submit Encrypted GM'}
               </button>
            </div>
          </div>
        </div>

        {/* GM Streak Section */}
        <div className="mb-6">
          {userAddress && (
          <GMStreak 
            userAddress={userAddress} 
            onStreakUpdate={(data) => {
              // console.log('🔄 GM Streak updated:', data);
              setStreakData(data);
            }}
          />
        )}
        </div>

                 {/* FHE Information */}
         <div className="bg-blue-50 rounded-lg p-6 mt-6">
           <h3 className="text-lg font-semibold text-blue-800 mb-3">
             🔐 About FHE (Fully Homomorphic Encryption)
           </h3>
           <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
             <div>
               <h4 className="font-medium mb-2">✅ What FHE Provides:</h4>
               <ul className="space-y-1">
                 <li>• Complete data privacy on-chain</li>
                 <li>• Encrypted computations</li>
                 <li>• Zero-knowledge proofs</li>
                 <li>• Censorship resistance</li>
               </ul>
             </div>
             <div>
               <h4 className="font-medium mb-2">🔧 How It Works:</h4>
               <ul className="space-y-1">
                 <li>• Data encrypted before submission</li>
                 <li>• Smart contract processes encrypted data</li>
                 <li>• Results remain encrypted</li>
                 <li>• Only authorized users can decrypt</li>
               </ul>
             </div>
           </div>
         </div>

         {/* Footer with Author Info */}
         <div className="bg-gray-50 rounded-lg p-6 mt-6">
           <div className="text-center">
             <h3 className="text-lg font-semibold text-gray-800 mb-3">
               🚀 Built with ❤️ by
             </h3>
             <div className="flex items-center justify-center space-x-4">
               <a 
                 href="https://x.com/trungkts29" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
               >
                 <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                 </svg>
                 @trungkts29
               </a>
               <span className="text-gray-600">•</span>
               <span className="text-sm text-gray-600">
                 FHE GM Contract Interface
               </span>
               <span className="text-gray-600">•</span>
               <span className="text-sm text-gray-600">
                 Powered by Zama FHE
               </span>
             </div>
             <p className="text-xs text-gray-500 mt-3">
               🔐 Privacy-first encrypted messaging on Ethereum
             </p>
           </div>
         </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <FHEGMInterface />
    </div>
  );
}

export default App; 