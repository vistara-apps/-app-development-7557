// Feature flag configuration for stealth mode
// Set REACT_APP_STEALTH_MODE=true to hide premium features

const isDevelopment = import.meta.env.DEV;
const isStealthMode = import.meta.env.VITE_STEALTH_MODE === 'true';

export const FEATURE_FLAGS = {
  // Core platform features
  STEALTH_MODE: isStealthMode,
  
  // Premium features (hidden in stealth mode)
  SHOW_TOKEN_BALANCE: !isStealthMode,
  SHOW_PREMIUM_BADGES: !isStealthMode,
  SHOW_SUBSCRIPTION_MODAL: !isStealthMode,
  SHOW_TOKEN_EARNINGS: !isStealthMode,
  SHOW_PREMIUM_CONTENT: !isStealthMode,
  SHOW_UPGRADE_PROMPTS: !isStealthMode,
  
  // Admin features (always hidden from regular users)
  SHOW_ADMIN_DASHBOARD: false, // Only enabled via secret route
  ENABLE_TOKEN_MINTING: true,
  ENABLE_ANALYTICS: true,
  
  // Video platform features
  ENABLE_VIDEO_PLAYER: true,
  ENABLE_CATEGORIES: true,
  ENABLE_SEARCH: true,
  ENABLE_MOBILE_OPTIMIZATIONS: true,
  
  // Development features
  SHOW_DEBUG_INFO: isDevelopment,
  MOCK_DATA: true, // Use mock data for now
};

// Admin access configuration
export const ADMIN_CONFIG = {
  SECRET_ROUTE: '/admin-phyght-2024',
  ADMIN_EMAIL: 'mayurchougule1@gmail.com', // Owner email
  TOKEN_SUPPLY: 1000000000, // 1 billion tokens
  OWNER_WALLET: null, // Will be set when wallet connects
};

// Combat video categories
export const COMBAT_CATEGORIES = [
  { id: 'mma', name: 'MMA', icon: '🥊' },
  { id: 'boxing', name: 'Boxing', icon: '🥊' },
  { id: 'kickboxing', name: 'Kickboxing', icon: '🦵' },
  { id: 'wrestling', name: 'Wrestling', icon: '🤼' },
  { id: 'bjj', name: 'Brazilian Jiu-Jitsu', icon: '🥋' },
  { id: 'muay-thai', name: 'Muay Thai', icon: '🇹🇭' },
  { id: 'karate', name: 'Karate', icon: '🥋' },
  { id: 'judo', name: 'Judo', icon: '🥋' },
  { id: 'highlights', name: 'Fight Highlights', icon: '⚡' },
  { id: 'training', name: 'Training', icon: '💪' },
];

export default FEATURE_FLAGS;

