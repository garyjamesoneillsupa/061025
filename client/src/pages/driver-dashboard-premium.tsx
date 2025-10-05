import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Wifi, 
  WifiOff, 
  LogOut,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';
// Simplified imports - using local session management
// import { useDriverSession } from '@/components/driver/use-driver-session';
// import { useConnection } from '@/components/driver/use-connection';
import type { Job } from '@shared/schema';

export function DriverDashboardPremium() {
  const [, navigate] = useLocation();
  
  // Get driver session from localStorage
  const getDriverSession = () => {
    try {
      const session = localStorage.getItem("driverSession");
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  };
  
  const driverSession = getDriverSession();
  const isOnline = navigator.onLine;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["/api/drivers/00c5693d-f184-4db2-bce4-fd45f70355ab/jobs"],
  });

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    window.dispatchEvent(new CustomEvent('driverLogout'));
    navigate('/drivers');
  };

  const handleStartJob = (job: any) => {
    if (job.status === 'assigned') {
      navigate(`/driver/collection/${job.id}`);
    } else if (job.status === 'collected') {
      navigate(`/drivers/jobs/${job.jobNumber}/delivery`);
    }
  };

  const activeJobs = (jobs as Job[]).filter((job: Job) => 
    ['assigned', 'collected'].includes(job.status)
  );

  const completedJobs = (jobs as Job[]).filter((job: Job) => job.status === 'delivered');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
      case 'collected': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm';
      case 'delivered': return 'bg-green-50 text-green-700 border border-green-200 shadow-sm';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200 shadow-sm';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Ready to Collect';
      case 'collected': return 'Ready to Deliver';
      case 'delivered': return 'Completed';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Premium Glass Header */}
      <div className="bg-white/75 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50 shadow-lg shadow-black/5">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="relative group">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 transform group-hover:scale-110 transition-all duration-300">
                  <Truck className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">
                  {driverSession?.driver?.name || 'Driver Dashboard'}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isOnline ? (
                      <>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        Connected
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Offline
                      </>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">•</div>
                  <div className="text-sm text-gray-600 font-medium">Professional Driver</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide ${isOnline ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-orange-100 text-orange-800 border border-orange-200'}`}>
                {isOnline ? (
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    ONLINE
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4" />
                    OFFLINE
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 rounded-xl p-3 transition-all duration-200 hover:scale-105"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/60 shadow-xl shadow-blue-600/10 rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-600/25">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-700 mb-1">{activeJobs.length}</div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Active Jobs</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 shadow-xl shadow-emerald-600/10 rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-600/25">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-emerald-700 mb-1">{completedJobs.length}</div>
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Completed</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/60 shadow-xl shadow-purple-600/10 rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-700 mb-1">4.9</div>
              <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Jobs Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Your Jobs
              </h2>
              <p className="text-gray-600 mt-2 text-lg">
                {activeJobs.length} active assignments • Professional transport services
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 uppercase tracking-wider font-bold">Today</div>
              <div className="text-2xl font-bold text-gray-900">{format(new Date(), 'dd MMM')}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-8">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-2xl shadow-gray-900/10 rounded-3xl">
                  <CardContent className="p-8">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <Skeleton className="h-8 w-48 mb-6" />
                    <Skeleton className="h-5 w-full mb-3" />
                    <Skeleton className="h-5 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-2xl shadow-gray-900/10 rounded-3xl">
              <CardContent className="p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
                  <Truck className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  No Jobs Available
                </h3>
                <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed">
                  Check back later for new assignments. We'll notify you when new jobs become available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8">
              {(jobs as Job[]).map((job: Job) => (
                <Card key={job.id} className="group bg-white/90 backdrop-blur-sm border border-gray-200/60 shadow-2xl shadow-gray-900/10 rounded-3xl hover:shadow-3xl hover:shadow-gray-900/15 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.01]">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-sm text-gray-500 font-semibold">
                            {job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy') : 'Today'}
                          </div>
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                          <div className="text-sm text-blue-600 font-bold">
                            #{job.jobNumber}
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                          {job.vehicleMake} {job.vehicleModel}
                        </h3>
                        {/* Apple-Quality UK Registration Plate */}
                        {job.vehicleReg && (
                          <div className="inline-flex items-center bg-gradient-to-b from-yellow-400 via-yellow-300 to-yellow-400 text-black px-5 py-3 rounded-xl text-lg font-black mb-5 border-2 border-gray-900 shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-3xl" style={{boxShadow: '0 10px 40px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 0 rgba(0,0,0,0.1)'}}>
                            <span className="tracking-[0.15em] text-xl font-black font-mono drop-shadow-sm">{job.vehicleReg}</span>
                          </div>
                        )}
                      </div>
                      <Badge className={`text-sm font-bold px-4 py-2 rounded-xl ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </Badge>
                    </div>

                    <div className="space-y-5 mb-8">
                      {/* Premium Collection Section */}
                      <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/50 rounded-2xl p-6 border border-blue-200/60 shadow-lg">
                        <div className="flex items-start gap-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/30">
                            <MapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-2">Collection Point</div>
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {job.collectionAddress || 'Address TBC'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Premium Delivery Section */}
                      <div className="bg-gradient-to-r from-emerald-50/80 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/60 shadow-lg">
                        <div className="flex items-start gap-5">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-600/30">
                            <Navigation className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2">Delivery Destination</div>
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {job.deliveryAddress || 'Address TBC'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {job.status === 'assigned' && (
                      <Button
                        onClick={() => navigate(`/driver/collection/${job.id}`)}
                        className="w-full bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold text-lg py-6 rounded-2xl shadow-2xl shadow-blue-600/30 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl hover:shadow-blue-600/40"
                      >
                        <div className="flex items-center justify-center gap-4">
                          <MapPin className="h-6 w-6" />
                          <span>Start Collection</span>
                          <ArrowRight className="h-6 w-6" />
                        </div>
                      </Button>
                    )}

                    {job.status === 'collected' && (
                      <Button
                        onClick={() => navigate(`/drivers/jobs/${job.jobNumber}/delivery`)}
                        className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-700 hover:from-emerald-700 hover:via-emerald-800 hover:to-green-800 text-white font-bold text-lg py-6 rounded-2xl shadow-2xl shadow-emerald-600/30 transform hover:scale-[1.02] transition-all duration-300 hover:shadow-3xl hover:shadow-emerald-600/40"
                      >
                        <div className="flex items-center justify-center gap-4">
                          <Navigation className="h-6 w-6" />
                          <span>Start Delivery</span>
                          <ArrowRight className="h-6 w-6" />
                        </div>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}