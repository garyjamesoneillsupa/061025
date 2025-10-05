// Enterprise-grade IndexedDB offline storage manager
import { openDB, IDBPDatabase } from 'idb';

interface JobRecord {
  id: string;
  jobNumber: string;
  data: any;
  lastUpdated: string;
  synced: boolean;
}

interface PhotoRecord {
  id: string;
  jobId: string;
  category: string;
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  timestamp: string;
  synced: boolean;
  uploadPriority: 'critical' | 'high' | 'normal' | 'low';
}

interface FormRecord {
  id: string;
  jobId: string;
  type: 'collection' | 'delivery' | 'expense' | 'collection-progress' | 'vehicle-inspection';
  data: any;
  timestamp: string;
  synced: boolean;
  uploadPriority: 'critical' | 'high' | 'normal' | 'low';
}

interface SignatureRecord {
  id: string;
  jobId: string;
  type: 'collection' | 'delivery';
  signatureData: string;
  customerName: string;
  timestamp: string;
  synced: boolean;
}

interface UploadQueueRecord {
  id: string;
  type: 'photo' | 'form' | 'signature' | 'job-completion';
  jobId: string;
  dataId: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  attempts: number;
  maxAttempts: number;
  nextRetry: string;
  lastError?: string;
  createdAt: string;
}

interface SnapshotRecord {
  id: string;
  jobId: string;
  workflowType: 'collection' | 'delivery';
  snapshotData: any;
  timestamp: string;
  deviceInfo: string;
}

const DB_NAME = 'OVMOfflineStorage';
const DB_VERSION = 1;

export class IndexedDBManager {
  private db: IDBPDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Jobs store
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('by-job-number', 'jobNumber');
          jobStore.createIndex('by-synced', 'synced');

          // Photos store
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('by-job', 'jobId');
          photoStore.createIndex('by-synced', 'synced');
          photoStore.createIndex('by-priority', 'uploadPriority');

          // Forms store
          const formStore = db.createObjectStore('forms', { keyPath: 'id' });
          formStore.createIndex('by-job', 'jobId');
          formStore.createIndex('by-synced', 'synced');
          formStore.createIndex('by-type', 'type');

          // Signatures store
          const sigStore = db.createObjectStore('signatures', { keyPath: 'id' });
          sigStore.createIndex('by-job', 'jobId');
          sigStore.createIndex('by-synced', 'synced');

          // Upload queue store
          const queueStore = db.createObjectStore('uploadQueue', { keyPath: 'id' });
          queueStore.createIndex('by-priority', 'priority');
          queueStore.createIndex('by-job', 'jobId');
          queueStore.createIndex('by-next-retry', 'nextRetry');

          // Snapshots store for crash recovery
          const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
          snapshotStore.createIndex('by-job', 'jobId');
          snapshotStore.createIndex('by-timestamp', 'timestamp');

