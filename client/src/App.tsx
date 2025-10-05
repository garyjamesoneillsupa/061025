import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, Suspense, lazy } from "react";
import { shouldRedirectToDriverPortal, getOptimalDriverRoute } from "@/lib/pwa-utils";
import { performanceOptimizer } from "@/lib/performanceOptimizer";
// New robust IndexedDB-based offline system with 50x capacity and zero data loss

// Core components for PWA
import { ErrorBoundary } from "@/components/error-boundary";

// Lazy load ALL pages for lightning-fast PWA startup
const Landing = lazy(() => import("@/pages/landing"));
const NotFound = lazy(() => import("@/pages/not-found"));
const BundlePayment = lazy(() => import("@/pages/bundle-payment"));
const Showcase = lazy(() => import("@/pages/showcase"));
const Demo = lazy(() => import("@/pages/demo"));

// AGGRESSIVE LAZY LOADING for instant PWA startup - EVERYTHING IS LAZY LOADED
const DriverLayout = lazy(() => import("@/components/layout/driver-layout"));
const AdminLayout = lazy(() => import("@/components/layout/admin-layout"));


// Initialize robust offline manager for PWA users
async function initializeOfflineManager() {
  if (shouldRedirectToDriverPortal()) {
    try {
      const { robustOfflineManager } = await import('./lib/offline/robust-offline-manager');
      await robustOfflineManager.init();
      console.log('✅ Robust offline manager initialized for PWA');
    } catch (error) {
      console.error('❌ Failed to initialize offline manager:', error);
    }
  }
}

// Driver Portal Components - lazy loaded for faster PWA startup
const DriverDashboard = lazy(() => import("@/pages/driver"));
const DriverLogin = lazy(() => import("@/pages/driver-login"));
const POCComparison = lazy(() => import("@/pages/poc-comparison"));

// Lazy load driver workflows - only load when needed for faster startup
const DriverPortalFixed = lazy(() => import("./pages/driver-portal-fixed"));

// Mobile/PWA direct driver portal
function MobileRedirect() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (shouldRedirectToDriverPortal()) {
      // Immediate redirect without delay
      navigate('/drivers', { replace: true });
    }
  }, [navigate]);

  // PWA users go directly to drivers with no loading screen
  if (shouldRedirectToDriverPortal()) {
    return null; // React will handle the redirect instantly
  }

  return (
    <Suspense fallback={<div></div>}>
      <Landing />
    </Suspense>
  );
}

function Router() {
  return (
    <Switch>
      {/* Default landing page with mobile redirect */}
      <Route path="/" component={MobileRedirect} />
      
      {/* Showcase page - sales demo */}
      <Route path="/showcase">
        <Suspense fallback={<div></div>}>
          <Showcase />
        </Suspense>
      </Route>
      
      {/* Demo page - customer-facing transport service landing page */}
      <Route path="/demo">
        <Suspense fallback={<div></div>}>
          <Demo />
        </Suspense>
      </Route>
      
      {/* POC Comparison page */}
      <Route path="/poc-comparison">
        <Suspense fallback={<div></div>}>
          <POCComparison />
        </Suspense>
      </Route>
      
      {/* Bundle payment page - public route */}
      <Route path="/payment/bundle/:bundleId">
        {({ bundleId }) => (
          <Suspense fallback={<div></div>}>
            <BundlePayment bundleId={bundleId || ''} />
          </Suspense>
        )}
      </Route>
      
      {/* Jobs route - redirect to admin jobs */}
      <Route path="/jobs" component={() => {
        const [, navigate] = useLocation();
        useEffect(() => {
          navigate('/admin/jobs', { replace: true });
        }, [navigate]);
        return null;
      }} />
      
      {/* Admin routes - lazy loaded (desktop only) */}
      <Route path="/admin/jobs/:jobNumber">
        <Suspense fallback={<div></div>}>
          <AdminLayout />
        </Suspense>
      </Route>
      <Route path="/admin/:path*">
        <Suspense fallback={<div></div>}>
          <AdminLayout />
        </Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<div></div>}>
          <AdminLayout />
        </Suspense>
      </Route>
      
      {/* Driver redirect - singular to plural */}
      <Route path="/driver" component={() => {
        const [, navigate] = useLocation();
        useEffect(() => {
          navigate('/drivers', { replace: true });
        }, [navigate]);
        return null;
      }} />
      
      {/* New Driver Portal Routes */}
      <Route path="/driver/login">
        <Suspense fallback={<div></div>}>
          <DriverLogin />
        </Suspense>
      </Route>
      <Route path="/driver">
        <Suspense fallback={<div></div>}>
          <DriverDashboard />
        </Suspense>
      </Route>
      
      <Route path="/drivers/jobs/:jobNumber/expenses" component={DriverLayout} />

      <Route path="/drivers/:rest*">
        <Suspense fallback={<div></div>}>
          <DriverLayout />
        </Suspense>
      </Route>
      <Route path="/drivers">
        <Suspense fallback={<div></div>}>
          <DriverLayout />
        </Suspense>
      </Route>
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize performance optimizations immediately for all users
    performanceOptimizer.preloadCriticalResources();
    performanceOptimizer.startMonitoring();
    
    // Offline storage disabled to prevent IndexedDB errors
    console.log('Using localStorage-only for data persistence');
    
    // Only initialize offline features for PWA/mobile users to improve performance
    if (shouldRedirectToDriverPortal()) {
      // Delay initialization significantly to not block critical PWA loading
      const initWhenIdle = () => {
        import('@/lib/offlineManager').then(module => {
          const { default: OfflineManager } = module;
          const offlineManager = new OfflineManager();
          offlineManager.init().then(() => {
            OfflineManager.setupConnectionListener();
            console.log('✅ Driver offline features ready');
          });
        }).catch(error => {
          console.warn('Offline features unavailable:', error);
        });
      };

      // Much longer delay to prioritize fast PWA startup
      if (window.requestIdleCallback) {
        window.requestIdleCallback(initWhenIdle, { timeout: 10000 });
      } else {
        setTimeout(initWhenIdle, 3000);
      }
    }
    
    // Data cleanup disabled with offline storage
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
