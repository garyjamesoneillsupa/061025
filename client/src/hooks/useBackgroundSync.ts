// Background internet monitoring and auto-sync hook
import { useEffect, useState } from 'react';
import OfflineManager from '../lib/offlineManager';

export function useBackgroundSync() {
  const [offlineManager] = useState(() => new OfflineManager());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingJobs, setPendingJobs] = useState<string[]>([]);
  const [uploadingJobs, setUploadingJobs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');

  useEffect(() => {
    // Initialize offline manager
    offlineManager.init().catch(console.error);

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('🟢 INTERNET CONNECTION RESTORED - Starting auto-upload');
      setIsOnline(true);
      
      // Trigger immediate sync when connection restored
      handleBackgroundSync();
    };

    const handleOffline = () => {
      console.log('🔴 INTERNET CONNECTION LOST - Offline mode active');
      setIsOnline(false);
    };

    // Background internet monitoring every 2 seconds as requested
    const monitorConnection = async () => {
      const wasOnline = isOnline;
      const nowOnline = navigator.onLine;
      
      if (!wasOnline && nowOnline) {
        console.log('🚀 Connection detected by background monitor - auto-syncing');
        handleOnline();
      } else if (wasOnline && !nowOnline) {
        handleOffline();
      }
      
      // Check for pending jobs
      try {
        const pending = await offlineManager.getPendingJobIds();
        setPendingJobs(pending);
      } catch (error) {
        console.error('Failed to check pending jobs:', error);
      }
    };

    // Set up background monitoring every 5 seconds as requested
    const connectionMonitor = setInterval(monitorConnection, 5000);

    // Also listen to browser events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Background sync function
    const handleBackgroundSync = async () => {
      if (!navigator.onLine) return;
      
      try {
        console.log('⬆️ Starting background sync...');
        setSyncStatus('syncing');
        
        // Mark all pending jobs as uploading
        const currentPending = await offlineManager.getPendingJobIds();
        setUploadingJobs(currentPending);
        
        await offlineManager.syncAllOfflineData();
        console.log('✅ Background sync completed successfully');
        
        setSyncStatus('completed');
        setUploadingJobs([]);
        
        // Update pending jobs after sync
        const pending = await offlineManager.getPendingJobIds();
        setPendingJobs(pending);
        
        // Show completed status for 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } catch (error) {
        console.error('❌ Background sync failed:', error);
        setSyncStatus('failed');
        setUploadingJobs([]);
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    // Initial check
    monitorConnection();

    // Cleanup
    return () => {
      clearInterval(connectionMonitor);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineManager, isOnline]);

  return {
    isOnline,
    pendingJobs,
    uploadingJobs,
    syncStatus,
    offlineManager
  };
}