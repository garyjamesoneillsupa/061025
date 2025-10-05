// Performance optimization utilities

// Debounce function for reducing frequent API calls
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for limiting execution frequency
export function throttle<T extends (...args: any[]) => void>(
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

// Preload critical driver routes when idle
export function preloadDriverRoutes() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const routes = [
        '/drivers/dashboard',
        '/drivers/login'
      ];
      
      routes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  }
}

// Memory-efficient image loading for mobile
export function optimizeImageLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback for older browsers
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;
      imgElement.src = imgElement.dataset.src || '';
    });
  }
}

// Reduce bundle size by removing unused CSS
export function removeUnusedStyles() {
  // This would be handled by build tools in production
  // For development, we can at least remove hidden elements' styles
  const hiddenElements = document.querySelectorAll('[style*="display: none"]');
  hiddenElements.forEach(el => {
    if (!el.hasAttribute('data-keep-hidden')) {
      el.remove();
    }
  });
}