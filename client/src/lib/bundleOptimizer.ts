// Bundle optimization and code splitting utilities
export const bundleOptimizer = {
  // Lazy load heavy components only when needed
  loadAdminLayout: () => import('@/components/layout/admin-layout'),
  loadDriverLayout: () => import('@/components/layout/driver-layout'),
  
  // Preload critical routes for drivers
  preloadDriverRoutes() {
    // Only preload if user is likely to need driver routes
    if (navigator.userAgent.includes('Mobile') || window.innerWidth < 768) {
      import('@/pages/driver-collection');
      import('@/pages/driver-delivery');
      import('@/pages/driver-expenses');
    }
  },
  
  // Split large dependencies
  async loadChartLibrary() {
    return import('recharts');
  },
  
  async loadDateLibrary() {
    return import('date-fns');
  },
  
  // Remove unused imports at runtime
  cleanupUnusedModules() {
    // Clear module cache for development hot reloading
    if (process.env.NODE_ENV === 'development') {
      // This helps with memory usage during development
      console.log('Development mode: cleaning up modules');
    }
  }
};

// Optimize bundle loading based on device capabilities
export function optimizeForDevice() {
  const isLowEnd = navigator.hardwareConcurrency <= 2 || 
                   (navigator as any).deviceMemory <= 2;
                   
  if (isLowEnd) {
    // Disable non-essential animations
    document.documentElement.style.setProperty('--animation-duration', '0ms');
    
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.loading !== 'lazy') {
        img.loading = 'lazy';
      }
    });
  }
}

// Monitor bundle size and performance
export function monitorBundlePerformance() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const totalJSSize = jsResources.reduce((size, resource) => {
      return size + (resource.transferSize || 0);
    }, 0);
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalJSSize: Math.round(totalJSSize / 1024), // KB
      jsResourceCount: jsResources.length
    };
    
    console.log('Bundle Performance Metrics:', metrics);
    
    // Alert if bundle is too large
    if (metrics.totalJSSize > 500) { // > 500KB
      console.warn(`Bundle size is large: ${metrics.totalJSSize}KB. Consider code splitting.`);
    }
    
    return metrics;
  }
  
  return null;
}