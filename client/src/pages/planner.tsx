import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Car, 
  MapPin, 
  Clock,
  User,
  Truck,
  Search,
  Filter,
  X,
  Undo2,
  Redo2,
  UserX
} from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, isAfter, isBefore } from "date-fns";
import { getStatusBgColor } from "@shared/status-utils";
import type { Job, Driver, DriverAvailability } from "@shared/schema";

interface DraggedJob {
  job: Job;
  mouseX: number;
  mouseY: number;
  sourceDriverId?: string;
  sourceDate?: Date;
}

interface PlannerAction {
  type: 'assign' | 'move' | 'unassign';
  jobId: string;
  fromDriverId?: string;
  toDriverId?: string;
  fromDate?: Date;
  toDate?: Date;
  timestamp: number;
}

export default function Planner() {
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [draggedJob, setDraggedJob] = useState<DraggedJob | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ driverId: string; date: Date } | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  
  // Undo/Redo functionality
  const [actionHistory, setActionHistory] = useState<PlannerAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Check if driver is unavailable on a specific date
  const isDriverUnavailable = (driverId: string, date: Date): boolean => {
    return driverAvailability.some((availability) => {
      if (availability.driverId !== driverId) return false;
      const startDate = typeof availability.startDate === 'string' ? parseISO(availability.startDate) : availability.startDate;
      const endDate = typeof availability.endDate === 'string' ? parseISO(availability.endDate) : availability.endDate;
      return !isBefore(date, startDate) && !isAfter(date, endDate);
    });
  };

  // Check if driver is unavailable for a job (checks both collection and delivery dates)
  const isDriverUnavailableForJob = (driverId: string, job: Job): { unavailable: boolean; reason?: string } => {
    console.log('🔍 CRITICAL AVAILABILITY CHECK:', {
      driverId,
      jobId: job.id,
      jobNumber: job.jobNumber,
      collectionDate: job.requestedCollectionDate,
      deliveryDate: job.requestedDeliveryDate,
      driverAvailabilityCount: driverAvailability.length,
      availabilityPeriods: driverAvailability.filter(a => a.driverId === driverId)
    });

    // ALWAYS check - even without dates, we should validate
    if (!job.requestedCollectionDate && !job.requestedDeliveryDate) {
      console.log('⚠️ No collection or delivery dates found for job');
      return { unavailable: false };
    }

    const unavailablePeriods = driverAvailability.filter(availability => availability.driverId === driverId);
    console.log('📊 Driver unavailable periods found:', unavailablePeriods.length);
    
    if (unavailablePeriods.length === 0) {
      console.log('✅ No unavailability periods found for driver');
      return { unavailable: false };
    }
    
    for (const availability of unavailablePeriods) {
      const startDate = typeof availability.startDate === 'string' ? parseISO(availability.startDate) : availability.startDate;
      const endDate = typeof availability.endDate === 'string' ? parseISO(availability.endDate) : availability.endDate;
      
      console.log('🔎 Checking availability period:', {
        reason: availability.reason,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      // Check collection date - use date-only comparison to avoid timezone issues
      if (job.requestedCollectionDate) {
        const collectionDate = new Date(job.requestedCollectionDate);
        // Use date-only comparison by comparing YYYY-MM-DD strings
        const collectionDateStr = format(collectionDate, 'yyyy-MM-dd');
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        const collectionInPeriod = collectionDateStr >= startDateStr && collectionDateStr <= endDateStr;
        
        console.log('📅 Collection date check (DATE-ONLY):', {
          collectionDateStr,
          startDateStr,
          endDateStr,
          isInUnavailablePeriod: collectionInPeriod
        });
        
        if (collectionInPeriod) {
          console.log('🚫 BLOCKING: Collection date conflicts with unavailability');
          return { 
            unavailable: true, 
            reason: `Driver unavailable on collection date (${format(collectionDate, 'dd MMM')}): ${availability.reason || 'Off duty'}` 
          };
        }
      }
      
      // Check delivery date - use date-only comparison to avoid timezone issues
      if (job.requestedDeliveryDate) {
        const deliveryDate = new Date(job.requestedDeliveryDate);
        // Use date-only comparison by comparing YYYY-MM-DD strings
        const deliveryDateStr = format(deliveryDate, 'yyyy-MM-dd');
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');
        const deliveryInPeriod = deliveryDateStr >= startDateStr && deliveryDateStr <= endDateStr;
        
        console.log('📅 Delivery date check (DATE-ONLY):', {
          deliveryDateStr,
          startDateStr,
          endDateStr,
          isInUnavailablePeriod: deliveryInPeriod
        });
        
        if (deliveryInPeriod) {
          console.log('🚫 BLOCKING: Delivery date conflicts with unavailability');
          return { 
            unavailable: true, 
            reason: `Driver unavailable on delivery date (${format(deliveryDate, 'dd MMM')}): ${availability.reason || 'Off duty'}` 
          };
        }
      }
    }
    
    console.log('✅ No conflicts found - assignment allowed');
    return { unavailable: false };
  };

  // Get unavailability reason for a driver on a specific date
  const getUnavailabilityReason = (driverId: string, date: Date): string | null => {
    const unavailable = driverAvailability.find((availability) => {
      if (availability.driverId !== driverId) return false;
      const startDate = typeof availability.startDate === 'string' ? parseISO(availability.startDate) : availability.startDate;
      const endDate = typeof availability.endDate === 'string' ? parseISO(availability.endDate) : availability.endDate;
      return !isBefore(date, startDate) && !isAfter(date, endDate);
    });
    return unavailable?.reason || null;
  };

  // Get all jobs and drivers
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Fetch driver availability
  const { data: driverAvailability = [] } = useQuery<DriverAvailability[]>({
    queryKey: ["/api/driver-availability"],
  });

  // Unassign jobs mutation for automatic reassignment
  const unassignJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to unassign job');
      }
      return response.json();
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  // Check for jobs that need automatic reassignment due to driver unavailability
  useEffect(() => {
    if (!jobs || !driverAvailability.length) return;

    const jobsToReassign: string[] = [];

    jobs.forEach(job => {
      if (!job.driverId || ['delivered', 'invoiced', 'paid', 'aborted', 'cancelled'].includes(job.status)) {
        return; // Skip unassigned jobs and completed jobs
      }

      const driverCheck = isDriverUnavailableForJob(job.driverId, job);
      if (driverCheck.unavailable) {
        console.log('🔄 AUTO-REASSIGNMENT TRIGGERED:', {
          jobId: job.id,
          jobNumber: job.jobNumber,
          driverId: job.driverId,
          reason: driverCheck.reason
        });
        jobsToReassign.push(job.id);
      }
    });

    // Batch unassign jobs that conflict with driver availability
    if (jobsToReassign.length > 0) {
      console.log('🔄 BATCH AUTO-REASSIGNMENT:', jobsToReassign);
      jobsToReassign.forEach(jobId => {
        unassignJobMutation.mutate(jobId);
      });
    }
  }, [jobs, driverAvailability]);

  // Assignment mutation with critical logging
  const assignJobMutation = useMutation({
    mutationFn: async ({ jobId, driverId, scheduledDate }: { 
      jobId: string; 
      driverId: string; 
      scheduledDate: string;
    }) => {
      console.log('🔥 MUTATION FUNCTION CALLED:', { jobId, driverId, scheduledDate });
      console.trace('🔍 MUTATION CALL STACK');
      const response = await fetch(`/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ driverId, scheduledDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign job');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      toast({
        title: "❌ Assignment Failed",
        description: error.message || "Failed to assign job to driver",
        variant: "destructive",
      });
    },
  });

  // Get week days (Monday-Friday only)
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(currentWeek, i));

  // Enhanced filtering with search and filters - show Created, Assigned, Collected, Delivered statuses
  const filteredJobs = jobs?.filter(job => {
    // Show active jobs and delivered jobs for better company movement overview
    if (!['created', 'assigned', 'collected', 'delivered'].includes(job.status)) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesJobNumber = job.jobNumber?.toLowerCase().includes(searchLower);
      const matchesCustomer = (job as any).customer?.name?.toLowerCase().includes(searchLower);
      const matchesVehicle = (job as any).vehicle?.registration?.toLowerCase().includes(searchLower);
      const matchesPostcode = job.collectionAddress.postcode?.toLowerCase().includes(searchLower) ||
                            job.deliveryAddress.postcode?.toLowerCase().includes(searchLower);
      
      if (!matchesJobNumber && !matchesCustomer && !matchesVehicle && !matchesPostcode) {
        return false;
      }
    }
    
    // Status filter
    if (statusFilter !== "all" && job.status !== statusFilter) {
      return false;
    }
    
    // Customer filter
    if (customerFilter !== "all" && (job as any).customer?.id !== customerFilter) {
      return false;
    }
    
    return true;
  }) || [];

  const unassignedJobs = filteredJobs.filter(job => 
    job.status === 'created' || (job.status === 'assigned' && !job.driverId)
  );

  const assignedJobs = filteredJobs.filter(job => 
    job.driverId && ['assigned', 'collected'].includes(job.status)
  );

  // Active drivers only
  const activeDrivers = drivers?.filter(driver => driver.isActive) || [];
  
  // Get unique customers for filter dropdown
  const uniqueCustomers = Array.from(new Set(
    jobs?.map(job => (job as any).customer).filter(Boolean) || []
  )).reduce((acc: any[], customer: any) => {
    if (!acc.find((c: any) => c.id === customer.id)) acc.push(customer);
    return acc;
  }, [] as any[]);



  // Undo/Redo handlers
  const handleUndo = () => {
    if (historyIndex >= 0) {
      const action = actionHistory[historyIndex];
      
      // Reverse the last action
      if (action.type === 'assign' && action.toDriverId) {
        // Unassign the job by using unassign endpoint
        fetch(`/api/jobs/${action.jobId}/unassign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        });
      } else if (action.type === 'move' && action.fromDriverId && action.toDriverId) {
        // Move job back to original driver and date
        const scheduledDate = action.fromDate ? format(action.fromDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        console.log('🔄 UNDO TRIGGERED ASSIGNMENT');
        assignJobMutation.mutate({
          jobId: action.jobId,
          driverId: action.fromDriverId,
          scheduledDate,
        });
      }
      
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < actionHistory.length - 1) {
      const action = actionHistory[historyIndex + 1];
      
      // Redo the action
      if (action.toDriverId) {
        const scheduledDate = action.toDate ? format(action.toDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        console.log('🔃 REDO TRIGGERED ASSIGNMENT');
        assignJobMutation.mutate({
          jobId: action.jobId,
          driverId: action.toDriverId,
          scheduledDate,
        });
      }
      
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Get jobs for specific driver and date (includes both collection and delivery dates)
  const getJobsForDriverAndDate = (driverId: string, date: Date) => {
    return assignedJobs.filter(job => {
      if (job.driverId !== driverId) return false;
      
      // Check if this date matches collection date or delivery date
      const hasCollectionDate = job.requestedCollectionDate && 
        isSameDay(new Date(job.requestedCollectionDate), date);
      const hasDeliveryDate = job.requestedDeliveryDate && 
        isSameDay(new Date(job.requestedDeliveryDate), date);
      
      return hasCollectionDate || hasDeliveryDate;
    });
  };

  // Status legend using consistent colors from shared utils - show all planner statuses
  const statusLegend = [
    { status: 'created', label: 'Created', color: getStatusBgColor('created') },
    { status: 'assigned', label: 'Assigned', color: getStatusBgColor('assigned') },
    { status: 'collected', label: 'Collected', color: getStatusBgColor('collected') },
    { status: 'delivered', label: 'Delivered', color: getStatusBgColor('delivered') },
  ];

  // Calculate daily income for driver and date - only count income on collection day
  const getDailyIncome = (driverId: string, date: Date) => {
    const dayJobs = getJobsForDriverAndDate(driverId, date);
    return dayJobs.reduce((total, job) => {
      // Only count income on collection day to avoid double counting
      const isCollectionDate = job.requestedCollectionDate && 
        isSameDay(new Date(job.requestedCollectionDate), date);
      
      if (isCollectionDate) {
        const mileage = job.calculatedMileage || 0;
        const rate = 0.80; // £0.80 per mile as per system specification
        return total + (Number(mileage) * rate);
      }
      
      return total;
    }, 0);
  };

  // Enhanced drag handlers with source tracking - only allow dragging for Created and Assigned jobs
  const handleJobDragStart = (job: Job, event: React.MouseEvent, sourceDriverId?: string, sourceDate?: Date) => {
    // Prevent dragging for Collected and Delivered jobs
    if (['collected', 'delivered'].includes(job.status)) {
      event.preventDefault();
      return;
    }
    
    setDraggedJob({
      job,
      mouseX: event.clientX,
      mouseY: event.clientY,
      sourceDriverId,
      sourceDate,
    });
  };

  const handleJobDragEnd = () => {
    console.log('🔄 DRAG END - Clearing drag state only');
    setDraggedJob(null);
    setDragOverCell(null);
  };

  const handleCellDragOver = (driverId: string, date: Date, event: React.DragEvent) => {
    event.preventDefault();
    
    // Prevent dropping on unavailable drivers
    if (isDriverUnavailable(driverId, date)) {
      event.dataTransfer.dropEffect = "none";
      return;
    }
    
    event.dataTransfer.dropEffect = "move";
    setDragOverCell({ driverId, date });
  };

  const handleCellDragLeave = () => {
    setDragOverCell(null);
  };

  // Mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (draggedJob) {
        setDraggedJob(prev => prev ? {
          ...prev,
          mouseX: event.clientX,
          mouseY: event.clientY,
        } : null);
      }
    };

    const handleMouseUp = () => {
      if (draggedJob) {
        handleJobDragEnd();
      }
    };

    if (draggedJob) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedJob]);

  if (jobsLoading || driversLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Planner</h2>
          <p className="text-gray-600 mt-1">Manage driver schedules and job assignments</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Search and Filters */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Planner</h2>
              <p className="text-gray-600 mt-1">Manage driver schedules and job assignments</p>
            </div>
            
            {/* Undo/Redo Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex < 0}
                className="flex items-center space-x-1"
              >
                <Undo2 className="h-4 w-4" />
                <span>Undo</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= actionHistory.length - 1}
                className="flex items-center space-x-1"
              >
                <Redo2 className="h-4 w-4" />
                <span>Redo</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls - Card Wrapper */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job #, customer, vehicle, postcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <User className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCustomerFilter("all");
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sticky Unassigned Jobs Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Car className="mr-2 h-5 w-5 text-gray-500" />
                    Unassigned Jobs
                    <Badge variant="secondary" className="ml-2">
                      {unassignedJobs.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    className="min-h-[400px] max-h-[calc(100vh-200px)] p-4 border-2 border-dashed border-gray-200 rounded-lg m-4 transition-all duration-200 hover:border-gray-300 overflow-y-auto"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50', 'border-solid');
                    e.currentTarget.classList.remove('border-dashed');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50', 'border-solid');
                    e.currentTarget.classList.add('border-dashed');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50', 'border-solid');
                    e.currentTarget.classList.add('border-dashed');
                    if (draggedJob) {
                      // Unassign job when dropped back to unallocated
                      fetch(`/api/jobs/${draggedJob.job.id}/unassign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      }).then(() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
                        toast({
                          title: "Job Unassigned",
                          description: "Job has been moved back to unassigned pool",
                        });
                      });
                      setDraggedJob(null);
                    }
                  }}
                >
                  <div className="space-y-3">
                  {unassignedJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow bg-white hover:border-blue-300"
                      onMouseDown={(e) => handleJobDragStart(job, e)}
                      draggable
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-900">
                          #{job.jobNumber}
                        </span>
                        <Badge className={`${getStatusBgColor(job.status || 'created')} text-white text-xs`}>
                          {(job.status || 'created').replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Car className="h-3 w-3 mr-1" />
                          {(job as any).vehicle?.registration || 'No Vehicle'}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.collectionAddress.city} ({job.collectionAddress.postcode}) → {job.deliveryAddress.city} ({job.deliveryAddress.postcode})
                        </div>
                        <div className="text-xs space-y-1">
                          {job.requestedCollectionDate && (
                            <div className="flex items-center">
                              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold mr-2">Collection</span>
                              <span className="text-gray-600">{format(new Date(job.requestedCollectionDate), 'dd/MM/yy')}</span>
                            </div>
                          )}
                          {job.requestedDeliveryDate && (
                            <div className="flex items-center">
                              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold mr-2">Delivery</span>
                              <span className="text-gray-600">{format(new Date(job.requestedDeliveryDate), 'dd/MM/yy')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {unassignedJobs.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No unassigned jobs</p>
                      <p className="text-xs mt-2">Drag assigned jobs here to unassign them</p>
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    Week of {format(currentWeek, 'MMM dd, yyyy')}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Status Legend - Perfect Circles */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mr-2">Status Legend:</div>
                  {statusLegend.map((item) => (
                    <div key={item.status} className="flex items-center space-x-1">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full">
                  <div className="grid grid-cols-6 w-full" style={{ gridTemplateColumns: '180px repeat(5, minmax(0, 1fr))' }}>
                    {/* Header Row */}
                    <div className="p-3 font-medium text-gray-900 border-r border-b border-gray-200 bg-gray-50 text-sm">
                      Driver
                    </div>
                    {weekDays.map((day, dayIndex) => (
                      <div 
                        key={day.toISOString()} 
                        className={`p-3 text-center font-medium text-gray-900 border-r border-b border-gray-200 ${
                          dayIndex % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                        }`}
                      >
                        <div className="text-xs">{format(day, 'EEE')}</div>
                        <div className="text-base font-semibold">{format(day, 'd')}</div>
                      </div>
                    ))}

                    {/* Driver Rows */}
                    {activeDrivers.map((driver) => (
                      <div key={driver.id} className="contents">
                        {/* Driver Info Column */}
                        <div className="p-3 border-r border-b border-gray-200 bg-white">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-xs text-gray-900 truncate">
                                {driver.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {driver.tradePlateNumber || 'No plate'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Day Columns with Availability Toggle */}
                        {weekDays.map((day, dayIndex) => {
                          const dayJobs = getJobsForDriverAndDate(driver.id, day);
                          const dailyIncome = getDailyIncome(driver.id, day);
                          const isDropTarget = dragOverCell?.driverId === driver.id && 
                                             dragOverCell?.date && isSameDay(dragOverCell.date, day);
                          const isAvailable = !isDriverUnavailable(driver.id, day);
                          
                          return (
                            <div
                              key={`${driver.id}-${day.toISOString()}`}
                              className={`p-2 border-r border-b border-gray-200 min-h-28 relative cursor-pointer ${
                                dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              } ${isDropTarget ? 'border-2 border-blue-300 border-dashed bg-blue-50' : ''} ${
                                !isAvailable ? 'bg-red-50 opacity-75' : ''
                              } hover:bg-blue-25 transition-colors`}
                              onDragOver={(e) => handleCellDragOver(driver.id, day, e)}
                              onDragLeave={handleCellDragLeave}
                              onDrop={(e) => {
                                e.preventDefault();
                                
                                if (draggedJob) {
                                  console.log('🎯 DROP EVENT - ATTEMPTING ASSIGNMENT:', {
                                    driverName: driver.name,
                                    driverId: driver.id,
                                    dropDay: format(day, 'yyyy-MM-dd'),
                                    jobNumber: draggedJob.job.jobNumber
                                  });
                                  
                                  // Check driver availability for this job
                                  const unavailabilityCheck = isDriverUnavailableForJob(driver.id, draggedJob.job);
                                  
                                  if (unavailabilityCheck.unavailable) {
                                    toast({
                                      title: "Assignment Blocked", 
                                      description: unavailabilityCheck.reason || "Driver is unavailable for this job",
                                      variant: "destructive"
                                    });
                                    handleJobDragEnd();
                                    return;
                                  }
                                  
                                  // Proceed with assignment
                                  const scheduledDate = format(day, 'yyyy-MM-dd');
                                  
                                  // Record action for undo/redo
                                  const action: PlannerAction = {
                                    type: draggedJob.sourceDriverId ? 'move' : 'assign',
                                    jobId: draggedJob.job.id,
                                    fromDriverId: draggedJob.sourceDriverId,
                                    toDriverId: driver.id,
                                    fromDate: draggedJob.sourceDate,
                                    toDate: day,
                                    timestamp: Date.now(),
                                  };
                                  
                                  setActionHistory(prev => [...prev.slice(0, historyIndex + 1), action]);
                                  setHistoryIndex(prev => prev + 1);
                                  
                                  console.log('🚀 ASSIGNING JOB:', draggedJob.job.jobNumber, 'to', driver.name);
                                  assignJobMutation.mutate({
                                    jobId: draggedJob.job.id,
                                    driverId: driver.id,
                                    scheduledDate,
                                  });
                                }
                                
                                handleJobDragEnd();
                              }}
                              onClick={(e) => {
                                // Note: Driver availability is managed from the Drivers page
                                if (!isAvailable && e.shiftKey) {
                                  toast({
                                    title: "Driver Unavailable",
                                    description: `${driver.name} is unavailable on ${format(day, 'MMM dd')}: ${getUnavailabilityReason(driver.id, day) || 'Scheduled unavailability'}. Manage availability from the Drivers page.`,
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              {/* Driver Unavailable Indicator */}
                              {!isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-80 rounded">
                                  <div className="text-center">
                                    <UserX className="h-8 w-8 text-red-500 mx-auto mb-1" />
                                    <div className="text-xs font-bold text-red-700">UNAVAILABLE</div>
                                    <div className="text-xs text-red-600">{getUnavailabilityReason(driver.id, day) || 'Off duty'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Daily Income - Simple display with delivery handling */}
                              {isAvailable && dayJobs.length > 0 && (
                                <div className="mb-2">
                                  {dailyIncome > 0 ? (
                                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-1.5 rounded-lg text-center shadow-sm">
                                      <span className="text-xs font-bold">£{dailyIncome.toFixed(2)}</span>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-400 text-white px-2 py-1.5 rounded-lg text-center shadow-sm">
                                      <span className="text-xs font-bold">Delivery</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Jobs - Support Multiple Jobs per Driver with Enhanced Drag */}
                              {isAvailable && (
                                <div className="space-y-1">
                                  {dayJobs.map((job, jobIndex) => {
                                    const isDraggable = ['created', 'assigned'].includes(job.status);
                                    return (
                                    <div
                                      key={job.id}
                                      className={`rounded-lg p-2 text-xs shadow-sm border transition-all duration-200 ${
                                        isDraggable 
                                          ? 'border-gray-200 bg-gradient-to-r from-white to-gray-50 cursor-move hover:shadow-lg hover:border-[#00ABE7] transform hover:scale-[1.02]'
                                          : 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 cursor-default opacity-80'
                                      }`}
                                      onMouseDown={(e) => handleJobDragStart(job, e, driver.id, day)}
                                      draggable={isDraggable}
                                    >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-gray-900 text-sm">#{job.jobNumber}</span>
                                      <div className={`w-3 h-3 rounded-full ${getStatusBgColor(job.status || 'assigned')} shadow-sm`}></div>
                                    </div>
                                    
                                    {/* Vehicle Registration */}
                                    <div className="text-gray-700 font-medium text-xs truncate mb-1">
                                      <Car className="h-3 w-3 inline mr-1" />
                                      {(job as any).vehicle?.registration || 'No Vehicle'}
                                    </div>
                                    
                                    {/* Location Information - Smart display for same-day jobs */}
                                    <div className="text-xs text-gray-500 mb-2 space-y-0.5">
                                      {job.requestedCollectionDate && isSameDay(new Date(job.requestedCollectionDate), day) && (
                                        <div className="truncate">
                                          <span className="font-medium">From:</span> {job.collectionAddress.city}
                                        </div>
                                      )}
                                      {job.requestedDeliveryDate && isSameDay(new Date(job.requestedDeliveryDate), day) && (
                                        <div className="truncate">
                                          <span className="font-medium">To:</span> {job.deliveryAddress.city}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Customer */}
                                    <div className="text-gray-500 text-xs truncate mb-1">
                                      {(job as any).customer?.name || 'No Customer'}
                                    </div>
                                    
                                    {/* Action type indicators - smart logic for same-day jobs */}
                                    <div className="mb-1 space-y-1">
                                      {job.requestedCollectionDate && isSameDay(new Date(job.requestedCollectionDate), day) && (
                                        <div className="inline-flex items-center">
                                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">Collection</span>
                                        </div>
                                      )}
                                      {job.requestedDeliveryDate && isSameDay(new Date(job.requestedDeliveryDate), day) && (
                                        <div className="inline-flex items-center">
                                          <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs font-bold">Delivery</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Mileage and fee - only show on collection day with improved format */}
                                    {job.calculatedMileage && job.requestedCollectionDate && isSameDay(new Date(job.requestedCollectionDate), day) && (
                                      <div className="bg-gray-50 px-2 py-1.5 rounded text-xs mt-1 border-t border-gray-100">
                                        <div className="text-center space-y-0.5">
                                          <div className="text-gray-600 font-medium">{Math.ceil(Number(job.calculatedMileage))} Miles</div>
                                          <div className="text-gray-900 font-bold text-sm">£{job.totalMovementFee}</div>
                                        </div>
                                      </div>
                                    )}
                                    </div>
                                    )
                                  })}
                                
                                {/* Multiple Jobs Indicator */}
                                {dayJobs.length > 1 && (
                                  <div className="text-center text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                                    {dayJobs.length} jobs scheduled
                                  </div>
                                )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dragging Job Preview */}
      {draggedJob && (
        <div
          className="fixed pointer-events-none z-50 bg-white border border-gray-300 rounded-lg p-2 shadow-lg"
          style={{
            left: draggedJob.mouseX + 10,
            top: draggedJob.mouseY - 10,
          }}
        >
          <div className="text-xs">
            <div className="font-semibold">#{draggedJob.job.jobNumber}</div>
            <div className="text-gray-600">{(draggedJob.job as any).vehicle?.registration || 'No Vehicle'}</div>
            <div className="text-gray-500">{(draggedJob.job as any).customer?.name || 'No Customer'}</div>
          </div>
        </div>
      )}
    </>
  );
}