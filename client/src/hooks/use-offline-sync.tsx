import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SyncStatus {
  isOffline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingCount: number;
  errors: string[];
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOffline: !navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    errors: []
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOffline: false }));
      // Trigger sync when coming back online
      setTimeout(syncPendingData, 1000);
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingData = useCallback(async () => {
    if (syncStatus.isOffline || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Check for pending data in IndexedDB
      const pendingData = await getPendingData();
      
      if (pendingData.length > 0) {
        for (const item of pendingData) {
          await syncDataItem(item);
        }
        
        await clearPendingData();
      }

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSync: new Date(),
        pendingCount: 0,
        errors: []
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Sync failed']
      }));
    }
  }, [syncStatus.isOffline, syncStatus.isSyncing]);

  // Mock functions for offline data management
  const getPendingData = async () => {
    // In a real implementation, this would read from IndexedDB
    return [];
  };

  const syncDataItem = async (item: any) => {
    // In a real implementation, this would sync to the server
    console.log('Syncing item:', item);
  };

  const clearPendingData = async () => {
    // In a real implementation, this would clear IndexedDB
    console.log('Clearing pending data');
  };

  const savePendingData = useCallback(async (data: any) => {
    if (!syncStatus.isOffline) return;
    
    // In a real implementation, this would save to IndexedDB
    console.log('Saving pending data:', data);
    
    setSyncStatus(prev => ({
      ...prev,
      pendingCount: prev.pendingCount + 1
    }));
  }, [syncStatus.isOffline]);

  return {
    ...syncStatus,
    syncPendingData,
    savePendingData
  };
}

// Sync status indicator component
export function SyncStatusIndicator() {
  const { isOffline, isSyncing, lastSync, pendingCount, errors } = useOfflineSync();

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Syncing...</span>
      </div>
    );
  }

  if (errors.length > 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Sync error</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1 text-amber-600">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm">{pendingCount} pending</span>
      </div>
    );
  }

  if (lastSync) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Synced</span>
      </div>
    );
  }

  return null;
}