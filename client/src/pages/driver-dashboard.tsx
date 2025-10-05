import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, LogOut, User, ChevronLeft, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Driver } from "@shared/schema";
import { format } from "date-fns";
// Removed PendingUploadStatus to fix driver dashboard loading issues

interface DriverSession {
  driver: Driver;
  message: string;
}

export default function DriverDashboardRedesigned() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);
  
  // Initialize background sync for internet monitoring every 5 seconds
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingJobs, setPendingJobs] = useState<string[]>([]);
  const [uploadingJobs, setUploadingJobs] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'failed'>('idle');
  
  // Simple connection monitoring to avoid complex offline manager issues
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for driver session on mount
  useEffect(() => {
    const session = localStorage.getItem("driverSession");
    const sessionExpiry = localStorage.getItem("driverSessionExpiry");
    
    if (!session || !sessionExpiry) {
      navigate("/drivers");
      return;
    }
    
    const expiryDate = new Date(sessionExpiry);
    const now = new Date();
    
    if (now > expiryDate) {
      localStorage.removeItem("driverSession");
      localStorage.removeItem("driverSessionExpiry");
      navigate("/drivers");
      return;
    }
    
    try {
      const parsedSession = JSON.parse(session) as DriverSession;
      setDriverSession(parsedSession);
      
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);
      localStorage.setItem("driverSessionExpiry", newExpiry.toISOString());
    } catch (error) {
      console.error("Invalid session data:", error);
      localStorage.removeItem("driverSession");
      localStorage.removeItem("driverSessionExpiry");
      navigate("/drivers");
    }
  }, [navigate]);

  // Fetch driver's assigned jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery<(Job & { customer?: any; vehicle?: any })[]>({
    queryKey: ["/api/drivers", driverSession?.driver?.id, "jobs"],
    enabled: !!driverSession?.driver?.id,
  });

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    
    // Dispatch custom event to trigger auth refresh
    window.dispatchEvent(new CustomEvent('driverLogout'));
    
    navigate("/drivers");
  };

  const clearCompletedJobs = () => {
    // This would typically call an API to mark completed jobs as cleared
    toast({
      title: "Jobs cleared",
      description: "Completed jobs have been cleared from your view.",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/drivers", driverSession?.driver?.id, "jobs"] });
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "border-l-gray-500";
      case "assigned":
        return "border-l-pink-500"; // Pink for assigned (matches admin panel)
      case "collected":
        return "border-l-amber-500"; // Amber for collected (matches admin panel)
      case "delivered":
        return "border-l-green-500"; // Green for delivered (matches admin panel)
      case "invoiced":
        return "border-l-blue-500"; // Blue for invoiced (matches admin panel)
      case "paid":
        return "border-l-black"; // Black for paid (matches admin panel)
      default:
        return "border-l-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "created":
        return (
          <Badge className="bg-gray-500 text-white border-0 px-3 py-1 text-xs font-medium">
            Created
          </Badge>
        );
      case "assigned":
        return (
          <Badge className="bg-pink-500 text-white border-0 px-3 py-1 text-xs font-medium">
            Assigned
          </Badge>
        );
      case "collected":
        return (
          <Badge className="bg-amber-500 text-white border-0 px-3 py-1 text-xs font-medium">
            Collected
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-xs font-medium">
            Delivered
          </Badge>
        );
      case "invoiced":
        return (
          <Badge className="bg-blue-500 text-white border-0 px-3 py-1 text-xs font-medium">
            Invoiced
          </Badge>
        );
      case "paid":
        return (
          <Badge className="bg-black text-white border-0 px-3 py-1 text-xs font-medium">
            Paid
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return "TBC";
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return format(date, "dd/MM/yy");
    } catch {
      return "TBC";
    }
  };

  const handleJobClick = (job: Job) => {
    // Check if this job is pending upload (offline submission)
    const isPendingUpload = pendingJobs.includes(job.id) || uploadingJobs.includes(job.id);
    
    if (isPendingUpload) {
      toast({
        title: "Job Pending Upload",
        description: uploadingJobs.includes(job.id) ? "This job is currently uploading..." : "This job will upload when connection resumes.",
      });
      return;
    }
    
    // Navigate to the appropriate process based on job status using clean job number
    if (job.status === "assigned") {
      navigate(`/drivers/jobs/${job.jobNumber}/collection`);
    } else if (job.status === "collected") {
      navigate(`/drivers/jobs/${job.jobNumber}/delivery`);
    }
  };

  // Filter active jobs
  const activeJobs = jobs?.filter(job => 
    job.status === 'assigned' || job.status === 'collected'
  ) || [];

  if (!driverSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Simple Online Status */}
      {!isOnline && (
        <div className="bg-orange-500 text-white text-center py-2 text-sm font-medium">
          <WifiOff className="inline h-4 w-4 mr-2" />
          Offline Mode - Changes will be saved locally
        </div>
      )}

      {/* Header with Perfect Vertical Centering */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-gray-900 mb-1.5">
                {driverSession.driver.name}
              </h1>
              {/* Enhanced Connection Status */}
              <div className={`inline-flex items-center space-x-1 rounded-full text-xs font-medium transition-all ${
                !isOnline 
                  ? 'bg-red-100 text-red-700 border border-red-200 px-3 py-1' 
                  : syncStatus === 'syncing'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1'
                  : syncStatus === 'completed'
                  ? 'bg-green-100 text-green-700 border border-green-200 px-3 py-1'
                  : 'bg-green-100 text-green-700 border border-green-200 px-2 py-1'
              }`}>
                {!isOnline ? (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline Mode</span>
                  </>
                ) : syncStatus === 'syncing' ? (
                  <>
                    <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : syncStatus === 'completed' ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>All Synced</span>
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3" />
                    <span>Online</span>
                  </>
                )}
                {(pendingJobs.length > 0 || uploadingJobs.length > 0) && (
                  <span className="bg-cyan-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                    {uploadingJobs.length > 0 ? uploadingJobs.length : pendingJobs.length}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="p-4 space-y-3">
        {jobsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))}
          </div>
        ) : activeJobs.length === 0 ? (
          <Card className="p-8 text-center bg-white">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Jobs</h3>
            <p className="text-gray-600">You don't have any jobs assigned at the moment.</p>
          </Card>
        ) : (
          activeJobs.map((job) => {
            const isPendingUpload = pendingJobs.includes(job.id);
            const isUploading = uploadingJobs.includes(job.id);
            
            return (
              <Card
                key={job.id}
                className={`shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  isPendingUpload || isUploading 
                    ? 'bg-amber-50 border-l-4 border-l-amber-500' 
                    : `bg-white border-l-4 ${getJobStatusColor(job.status || 'created')}`
                }`}
                onClick={() => handleJobClick(job)}
              >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-3">
                    <div className="mb-1">
                      <span className="font-semibold text-gray-900">
                        Job: {job.jobNumber}
                        {job.vehicle && (
                          <span className="text-gray-600">
                            {' '}({job.vehicle.registration} - {job.vehicle.make})
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {job.status === 'assigned' ? (
                        <>
                          <div>
                            <span className="font-medium">Collection Date:</span>
                            <span> {formatDate(job.requestedCollectionDate)}</span>
                          </div>
                          {job.collectionAddress && (
                            <div>
                              <span className="font-medium">From:</span>
                              <span> {job.collectionAddress.line1}</span>
                            </div>
                          )}
                          {job.collectionContact?.notes && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-1">
                              <span className="font-medium text-blue-900">Note: </span>
                              <span className="text-blue-800">{job.collectionContact.notes}</span>
                            </div>
                          )}
                        </>
                      ) : job.status === 'collected' ? (
                        <>
                          <div>
                            <span className="font-medium">Delivery Date:</span>
                            <span> {formatDate(job.requestedDeliveryDate)}</span>
                          </div>
                          {job.deliveryAddress && (
                            <div>
                              <span className="font-medium">To:</span>
                              <span> {job.deliveryAddress.line1}</span>
                            </div>
                          )}
                          {job.deliveryContact?.notes && (
                            <div className="bg-green-50 border border-green-200 rounded p-2 mt-1">
                              <span className="font-medium text-green-900">Note: </span>
                              <span className="text-green-800">{job.deliveryContact.notes}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="font-medium">Collecting:</span>
                            <span> {formatDate(job.requestedCollectionDate)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Delivering:</span>
                            <span> {formatDate(job.requestedDeliveryDate)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJobClick(job);
                    }}
                  >
                    <ArrowRight className="h-5 w-5 text-gray-600" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    {(isPendingUpload || isUploading) ? (
                      <Badge className="bg-amber-500 text-white border-0 px-3 py-1 text-xs font-medium">
                        {isUploading ? (
                          <div className="flex items-center space-x-1">
                            <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          'Pending Upload...'
                        )}
                      </Badge>
                    ) : (
                      getStatusBadge(job.status || 'created')
                    )}
                  </div>
                  
                  {(isPendingUpload || isUploading) && (
                    <div className="text-xs text-amber-600 font-medium">
                      {isUploading ? 'Uploading to system' : 'Saved offline'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}