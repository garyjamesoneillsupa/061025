// DEPRECATED: This file is replaced by robust-offline-manager.ts
// This wrapper maintains backward compatibility

import { robustOfflineManager } from './offline/robust-offline-manager';

interface OfflineJob {
  id: string;
  jobNumber: string;
  data: any;
  lastUpdated: string;
}

interface OfflinePhoto {
  id: string;
  jobId: string;
  category: string;
  blob: Blob;
  timestamp: string;
  synced: boolean;
}

interface OfflineForm {
  id: string;
  jobId: string;
  type: 'collection' | 'delivery' | 'collection-progress' | 'vehicle-inspection';
  data: any;
  timestamp: string;
  synced: boolean;
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  retryCount: number;
}

class OfflineStorage {
  private readonly STORAGE_PREFIX = 'ovm-offline-';

  async init(): Promise<void> {
    console.log('🔄 Initializing robust offline storage (legacy wrapper)');
    await robustOfflineManager.init();
  }

  async storeJob(job: OfflineJob): Promise<void> {
    await robustOfflineManager.storeJob(job);
  }

  async getJob(id: string): Promise<OfflineJob | null> {
    return await robustOfflineManager.getJob(id);
  }

  async getJobByNumber(jobNumber: string): Promise<OfflineJob | null> {
    return await robustOfflineManager.getJobByNumber(jobNumber);
  }

  async storePhoto(jobId: string, category: string, blob: File): Promise<string> {
    return await robustOfflineManager.storePhoto(jobId, blob, category);
  }

  async getPhotos(): Promise<OfflinePhoto[]> {
    // Legacy method - data is now in IndexedDB
    console.warn('getPhotos() is deprecated. Use robustOfflineManager methods instead.');
    return [];
  }

  async storeForm(jobId: string, type: 'collection' | 'delivery' | 'collection-progress' | 'vehicle-inspection', data: any): Promise<string> {
    return await robustOfflineManager.storeForm(jobId, type, data);
  }

  async getForms(): Promise<OfflineForm[]> {
    // Legacy method - data is now in IndexedDB  
    console.warn('getForms() is deprecated. Use robustOfflineManager methods instead.');
    return [];
  }

  async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>, jobId?: string): Promise<void> {
    // Legacy method - now handled automatically by robust offline manager
    console.warn('queueRequest() is deprecated. Requests are now queued automatically.');
  }

  async getQueuedRequests(): Promise<QueuedRequest[]> {
    // Legacy method - data is now in IndexedDB
    console.warn('getQueuedRequests() is deprecated. Use robustOfflineManager sync methods instead.');
    return [];
  }

  async removeQueuedRequest(id: string): Promise<void> {
    // Legacy method - now handled automatically
    console.warn('removeQueuedRequest() is deprecated. Handled automatically by robust offline manager.');
  }

  async clearOldData(daysOld: number): Promise<void> {
    await robustOfflineManager.clearOldData(daysOld);
  }
}

export const offlineStorage = new OfflineStorage();
export default OfflineStorage;