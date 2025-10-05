// Comprehensive offline functionality demonstration and testing
import { offlineStorage } from './offlineStorage';

interface OfflineTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  result?: boolean;
  error?: string;
}

export class OfflineDemo {
  private tests: OfflineTest[] = [
    {
      name: "IndexedDB Storage",
      description: "Test if browser supports IndexedDB for offline storage",
      test: async () => {
        return 'indexedDB' in window && indexedDB !== null;
      }
    },
    {
      name: "Service Worker",
      description: "Test if service worker is registered and active",
      test: async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return registration !== undefined && registration.active !== null;
        }
        return false;
      }
    },
    {
      name: "Offline Storage Init",
      description: "Test if offline storage can be initialized",
      test: async () => {
        try {
          await offlineStorage.init();
          return true;
        } catch (error) {
          console.error('Offline storage init failed:', error);
          return false;
        }
      }
    },
    {
      name: "Store Job Data",
      description: "Test storing job data for offline access",
      test: async () => {
        try {
          const testJob = {
            id: 'test-job-123',
            jobNumber: 'TEST001',
            collectionAddress: { line1: '123 Test St', city: 'Test City', postcode: 'T1 1ST' },
            deliveryAddress: { line1: '456 Demo Ave', city: 'Demo City', postcode: 'D2 2ND' },
            status: 'assigned'
          };
          
          await offlineStorage.storeJob(testJob);
          const retrieved = await offlineStorage.getJob('test-job-123');
          return retrieved !== null && retrieved.jobNumber === 'TEST001';
        } catch (error) {
          console.error('Job storage test failed:', error);
          return false;
        }
      }
    },
    {
      name: "Store Photo Offline",
      description: "Test storing photos without internet connection",
      test: async () => {
        try {
          // Create a small test blob (1x1 pixel image)
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = 'red';
          ctx.fillRect(0, 0, 1, 1);
          
          return new Promise<boolean>((resolve) => {
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const photoId = await offlineStorage.storePhoto('test-job-123', 'damage', blob);
                  resolve(photoId !== null && photoId.length > 0);
                } catch (error) {
                  console.error('Photo storage test failed:', error);
                  resolve(false);
                }
              } else {
                resolve(false);
              }
            });
          });
        } catch (error) {
          console.error('Photo storage test failed:', error);
          return false;
        }
      }
    },
    {
      name: "Store Form Data",
      description: "Test storing collection/delivery forms offline",
      test: async () => {
        try {
          const testFormData = {
            driverSignature: 'test-signature-data',
            customerSignature: 'test-customer-signature',
            notes: 'Test collection completed successfully',
            timestamp: new Date().toISOString()
          };
          
          await offlineStorage.storeForm('test-job-123', 'collection', testFormData);
          return true;
        } catch (error) {
          console.error('Form storage test failed:', error);
          return false;
        }
      }
    },
    {
      name: "Queue API Requests",
      description: "Test queuing API requests for when connection returns",
      test: async () => {
        try {
          await offlineStorage.queueRequest(
            '/api/jobs/test-job-123/complete',
            'POST',
            { 'Content-Type': 'application/json' },
            JSON.stringify({ status: 'completed', timestamp: new Date().toISOString() })
          );
          return true;
        } catch (error) {
          console.error('Request queue test failed:', error);
          return false;
        }
      }
    },
    {
      name: "Retrieve Unsynced Data",
      description: "Test retrieving all data that needs to be synced",
      test: async () => {
        try {
          const unsyncedData = await offlineStorage.getUnsyncedData();
          return unsyncedData.photos.length >= 0 && 
                 unsyncedData.forms.length >= 0 && 
                 unsyncedData.requests.length >= 0;
        } catch (error) {
          console.error('Unsynced data retrieval test failed:', error);
          return false;
        }
      }
    }
  ];

  async runAllTests(): Promise<{ passed: number; failed: number; results: OfflineTest[] }> {
    console.log('🧪 Running Offline Capability Tests...');
    
    let passed = 0;
    let failed = 0;
    
    for (const test of this.tests) {
      try {
        console.log(`Testing: ${test.name}...`);
        test.result = await test.test();
        
        if (test.result) {
          passed++;
          console.log(`✅ ${test.name}: PASSED`);
        } else {
          failed++;
          console.log(`❌ ${test.name}: FAILED`);
        }
      } catch (error) {
        failed++;
        test.result = false;
        test.error = error instanceof Error ? error.message : 'Unknown error';
        console.log(`❌ ${test.name}: ERROR - ${test.error}`);
      }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    return {
      passed,
      failed,
      results: this.tests
    };
  }

  // Simulate offline scenario for testing
  async simulateOfflineScenario(): Promise<void> {
    console.log('🔌 Simulating Offline Driver Workflow...');
    
    try {
      // 1. Store job data (as if downloaded when online)
      const testJob = {
        id: 'offline-test-job',
        jobNumber: 'OFFLINE001',
        collectionAddress: {
          line1: '123 Collection Street',
          city: 'Collection City',
          postcode: 'C1 1CC'
        },
        deliveryAddress: {
          line1: '456 Delivery Road',
          city: 'Delivery Town',
          postcode: 'D1 1DD'
        },
        status: 'assigned',
        vehicleRegistration: 'TEST123'
      };
      
      await offlineStorage.storeJob(testJob);
      console.log('✅ Job data stored offline');
      
      // 2. Simulate taking photos during collection
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'blue';
      ctx.fillRect(0, 0, 100, 100);
      
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            await offlineStorage.storePhoto('offline-test-job', 'vehicle-exterior', blob);
            console.log('✅ Vehicle photo stored offline');
            resolve();
          }
        });
      });
      
      // 3. Store collection form data
      const collectionData = {
        driverSignature: 'offline-driver-signature',
        customerSignature: 'offline-customer-signature',
        notes: 'Vehicle collected successfully in offline mode',
        mileage: '45000',
        fuelLevel: '3/4',
        timestamp: new Date().toISOString()
      };
      
      await offlineStorage.storeForm('offline-test-job', 'collection', collectionData);
      console.log('✅ Collection form stored offline');
      
      // 4. Queue status update for when online
      await offlineStorage.queueRequest(
        '/api/jobs/offline-test-job/status',
        'PATCH',
        { 'Content-Type': 'application/json' },
        JSON.stringify({ status: 'collected', timestamp: new Date().toISOString() })
      );
      console.log('✅ Status update queued for sync');
      
      // 5. Show what data is waiting to sync
      const unsyncedData = await offlineStorage.getUnsyncedData();
      console.log(`📋 Offline Data Summary:
        - ${unsyncedData.photos.length} photos ready to sync
        - ${unsyncedData.forms.length} forms ready to sync  
        - ${unsyncedData.requests.length} API requests queued`);
      
      console.log('🎉 Offline workflow simulation completed successfully!');
      
    } catch (error) {
      console.error('❌ Offline simulation failed:', error);
      throw error;
    }
  }

  // Test network connectivity
  getConnectionStatus(): {
    online: boolean;
    type?: string;
    downlink?: number;
    effectiveType?: string;
  } {
    const online = navigator.onLine;
    let connectionInfo: any = { online };
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionInfo = {
        online,
        type: connection.type,
        downlink: connection.downlink,
        effectiveType: connection.effectiveType
      };
    }
    
    return connectionInfo;
  }
}

export const offlineDemo = new OfflineDemo();