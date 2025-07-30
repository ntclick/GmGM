import { GMStreakData } from '../types/gmStreak';

// GM Streak API Service with Onchain Integration
export class GMStreakAPI {
  private static instance: GMStreakAPI;
  private etherscanApiKey: string;
  private contractAddress: string;
  private apiCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    // Load API key from environment
    this.etherscanApiKey = import.meta.env.VITE_ETHERSCAN_API_KEY || 'SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6';
    this.contractAddress = import.meta.env.VITE_FHEVM_CONTRACT_ADDRESS || '0x72eEA702E909599bC92f75774c5f1cE41b8B59BA';
  }

  static getInstance(): GMStreakAPI {
    if (!GMStreakAPI.instance) {
      GMStreakAPI.instance = new GMStreakAPI();
    }
    return GMStreakAPI.instance;
  }

  // Force reload API key from environment
  reloadApiKey(): void {
    const newApiKey = import.meta.env.VITE_ETHERSCAN_API_KEY || 'SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6';
    this.etherscanApiKey = newApiKey;
  }

  // Cache management methods
  private getCachedData(key: string): any | null {
    const cached = this.apiCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.apiCache.set(key, { data, timestamp: Date.now() });
  }

  // Get onchain GM events for a user
  async getOnchainGMData(userAddress: string): Promise<any> {
    try {
      // Try different event signatures
      const eventSignatures = [
        '0xEncryptedGMSubmitted', // Original
        '0xGMSubmitted', // Alternative
        '0xEncryptedGM', // Another alternative
        '0xGMSubmitted' // Simple
      ];
      
      for (const eventSig of eventSignatures) {
        try {
          const url = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&topic0=${eventSig}&apikey=${this.etherscanApiKey}`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.status === '1' && data.result && data.result.length > 0) {
            return data.result;
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          // Silent error handling
        }
      }
      
      // If no events found, try getting all logs for the contract
      // Add delay before next API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allLogsUrl = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const allLogsResponse = await fetch(allLogsUrl);
      const allLogsData = await allLogsResponse.json();
      
      if (allLogsData.status === '1') {
        return allLogsData.result;
      } else {
        return [];
      }
      
    } catch (error) {
      return [];
    }
  }

  // Get total GM count from onchain
  async getTotalGMCount(): Promise<number> {
    try {
      // Check cache first
      const cacheKey = 'total_gm_count';
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get all contract logs
      const url = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1') {
        const totalCount = data.result.length;
        
        // Cache the result
        this.setCachedData(cacheKey, totalCount);
        
        return totalCount;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Get today's GM count from onchain
  async getTodayGMCount(): Promise<number> {
    try {
      const cacheKey = 'today_gm_count';
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate today's date range in UTC
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const startOfDay = Math.floor(today.getTime() / 1000);
      const endOfDay = startOfDay + 86400; // 24 hours in seconds
      
      // Get all contract logs
      const url = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const todayEvents = data.result.filter((event: any) => {
          const eventTime = parseInt(event.timeStamp, 16);
          return eventTime >= startOfDay && eventTime < endOfDay;
        });
        
        // Cache the result for 5 minutes
        this.setCachedData(cacheKey, todayEvents.length);
        return todayEvents.length;
      } else {
        return 0;
      }
    } catch (error) {
      return 0;
    }
  }

  // Test onchain API connection
  async testOnchainConnection(): Promise<void> {
    try {
      // Reload API key first
      this.reloadApiKey();
      
      // Test API key with a simple request first
      const testUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${this.etherscanApiKey}`;
      
      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();
      
      // Now test contract logs
      const url = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1') {
        // Contract logs available
      } else {
        // API Error
      }
      
    } catch (error) {
      // API Test failed
    }
  }

  // Test API with hardcoded key
  async testWithHardcodedKey(): Promise<void> {
    try {
      const testKey = 'SMYU9ZMV9DB55ZAFPW5JKN56S52RVBIWX6';
      const testUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=${testKey}`;
      
      const testResponse = await fetch(testUrl);
      const testData = await testResponse.json();
      
      // Test contract logs with hardcoded key
      const contractUrl = `https://api-sepolia.etherscan.io/api?module=logs&action=getLogs&address=${this.contractAddress}&apikey=${testKey}`;
      
      const contractResponse = await fetch(contractUrl);
      const contractData = await contractResponse.json();
      
      if (contractData.status === '1') {
        // Contract has logs with hardcoded key
      } else {
        // API Error with hardcoded key
      }
      
    } catch (error) {
      // Hardcoded key test failed
    }
  }

  // Sync local data with onchain data
  async syncWithOnchain(userAddress: string): Promise<GMStreakData> {
    try {
      // Test API connection first
      await this.testOnchainConnection();
      
      // Get local data
      const localData = this.getLocalData(userAddress);
      
      // Get onchain data
      const onchainEvents = await this.getOnchainGMData(userAddress);
      const totalOnchain = await this.getTotalGMCount();
      const todayOnchain = await this.getTodayGMCount();
      
      // Create initial streak data if none exists
      let mergedData: GMStreakData;
      
      if (localData.currentStreak === 0 && localData.lastGMDay === '') {
        // No local data exists, create initial data from onchain
        const today = new Date().toDateString();
        const now = Date.now();
        
        mergedData = {
          currentStreak: todayOnchain > 0 ? 1 : 0, // Start streak if today has GMs
          bestStreak: todayOnchain > 0 ? 1 : 0,
          totalGMs: totalOnchain,
          todayGMs: todayOnchain,
          lastGMDay: todayOnchain > 0 ? today : '',
          lastGMTime: todayOnchain > 0 ? now : 0,
          lastCategory: todayOnchain > 0 ? 'onchain' : '',
          lastSync: Date.now(),
          onchainEvents: onchainEvents.length
        };
      } else {
        // Merge existing local data with onchain
        mergedData = {
          ...localData,
          totalGMs: totalOnchain,
          todayGMs: todayOnchain,
          lastSync: Date.now(),
          onchainEvents: onchainEvents.length
        };
      }
      
      // Update local storage
      this.saveLocalData(userAddress, mergedData);
      
      return mergedData;
      
    } catch (error) {
      return this.getLocalData(userAddress);
    }
  }

  // Get local data from localStorage
  getLocalData(userAddress: string): GMStreakData {
    try {
      const data = localStorage.getItem(`gm_streak_${userAddress}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      // Silent error handling
    }
    
    return this.getDefaultData();
  }

  // Save data to localStorage
  saveLocalData(userAddress: string, data: GMStreakData): void {
    try {
      localStorage.setItem(`gm_streak_${userAddress}`, JSON.stringify(data));
    } catch (error) {
      // Silent error handling
    }
  }

  // Update streak data
  updateStreak(userAddress: string, category: string = 'general'): GMStreakData {
    const now = Date.now();
    const today = new Date().toDateString();
    const data = this.getLocalData(userAddress);
    
    // Check if already GM'd today
    if (data.lastGMDay === today) {
      return data;
    }
    
    // Reset streak if missed a day
    const yesterday = new Date(now - 24 * 60 * 60 * 1000).toDateString();
    if (data.lastGMDay !== yesterday && data.lastGMDay !== today) {
      data.currentStreak = 0;
    }
    
    // Update data
    data.currentStreak++;
    data.totalGMs++;
    data.todayGMs++;
    data.lastGMDay = today;
    data.lastGMTime = now;
    data.lastCategory = category;
    
    // Update best streak
    if (data.currentStreak > data.bestStreak) {
      data.bestStreak = data.currentStreak;
    }
    
    this.saveLocalData(userAddress, data);
    
    return data;
  }

  // Force refresh onchain data after GM
  async forceRefreshAfterGM(userAddress: string): Promise<GMStreakData> {
    try {
      // Clear cache to force fresh data
      this.apiCache.clear();
      
      // Wait a bit for transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Get fresh onchain data
      const onchainEvents = await this.getOnchainGMData(userAddress);
      const totalOnchain = await this.getTotalGMCount();
      const todayOnchain = await this.getTodayGMCount();
      
      // Get current local data
      const localData = this.getLocalData(userAddress);
      
      // Merge with fresh onchain data
      const refreshedData: GMStreakData = {
        ...localData,
        totalGMs: totalOnchain,
        todayGMs: todayOnchain,
        lastSync: Date.now(),
        onchainEvents: onchainEvents.length
      };
      
      // Save updated data
      this.saveLocalData(userAddress, refreshedData);
      
      return refreshedData;
      
    } catch (error) {
      return this.getLocalData(userAddress);
    }
  }

  // Get default data structure
  private getDefaultData(): GMStreakData {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalGMs: 0,
      todayGMs: 0,
      lastGMDay: '',
      lastGMTime: 0,
      lastCategory: '',
      lastSync: 0,
      onchainEvents: 0
    };
  }

  // Check if contract exists and has bytecode
  async checkContractExistence(): Promise<void> {
    try {
      // Check contract bytecode
      const bytecodeUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getCode&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const bytecodeResponse = await fetch(bytecodeUrl);
      const bytecodeData = await bytecodeResponse.json();
      
      if (bytecodeData.result && bytecodeData.result !== '0x') {
        // Contract has bytecode (exists)
      } else {
        // Contract has no bytecode (does not exist)
      }
      
      // Check contract balance
      const balanceUrl = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${this.contractAddress}&apikey=${this.etherscanApiKey}`;
      
      const balanceResponse = await fetch(balanceUrl);
      const balanceData = await balanceResponse.json();
      
      if (balanceData.status === '1') {
        // Contract balance available
      } else {
        // Error getting contract balance
      }
      
    } catch (error) {
      // Error checking contract existence
    }
  }
}

// GM Streak Data Interface
export interface GMStreakData {
  currentStreak: number;
  bestStreak: number;
  totalGMs: number;
  todayGMs: number;
  lastGMDay: string;
  lastGMTime: number;
  lastCategory: string;
  lastSync: number;
  onchainEvents: number;
} 