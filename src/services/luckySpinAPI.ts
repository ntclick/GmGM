import { ethers } from "ethers";
import { initializeZamaSDK, createEIP712Signature } from "../utils/zamaSDK";
import { 
  PoolReward, 
  PublicScore, 
  UserStats, 
  SpinResult, 
  CheckInResult 
} from "../types/luckySpin";

// ABI for LuckySpinFHE contract
const LUCKY_SPIN_ABI = [
  // Pool management
  "function addPool(string name, string imageUrl, uint256 value, uint256 probability) external",
  "function updatePool(uint256 index, string name, string imageUrl, uint256 value, uint256 probability) external",
  "function removePool(uint256 index) external",
  "function poolCount() external view returns (uint256)",
  "function getPool(uint256 index) external view returns (string name, string imageUrl, uint256 value, uint256 probability)",
  "function getPoolRewards() external view returns (tuple(string name, string imageUrl, uint256 value, uint256 probability)[])",
  
  // User actions
  "function checkIn(bytes encryptedSpins, bytes attestation) external",
  "function spinAndClaimReward(bytes encryptedPoolIndex, bytes encryptedPoint, bytes attestationPool, bytes attestationPoint) external",
  "function makeScorePublic() external",
  
  // Admin functions
  "function submitPublicScore(address user, uint32 plainScore, uint32 plainTotalSpins, uint32 plainCheckInDays) external",
  "function resetLeaderboard() external",
  "function removeScoreFromLeaderboard(uint256 index) external",
  
  // View functions
  "function getLeaderboard() external view returns (tuple(address user, uint32 score, uint32 totalSpins, uint32 checkInDays, uint256 lastUpdate)[])",
  "function getTopPlayers(uint256 count) external view returns (tuple(address user, uint32 score, uint32 totalSpins, uint32 checkInDays, uint256 lastUpdate)[])",
  "function hasSpinsLeft(address user) external view returns (bool)",
  
  // Encrypted state (readable by user only)
  "function encryptedSpinCount(address user) external view returns (bytes)",
  "function encryptedScores(address user) external view returns (bytes)",
  "function encryptedTotalSpins(address user) external view returns (bytes)",
  "function encryptedCheckInDays(address user) external view returns (bytes)",
  "function encryptedLastRewardIndex(address user) external view returns (bytes)",
  
  // Events
  "event PoolAdded(uint256 indexed index, string name, string imageUrl, uint256 value, uint256 probability)",
  "event UserCheckedIn(address indexed user, uint8 spinsAdded)",
  "event UserSpun(address indexed user, uint8 poolIndex, uint32 points, uint8 spinsLeft)",
  "event ScoreMadePublic(address indexed user)",
  "event ScoreSubmitted(address indexed user, uint32 score)"
];

export class LuckySpinAPI {
  private contract: ethers.Contract;
  private sdk: any;
  private signer: ethers.Signer;

  constructor(contractAddress: string, signer: ethers.Signer) {
    this.contract = new ethers.Contract(contractAddress, LUCKY_SPIN_ABI, signer);
    this.signer = signer;
  }

  async initialize() {
    this.sdk = await initializeZamaSDK();
    if (!this.sdk) {
      throw new Error("Failed to initialize Zama SDK");
    }
  }

  // ===== POOL MANAGEMENT =====
  async getPools(): Promise<PoolReward[]> {
    const pools = await this.contract.getPoolRewards();
    return pools.map((pool: any) => ({
      name: pool.name,
      imageUrl: pool.imageUrl,
      value: Number(pool.value),
      probability: Number(pool.probability)
    }));
  }

  async getPool(index: number): Promise<PoolReward> {
    const pool = await this.contract.getPool(index);
    return {
      name: pool.name,
      imageUrl: pool.imageUrl,
      value: Number(pool.value),
      probability: Number(pool.probability)
    };
  }

  async getPoolCount(): Promise<number> {
    return Number(await this.contract.poolCount());
  }

  // ===== USER ACTIONS =====
  async checkIn(spinsToAdd: number): Promise<CheckInResult> {
    if (!this.sdk) throw new Error("SDK not initialized");

    const userAddress = await this.signer.getAddress();
    const contractAddress = await this.contract.getAddress();

    // Encrypt spins to add
    const encryptedInput = await this.sdk.createEncryptedInput(
      spinsToAdd,
      'euint8',
      userAddress,
      contractAddress
    );

    // Send transaction
    const tx = await this.contract.checkIn(
      encryptedInput.value,
      encryptedInput.attestation
    );
    await tx.wait();

    // Decrypt updated values
    const spinsLeft = await this.sdk.decrypt(
      await this.contract.encryptedSpinCount(userAddress),
      userAddress
    );

    const checkInDays = await this.sdk.decrypt(
      await this.contract.encryptedCheckInDays(userAddress),
      userAddress
    );

    return {
      spinsAdded: spinsToAdd,
      totalSpins: Number(checkInDays),
      checkInDays: Number(checkInDays)
    };
  }

