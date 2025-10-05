// Performance optimization utilities for PWA
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Preload critical resources for instant PWA loading
  preloadCriticalResources() {
    const criticalAssets = [
      { href: '/attached_assets/ovmlogo_1753908468997.png', as: 'image' },
      { href: '/attached_assets/avatar_1753922692670.png', as: 'image' }
    ];
    
    criticalAssets.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
    
    // Preload driver API for instant data loading
    this.preloadDriverAPI();
  }

  // Preload driver API endpoints for instant data access
  private preloadDriverAPI() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Let service worker pre-cache driver endpoints
      fetch('/api/drivers/current/jobs', { method: 'HEAD' }).catch(() => {});
    }
  }

  // Optimize images for mobile
  optimizeImageLoading() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      // Add loading="lazy" for non-critical images
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      // Add better error handling
      img.onerror = () => {
        console.warn('Image failed to load:', img.src);
        // Replace with placeholder or remove
        img.style.display = 'none';
      };
    });
  }

  // Monitor memory usage
  monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
      
      // Log warning if memory usage is high
      if (memoryInfo.percentage > 80) {
        console.warn('High memory usage detected:', memoryInfo);
        this.triggerGarbageCollection();
      }
      
      return memoryInfo;
    }
    return null;
  }

  // Force garbage collection (if available)
  private triggerGarbageCollection() {
    if ('gc' in window) {
      (window as any).gc();
    }
  }

  // Debounce function calls to prevent excessive API calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Compress images before upload
  async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(new Blob());
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Monitor network connection
  getConnectionInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  // Adaptive loading based on connection
  shouldLoadHighQuality(): boolean {
    const connection = this.getConnectionInfo();
    if (!connection) return true;
    
    // Load high quality only on fast connections
    return connection.effectiveType === '4g' && connection.downlink > 1.5;
  }

  // Preload next page resources
  preloadNextPage(route: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }

  // Clean up resources
  cleanup() {
    // Remove unused event listeners
    // Clear intervals/timeouts
    // Free up memory where possible
  }

  // Start performance monitoring
  startMonitoring() {
    // Monitor every 30 seconds
    setInterval(() => {
      this.monitorMemoryUsage();
      this.optimizeImageLoading();
    }, 30000);

    // Monitor connection changes
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        console.log('Connection changed:', this.getConnectionInfo());
      });
    }
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();