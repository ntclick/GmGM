// Utility to clear old localStorage data
export function clearOldCache() {
  try {
    const currentVersion = '1.0.1';
    const cachedVersion = localStorage.getItem('app_version');
    
    if (cachedVersion !== currentVersion) {
      // Clear old cache
      localStorage.clear();
      localStorage.setItem('app_version', currentVersion);
    }
  } catch (error) {
    // Silent error handling for production
  }
}

// Clear cache on import
clearOldCache(); 