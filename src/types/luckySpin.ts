export interface PoolReward {
  name: string;
  imageUrl: string;
  value: number;
  probability: number;
}

export interface PublicScore {
  user: string;
  score: number;
  totalSpins: number;
  checkInDays: number;
  lastUpdate: number;
}

export interface UserStats {
  spinsLeft: number;
  score: number;
  totalSpins: number;
  checkInDays: number;
  lastRewardIndex: number;
}

export interface SpinResult {
  poolIndex: number;
  points: number;
  spinsLeft: number;
  reward: PoolReward;
}

export interface CheckInResult {
  spinsAdded: number;
  totalSpins: number;
  checkInDays: number;
}

// Event types
export interface PoolAddedEvent {
  index: number;
  name: string;
  imageUrl: string;
  value: number;
  probability: number;
}

export interface UserSpunEvent {
  user: string;
  poolIndex: number;
  points: number;
  spinsLeft: number;
}

export interface ScoreSubmittedEvent {
  user: string;
  score: number;
} 