  async spinWheel(): Promise<SpinResult> {
    if (!this.sdk) throw new Error("SDK not initialized");

    const userAddress = await this.signer.getAddress();
    const contractAddress = await this.contract.getAddress();

    // Get pools for random selection
    const pools = await this.getPools();
    
    // Frontend logic: Random pool selection based on probability
    const poolIndex = this.selectRandomPool(pools);
    const points = this.calculatePoints(poolIndex, pools);

    // Encrypt pool index and points
    const encryptedPoolIndex = await this.sdk.createEncryptedInput(
      poolIndex,
      'euint8',
      userAddress,
      contractAddress
    );

    const encryptedPoints = await this.sdk.createEncryptedInput(
      points,
      'euint32',
      userAddress,
      contractAddress
    );

    // Send transaction
    const tx = await this.contract.spinAndClaimReward(
      encryptedPoolIndex.value,
      encryptedPoints.value,
      encryptedPoolIndex.attestation,
      encryptedPoints.attestation
    );
    await tx.wait();

    // Decrypt updated values
    const spinsLeft = await this.sdk.decrypt(
      await this.contract.encryptedSpinCount(userAddress),
      userAddress
    );

    const lastRewardIndex = await this.sdk.decrypt(
      await this.contract.encryptedLastRewardIndex(userAddress),
      userAddress
    );

    return {
      poolIndex: Number(lastRewardIndex),
      points: points,
      spinsLeft: Number(spinsLeft),
      reward: pools[poolIndex]
    };
  }

  async makeScorePublic(): Promise<void> {
    const tx = await this.contract.makeScorePublic();
    await tx.wait();
  }

  // ===== USER STATS =====
  async getUserStats(): Promise<UserStats> {
    if (!this.sdk) throw new Error("SDK not initialized");

    const userAddress = await this.signer.getAddress();

    // Decrypt all user stats
    const spinsLeft = await this.sdk.decrypt(
      await this.contract.encryptedSpinCount(userAddress),
      userAddress
    );

    const score = await this.sdk.decrypt(
      await this.contract.encryptedScores(userAddress),
      userAddress
    );

    const totalSpins = await this.sdk.decrypt(
      await this.contract.encryptedTotalSpins(userAddress),
      userAddress
    );

    const checkInDays = await this.sdk.decrypt(
      await this.contract.encryptedCheckInDays(userAddress),
      userAddress
    );

    const lastRewardIndex = await this.sdk.decrypt(
      await this.contract.encryptedLastRewardIndex(userAddress),
      userAddress
    );

    return {
      spinsLeft: Number(spinsLeft),
      score: Number(score),
      totalSpins: Number(totalSpins),
      checkInDays: Number(checkInDays),
      lastRewardIndex: Number(lastRewardIndex)
    };
  }

  async hasSpinsLeft(): Promise<boolean> {
    const userAddress = await this.signer.getAddress();
    return await this.contract.hasSpinsLeft(userAddress);
  }

  // ===== LEADERBOARD =====
  async getLeaderboard(): Promise<PublicScore[]> {
    const leaderboard = await this.contract.getLeaderboard();
    return leaderboard.map((score: any) => ({
      user: score.user,
      score: Number(score.score),
      totalSpins: Number(score.totalSpins),
      checkInDays: Number(score.checkInDays),
      lastUpdate: Number(score.lastUpdate)
    }));
  }

  async getTopPlayers(count: number): Promise<PublicScore[]> {
    const topPlayers = await this.contract.getTopPlayers(count);
    return topPlayers.map((score: any) => ({
      user: score.user,
      score: Number(score.score),
      totalSpins: Number(score.totalSpins),
      checkInDays: Number(score.checkInDays),
      lastUpdate: Number(score.lastUpdate)
    }));
  }

  // ===== UTILITY FUNCTIONS =====
  private selectRandomPool(pools: PoolReward[]): number {
    // Simple random selection based on probability
    const random = Math.random() * 10000;
    let cumulative = 0;
    
    for (let i = 0; i < pools.length; i++) {
      cumulative += pools[i].probability;
      if (random <= cumulative) {
        return i;
      }
    }
    
    return pools.length - 1; // Fallback to last pool
  }

  private calculatePoints(poolIndex: number, pools: PoolReward[]): number {
    // Calculate points based on pool value
    const pool = pools[poolIndex];
    return Math.floor(pool.value / 10); // Example: 100 tokens = 10 points
  }

  // ===== ADMIN FUNCTIONS (only for contract owner) =====
  async submitPublicScore(
    user: string, 
    score: number, 
    totalSpins: number, 
    checkInDays: number
  ): Promise<void> {
    const tx = await this.contract.submitPublicScore(user, score, totalSpins, checkInDays);
    await tx.wait();
  }

  async addPool(
    name: string, 
    imageUrl: string, 
    value: number, 
    probability: number
  ): Promise<void> {
    const tx = await this.contract.addPool(name, imageUrl, value, probability);
    await tx.wait();
  }

  async updatePool(
    index: number, 
    name: string, 
    imageUrl: string, 
    value: number, 
    probability: number
  ): Promise<void> {
    const tx = await this.contract.updatePool(index, name, imageUrl, value, probability);
    await tx.wait();
  }

  async removePool(index: number): Promise<void> {
    const tx = await this.contract.removePool(index);
    await tx.wait();
  }

  async resetLeaderboard(): Promise<void> {
    const tx = await this.contract.resetLeaderboard();
    await tx.wait();
  }
} 