// Unified robust offline manager - the single source of truth for all offline operations
import { indexedDBManager } from '../storage/indexeddb-manager';
import { intelligentSyncEngine } from '../sync/intelligent-sync-engine';
import { compressSignature } from '../compression/photo-compression-engine';

export interface OfflinePhoto {
  id: string;
  jobId: string;
  category: string;
  blob: Blob;
  timestamp: string;
  synced: boolean;
}

export interface OfflineForm {
  id: string;
  jobId: string;
  type: 'collection' | 'delivery' | 'expense' | 'collection-progress' | 'vehicle-inspection';
  data: any;
  timestamp: string;
  synced: boolean;
}

export interface OfflineSignature {
  id: string;
  jobId: string;
  type: 'collection' | 'delivery';
  signatureData: string;
  customerName: string;
  timestamp: string;
  synced: boolean;
}

export interface SyncStatus {
  isOffline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingCount: number;
  errors: string[];
}

class RobustOfflineManager {
  private isInitialized = false;
  private syncStatus: SyncStatus = {
    isOffline: !navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingCount: 0,
    errors: []
  };

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB storage
      await indexedDBManager.init();
      
      // Initialize intelligent sync engine
      await intelligentSyncEngine.init();
      
      // Setup sync progress monitoring
      intelligentSyncEngine.onSyncProgress((status: string, progress: number) => {
        this.syncStatus.isSyncing = status === 'syncing';
        if (status === 'completed') {
          this.syncStatus.lastSync = new Date();
          this.syncStatus.errors = [];
        } else if (status === 'failed') {
          this.syncStatus.errors.push('Sync failed');
        }
      });

      // Setup connection monitoring
      this.setupConnectionListener();
      
