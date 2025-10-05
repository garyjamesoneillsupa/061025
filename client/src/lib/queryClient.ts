// Enhanced query client with robust offline-first capabilities
import { QueryClient, QueryFunction } from '@tanstack/react-query';
import { robustOfflineManager } from './offline/robust-offline-manager';

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 hours
const STALE_TIME = 1000 * 60 * 30; // 30 minutes

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      const text = await res.text();
      // Try to parse as JSON first to get structured error
      try {
        const json = JSON.parse(text);
        errorMessage = json.message || text || res.statusText;
      } catch {
        errorMessage = text || res.statusText;
      }
    } catch {
      errorMessage = res.statusText;
    }
    
    // Auto-redirect to login for expired/invalid tokens (drivers only)
    if (errorMessage.includes('Invalid or expired token') || 
        errorMessage.includes('Access token required')) {
      const driverSession = localStorage.getItem("driverSession");
      if (driverSession) {
        // Clear driver session
        localStorage.removeItem("driverSession");
        // Redirect to driver portal (DriverLayout handles login)
        window.location.href = '/drivers';
        return;
      }
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

// Get authentication token (admin or driver)
function getAuthToken(): string | null {
  // Check for admin token first
  const adminToken = localStorage.getItem("authToken");
  if (adminToken) return adminToken;
  
  // Check for driver token
  const driverSession = localStorage.getItem("driverSession");
  if (driverSession) {
    try {
      const session = JSON.parse(driverSession);
      return session.token || null;
    } catch {
      return null;
    }
  }
  
  return null;
}

// Custom fetch function that tries offline first, then online
async function offlineFirstFetch(url: string, options?: RequestInit): Promise<Response> {
  const isOnline = navigator.onLine;
  
  // Add authentication header if token exists
  const token = getAuthToken();
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const fetchOptions = {
    ...options,
    headers
  };
  
  // For job queries, try offline storage first
  if (url.includes('/api/jobs/by-number/')) {
    const jobNumber = url.split('/api/jobs/by-number/')[1];
    try {
      await robustOfflineManager.init(); // Ensure initialized
      const offlineJob = await robustOfflineManager.getJobByNumber(jobNumber);
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
      const response = await fetch(url, fetchOptions);
      
      // Store job data for offline use when successfully fetched
      if (response.ok && url.includes('/api/jobs/by-number/')) {
        const jobData = await response.clone().json();
        await robustOfflineManager.storeJob(jobData);
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

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`🌐 API Request: ${method} ${url}`, data ? { data } : '');
  
  try {
    // Get auth token (admin or driver)
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    
    if (data) {
      headers["Content-Type"] = "application/json";
    }
    
    // Add Authorization header if token exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`📡 Response: ${res.status} ${res.statusText}`);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`❌ Network Error for ${method} ${url}:`, error);
    
    // If we're offline and this is a mutation, queue it
    if (!navigator.onLine && method !== 'GET') {
      console.log('📱 Offline mode: Request will be queued for later sync');
      // The robust offline manager will handle this through the component-level operations
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    // Use offline-first fetch for compatible endpoints
    const res = await offlineFirstFetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: STALE_TIME,
      gcTime: CACHE_TIME,
      retry: (failureCount, error) => {
        // Don't retry if we're offline
        if (!navigator.onLine) return false;
        // Retry up to 3 times for network errors
        return failureCount < 3;
      },
      // PWA Performance optimizations with offline-first approach
      refetchOnMount: false, // Don't refetch on component mount for faster loading
      refetchOnReconnect: 'always', // Refetch when connection restored
      networkMode: 'offlineFirst', // Prioritize cached data and offline storage
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst', // Allow mutations to work offline via queuing
    },
  },
});

export default queryClient;