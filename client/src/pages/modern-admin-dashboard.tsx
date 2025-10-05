import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  TrendingUp, Clock, Users, FileText, Plus, 
  Building2, Package, Calendar, BarChart3,
  ArrowUpRight, ArrowDownRight, Activity,
  PoundSterling, Car, AlertTriangle, CheckCircle, X
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import EnhancedJobCreationForm from "@/components/job/enhanced-job-creation-form";

export default function ModernAdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showJobCreation, setShowJobCreation] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  const { data: stats, isLoading: isStatsLoading } = useQuery<{
    jobsInProgress: number;
    revenueThisWeek: number;
    uninvoicedJobs: number;
    totalCompletedJobs: number;
    unassignedJobs: number;
    statusCounts: Record<string, number>;
    topCustomers: Array<{ name: string; jobCount: number; revenue: number }>;
    outstandingRevenue: number;
    unpaidInvoices: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 30000,
    staleTime: 0, // Always refetch to avoid cache issues
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  if (isStatsLoading || isJobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-white rounded-lg shadow"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= startOfWeek;
  }) || [];
  const weekRevenue = weekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  const activeJobs = jobs?.filter(job => job.status === 'active') || [];
  const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
  
  // Calculate week over week growth
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= lastWeekStart && jobDate < startOfWeek;
  }) || [];
  const lastWeekRevenue = lastWeekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  const revenueGrowth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <Button 
              className="bg-[#00ABE7] hover:bg-[#0099d3] text-white"
              onClick={() => setShowJobCreation(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Job
            </Button>
          </div>
        </div>

        {/* Key Metrics - Clean Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <PoundSterling className="h-5 w-5 text-green-600" />
                </div>
                {revenueGrowth > 0 && (
                  <span className="flex items-center text-xs text-green-600 font-medium">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {revenueGrowth.toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold text-gray-900">£{weekRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Weekly Revenue</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Car className="h-5 w-5 text-blue-600" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {activeJobs.length} active
                </Badge>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{(jobs || []).length}</p>
              <p className="text-sm text-gray-500 mt-1">Total Jobs</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                {(stats?.uninvoicedJobs || 0) > 0 && (
                  <span className="flex items-center text-xs text-amber-600 font-medium">
                    {stats?.uninvoicedJobs} pending
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold text-gray-900">£{(stats?.outstandingRevenue || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Outstanding</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{customers?.length || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Total Customers</p>
            </CardContent>
          </Card>
        </div>


        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Jobs */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Recent Jobs</CardTitle>
              <Link href="/admin/jobs">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs?.slice(0, 5).map((job) => (
                  <Link key={job.id} href={`/admin/jobs/${job.jobNumber}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          job.status === 'created' ? 'bg-gray-500' :
                          job.status === 'assigned' ? 'bg-pink-500' :
                          job.status === 'collected' ? 'bg-amber-500' :
                          job.status === 'delivered' ? 'bg-green-500' :
                          job.status === 'invoiced' ? 'bg-blue-500' :
                          job.status === 'paid' ? 'bg-black' :
                          job.status === 'aborted' ? 'bg-red-600' :
                          job.status === 'cancelled' ? 'bg-orange-600' :
                          'bg-gray-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{job.jobNumber}</p>
                          <p className="text-xs text-gray-500">{job.customer?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">£{parseFloat(job.totalMovementFee || '0').toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{job.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-medium text-gray-900">Top Customers</CardTitle>
              <Link href="/admin/customers">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.topCustomers?.slice(0, 5).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.jobCount} jobs</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">£{customer.revenue.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Job Creation Modal - Perfectly Centered */}
      {showJobCreation && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJobCreation(false);
            }
          }}
          onScroll={() => {
            // Auto-snap to center on scroll
            setTimeout(() => {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
              });
            }, 100);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ 
              position: 'fixed',
              top: '50vh',
              left: '50vw',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 2rem)', 
              maxWidth: 'calc(1280px - 4rem)',
              height: 'min(85vh, calc(100vh - 80px))',
              zIndex: 60
            }}
          >
            {/* Beautiful Header */}
            <div className="bg-gradient-to-r from-[#00ABE7] to-cyan-500 px-6 py-4 text-white relative flex-shrink-0">
              <button
                onClick={() => setShowJobCreation(false)}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Job</h2>
                  <p className="text-cyan-50 mt-1">Fill in the details to create a new transport job</p>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <EnhancedJobCreationForm onClose={() => setShowJobCreation(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}