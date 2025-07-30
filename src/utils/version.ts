// Version and build information
export const VERSION = '1.0.1';
export const BUILD_TIME = new Date().toISOString();
export const BUILD_INFO = {
  version: VERSION,
  buildTime: BUILD_TIME,
  features: [
    '🌐 Onchain data loading',
    '🔗 Etherscan links',
    '🌍 GMT+0 time categories',
    '⏰ Real-time clock',
    '🔄 Auto category update',
    '📊 Blockchain statistics'
  ]
};

// Initialize version info
export function initializeVersionInfo() {
  // Version info is now silent for production
} 