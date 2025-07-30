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

export interface GMStreakStats {
  userAddress: string;
  streakData: GMStreakData;
  lastUpdated: number;
  syncStatus: 'local' | 'synced' | 'error';
}

export interface GMStreakUpdate {
  userAddress: string;
  streakData: GMStreakData;
  timestamp: number;
  transactionHash?: string;
} 