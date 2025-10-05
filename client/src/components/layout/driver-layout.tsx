import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import Footer from "./footer";
import { ErrorBoundary } from "@/components/error-boundary";

// LAZY LOAD all driver pages for lightning-fast startup
const NotFound = lazy(() => import("@/pages/not-found"));
const DriverLogin = lazy(() => import("@/pages/driver-login"));
const DriverPortalFixed = lazy(() => import("@/pages/driver-portal-fixed"));
const DriverExpenses = lazy(() => import("@/pages/driver-expenses"));

interface DriverAuth {
  isAuthenticated: boolean;
  username: string;
  driverId: string;
}

export default function DriverLayout() {
  const [location] = useLocation();
  // Initialize auth state immediately from localStorage to prevent flashes
  const [driverAuth, setDriverAuth] = useState<DriverAuth>(() => {
    const session = localStorage.getItem("driverSession");
    const sessionExpiry = localStorage.getItem("driverSessionExpiry");
    
    if (session && sessionExpiry) {
      const expiryDate = new Date(sessionExpiry);
      const now = new Date();
      
      if (now <= expiryDate) {
        try {
          const parsedSession = JSON.parse(session);
          return {
            isAuthenticated: true,
            username: parsedSession.driver?.name || '',
            driverId: parsedSession.driver?.id || ''
          };
        } catch (error) {
          console.error('Failed to parse driver session:', error);
          localStorage.removeItem("driverSession");
          localStorage.removeItem("driverSessionExpiry");
        }
      } else {
        localStorage.removeItem("driverSession");
        localStorage.removeItem("driverSessionExpiry");
      }
    }
    
    return {
      isAuthenticated: false,
      username: '',
      driverId: ''
    };
  });

  useEffect(() => {
    // Check driver session on every location change
    const checkDriverSession = () => {
      const session = localStorage.getItem("driverSession");
      const sessionExpiry = localStorage.getItem("driverSessionExpiry");
      
      if (session && sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        const now = new Date();
        
        if (now <= expiryDate) {
          try {
            const parsedSession = JSON.parse(session);
            setDriverAuth({
              isAuthenticated: true,
              username: parsedSession.driver?.name || '',
              driverId: parsedSession.driver?.id || ''
            });
          } catch (error) {
            console.error('Failed to parse driver session:', error);
            localStorage.removeItem("driverSession");
            localStorage.removeItem("driverSessionExpiry");
            setDriverAuth({
              isAuthenticated: false,
              username: '',
              driverId: ''
            });
          }
        } else {
          // Session expired
          localStorage.removeItem("driverSession");
          localStorage.removeItem("driverSessionExpiry");
          setDriverAuth({
            isAuthenticated: false,
            username: '',
            driverId: ''
          });
        }
      } else {
        setDriverAuth({
          isAuthenticated: false,
          username: '',
          driverId: ''
        });
      }
    };

    checkDriverSession();
    
    // Listen for login/logout events to refresh auth state
    const handleAuthEvent = () => {
      checkDriverSession();
    };
    
    window.addEventListener('driverLogin', handleAuthEvent);
    window.addEventListener('driverLogout', handleAuthEvent);
    
    return () => {
      window.removeEventListener('driverLogin', handleAuthEvent);
      window.removeEventListener('driverLogout', handleAuthEvent);
    };
  }, [location]); // Re-run when location changes



  // Route matching logic
  const isJobExpenses = location.startsWith("/drivers/jobs/") && location.includes("/expenses");
  const isMainDrivers = location === "/drivers";

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <main className="flex-1">
          {/* Main drivers page */}
          {isMainDrivers && (
            <ErrorBoundary>
              <Suspense fallback={<div></div>}>
                {driverAuth.isAuthenticated ? (
                  <DriverPortalFixed />
                ) : (
                  <DriverLogin />
                )}
              </Suspense>
            </ErrorBoundary>
          )}
          
          {location.startsWith("/drivers/jobs/") && location.includes("/expenses") && (
            <ErrorBoundary>
              <Suspense fallback={<div></div>}>
                {driverAuth.isAuthenticated ? (
                  <DriverExpenses />
                ) : (
                  <DriverLogin />
                )}
              </Suspense>
            </ErrorBoundary>
          )}
          
          {/* Only show NotFound for truly unmatched routes */}
          {!location.match(/^\/drivers(\/jobs\/[^\/]+\/expenses)?$/) && 
           location.startsWith("/drivers") && 
           location !== "/drivers" && (
            <Suspense fallback={<div></div>}>
              <NotFound />
            </Suspense>
          )}
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}