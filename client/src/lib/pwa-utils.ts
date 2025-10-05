// PWA and mobile detection utilities

export function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function shouldRedirectToDriverPortal(): boolean {
  return isPWA() || isMobile();
}

export function getDriverLoginStatus(): boolean {
  const session = localStorage.getItem("driverSession");
  const sessionExpiry = localStorage.getItem("driverSessionExpiry");
  
  if (session && sessionExpiry) {
    const expiryDate = new Date(sessionExpiry);
    const now = new Date();
    return now <= expiryDate;
  }
  return false;
}

export function getOptimalDriverRoute(): string {
  // Always redirect to /drivers - the DriverLayout will handle login vs dashboard internally
  return '/drivers';
}