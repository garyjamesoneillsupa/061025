import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { 
  ArrowRight, 
  LogOut, 
  User, 
  Wifi, 
  WifiOff, 
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Package,
  AlertCircle,
  TrendingUp,
  Calendar,
  Navigation,
  Truck,
  FileText,
  DollarSign,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Driver } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

interface DriverSession {
  driver: Driver;
  message: string;
}

interface JobWithDetails extends Partial<Job> {
  id: string;
  jobNumber: string;
  status: string;
  createdAt: Date | null;
  customer?: any;
  vehicle?: any;
  collectionAddress?: any;
  deliveryAddress?: any;
  assignedDriverId?: string | null;
  collectedAt?: Date | null;
  deliveredAt?: Date | null;
  driverPrice?: number | null;
}

export default function DriverDashboardEnhanced() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed' | 'upcoming'>('active');
  
  // Connection monitoring
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing data...",
        className: "bg-green-50 border-green-200"
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Working Offline",
        description: "You can continue working. Changes will sync when reconnected.",
        className: "bg-amber-50 border-amber-200"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Check driver session
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
      
      // Extend session
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

  // Fetch driver's jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithDetails[]>({
    queryKey: ["/api/drivers", driverSession?.driver?.id, "jobs"],
    enabled: !!driverSession?.driver?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Categorize jobs
  const activeJobs = jobs.filter(job => 
    ['assigned', 'collected'].includes(job.status)
  );
  
  const upcomingJobs = jobs.filter(job => 
    job.status === 'created' && job.assignedDriverId === driverSession?.driver?.id
  );
  
  const completedJobs = jobs.filter(job => 
    ['delivered', 'invoiced', 'paid'].includes(job.status)
  );

  // Calculate statistics
  const todaysJobs = jobs.filter(job => {
    const jobDate = job.collectedAt ? new Date(job.collectedAt) : 
                  job.createdAt ? new Date(job.createdAt) : new Date();
    const today = new Date();
    return jobDate.toDateString() === today.toDateString();
  });

  const weeklyEarnings = completedJobs
    .filter(job => {
      const deliveryDate = job.deliveredAt ? new Date(job.deliveredAt) :
                          job.createdAt ? new Date(job.createdAt) : new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return deliveryDate >= weekAgo;
    })
    .reduce((sum, job) => sum + (job.driverPrice || 0), 0);

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    window.dispatchEvent(new CustomEvent('driverLogout'));
    navigate("/drivers");
  };

  const handleJobAction = (job: JobWithDetails) => {
    if (job.status === 'assigned') {
      navigate(`/driver/collection/${job.jobNumber}`);
    } else if (job.status === 'collected') {
      navigate(`/driver/delivery/${job.jobNumber}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Package className="h-4 w-4" />;
      case 'collected':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'invoiced':
        return <FileText className="h-4 w-4" />;
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'collected':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invoiced':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
        return 'bg-gray-900 text-white';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionButton = (job: JobWithDetails) => {
    if (job.status === 'assigned') {
      return (
        <Button 
          onClick={() => handleJobAction(job)}
          className="btn-primary"
        >
          Start Collection
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (job.status === 'collected') {
      return (
        <Button 
          onClick={() => handleJobAction(job)}
          className="btn-success"
        >
          Start Delivery
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }
    return null;
  };

  if (!driverSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-center text-muted-foreground">Loading session...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Driver Portal
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {driverSession.driver.name}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                isOnline 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Offline</span>
                  </>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Jobs</p>
                  <p className="text-2xl font-bold">{todaysJobs.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold">{activeJobs.length}</p>
                </div>
                <Package className="h-8 w-8 text-amber-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completedJobs.length}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Earnings</p>
                  <p className="text-2xl font-bold">£{weeklyEarnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex">
              <button
                onClick={() => setSelectedTab('active')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'active'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active ({activeJobs.length})
              </button>
              <button
                onClick={() => setSelectedTab('upcoming')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'upcoming'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Upcoming ({upcomingJobs.length})
              </button>
              <button
                onClick={() => setSelectedTab('completed')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  selectedTab === 'completed'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed ({completedJobs.length})
              </button>
            </div>
          </div>

          <div className="p-4">
            {jobsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {selectedTab === 'active' && (
                  activeJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No active jobs at the moment</p>
                    </div>
                  ) : (
                    activeJobs.map(job => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(job.status)}>
                                  {getStatusIcon(job.status)}
                                  <span className="ml-1 capitalize">{job.status}</span>
                                </Badge>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  #{job.jobNumber}
                                </span>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Collection:</span>
                                  <span className="text-muted-foreground">
                                    {job.collectionAddress?.postcode ? job.collectionAddress.postcode : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">Delivery:</span>
                                  <span className="text-muted-foreground">
                                    {job.deliveryAddress?.postcode ? job.deliveryAddress.postcode : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {job.vehicle && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium">
                                    {job.vehicle.make} {job.vehicle.model}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {job.vehicle.registration}
                                  </Badge>
                                </div>
                              )}

                              {job.customer && (
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span>{job.customer.name}</span>
                                  {job.customer.phone && (
                                    <>
                                      <Phone className="h-3.5 w-3.5 text-muted-foreground ml-2" />
                                      <span>{job.customer.phone}</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="ml-4">
                              {getActionButton(job)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                )}

                {selectedTab === 'upcoming' && (
                  upcomingJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming jobs scheduled</p>
                    </div>
                  ) : (
                    upcomingJobs.map(job => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow opacity-75">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  Scheduled
                                </Badge>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  #{job.jobNumber}
                                </span>
                              </div>
                              
                              {job.collectedAt && (
                                <div className="text-sm text-muted-foreground">
                                  Collection: {format(new Date(job.collectedAt), 'PPP')}
                                </div>
                              )}
                              
                              <div className="text-sm">
                                {job.collectionAddress?.postcode ? job.collectionAddress.postcode : 'N/A'} → {job.deliveryAddress?.postcode ? job.deliveryAddress.postcode : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                )}

                {selectedTab === 'completed' && (
                  completedJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed jobs yet</p>
                    </div>
                  ) : (
                    completedJobs.slice(0, 10).map(job => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(job.status)}>
                                  {getStatusIcon(job.status)}
                                  <span className="ml-1 capitalize">{job.status}</span>
                                </Badge>
                                <span className="text-sm font-semibold text-muted-foreground">
                                  #{job.jobNumber}
                                </span>
                              </div>
                              
                              <div className="text-sm text-muted-foreground">
                                {job.collectionAddress?.postcode ? job.collectionAddress.postcode : 'N/A'} → {job.deliveryAddress?.postcode ? job.deliveryAddress.postcode : 'N/A'}
                              </div>
                              
                              {job.deliveredAt && (
                                <div className="text-sm text-muted-foreground">
                                  Delivered: {formatDistanceToNow(new Date(job.deliveredAt), { addSuffix: true })}
                                </div>
                              )}
                            </div>
                            
                            {job.driverPrice && (
                              <div className="text-right">
                                <p className="text-lg font-semibold">£{job.driverPrice.toFixed(2)}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => navigate('/driver/expenses')}
          >
            <FileText className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Submit Expenses</p>
              <p className="text-xs text-muted-foreground">Track your business expenses</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => window.location.href = 'tel:+442081234567'}
          >
            <Phone className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">Call Support</p>
              <p className="text-xs text-muted-foreground">24/7 driver assistance</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 justify-start"
            onClick={() => toast({ title: "Coming Soon", description: "Performance metrics will be available soon" })}
          >
            <Activity className="h-5 w-5 mr-3 text-primary" />
            <div className="text-left">
              <p className="font-semibold">View Performance</p>
              <p className="text-xs text-muted-foreground">Check your stats</p>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}