import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Car, 
  User, 
  Phone,
  ArrowRight,
  LogOut,
  FileText,
  Key,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProductionCollectionWorkflow from "../components/driver/ProductionCollectionWorkflow";
import ProductionDeliveryWorkflow from "../components/driver/ProductionDeliveryWorkflow";

interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  color: string;
  collectionAddress: string;
  deliveryAddress: string;
  collectionDate: string;
  deliveryDate: string;
  collectionContactName: string;
  collectionContactPhone: string;
  deliveryContactName: string;
  deliveryContactPhone: string;
  status: string;
  driverId: string;
  specialInstructions: string | null;
  releaseCode: string | null;
  modelPin: string | null;
  createdAt: string;
  updatedAt: string;
}

// Admin panel status colors - exact match
const statusColors = {
  created: "job-status-created",
  assigned: "job-status-assigned", 
  collected: "job-status-collected",
  delivered: "job-status-delivered",
  invoiced: "job-status-invoiced",
  paid: "job-status-paid"
};

const statusLabels = {
  created: "Created",
  assigned: "Assigned", 
  collected: "Collected",
  delivered: "Delivered",
  invoiced: "Invoiced",
  paid: "Paid"
};

export default function DriverPortalFixed() {
  const [, navigate] = useLocation();
  const [showCollectionWorkflow, setShowCollectionWorkflow] = useState(false);
  const [showDeliveryWorkflow, setShowDeliveryWorkflow] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [driverName, setDriverName] = useState<string>('Driver');
  
  // Validate session has token - clear invalid sessions from before token implementation
  useEffect(() => {
    const session = localStorage.getItem("driverSession");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (!parsed.token) {
          console.log('🔄 Clearing old session without token - please log in again');
          localStorage.removeItem("driverSession");
          localStorage.removeItem("driverSessionExpiry");
          window.location.reload();
        } else {
          // Get driver name from session
          setDriverName(parsed.driver?.name || 'Driver');
        }
      } catch (error) {
        console.error('Invalid session data:', error);
        localStorage.removeItem("driverSession");
        localStorage.removeItem("driverSessionExpiry");
        window.location.reload();
      }
    }
  }, []);
  
  // Premium Pull-to-refresh state for PWA
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullDistanceRef = useRef(0);
  const touchStartYRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  
  // Premium PTR physics - native-like thresholds
  const ACTIVATE_START = 6;
  const TRIGGER_THRESHOLD = 36;
  const MAX_PULL = 80;
  const PINNED_HEIGHT = 48;
  
  // PWA-OPTIMIZED QUERY - NO LOADING STATES for instant appearance
  const { data: jobs = [], refetch } = useQuery<Job[]>({
    queryKey: ["/api/drivers/current/jobs"],
    staleTime: 5 * 60 * 1000, // 5 minutes before considering stale
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    // No background refresh - rely on pull-to-refresh for data updates
  });

  const handleStartJob = (job: Job) => {
    setActiveJob(job);
    if (job.status === 'assigned') {
      setShowCollectionWorkflow(true);
    } else if (job.status === 'collected') {
      setShowDeliveryWorkflow(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Clean data helper - remove "Unknown" and empty values
  const cleanText = useCallback((text: string | null | undefined): string => {
    if (!text) return '';
    const cleaned = text.trim();
    return cleaned && cleaned.toLowerCase() !== 'unknown' ? cleaned : '';
  }, []);

  const handleCallContact = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    window.dispatchEvent(new CustomEvent('driverLogout'));
    navigate('/drivers');
  };

  // Premium PTR with direct DOM manipulation (no re-renders)
  const updatePullVisuals = useCallback((distance: number) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    
    rafIdRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const indicator = indicatorRef.current;
      
      if (!container || !indicator) return;
      
      if (distance === 0) {
        // Complete cleanup when distance is 0
        container.style.transform = 'translateY(0px)';
        indicator.style.opacity = '0';
        indicator.style.setProperty('--progress', '0');
        pullDistanceRef.current = 0;
        return;
      }
      
      // Native-like easing physics
      const eased = 1 - Math.exp(-distance / 40);
      const visualOffset = Math.min(eased * MAX_PULL, MAX_PULL);
      const progress = Math.min(distance / TRIGGER_THRESHOLD, 1);
      
      // Update visuals directly without React re-renders
      container.style.transform = `translateY(${visualOffset}px)`;
      indicator.style.opacity = distance > ACTIVATE_START ? '1' : '0';
      indicator.style.setProperty('--progress', progress.toString());
      
      // Haptic feedback on threshold cross
      if (distance >= TRIGGER_THRESHOLD && pullDistanceRef.current < TRIGGER_THRESHOLD) {
        if ('vibrate' in navigator) navigator.vibrate(10);
      }
      
      pullDistanceRef.current = distance;
    });
  }, []);

  // Premium native-feeling touch handlers
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let pulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && !isRefreshing) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartYRef.current;

      // Premium activation with minimal threshold
      if (container.scrollTop === 0 && distance > ACTIVATE_START) {
        if (!pulling) {
          pulling = true;
          setIsPulling(true);
        }
        e.preventDefault(); // Block native PTR
        updatePullVisuals(distance - ACTIVATE_START);
      } else if (pulling && distance < ACTIVATE_START / 2) {
        pulling = false;
        setIsPulling(false);
        updatePullVisuals(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;

      const distance = pullDistanceRef.current;
      pulling = false;
      setIsPulling(false);

      if (distance >= (TRIGGER_THRESHOLD - ACTIVATE_START)) {
        // Pin indicator during refresh
        const container = scrollContainerRef.current;
        const indicator = indicatorRef.current;
        
        if (container && indicator) {
          container.style.transform = `translateY(${PINNED_HEIGHT}px)`;
          container.style.transition = 'transform 0.3s ease-out';
        }
        
        setIsRefreshing(true);
        try {
          if (navigator.onLine) {
            await refetch();
          }
        } catch (error) {
          console.log('Refresh failed:', error);
        } finally {
          // Smooth return to normal with proper indicator cleanup
          setTimeout(() => {
            if (container && indicator) {
              container.style.transform = 'translateY(0)';
              indicator.style.opacity = '0';
              indicator.style.setProperty('--progress', '0');
              setTimeout(() => {
                if (container) container.style.transition = '';
              }, 300);
            }
            setIsRefreshing(false);
          }, 600);
        }
      } else {
        updatePullVisuals(0);
      }
    };

    const handleTouchCancel = () => {
      pulling = false;
      setIsPulling(false);
      updatePullVisuals(0);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [isRefreshing, refetch, updatePullVisuals]);

  // Show collection workflow if active
  if (activeJob && showCollectionWorkflow) {
    return (
      <ProductionCollectionWorkflow
        job={activeJob}
        onComplete={() => {
          setShowCollectionWorkflow(false);
          setActiveJob(null);
          refetch();
        }}
        onBack={() => {
          setShowCollectionWorkflow(false);
          setActiveJob(null);
        }}
      />
    );
  }

  // Show delivery workflow if active
  if (activeJob && showDeliveryWorkflow) {
    return (
      <ProductionDeliveryWorkflow
        job={activeJob}
        onComplete={() => {
          setShowDeliveryWorkflow(false);
          setActiveJob(null);
          refetch();
        }}
        onBack={() => {
          setShowDeliveryWorkflow(false);
          setActiveJob(null);
        }}
      />
    );
  }

  // NO LOADING SCREEN - instant appearance

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Seamless Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 relative z-20 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#00ABE7] rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 text-lg font-semibold">{driverName}</h1>
                <p className="text-gray-500 text-sm">Driver Portal</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Pull-to-Refresh Indicator */}
      <div 
        ref={indicatorRef}
        className="absolute top-20 left-1/2 transform -translate-x-1/2 z-30 opacity-0"
        style={{
          willChange: 'transform, opacity',
        }}
        data-testid="status-refresh-indicator"
      >
        <div className="bg-white/98 backdrop-blur-sm rounded-full p-4 border border-gray-200/50 shadow-xl">
          {isRefreshing ? (
            <div 
              className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
              data-testid="spinner-refreshing"
            />
          ) : (
            <div className="relative w-6 h-6">
              <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="63"
                  strokeDashoffset="calc(63 - 63 * var(--progress, 0))"
                  className="transition-all duration-150 ease-out"
                />
              </svg>
              <ArrowRight className="absolute inset-0 w-6 h-6 text-blue-500 transform rotate-90" />
            </div>
          )}
        </div>
      </div>

      {/* Premium Scrollable Job Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{
          overscrollBehaviorY: 'contain',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          transform: 'translateY(0px)', // Controlled by direct DOM manipulation
        }}
        data-testid="content-pullable"
      >
        <div className="max-w-4xl mx-auto p-4">
          {jobs.length > 0 && (
            <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="bg-white border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {job.jobNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created {formatDate(job.createdAt)}
                      </p>
                    </div>
                    
                    <Badge className={cn("px-3 py-1 text-sm font-medium", statusColors[job.status as keyof typeof statusColors] || "bg-gray-500 text-white")}>
                      {statusLabels[job.status as keyof typeof statusLabels] || job.status}
                    </Badge>
                  </div>

                  {/* Vehicle Information */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#00ABE7] rounded-xl flex items-center justify-center">
                        <Car className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-xl">{job.vehicleReg}</div>
                        <div className="text-gray-600 text-sm">
                          {(() => {
                            const make = cleanText(job.vehicleMake);
                            const model = cleanText(job.vehicleModel);
                            if (!make && !model) return 'Vehicle details not specified';
                            return `${make}${make && model ? ' ' : ''}${model}`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div 
                    className="mb-4 p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => job.customerPhone && handleCallContact(job.customerPhone)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{job.customerName}</div>
                          <div className="text-sm text-blue-700">{job.customerPhone}</div>
                        </div>
                      </div>
                      {job.customerPhone && (
                        <Phone className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Collection/Delivery Information based on status */}
                  {job.status === 'assigned' && (
                    <div className="mb-4">
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-green-800 text-lg">COLLECTION</div>
                            <div className="text-sm text-green-700">{formatDate(job.collectionDate)}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {job.collectionAddress || 'Collection address not specified'}
                        </div>
                        
                        {job.collectionContactName && (
                          <div 
                            className="p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => job.collectionContactPhone && handleCallContact(job.collectionContactPhone)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">{job.collectionContactName}</div>
                                <div className="text-sm text-green-700">{job.collectionContactPhone}</div>
                              </div>
                              {job.collectionContactPhone && (
                                <Phone className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {job.status === 'collected' && (
                    <div className="mb-4">
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-red-800 text-lg">DELIVERY</div>
                            <div className="text-sm text-red-700">{formatDate(job.deliveryDate)}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {job.deliveryAddress || 'Delivery address not specified'}
                        </div>
                        
                        {job.deliveryContactName && (
                          <div 
                            className="p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => job.deliveryContactPhone && handleCallContact(job.deliveryContactPhone)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">{job.deliveryContactName}</div>
                                <div className="text-sm text-red-700">{job.deliveryContactPhone}</div>
                              </div>
                              {job.deliveryContactPhone && (
                                <Phone className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Instructions */}
                  {job.specialInstructions && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-amber-800 mb-2">Special Instructions</div>
                          <div className="text-sm text-amber-700 leading-relaxed">{job.specialInstructions}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Release Code / Model Pin */}
                  {(job.releaseCode || job.modelPin) && (
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Key className="h-4 w-4 text-white" />
                        </div>
                        <div className="space-y-2">
                          <div className="font-semibold text-purple-800">Security Information</div>
                          {job.releaseCode && (
                            <div className="text-sm text-purple-700 bg-white px-3 py-2 rounded-lg">
                              <span className="font-medium">Release Code:</span> <span className="text-base">{job.releaseCode}</span>
                            </div>
                          )}
                          {job.modelPin && (
                            <div className="text-sm text-purple-700 bg-white px-3 py-2 rounded-lg">
                              <span className="font-medium">Model PIN:</span> <span className="text-base">{job.modelPin}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {(job.status === 'assigned' || job.status === 'collected') && (
                    <Button 
                      onClick={() => handleStartJob(job)}
                      className="w-full bg-[#00ABE7] hover:bg-[#0096d1] text-white h-12 font-semibold"
                    >
                      {job.status === 'assigned' ? 'Start Collection' : 'Start Delivery'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Assigned</h3>
            <p className="text-gray-600">New jobs will appear here when assigned to you</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}