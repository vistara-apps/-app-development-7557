import { useState, useEffect } from 'react';
import { FEATURE_FLAGS, ADMIN_CONFIG } from '../config/features';
import { useAuth } from '../context/AuthContext';

export const useFeatureFlags = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Check if user is admin (owner)
    if (user?.email === ADMIN_CONFIG.ADMIN_EMAIL) {
      setIsAdmin(true);
    }
  }, [user]);

  const isFeatureEnabled = (featureName) => {
    // Admin can see all features
    if (isAdmin && featureName.startsWith('SHOW_')) {
      return true;
    }
    
    return FEATURE_FLAGS[featureName] || false;
  };

  const toggleFeature = (featureName, enabled) => {
    // Only admin can toggle features
    if (!isAdmin) return false;
    
    // In a real app, this would update the backend
    // For now, we'll use localStorage for persistence
    const key = `feature_${featureName}`;
    localStorage.setItem(key, enabled.toString());
    
    return true;
  };

  const getAdminConfig = () => {
    return isAdmin ? ADMIN_CONFIG : null;
  };

  return {
    isFeatureEnabled,
    toggleFeature,
    isAdmin,
    getAdminConfig,
    FEATURE_FLAGS,
  };
};

export default useFeatureFlags;

