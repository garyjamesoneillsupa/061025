import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, WifiOff, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import OfflineManager from '@/lib/offlineManager';

interface OfflineStatusProps {
  onSyncComplete?: () => void;
}

const OfflineStatus: React.FC<OfflineStatusProps> = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [offlineManager] = useState(() => new OfflineManager());

  useEffect(() => {
    // Initialize offline manager
    offlineManager.init().catch(console.error);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register sync status callback
    offlineManager.onSyncStatus((status: string, progress: number) => {
      setSyncStatus(status as any);
      setSyncProgress(progress);
      
      if (status === 'completed') {
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncProgress(0);
          onSyncComplete?.();
        }, 2000);
      }
    });

    // Check pending count periodically
    const checkPending = async () => {
      try {
        const count = await offlineManager.getPendingSyncCount();
        setPendingCount(count);
      } catch (error) {
        console.error('Failed to check pending count:', error);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [offlineManager, onSyncComplete]);

  const handleManualSync = async () => {
    if (!isOnline || syncStatus === 'syncing') return;
    
    try {
      setSyncStatus('syncing');
      await offlineManager.syncAllOfflineData();
    } catch (error) {
      console.error('Manual sync failed:', error);
      setSyncStatus('failed');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const getStatusIcon = () => {
    if (syncStatus === 'syncing') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (syncStatus === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (syncStatus === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (syncStatus === 'syncing') {
      return `Syncing... ${syncProgress}%`;
    }
    if (syncStatus === 'completed') {
      return 'Sync completed';
    }
    if (syncStatus === 'failed') {
      return 'Sync failed';
    }
    return isOnline ? 'Online' : 'Offline';
  };

  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'bg-blue-100 text-blue-800';
    if (syncStatus === 'completed') return 'bg-green-100 text-green-800';
    if (syncStatus === 'failed') return 'bg-red-100 text-red-800';
    return isOnline ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800';
  };

  return (
    <Card className="w-full mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getStatusColor()}>
                  {getStatusText()}
                </Badge>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              {syncStatus === 'syncing' && (
                <Progress value={syncProgress} className="w-48 mt-2" />
              )}
            </div>
          </div>

          {isOnline && pendingCount > 0 && syncStatus === 'idle' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              className="text-cyan-600 border-cyan-600 hover:bg-cyan-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
          )}
        </div>

        {!isOnline && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              📱 <strong>Offline Mode:</strong> You can continue capturing photos, signatures, and data. 
              Everything will sync automatically when connection is restored.
            </p>
          </div>
        )}

        {syncStatus === 'completed' && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ All data synced successfully! Your offline captures are now in the system.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineStatus;