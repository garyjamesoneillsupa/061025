import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, Clock, Car, AlertCircle, PoundSterling, Users, 
  CreditCard, AlertTriangle, FileText, CheckCircle, Plus, 
  Building2, UserCheck, Activity, Truck, BarChart3, Package,
  Calendar, Target, RefreshCw, ArrowUp, ArrowDown, Minus
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function ConsistentAdminDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(refreshTimer);
  }, []);
  
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useQuery<{
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
    refetchInterval: 30000,
  });

  const { data: jobs, isLoading: isJobsLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 30000,
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  if (isStatsLoading || isJobsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-48 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  // Calculate metrics with enhanced data
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const todayJobs = jobs?.filter(job => job.createdAt?.startsWith(today)) || [];
  const todayRevenue = todayJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  const weekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= startOfWeek;
  }) || [];
  const weekRevenue = weekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  const activeJobs = jobs?.filter(job => job.status === 'active') || [];
  const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
  const pendingJobs = jobs?.filter(job => job.status === 'pending') || [];
  const urgentJobs = jobs?.filter(job => job.status === 'pending' && !job.driver) || [];
  const collectedJobs = jobs?.filter(job => job.status === 'collected') || [];
  const deliveredJobs = jobs?.filter(job => job.status === 'delivered') || [];
  
  const totalRevenue = completedJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  const averageJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
  
  // Calculate trends (compare to last week)
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= lastWeekStart && jobDate < startOfWeek;
  }) || [];
  const lastWeekRevenue = lastWeekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  const revenueGrowth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue * 100) : 0;
  
  // Calculate completion rate
  const totalJobs = jobs?.length || 0;
  const completionRate = totalJobs > 0 ? (completedJobs.length / totalJobs * 100) : 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header with Live Status */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Dashboard
              <Badge variant="outline" className="font-normal text-xs animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Live
              </Badge>
            </h2>
            <p className="text-gray-600 mt-1">
              {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' • '}
              {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                refetchStats();
                setRefreshKey(prev => prev + 1);
              }}
              className="hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Link href="/admin/jobs/new">
              <Button className="bg-[#00ABE7] hover:bg-[#0099d3]">
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">System Online</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{drivers?.length || 0} Active Drivers</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{customers?.length || 0} Customers</span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{jobs?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Key Business Metrics with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Outstanding Revenue</p>
                <p className="text-3xl font-bold text-gray-900">£{(stats?.outstandingRevenue || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {invoices?.filter(i => i.status === 'unpaid').length || 0} unpaid invoices
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-100 rounded-lg">
                  <PoundSterling className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            {stats?.outstandingRevenue && stats.outstandingRevenue > 10000 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-amber-600 font-medium">⚠ High outstanding amount</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Uninvoiced Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.uninvoicedJobs || 0}</p>
                <div className="mt-2">
                  <Progress value={(stats?.uninvoicedJobs || 0) > 0 ? 100 : 0} className="h-1" />
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <FileText className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>
            {(stats?.uninvoicedJobs || 0) > 5 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link href="/admin/invoices">
                  <span className="text-xs text-[#00ABE7] hover:underline cursor-pointer">Generate invoices →</span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{activeJobs.length}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {collectedJobs.length} collected
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {deliveredJobs.length} delivered
                  </Badge>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Car className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-[#00ABE7]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Weekly Performance</p>
                <p className="text-3xl font-bold text-gray-900">£{weekRevenue.toFixed(2)}</p>
                <div className="flex items-center gap-2 mt-2">
                  {revenueGrowth > 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-500" />
                  ) : revenueGrowth < 0 ? (
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    revenueGrowth > 0 ? 'text-green-600' : 
                    revenueGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {Math.abs(revenueGrowth).toFixed(1)}% vs last week
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="p-3 bg-[#00ABE7]/10 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-[#00ABE7]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid with Enhanced Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Priority Actions Card */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-red-50 to-amber-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-600" />
                Priority Actions
              </div>
              <Badge variant="destructive" className="text-xs">
                {(stats?.uninvoicedJobs || 0) + (stats?.unassignedJobs || 0)} pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {(stats?.uninvoicedJobs || 0) > 0 && (
              <Link href="/admin/invoices">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <span className="text-sm font-medium text-amber-800">Generate invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-600 text-white">
                      {stats?.uninvoicedJobs}
                    </Badge>
                    <span className="text-amber-600 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            )}
            {(stats?.unassignedJobs || 0) > 0 && (
              <Link href="/admin/planner">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-red-700" />
                    <span className="text-sm font-medium text-red-800">Assign drivers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600 text-white">
                      {stats?.unassignedJobs}
                    </Badge>
                    <span className="text-red-600 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            )}
            {(stats?.outstandingRevenue || 0) > 1000 && (
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-800">Chase payments</span>
                </div>
                <Badge className="bg-blue-600 text-white">
                  £{(stats?.outstandingRevenue || 0).toFixed(2)}
                </Badge>
              </div>
            )}
            {(stats?.pendingExpenseCount || 0) > 0 && (
              <Link href="/admin/expenses">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-700" />
                    <span className="text-sm font-medium text-purple-800">Review expenses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600 text-white">
                      {stats?.pendingExpenseCount}
                    </Badge>
                    <span className="text-purple-600 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            )}
            {(!stats?.uninvoicedJobs && !stats?.unassignedJobs && (stats?.outstandingRevenue || 0) < 1000 && !stats?.pendingExpenseCount) && (
              <div className="flex items-center justify-center p-8 text-center">
                <div className="animate-pulse">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">All clear!</p>
                  <p className="text-sm text-green-600">No urgent actions</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Performance with Visual Indicators */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-[#00ABE7]" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Average Job Value</span>
                  <span className="font-bold text-lg text-[#00ABE7]">
                    £{averageJobValue.toFixed(2)}
                  </span>
                </div>
                <Progress value={averageJobValue > 0 ? Math.min((averageJobValue / 1000) * 100, 100) : 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-bold text-lg text-green-600">
                    {completionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Today's Performance</span>
                  <span className="font-bold text-lg text-gray-900">
                    £{todayRevenue.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Package className="h-3 w-3" />
                  {todayJobs.length} jobs • {activeJobs.length} active
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{drivers?.length || 0}</p>
                    <p className="text-xs text-gray-600">Drivers</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-900">{customers?.length || 0}</p>
                    <p className="text-xs text-gray-600">Customers</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions with Better Visual Hierarchy */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <Link href="/admin/jobs/new">
              <Button className="w-full justify-start bg-[#00ABE7] hover:bg-[#0099d3] text-white group">
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                Create New Job
              </Button>
            </Link>
            <Link href="/admin/customers/new">
              <Button variant="outline" className="w-full justify-start hover:bg-gray-50 group">
                <Building2 className="mr-2 h-4 w-4 text-gray-600 group-hover:text-[#00ABE7]" />
                Add Customer
              </Button>
            </Link>
            <Link href="/admin/planner">
              <Button variant="outline" className="w-full justify-start hover:bg-gray-50 group">
                <Calendar className="mr-2 h-4 w-4 text-gray-600 group-hover:text-[#00ABE7]" />
                Job Planner
              </Button>
            </Link>
            <Link href="/admin/invoices">
              <Button variant="outline" className="w-full justify-start hover:bg-gray-50 group">
                <FileText className="mr-2 h-4 w-4 text-gray-600 group-hover:text-[#00ABE7]" />
                Manage Invoices
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start hover:bg-gray-50 group">
                <BarChart3 className="mr-2 h-4 w-4 text-gray-600 group-hover:text-[#00ABE7]" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Data Tables with Better Visual Design */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Jobs with Status Indicators */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5 text-gray-600" />
              Recent Jobs
            </CardTitle>
            <Link href="/admin/jobs">
              <Button variant="ghost" size="sm" className="hover:bg-white">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {jobs?.slice(0, 6).map((job, index) => (
                <Link key={job.id} href={`/admin/jobs/${job.jobNumber}`}>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${
                          job.status === 'completed' ? 'bg-green-500' :
                          job.status === 'active' ? 'bg-blue-500' :
                          job.status === 'collected' ? 'bg-cyan-500' :
                          job.status === 'delivered' ? 'bg-indigo-500' :
                          job.status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'
                        }`}></div>
                        {job.status === 'active' && (
                          <div className="absolute inset-0 w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 group-hover:text-[#00ABE7] transition-colors">
                            {job.jobNumber}
                          </p>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="truncate max-w-[150px]">{job.customer?.name || 'Unknown'}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-mono text-xs">{job.vehicle?.registration || 'No Reg'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-gray-900">£{parseFloat(job.totalMovementFee || '0').toFixed(2)}</p>
                      <Badge 
                        variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'active' ? 'secondary' :
                          job.status === 'collected' ? 'outline' :
                          job.status === 'delivered' ? 'outline' :
                          job.status === 'pending' ? 'outline' : 'destructive'
                        } 
                        className={`text-xs capitalize ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          job.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          job.status === 'collected' ? 'bg-cyan-100 text-cyan-800 border-cyan-200' :
                          job.status === 'delivered' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          job.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' : ''
                        }`}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              )) || (
                <div className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No recent jobs</p>
                  <Link href="/admin/jobs/new">
                    <Button variant="outline" size="sm" className="mt-4">
                      Create First Job
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Customers with Revenue Bars */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-gray-600" />
              Top Customers
            </CardTitle>
            <Link href="/admin/customers">
              <Button variant="ghost" size="sm" className="hover:bg-white">
                View All →
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {stats?.topCustomers?.slice(0, 6).map((customer, index) => {
                const maxRevenue = Math.max(...(stats?.topCustomers?.map(c => c.revenue) || [1]));
                const revenuePercentage = (customer.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                          'bg-gradient-to-br from-slate-400 to-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {customer.jobCount} jobs
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold text-[#00ABE7]">
                              £{customer.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#00ABE7] to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${revenuePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              }) || (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No customer data</p>
                  <Link href="/admin/customers/new">
                    <Button variant="outline" size="sm" className="mt-4">
                      Add First Customer
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}