import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Loader2, Clock, Wifi } from 'lucide-react';
import OfflineManager from '@/lib/offlineManager';
import { useToast } from '@/hooks/use-toast';

interface PendingUploadStatusProps {
  onSyncComplete?: () => void;
}

const PendingUploadStatus: React.FC<PendingUploadStatusProps> = ({ onSyncComplete }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingJobs, setPendingJobs] = useState<Array<{ jobId: string, type: 'collection' | 'delivery', timestamp: string }>>([]);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, 'pending' | 'uploading' | 'success' | 'failed'>>({});
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [offlineManager] = useState(() => new OfflineManager());
  const { toast } = useToast();

  useEffect(() => {
    // Initialize offline manager
    offlineManager.init().catch(console.error);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when coming back online
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for upload status changes
    offlineManager.onUploadStatusChange((jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => {
      setUploadStatuses(prev => ({ ...prev, [jobId]: status }));
      
      if (status === 'success') {
        toast({
          title: "Job Successfully Uploaded",
          description: `Job ${jobId.slice(0, 8)}... synced to server`,
        });
        
        // Remove from pending list after success
        setTimeout(() => {
          setPendingJobs(prev => prev.filter(job => job.jobId !== jobId));
          setUploadStatuses(prev => {
            const updated = { ...prev };
            delete updated[jobId];
            return updated;
          });
          onSyncComplete?.();
        }, 2000);
      } else if (status === 'failed') {
        toast({
          title: "Upload Failed",
          description: `Failed to upload job ${jobId.slice(0, 8)}... Will retry automatically.`,
          variant: "destructive",
        });
      }
    });

    // Check pending jobs periodically
    const checkPendingJobs = () => {
      const pending = offlineManager.getPendingJobSubmissions();
      setPendingJobs(pending);
      
      // Initialize upload statuses for pending jobs
      const statuses: Record<string, 'pending' | 'uploading' | 'success' | 'failed'> = {};
      pending.forEach(job => {
        if (!uploadStatuses[job.jobId]) {
          statuses[job.jobId] = 'pending';
        }
      });
      if (Object.keys(statuses).length > 0) {
        setUploadStatuses(prev => ({ ...prev, ...statuses }));
      }
    };

    checkPendingJobs();
    const interval = setInterval(checkPendingJobs, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [offlineManager, onSyncComplete, toast]);

  const triggerSync = async () => {
    if (!isOnline || syncInProgress || pendingJobs.length === 0) return;
    
    setSyncInProgress(true);
    
    try {
      // Show uploading status for all pending jobs
      pendingJobs.forEach(job => {
        setUploadStatuses(prev => ({ ...prev, [job.jobId]: 'uploading' }));
      });
      
      toast({
        title: "Sending...",
        description: `Uploading ${pendingJobs.length} pending job${pendingJobs.length > 1 ? 's' : ''}`,
      });
      
      await offlineManager.syncAllOfflineData();
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Will retry automatically in background",
        variant: "destructive",
      });
    } finally {
      setSyncInProgress(false);
    }
  };

  const getStatusDisplay = (jobId: string, type: 'collection' | 'delivery') => {
    const status = uploadStatuses[jobId] || 'pending';
    
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
              Pending Upload
            </Badge>
          </div>
        );
      case 'uploading':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
              Sending...
            </Badge>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
              Successfully Uploaded
            </Badge>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
              Upload Failed
            </Badge>
          </div>
        );
    }
  };

  if (pendingJobs.length === 0) return null;

  return (
    <Card className="mb-4 border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-amber-800 flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Pending Uploads ({pendingJobs.length})</span>
          {!isOnline && (
            <div className="flex items-center text-red-600 ml-auto">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Offline</span>
            </div>
          )}
          {isOnline && (
            <div className="flex items-center text-green-600 ml-auto">
              <Wifi className="h-4 w-4 mr-1" />
              <span className="text-xs">Online</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {pendingJobs.map(job => (
            <div key={job.jobId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {job.type === 'collection' ? 'Collection' : 'Delivery'} Process
                </p>
                <p className="text-xs text-gray-500">
                  Job {job.jobId.slice(0, 8)}... • {new Date(job.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusDisplay(job.jobId, job.type)}
              </div>
            </div>
          ))}
          
          {isOnline && pendingJobs.some(job => uploadStatuses[job.jobId] === 'pending') && (
            <Button
              onClick={triggerSync}
              disabled={syncInProgress}
              size="sm"
              className="w-full bg-[#00ABE7] hover:bg-[#0096D1] text-white"
            >
              {syncInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Now
                </>
              )}
            </Button>
          )}
          
          {!isOnline && (
            <div className="text-center py-2">
              <p className="text-xs text-amber-700">
                Jobs will upload automatically when internet connection is restored
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingUploadStatus;