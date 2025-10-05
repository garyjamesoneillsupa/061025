import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Car, AlertCircle, PoundSterling, Users, CreditCard, AlertTriangle, FileText, CheckCircle, Truck, Calendar, Target, Activity } from "lucide-react";
import { Link } from "wouter";

export default function ProfessionalAdminDashboard() {
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
    pendingExpenseCount?: number;
    pendingExpenseAmount?: number;
    approvedExpenseAmount?: number;
    customerChargeableAmount?: number;
    weeklyProfit?: number;
    weeklyMovementRevenue?: number;
    weeklyNonFuelExpenses?: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers, isLoading: isCustomersLoading } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers, isLoading: isDriversLoading } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  if (isStatsLoading || isJobsLoading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Calculate today's metrics
  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs?.filter(job => job.createdAt?.startsWith(today)) || [];
  const todayRevenue = todayJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);

  // Calculate this week's metrics
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= startOfWeek;
  }) || [];
  
  const weekRevenue = weekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);

  // Calculate pending/urgent items
  const urgentJobs = jobs?.filter(job => 
    job.status === 'pending' || 
    (job.status === 'active' && !job.driver)
  ) || [];

  const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
  const activeJobs = jobs?.filter(job => job.status === 'active') || [];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Operations Dashboard</h1>
          <p className="text-slate-600">OVM Management System</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Today's Revenue */}
          <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Today's Revenue</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    £{todayRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{todayJobs.length} jobs today</p>
                </div>
                <div className="h-12 w-12 bg-[#00ABE7]/10 rounded-lg flex items-center justify-center">
                  <PoundSterling className="h-6 w-6 text-[#00ABE7]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week's Revenue */}
          <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">This Week</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    £{weekRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{weekJobs.length} jobs this week</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Jobs */}
          <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Active Jobs</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {activeJobs.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">in progress</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Items */}
          <Card className="bg-white border border-slate-200 hover:border-slate-300 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Urgent Items</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {urgentJobs.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">require attention</p>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operations Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Quick Actions */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/jobs/new">
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#00ABE7] hover:bg-[#00ABE7]/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#00ABE7]/10 rounded-md flex items-center justify-center">
                      <Car className="h-4 w-4 text-[#00ABE7]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Create New Job</p>
                      <p className="text-xs text-slate-500">Add new transport request</p>
                    </div>
                  </div>
                </button>
              </Link>
              
              <Link href="/admin/customers/new">
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#00ABE7] hover:bg-[#00ABE7]/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#00ABE7]/10 rounded-md flex items-center justify-center">
                      <Users className="h-4 w-4 text-[#00ABE7]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Add Customer</p>
                      <p className="text-xs text-slate-500">Register new client</p>
                    </div>
                  </div>
                </button>
              </Link>
              
              <Link href="/admin/invoices">
                <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-[#00ABE7] hover:bg-[#00ABE7]/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#00ABE7]/10 rounded-md flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#00ABE7]" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Generate Invoice</p>
                      <p className="text-xs text-slate-500">Create billing documents</p>
                    </div>
                  </div>
                </button>
              </Link>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Database</span>
                </div>
                <span className="text-sm font-medium text-green-600">Online</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Email Service</span>
                </div>
                <span className="text-sm font-medium text-green-600">Active</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Backup System</span>
                </div>
                <span className="text-sm font-medium text-green-600">Running</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Total Customers</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{customers?.length || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Active Drivers</span>
                </div>
                <span className="text-sm font-medium text-slate-900">{drivers?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {jobs?.slice(0, 5).map((job, index) => (
                <div key={job.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50">
                  <div className={`h-2 w-2 rounded-full ${
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'active' ? 'bg-blue-500' :
                    job.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      Job {job.jobNumber}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {job.vehicle?.registration} • {job.customer?.name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-700' :
                    job.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    job.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Revenue Breakdown */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Completed Jobs Revenue</span>
                <span className="text-sm font-semibold text-slate-900">
                  £{completedJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Outstanding Invoices</span>
                <span className="text-sm font-semibold text-amber-600">
                  £{stats?.outstandingRevenue?.toFixed(2) || '0'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600">Uninvoiced Jobs</span>
                <span className="text-sm font-semibold text-blue-600">
                  {stats?.uninvoicedJobs || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-600">Total Jobs Completed</span>
                <span className="text-sm font-semibold text-green-600">
                  {completedJobs.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Top Customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.topCustomers?.slice(0, 5).map((customer, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-100 rounded-md flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-600">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">{customer.jobCount} jobs</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    £{customer.revenue.toFixed(2)}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-slate-500 text-center py-4">No customer data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}