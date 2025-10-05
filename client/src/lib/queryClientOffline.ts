// Enhanced query client with offline-first capabilities for business reliability
import { QueryClient } from '@tanstack/react-query';
import { offlineStorage } from './offlineStorage';

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours
const STALE_TIME = 1000 * 60 * 30; // 30 minutes

// Custom fetch function that tries offline first, then online
async function offlineFirstFetch(url: string, options?: RequestInit): Promise<Response> {
  const isOnline = navigator.onLine;
  
  // For job queries, try offline storage first
  if (url.includes('/api/jobs/by-number/')) {
    const jobNumber = url.split('/api/jobs/by-number/')[1];
    try {
      const offlineJob = await offlineStorage.getJobByNumber(jobNumber);
      if (offlineJob) {
        console.log(`✅ Loaded job ${jobNumber} from offline storage`);
        return new Response(JSON.stringify(offlineJob), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      console.warn('Offline job lookup failed:', error);
    }
  }
  
  // If no offline data or not a job query, try online
  if (isOnline) {
    try {
      const response = await fetch(url, options);
      
      // Store job data for offline use when successfully fetched
      if (response.ok && url.includes('/api/jobs/by-number/')) {
        const jobData = await response.clone().json();
        await offlineStorage.storeJob(jobData);
        console.log(`✅ Stored job ${jobData.jobNumber} for offline use`);
      }
      
      return response;
    } catch (error) {
      console.warn('Online fetch failed, checking offline storage:', error);
    }
  }
  
  // If offline or online failed, return not found
  return new Response(JSON.stringify({ error: 'Job not available offline' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Longer cache times for offline reliability
      gcTime: CACHE_TIME,
      staleTime: STALE_TIME,
      
      // Custom fetcher that uses offline storage
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const response = await offlineFirstFetch(url);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Network request failed');
        }
        
        return response.json();
      },
      
      // Retry strategy for poor connections
      retry: (failureCount, error) => {
        // Don't retry if we have offline data
        if (error.message.includes('offline')) return false;
        // Retry up to 3 times for network errors
        return failureCount < 3;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Queue mutations for offline sync
      onError: async (error, variables, context) => {
        console.warn('Mutation failed, considering offline queue:', error);
        // This could be enhanced to automatically queue failed mutations
      }
    }
  }
});

// Store jobs whenever they're fetched successfully
queryClient.setQueryDefaults(['jobs'], {
  staleTime: STALE_TIME,
  gcTime: CACHE_TIME,
});

export default queryClient;