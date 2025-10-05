// Enhanced offline detection utilities
export const isOffline = (): boolean => {
  // Check multiple indicators of offline status
  const navigatorOffline = !navigator.onLine;
  
  // Additional checks can be added here if needed
  // For now, rely on navigator.onLine
  console.log('Offline detection check:', { navigatorOffline });
  
  return navigatorOffline;
};

export const waitForConnectionChange = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkConnection = () => {
      if (navigator.onLine) {
        resolve(true);
      } else {
        setTimeout(checkConnection, 1000);
      }
    };
    
    window.addEventListener('online', () => resolve(true), { once: true });
    checkConnection();
  });
};