      this.isInitialized = true;
      console.log('✅ Robust offline manager ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize offline manager:', error);
      throw error;
    }
  }

  private setupConnectionListener(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOffline = false;
      console.log('✅ Back online - will sync data');
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOffline = true;
      console.log('📱 Offline mode - data will be stored locally');
    });
  }

  // Job operations - maintain backward compatibility
  async storeJob(job: { id: string; jobNumber: string; data: any }): Promise<void> {
    await indexedDBManager.storeJob(job);
  }

  async getJob(id: string): Promise<any | null> {
    return await indexedDBManager.getJob(id);
  }

  async getJobByNumber(jobNumber: string): Promise<any | null> {
    return await indexedDBManager.getJobByNumber(jobNumber);
  }

  // Photo operations with automatic compression and upload queuing
  async storePhoto(jobId: string, file: File, category: string): Promise<string> {
    const photoId = await indexedDBManager.storePhoto(jobId, file, category, 'high');
    
    // Queue for upload
    await this.queuePhotoUpload(photoId, jobId);
    
    return photoId;
  }

  private async queuePhotoUpload(photoId: string, jobId: string): Promise<void> {
    // Create upload request for the photo
    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('category', 'collection'); // Default category
    
    await indexedDBManager.queueUpload({
      type: 'photo',
      jobId,
      dataId: photoId,
      priority: 'high',
      url: `/api/jobs/${jobId}/photos`,
      method: 'POST',
      headers: {}, // FormData will set appropriate headers
      body: JSON.stringify({ photoId }) // We'll reconstruct FormData during upload
    });
  }

  // Form operations with automatic upload queuing
  async storeForm(jobId: string, type: 'collection' | 'delivery' | 'expense' | 'collection-progress' | 'vehicle-inspection', data: any): Promise<string> {
    const priority = (type === 'collection' || type === 'delivery') ? 'critical' : 'normal';
    const formId = await indexedDBManager.storeForm(jobId, type, data, priority);
    
    // Queue for upload based on form type
    await this.queueFormUpload(formId, jobId, type, data);
    
    return formId;
  }

  private async queueFormUpload(formId: string, jobId: string, type: string, data: any): Promise<void> {
    let url = `/api/jobs/${jobId}/auto-save`;
    let priority: 'critical' | 'high' | 'normal' | 'low' = 'normal';
    
    // Determine appropriate endpoint and priority based on form type
    if (type === 'collection') {
      url = `/api/jobs/${jobId}/complete-collection`;
      priority = 'critical';
    } else if (type === 'delivery') {
      url = `/api/jobs/${jobId}/complete-delivery`;
      priority = 'critical';
    } else if (type === 'vehicle-inspection') {
      url = `/api/vehicle-inspections`;
      priority = 'high';
    }

    await indexedDBManager.queueUpload({
      type: 'form',
      jobId,
      dataId: formId,
      priority,
      url,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // Signature operations with compression and upload queuing
  async storeSignature(jobId: string, type: 'collection' | 'delivery', signatureData: string, customerName: string): Promise<string> {
    // Compress signature before storing
    const compressedSignature = await compressSignature(signatureData);
    
    const sigId = await indexedDBManager.storeSignature(jobId, type, compressedSignature, customerName);
    
    // Queue for upload
    await this.queueSignatureUpload(sigId, jobId, type, compressedSignature, customerName);
    
    return sigId;
  }

  private async queueSignatureUpload(sigId: string, jobId: string, type: string, signatureData: string, customerName: string): Promise<void> {
    await indexedDBManager.queueUpload({
      type: 'signature',
      jobId,
      dataId: sigId,
      priority: 'high',
      url: `/api/jobs/${jobId}/signature`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        signatureData, 
        customerName,
        timestamp: new Date().toISOString()
      })
    });
  }

  // Crash recovery operations
  async createSnapshot(jobId: string, workflowType: 'collection' | 'delivery', snapshotData: any): Promise<string> {
    return await indexedDBManager.createSnapshot(jobId, workflowType, snapshotData);
  }

  async restoreFromCrash(jobId: string): Promise<any | null> {
    const snapshot = await indexedDBManager.getLatestSnapshot(jobId);
    
    if (snapshot) {
      console.log(`🔄 Restored workflow data for job ${jobId} from ${new Date(snapshot.timestamp).toLocaleString()}`);
      return snapshot.snapshotData;
    }
    
    return null;
  }

  // Auto-save functionality with debouncing for workflows
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  async autoSave(jobId: string, workflowType: 'collection' | 'delivery', data: any, delay: number = 2000): Promise<void> {
    const key = `${jobId}-${workflowType}`;
    
    // Clear existing timer for this job
    const existingTimer = this.autoSaveTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new timer
    const timer = setTimeout(async () => {
      try {
        await this.createSnapshot(jobId, workflowType, data);
        console.log(`💾 Auto-saved ${workflowType} data for job ${jobId}`);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        this.autoSaveTimers.delete(key);
      }
    }, delay);
    
    this.autoSaveTimers.set(key, timer);
  }

  // Force sync for critical operations (job completion)
  async forceSyncForJob(jobId: string): Promise<boolean> {
    return await intelligentSyncEngine.forceSyncForJob(jobId);
  }

  // Manual sync trigger
  async syncOfflineData(): Promise<{ success: boolean; synced: number; failed: number }> {
    return await intelligentSyncEngine.syncPendingData();
  }

  // Storage management
  async getStorageStats(): Promise<{
    totalJobs: number;
    totalPhotos: number;
    totalForms: number;
    pendingUploads: number;
    estimatedSize: string;
  }> {
    return await indexedDBManager.getStorageStats();
  }

  async clearOldData(daysOld: number = 30): Promise<void> {
    await indexedDBManager.cleanupOldData();
    console.log(`🧹 Cleared data older than ${daysOld} days`);
  }

  // Status monitoring
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  onSyncProgress(callback: (status: string, progress: number) => void): void {
    intelligentSyncEngine.onSyncProgress(callback);
  }

  onUploadStatusChange(callback: (jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => void): void {
    intelligentSyncEngine.onUploadStatusChange(callback);
  }

  // Legacy compatibility methods - these maintain the same API as the old localStorage-based system
  async getOfflineData(): Promise<{ photos: OfflinePhoto[], forms: OfflineForm[], signatures: OfflineSignature[] }> {
    // This method is kept for backward compatibility but data is now stored in IndexedDB
    console.warn('getOfflineData() is deprecated. Data is now automatically managed in IndexedDB.');
    return { photos: [], forms: [], signatures: [] };
  }
}

// Export singleton instance
export const robustOfflineManager = new RobustOfflineManager();

// Also export as default for backward compatibility
export default robustOfflineManager;

// Setup connection listener as static method for backward compatibility
export class OfflineManager {
  static setupConnectionListener(): void {
    // This is now handled automatically by robustOfflineManager.init()
    console.log('✅ Connection listeners set up by robust offline manager');
  }
}