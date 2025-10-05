// Intelligent background sync engine with connection-aware optimization
import { indexedDBManager } from '../storage/indexeddb-manager';

interface ConnectionQuality {
  type: 'excellent' | 'good' | 'poor' | 'offline';
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export class IntelligentSyncEngine {
  private syncCallbacks: Array<(status: string, progress: number) => void> = [];
  private uploadStatusCallbacks: Array<(jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => void> = [];
  private isCurrentlySyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private connectionQuality: ConnectionQuality = { type: 'offline', effectiveType: 'none', downlink: 0, rtt: 0 };
  
  constructor() {
    this.setupConnectionMonitoring();
    this.setupVisibilityChangeListener();
  }

  async init(): Promise<void> {
    console.log('🔄 Intelligent sync engine initialized');
    this.startPeriodicSync();
    
    // Attempt immediate sync if online
    if (navigator.onLine) {
      setTimeout(() => this.syncPendingData(), 1000);
    }
  }

  private setupConnectionMonitoring(): void {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('✅ Connection restored - starting sync');
      this.updateConnectionQuality();
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Gone offline - queuing data locally');
      this.connectionQuality.type = 'offline';
      this.notifyCallbacks('offline', 0);
    });

    // Monitor connection quality changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.updateConnectionQuality();
      });
    }

    // Initial connection quality check
    this.updateConnectionQuality();
  }

  private setupVisibilityChangeListener(): void {
    // Sync when app becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine && !this.isCurrentlySyncing) {
        console.log('👁️ App visible - checking for pending data');
        setTimeout(() => this.syncPendingData(), 500);
      }
    });
  }

  private updateConnectionQuality(): void {
    if (!navigator.onLine) {
      this.connectionQuality = { type: 'offline', effectiveType: 'none', downlink: 0, rtt: 0 };
      return;
    }

    const connection = (navigator as any).connection;
    if (connection) {
      const downlink = connection.downlink || 1;
      const rtt = connection.rtt || 100;
      const effectiveType = connection.effectiveType || '4g';

      let type: ConnectionQuality['type'];
      if (downlink > 5 && rtt < 100) {
        type = 'excellent';
      } else if (downlink > 2 && rtt < 300) {
        type = 'good';
      } else {
        type = 'poor';
      }

      this.connectionQuality = { type, effectiveType, downlink, rtt };
    } else {
      // Fallback for browsers without Network Information API
      this.connectionQuality = { type: 'good', effectiveType: '4g', downlink: 2, rtt: 150 };
    }

    console.log(`📡 Connection quality: ${this.connectionQuality.type} (${this.connectionQuality.downlink}Mbps, ${this.connectionQuality.rtt}ms RTT)`);
  }

  private startPeriodicSync(): void {
    // Intelligent sync intervals based on connection quality
    const getInterval = () => {
      switch (this.connectionQuality.type) {
        case 'excellent': return 15000; // 15 seconds
        case 'good': return 30000; // 30 seconds  
        case 'poor': return 60000; // 1 minute
        default: return 120000; // 2 minutes
      }
    };

    const scheduleNextSync = () => {
      if (this.syncInterval) clearTimeout(this.syncInterval);
      
      this.syncInterval = setTimeout(() => {
        if (navigator.onLine && !this.isCurrentlySyncing) {
          this.syncPendingData().finally(() => {
            scheduleNextSync(); // Schedule next sync
          });
        } else {
          scheduleNextSync(); // Reschedule if offline or already syncing
        }
      }, getInterval());
    };

    scheduleNextSync();
  }

  async syncPendingData(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.isCurrentlySyncing || !navigator.onLine) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.isCurrentlySyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      this.notifyCallbacks('syncing', 0);
      
      // Get pending uploads sorted by priority
      const pendingUploads = await indexedDBManager.getPendingUploads();
      
      if (pendingUploads.length === 0) {
        this.notifyCallbacks('completed', 100);
        return { success: true, synced: 0, failed: 0 };
      }

      console.log(`🔄 Syncing ${pendingUploads.length} pending uploads`);

      // Process uploads based on connection quality
      const batchSize = this.getBatchSize();
      const batches = this.chunkArray(pendingUploads, batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const progress = Math.round(((i + 1) / batches.length) * 100);
        
        this.notifyCallbacks('syncing', progress);

        // Process batch with connection-aware concurrency
        const batchPromises = batch.map(upload => this.processUpload(upload));
        const results = await Promise.allSettled(batchPromises);

        // Count successes and failures
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            synced++;
            this.notifyUploadStatus(batch[index].jobId, 'success');
          } else {
            failed++;
            this.notifyUploadStatus(batch[index].jobId, 'failed');
            console.error('Upload failed:', result.reason);
          }
        });

        // Add delay between batches for poor connections
        if (this.connectionQuality.type === 'poor' && i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      const successRate = synced / (synced + failed);
      this.notifyCallbacks(successRate > 0.8 ? 'completed' : 'partial', 100);
      
      console.log(`✅ Sync completed: ${synced} successful, ${failed} failed`);
      
      return { success: successRate > 0.5, synced, failed };
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.notifyCallbacks('failed', 0);
      return { success: false, synced, failed };
    } finally {
      this.isCurrentlySyncing = false;
    }
  }

  private getBatchSize(): number {
    switch (this.connectionQuality.type) {
      case 'excellent': return 5;
      case 'good': return 3;
      case 'poor': return 1;
      default: return 1;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async processUpload(upload: any): Promise<void> {
    try {
      this.notifyUploadStatus(upload.jobId, 'uploading');
      
      const response = await fetch(upload.url, {
        method: upload.method,
        headers: upload.headers,
        body: upload.body,
        signal: AbortSignal.timeout(this.getTimeoutForConnection())
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Mark as complete in IndexedDB
      await indexedDBManager.markUploadComplete(upload.id);
      
      console.log(`✅ Upload successful: ${upload.type} for job ${upload.jobId}`);
      
    } catch (error) {
      // Mark as failed with retry logic
      await indexedDBManager.markUploadFailed(upload.id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  private getTimeoutForConnection(): number {
    switch (this.connectionQuality.type) {
      case 'excellent': return 10000; // 10 seconds
      case 'good': return 20000; // 20 seconds
      case 'poor': return 60000; // 1 minute
      default: return 30000; // 30 seconds
    }
  }

  // Force sync for critical operations (e.g., job completion)
  async forceSyncForJob(jobId: string): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      const pendingUploads = await indexedDBManager.getPendingUploads();
      const jobUploads = pendingUploads.filter(upload => upload.jobId === jobId);
      
      if (jobUploads.length === 0) return true;

      console.log(`🚀 Force syncing ${jobUploads.length} uploads for job ${jobId}`);
      
      for (const upload of jobUploads) {
        await this.processUpload(upload);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Force sync failed for job ${jobId}:`, error);
      return false;
    }
  }

  // Callback management
  onSyncProgress(callback: (status: string, progress: number) => void): void {
    this.syncCallbacks.push(callback);
  }

  onUploadStatusChange(callback: (jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => void): void {
    this.uploadStatusCallbacks.push(callback);
  }

  private notifyCallbacks(status: string, progress: number): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status, progress);
      } catch (error) {
        console.error('Sync callback error:', error);
      }
    });
  }

  private notifyUploadStatus(jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed'): void {
    this.uploadStatusCallbacks.forEach(callback => {
      try {
        callback(jobId, status);
      } catch (error) {
        console.error('Upload status callback error:', error);
      }
    });
  }

  destroy(): void {
    if (this.syncInterval) {
      clearTimeout(this.syncInterval);
    }
    this.syncCallbacks = [];
    this.uploadStatusCallbacks = [];
  }
}

export const intelligentSyncEngine = new IntelligentSyncEngine();