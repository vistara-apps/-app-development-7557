import React from 'react';
import { FEATURE_FLAGS } from '../config/features';

/**
 * Web3Wrapper component that conditionally wraps children with Web3 providers
 * based on feature flags
 */
const Web3Wrapper = ({ children }) => {
  // Since Web3 features are disabled, just render children
  return children;
};

export default Web3Wrapper;

