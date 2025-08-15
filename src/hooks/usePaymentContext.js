import { useCallback } from "react";

export function usePaymentContext() {
  const createSession = useCallback(async (amount = "$10") => {
    // Simulate payment processing without Web3/Wagmi
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful payment response
        resolve({
          success: true,
          amount: amount,
          transactionId: `mock-${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      }, 2000); // Simulate 2 second processing time
    });
  }, []);

  return { createSession };
}