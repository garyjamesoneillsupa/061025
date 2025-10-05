import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function ExecutiveAdminDashboard() {
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

  const { data: customers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  if (isStatsLoading || isJobsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#00ABE7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading operations data...</p>
        </div>
      </div>
    );
  }

  // Calculate comprehensive metrics
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Today's metrics
  const todayJobs = jobs?.filter(job => job.createdAt?.startsWith(today)) || [];
  const todayRevenue = todayJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  // Week metrics
  const weekJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= startOfWeek;
  }) || [];
  const weekRevenue = weekJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  // Month metrics
  const monthJobs = jobs?.filter(job => {
    const jobDate = new Date(job.createdAt);
    return jobDate >= startOfMonth;
  }) || [];
  const monthRevenue = monthJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  // Status breakdowns
  const activeJobs = jobs?.filter(job => job.status === 'active') || [];
  const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
  const pendingJobs = jobs?.filter(job => job.status === 'pending') || [];
  const urgentJobs = jobs?.filter(job => 
    job.status === 'pending' && !job.driver
  ) || [];
  
  // Financial calculations
  const totalRevenue = completedJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  const avgJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
  
  // Fleet utilization
  const utilizationRate = (drivers?.length || 0) > 0 ? (activeJobs.length / (drivers?.length || 1) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        
        {/* Executive Header */}
        <div className="mb-8 border-b border-slate-700 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">OVM TRANSPORT</h1>
              <p className="text-slate-400 text-sm uppercase tracking-wide">Executive Operations Center</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">System Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#00ABE7] rounded-full animate-pulse"></div>
                <span className="text-[#00ABE7] text-sm font-medium">OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">TODAY</div>
            <div className="text-2xl font-bold text-white mb-1">£{todayRevenue.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{todayJobs.length} jobs</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">THIS WEEK</div>
            <div className="text-2xl font-bold text-[#00ABE7] mb-1">£{weekRevenue.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{weekJobs.length} jobs</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">THIS MONTH</div>
            <div className="text-2xl font-bold text-green-400 mb-1">£{monthRevenue.toLocaleString()}</div>
            <div className="text-xs text-slate-500">{monthJobs.length} jobs</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">ACTIVE</div>
            <div className="text-2xl font-bold text-blue-400 mb-1">{activeJobs.length}</div>
            <div className="text-xs text-slate-500">in progress</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">PENDING</div>
            <div className="text-2xl font-bold text-amber-400 mb-1">{pendingJobs.length}</div>
            <div className="text-xs text-slate-500">awaiting</div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">URGENT</div>
            <div className="text-2xl font-bold text-red-400 mb-1">{urgentJobs.length}</div>
            <div className="text-xs text-slate-500">critical</div>
          </div>
        </div>

        {/* Operations Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Financial Performance */}
          <div className="bg-slate-800 border border-slate-700">
            <div className="border-b border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">FINANCIAL PERFORMANCE</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Revenue</span>
                <span className="text-white font-bold">£{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Outstanding</span>
                <span className="text-amber-400 font-bold">£{(stats?.outstandingRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Avg Job Value</span>
                <span className="text-[#00ABE7] font-bold">£{avgJobValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Uninvoiced Jobs</span>
                <span className="text-red-400 font-bold">{stats?.uninvoicedJobs || 0}</span>
              </div>
            </div>
          </div>

          {/* Fleet Operations */}
          <div className="bg-slate-800 border border-slate-700">
            <div className="border-b border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">FLEET OPERATIONS</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Drivers</span>
                <span className="text-white font-bold">{drivers?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Utilization Rate</span>
                <span className="text-[#00ABE7] font-bold">{utilizationRate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Jobs Completed</span>
                <span className="text-green-400 font-bold">{completedJobs.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Active Customers</span>
                <span className="text-white font-bold">{customers?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* System Control */}
          <div className="bg-slate-800 border border-slate-700">
            <div className="border-b border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">SYSTEM CONTROL</h3>
            </div>
            <div className="p-4 space-y-3">
              <Link href="/admin/jobs/new">
                <button className="w-full bg-[#00ABE7] hover:bg-[#0099CC] text-white px-4 py-2 text-sm font-medium transition-colors">
                  CREATE JOB
                </button>
              </Link>
              <Link href="/admin/planner">
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 text-sm font-medium transition-colors">
                  PLANNER
                </button>
              </Link>
              <Link href="/admin/invoices">
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 text-sm font-medium transition-colors">
                  INVOICES
                </button>
              </Link>
              <Link href="/admin/reports">
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 text-sm font-medium transition-colors">
                  REPORTS
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Operations Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Live Job Feed */}
          <div className="bg-slate-800 border border-slate-700">
            <div className="border-b border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">LIVE JOB FEED</h3>
              <Link href="/admin/jobs">
                <button className="text-xs text-[#00ABE7] hover:underline uppercase tracking-wide">VIEW ALL</button>
              </Link>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {jobs?.slice(0, 8).map((job, index) => (
                <div key={job.id} className="border-b border-slate-700 p-3 hover:bg-slate-750">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-400' :
                        job.status === 'active' ? 'bg-blue-400' :
                        job.status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'
                      }`}></div>
                      <div>
                        <Link href={`/admin/jobs/${job.jobNumber}`}>
                          <button className="text-[#00ABE7] hover:underline font-mono text-sm">
                            {job.jobNumber}
                          </button>
                        </Link>
                        <div className="text-xs text-slate-400">
                          {job.customer?.name} • {job.vehicle?.registration}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-sm">£{parseFloat(job.totalMovementFee || '0').toFixed(2)}</div>
                      <div className="text-xs text-slate-400 uppercase">{job.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-slate-800 border border-slate-700">
            <div className="border-b border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">TOP CUSTOMERS</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {stats?.topCustomers?.slice(0, 8).map((customer, index) => (
                <div key={index} className="border-b border-slate-700 p-3 hover:bg-slate-750">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-slate-700 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-300">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium text-sm">{customer.name}</div>
                        <div className="text-xs text-slate-400">{customer.jobCount} jobs</div>
                      </div>
                    </div>
                    <div className="text-[#00ABE7] font-bold text-sm">
                      £{customer.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              )) || (
                <div className="p-4 text-center text-slate-500">
                  No customer data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}