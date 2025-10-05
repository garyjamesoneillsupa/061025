import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowRight, 
  LogOut, 
  Car, 
  MapPin, 
  Navigation,
  Wifi,
  WifiOff
} from "lucide-react";
import { useLocation } from "wouter";
import type { Job, Driver } from "@shared/schema";
import { format } from "date-fns";
import { ContactModal } from "../components/driver/ContactModal";

interface DriverSession {
  driver: Driver;
  message: string;
}

export interface JobWithDetails extends Partial<Job> {
  id: string;
  jobNumber: string;
  status: "created" | "assigned" | "collected" | "delivered" | "invoiced" | "paid" | "aborted" | "cancelled";
  createdAt: Date | null;
  customer?: any;
  vehicle?: any;
  collectionAddress?: any;
  deliveryAddress?: any;
  collectionContact?: { name: string; phone: string; email: string };
  deliveryContact?: { name: string; phone: string; email: string };
  assignedDriverId?: string | null;
  collectedAt?: Date | null;
  deliveredAt?: Date | null;
  driverPrice?: number | null;
}

export default function DriverDashboardSimple() {
  const [, navigate] = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithDetails | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    const session = localStorage.getItem("driverSession");
    if (session) {
      setDriverSession(JSON.parse(session));
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: jobs = [], isLoading, refetch } = useQuery<JobWithDetails[]>({
    queryKey: ['/api/drivers', driverSession?.driver?.id, 'jobs'],
    enabled: !!driverSession?.driver?.id,
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    window.location.href = '/drivers';
  };

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      setTouchStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY;

    if (distance > 0 && distance <= 120) {
      setPullDistance(distance);
      // Prevent default scrolling when pulling down
      e.preventDefault();
    } else if (distance < 0) {
      // User scrolled up, cancel pull
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= 70) {
      // Trigger refresh
      setIsRefreshing(true);
      try {
        await refetch();
        // Add a small delay for better UX
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      } catch (error) {
        setIsRefreshing(false);
      }
    }

    // Animate back to 0
    setPullDistance(0);
  };

  const activeJobs = jobs.filter(job => 
    ['assigned', 'collected'].includes(job.status) && 
    job.assignedDriverId === driverSession?.driver?.id
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'created': return { label: 'Created', color: 'bg-gray-500', textColor: 'text-gray-400' };
      case 'assigned': return { label: 'Assigned', color: 'bg-pink-500', textColor: 'text-pink-400' };
      case 'collected': return { label: 'Collected', color: 'bg-amber-500', textColor: 'text-amber-400' };
      case 'delivered': return { label: 'Delivered', color: 'bg-green-500', textColor: 'text-green-400' };
      case 'invoiced': return { label: 'Invoiced', color: 'bg-blue-500', textColor: 'text-blue-400' };
      case 'paid': return { label: 'Paid', color: 'bg-black', textColor: 'text-white' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-orange-600', textColor: 'text-orange-400' };
      case 'aborted': return { label: 'Aborted', color: 'bg-red-600', textColor: 'text-red-400' };
      default: return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  const getButtonConfig = (status: string) => {
    switch (status) {
      case 'assigned': 
        return { 
          text: 'Start Collection', 
          gradient: 'from-blue-600 to-blue-700',
          hoverGradient: 'hover:from-blue-700 hover:to-blue-800',
          borderColor: 'border-blue-500/40'
        };
      case 'collected': 
        return { 
          text: 'Start Delivery', 
          gradient: 'from-green-600 to-green-700',
          hoverGradient: 'hover:from-green-700 hover:to-green-800',
          borderColor: 'border-green-500/40'
        };
      case 'delivered':
        return { 
          text: 'Completed', 
          gradient: 'from-gray-600 to-gray-700',
          hoverGradient: 'hover:from-gray-700 hover:to-gray-800',
          borderColor: 'border-gray-500/40'
        };
      default: 
        return { 
          text: 'View Details', 
          gradient: 'from-gray-600 to-gray-700',
          hoverGradient: 'hover:from-gray-700 hover:to-gray-800',
          borderColor: 'border-gray-500/40'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Premium Professional Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700/50 px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold text-lg">Driver Portal</div>
              <div className="text-gray-400 text-sm">{driverSession?.driver?.name || 'Driver'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-xs text-gray-300">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
            >
              <LogOut className="h-4 w-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Pull-to-Refresh Indicator */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-20"
        style={{
          transform: `translate(-50%, ${Math.max(-60, pullDistance - 80)}px)`,
          opacity: pullDistance > 20 ? 1 : 0
        }}
        data-testid="status-refresh-indicator"
      >
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-full p-3 border border-gray-700/50 shadow-lg">
          {isRefreshing ? (
            <div 
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
              data-testid="spinner-refreshing"
            />
          ) : (
            <ArrowRight 
              className={`h-6 w-6 text-gray-300 transition-transform duration-300 ${
                pullDistance >= 70 ? 'rotate-180 text-blue-400' : '-rotate-90'
              }`}
              data-testid="icon-arrow"
            />
          )}
        </div>
      </div>


      {/* Main Content - Pull-to-refresh enabled */}
      <div 
        className="px-4 py-6 space-y-5 transition-transform duration-300 overflow-hidden"
        style={{
          transform: `translateY(${pullDistance}px)`,
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          WebkitOverflowScrolling: 'touch'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="content-pullable"
      >
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2].map(i => (
              <div key={i} className="bg-gradient-to-r from-gray-800 to-gray-800/80 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-3"></div>
                  <div className="h-6 bg-gray-700 rounded w-32 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-48"></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 rounded-xl p-8 text-center backdrop-blur-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No Active Jobs</h3>
            <p className="text-gray-400">Your job assignments will appear here</p>
          </div>
        ) : (
          <div className="space-y-5">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                onClick={() => {
                  setSelectedJob(job);
                  setIsContactModalOpen(true);
                }}
                className="group bg-gradient-to-br from-gray-800/95 via-gray-800/90 to-gray-900/95 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-lg hover:border-gray-600/70 hover:shadow-2xl transition-all duration-300 hover:from-gray-800 hover:to-gray-900 shadow-xl cursor-pointer"
              >
                {/* Premium Header with Enhanced Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-white font-bold text-lg truncate">
                        {job.vehicle?.make}
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusConfig(job.status).color} shadow-lg`}></div>
                      </div>
                    </div>
                    <div className="text-gray-300 text-sm font-medium mb-3">
                      {job.vehicle?.year || '2022'} • Petrol
                    </div>
                    {/* Enhanced Registration Plate */}
                    {job.vehicle?.registration && (
                      <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-300 text-black px-3 py-1.5 rounded-lg text-sm font-black tracking-wider shadow-md">
                        {job.vehicle.registration}
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-full bg-gray-700/50 border border-gray-600/50 text-xs font-semibold ${getStatusConfig(job.status).textColor} backdrop-blur-sm`}>
                    {getStatusConfig(job.status).label}
                  </div>
                </div>

                {/* Enhanced Address Layout */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-blue-800/20 rounded-lg p-4 border border-blue-700/30 backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-blue-300 text-xs font-bold uppercase tracking-widest">Collection</div>
                      <div className="text-white text-sm font-bold truncate">
                        {job.collectionAddress?.city || 'Manchester'}, {job.collectionAddress?.postcode || 'M1 2AB'}
                      </div>
                    </div>
                    <div className="bg-blue-600/30 px-3 py-1.5 rounded-full text-blue-200 text-xs font-bold">27/07</div>
                  </div>
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-900/20 to-green-800/20 rounded-lg p-4 border border-green-700/30 backdrop-blur-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-green-300 text-xs font-bold uppercase tracking-widest">Delivery</div>
                      <div className="text-white text-sm font-bold truncate">
                        {job.deliveryAddress?.city || 'Leicester'}, {job.deliveryAddress?.postcode || 'LE1 9XY'}
                      </div>
                    </div>
                    <div className="bg-green-600/30 px-3 py-1.5 rounded-full text-green-200 text-xs font-bold">28/07</div>
                  </div>
                </div>

                {/* Dynamic Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (job.status === 'assigned') {
                      navigate(`/drivers/jobs/${job.jobNumber}/collection`);
                    } else if (job.status === 'collected') {
                      navigate(`/drivers/jobs/${job.jobNumber}/delivery`);
                    } else {
                      setSelectedJob(job);
                      setIsContactModalOpen(true);
                    }
                  }}
                  className={`w-full bg-gradient-to-r ${getButtonConfig(job.status).gradient} ${getButtonConfig(job.status).hoverGradient} text-white py-3.5 rounded-xl text-sm font-bold text-center transition-all duration-300 shadow-xl hover:shadow-2xl group-hover:scale-[1.02] border ${getButtonConfig(job.status).borderColor} backdrop-blur-sm`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {getButtonConfig(job.status).text}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {selectedJob && (
        <ContactModal
          job={selectedJob}
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
}