          // Sync metadata store
          db.createObjectStore('syncMetadata', { keyPath: 'id' });
        },
      });

      this.isInitialized = true;
      console.log('✅ IndexedDB initialized successfully');
      
      // Clean up old data on startup (older than 30 days)
      await this.cleanupOldData();
      
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
      throw new Error('Offline storage initialization failed');
    }
  }

  private ensureInitialized(): void {
    if (!this.db || !this.isInitialized) {
      throw new Error('IndexedDB not initialized. Call init() first.');
    }
  }

  // Job operations
  async storeJob(job: { id: string; jobNumber: string; data: any }): Promise<void> {
    this.ensureInitialized();
    
    const jobData: JobRecord = {
      id: job.id,
      jobNumber: job.jobNumber,
      data: job.data,
      lastUpdated: new Date().toISOString(),
      synced: false
    };

    await this.db!.put('jobs', jobData);
  }

  async getJob(id: string): Promise<JobRecord | null> {
    this.ensureInitialized();
    const job = await this.db!.get('jobs', id);
    return job || null;
  }

  async getJobByNumber(jobNumber: string): Promise<JobRecord | null> {
    this.ensureInitialized();
    const job = await this.db!.getFromIndex('jobs', 'by-job-number', jobNumber);
    return job || null;
  }

  // Photo operations with compression
  async storePhoto(jobId: string, file: File, category: string, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): Promise<string> {
    this.ensureInitialized();
    
    const photoId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const originalSize = file.size;
    
    // Import compression here to avoid bundle issues
    const { compressImage } = await import('../compression/photo-compression-engine');
    const compressedBlob = await compressImage(file);
    
    const photoData: PhotoRecord = {
      id: photoId,
      jobId,
      category,
      compressedBlob,
      originalSize,
      compressedSize: compressedBlob.size,
      timestamp: new Date().toISOString(),
      synced: false,
      uploadPriority: priority
    };

    await this.db!.put('photos', photoData);
    
    console.log(`📸 Photo stored: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedBlob.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedBlob.size / originalSize) * 100)}% reduction)`);
    
    return photoId;
  }

  async getPhotosForJob(jobId: string): Promise<PhotoRecord[]> {
    this.ensureInitialized();
    return await this.db!.getAllFromIndex('photos', 'by-job', jobId);
  }

  // Form operations
  async storeForm(jobId: string, type: 'collection' | 'delivery' | 'expense' | 'collection-progress' | 'vehicle-inspection', data: any, priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): Promise<string> {
    this.ensureInitialized();
    
    const formId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const formData: FormRecord = {
      id: formId,
      jobId,
      type,
      data,
      timestamp: new Date().toISOString(),
      synced: false,
      uploadPriority: priority
    };

    await this.db!.put('forms', formData);
    return formId;
  }

  async getFormsForJob(jobId: string): Promise<FormRecord[]> {
    this.ensureInitialized();
    return await this.db!.getAllFromIndex('forms', 'by-job', jobId);
  }

  // Signature operations
  async storeSignature(jobId: string, type: 'collection' | 'delivery', signatureData: string, customerName: string): Promise<string> {
    this.ensureInitialized();
    
    const sigId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const signature: SignatureRecord = {
      id: sigId,
      jobId,
      type,
      signatureData,
      customerName,
      timestamp: new Date().toISOString(),
      synced: false
    };

    await this.db!.put('signatures', signature);
    return sigId;
  }

  // Crash recovery snapshots
  async createSnapshot(jobId: string, workflowType: 'collection' | 'delivery', snapshotData: any): Promise<string> {
    this.ensureInitialized();
    
    const snapshotId = `${jobId}-${Date.now()}`;
    
    const snapshot: SnapshotRecord = {
      id: snapshotId,
      jobId,
      workflowType,
      snapshotData,
      timestamp: new Date().toISOString(),
      deviceInfo: navigator.userAgent
    };

    await this.db!.put('snapshots', snapshot);
    
    // Keep only the latest 5 snapshots per job
    const allSnapshots = await this.db!.getAllFromIndex('snapshots', 'by-job', jobId);
    if (allSnapshots.length > 5) {
      const sortedSnapshots = allSnapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const snapshotsToDelete = sortedSnapshots.slice(5);
      
      for (const snapshot of snapshotsToDelete) {
        await this.db!.delete('snapshots', snapshot.id);
      }
    }
    
    return snapshotId;
  }

  async getLatestSnapshot(jobId: string): Promise<SnapshotRecord | null> {
    this.ensureInitialized();
    
    const snapshots = await this.db!.getAllFromIndex('snapshots', 'by-job', jobId);
    if (snapshots.length === 0) return null;
    
    const sortedSnapshots = snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return sortedSnapshots[0];
  }

  // Queue management for uploads
  async queueUpload(uploadData: {
    type: 'photo' | 'form' | 'signature' | 'job-completion';
    jobId: string;
    dataId: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  }): Promise<string> {
    this.ensureInitialized();
    
    const uploadId = `${uploadData.type}-${uploadData.dataId}-${Date.now()}`;
    
    const queueItem: UploadQueueRecord = {
      id: uploadId,
      ...uploadData,
      attempts: 0,
      maxAttempts: uploadData.priority === 'critical' ? 10 : 5,
      nextRetry: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await this.db!.put('uploadQueue', queueItem);
    return uploadId;
  }

  async getPendingUploads(): Promise<UploadQueueRecord[]> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const allItems = await this.db!.getAll('uploadQueue');
    
    // Filter items that are ready for retry and sort by priority
    const readyItems = allItems.filter(item => item.nextRetry <= now);
    
    return readyItems.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });
  }

  async markUploadComplete(uploadId: string): Promise<void> {
    this.ensureInitialized();
    await this.db!.delete('uploadQueue', uploadId);
  }

  async markUploadFailed(uploadId: string, error: string): Promise<void> {
    this.ensureInitialized();
    
    const item = await this.db!.get('uploadQueue', uploadId);
    if (!item) return;
    
    item.attempts += 1;
    item.lastError = error;
    
    if (item.attempts >= item.maxAttempts) {
      console.error(`❌ Upload failed permanently: ${uploadId}`, error);
      await this.db!.delete('uploadQueue', uploadId);
      return;
    }
    
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, item.attempts), 60000); // Max 1 minute
    const jitter = Math.random() * 1000;
    const retryDelay = baseDelay + jitter;
    
    item.nextRetry = new Date(Date.now() + retryDelay).toISOString();
    
    await this.db!.put('uploadQueue', item);
  }

  // Data cleanup
  async cleanupOldData(): Promise<void> {
    this.ensureInitialized();
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Clean up old snapshots
    const allSnapshots = await this.db!.getAll('snapshots');
    const oldSnapshots = allSnapshots.filter(s => s.timestamp < thirtyDaysAgo);
    
    for (const snapshot of oldSnapshots) {
      await this.db!.delete('snapshots', snapshot.id);
    }
    
    console.log(`🧹 Cleaned up ${oldSnapshots.length} old snapshots`);
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    totalJobs: number;
    totalPhotos: number;
    totalForms: number;
    pendingUploads: number;
    estimatedSize: string;
  }> {
    this.ensureInitialized();
    
    const [jobs, photos, forms, uploads] = await Promise.all([
      this.db!.getAll('jobs'),
      this.db!.getAll('photos'),
      this.db!.getAll('forms'),
      this.db!.getAll('uploadQueue')
    ]);
    
    const totalSize = photos.reduce((sum, photo) => sum + photo.compressedSize, 0);
    
    return {
      totalJobs: jobs.length,
      totalPhotos: photos.length,
      totalForms: forms.length,
      pendingUploads: uploads.length,
      estimatedSize: `${(totalSize / 1024 / 1024).toFixed(1)} MB`
    };
  }
}

export const indexedDBManager = new IndexedDBManager();