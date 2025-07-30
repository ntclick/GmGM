import React, { useState, useEffect } from 'react';
import { GMStreakAPI } from '../services/gmStreakAPI';
import { GMStreakData } from '../types/gmStreak';

interface GMStreakProps {
  userAddress: string;
  onStreakUpdate?: (_data: GMStreakData) => void;
}

const GMStreak: React.FC<GMStreakProps> = ({ userAddress, onStreakUpdate }) => {
  const [streakData, setStreakData] = useState<GMStreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [gmNotification, setGmNotification] = useState<string>('');

  const api = GMStreakAPI.getInstance();

  // Load initial data and auto sync
  useEffect(() => {
    if (userAddress) {
      // Immediately start loading from API
      loadStreakDataFromAPI();
    }
  }, [userAddress]);

  // Auto sync every 10 minutes (silent)
  useEffect(() => {
    const interval = setInterval(() => {
      if (userAddress) {
        silentSyncWithOnchain();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [userAddress]);

  // Auto sync when window becomes visible (silent)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userAddress) {
        silentSyncWithOnchain();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userAddress]);

  const loadStreakDataFromAPI = async () => {
    try {
      setLoading(true);
      
      // First, get local data as fallback
      api.getLocalData(userAddress);
      
      // Then immediately sync with onchain data
      const syncedData = await api.syncWithOnchain(userAddress);
      setStreakData(syncedData);
      setLastSyncTime(syncedData.lastSync);
      
      if (onStreakUpdate) {
        onStreakUpdate(syncedData);
      }
      
    } catch (error) {
      // If API sync fails, use local data
      const localData = api.getLocalData(userAddress);
      setStreakData(localData);
      setLastSyncTime(localData.lastSync);
      
      if (onStreakUpdate) {
        onStreakUpdate(localData);
      }
    } finally {
      setLoading(false);
    }
  };

  // Silent sync without notifications
  const silentSyncWithOnchain = async () => {
    try {
      const syncedData = await api.syncWithOnchain(userAddress);
      setStreakData(syncedData);
      setLastSyncTime(syncedData.lastSync);
      
      if (onStreakUpdate) {
        onStreakUpdate(syncedData);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const syncWithOnchain = async (isAutoSync: boolean = false) => {
    try {
      setSyncing(true);
      
      const syncedData = await api.syncWithOnchain(userAddress);
      setStreakData(syncedData);
      setLastSyncTime(syncedData.lastSync);
      
      if (onStreakUpdate) {
        onStreakUpdate(syncedData);
      }
      
      // Only show notification for manual sync
      if (!isAutoSync) {
        setGmNotification('🔄 Sync completed');
        setTimeout(() => setGmNotification(''), 2000);
      }
    } catch (error) {
      // Silent error handling for production
    } finally {
      setSyncing(false);
    }
  };

    const updateStreak = (category: string = 'general') => {
    try {
      const updatedData = api.updateStreak(userAddress, category);
      setStreakData(updatedData);
      
      if (onStreakUpdate) {
        onStreakUpdate(updatedData);
      }
      
      // Force sync with onchain immediately after GM
      setGmNotification('✅ GM submitted! Syncing with blockchain...');
      
      setTimeout(async () => {
        try {
          const refreshedData = await api.forceRefreshAfterGM(userAddress);
          setStreakData(refreshedData);
          setLastSyncTime(refreshedData.lastSync);
          
          if (onStreakUpdate) {
            onStreakUpdate(refreshedData);
          }
          
          setGmNotification('🎉 GM synced with blockchain!');
          setTimeout(() => setGmNotification(''), 3000);
        } catch (error) {
          setGmNotification('⚠️ Sync failed, trying again...');
          // Fallback to normal sync
          syncWithOnchain(true);
        }
      }, 2000); // Increased delay to ensure transaction is mined
      
    } catch (error) {
      // Silent error handling for production
    }
  };



  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = Date.now();
    const diff = now - lastSyncTime;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">GM Streak</h3>
          <p className="text-sm text-gray-600">Loading data from blockchain...</p>
        </div>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">GM Streak</h3>
        <p className="text-gray-600">No streak data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* GM Notification */}
      {gmNotification && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 text-center">{gmNotification}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-semibold text-gray-800">GM Streak</h3>
                   <div className="flex space-x-2">
            <button
              onClick={() => syncWithOnchain()}
              disabled={syncing}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                syncing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {syncing ? '🔄 Syncing...' : '🔄 Sync'}
            </button>
          </div>
       </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{streakData.currentStreak}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{streakData.bestStreak}</div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{streakData.totalGMs}</div>
          <div className="text-sm text-gray-600">Total GMs</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{streakData.todayGMs}</div>
          <div className="text-sm text-gray-600">Today's GMs</div>
        </div>
      </div>

             <div className="space-y-2 text-sm text-gray-600">
         <div className="flex justify-between">
           <span>Last GM:</span>
           <span>{streakData.lastGMDay ? new Date(streakData.lastGMTime).toLocaleString() : 'Never'}</span>
         </div>
         
         <div className="flex justify-between">
           <span>Last Category:</span>
           <span className="capitalize">{streakData.lastCategory || 'None'}</span>
         </div>
         
         <div className="flex justify-between">
           <span>Onchain Events:</span>
           <span>{streakData.onchainEvents}</span>
         </div>
         
         <div className="flex justify-between">
           <span>Last Sync:</span>
           <span>{formatLastSync()}</span>
         </div>
         
         {streakData.currentStreak === 0 && streakData.totalGMs > 0 && (
           <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
             <p className="text-xs text-blue-700">
               💡 <strong>Tip:</strong> Click "Refresh Data" to sync your streak with onchain data!
             </p>
           </div>
         )}
       </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => updateStreak('morning')}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            🌅 Morning GM
          </button>
          
          <button
            onClick={() => updateStreak('afternoon')}
            className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            ☀️ Afternoon GM
          </button>
          
          <button
            onClick={() => updateStreak('evening')}
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            🌙 Evening GM
          </button>
        </div>
      </div>
    </div>
  );
};

export default GMStreak; 