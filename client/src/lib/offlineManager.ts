// DEPRECATED: This file is replaced by robust-offline-manager.ts
// This wrapper maintains backward compatibility

import { robustOfflineManager, OfflinePhoto, OfflineForm, OfflineSignature } from './offline/robust-offline-manager';

// Legacy interface compatibility
interface SyncStatus {
  id: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  type: 'photo' | 'form' | 'signature';
  retryCount: number;
  lastError?: string;
  timestamp: string;
}

class OfflineManager {
  private readonly STORAGE_PREFIX = 'ovm-offline-';
  private syncCallbacks: Array<(status: string, progress: number) => void> = [];
  private pendingJobSubmissions: Map<string, { type: 'collection' | 'delivery', timestamp: string }> = new Map();
  private uploadStatusCallbacks: Array<(jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => void> = [];

  async init(): Promise<void> {
    console.log('🔄 Initializing robust offline manager (legacy wrapper)');
    await robustOfflineManager.init();
    
    // Setup callback forwarding
    robustOfflineManager.onSyncProgress((status: string, progress: number) => {
      this.syncCallbacks.forEach(callback => callback(status, progress));
    });

    robustOfflineManager.onUploadStatusChange((jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => {
      this.uploadStatusCallbacks.forEach(callback => callback(jobId, status));
    });
  }

  async storePhoto(jobId: string, file: File, category: string): Promise<string> {
    return await robustOfflineManager.storePhoto(jobId, file, category);
  }

  async storeForm(jobId: string, type: 'collection' | 'delivery' | 'expense', data: any): Promise<string> {
    return await robustOfflineManager.storeForm(jobId, type, data);
  }

  async storeSignature(jobId: string, type: 'collection' | 'delivery', signatureData: string, customerName: string): Promise<string> {
    return await robustOfflineManager.storeSignature(jobId, type, signatureData, customerName);
  }

  async getOfflineData(): Promise<{ photos: OfflinePhoto[], forms: OfflineForm[], signatures: OfflineSignature[] }> {
    return await robustOfflineManager.getOfflineData();
  }

  async syncOfflineData(): Promise<{ success: boolean, synced: number, failed: number }> {
    return await robustOfflineManager.syncOfflineData();
  }

  onSyncProgress(callback: (status: string, progress: number) => void): void {
    this.syncCallbacks.push(callback);
  }

  onUploadStatusChange(callback: (jobId: string, status: 'pending' | 'uploading' | 'success' | 'failed') => void): void {
    this.uploadStatusCallbacks.push(callback);
  }

  async clearOldData(daysOld: number): Promise<void> {
    await robustOfflineManager.clearOldData(daysOld);
  }

  static setupConnectionListener(): void {
    // This is now handled automatically by robustOfflineManager.init()
    console.log('✅ Connection listeners set up by robust offline manager');
  }
}

export default OfflineManager;