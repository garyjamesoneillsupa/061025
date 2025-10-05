import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function MinimalAdminDashboard() {
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
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs?.filter(job => job.createdAt?.startsWith(today)) || [];
  const todayRevenue = todayJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
  
  const activeJobs = jobs?.filter(job => job.status === 'active') || [];
  const completedJobs = jobs?.filter(job => job.status === 'completed') || [];
  const pendingJobs = jobs?.filter(job => job.status === 'pending') || [];
  
  const totalRevenue = completedJobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-8 py-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-medium text-slate-900 mb-2">OVM Management</h1>
          <p className="text-slate-600">Operations Dashboard</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Today Revenue</p>
            <p className="text-2xl font-medium text-slate-900">£{todayRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">{todayJobs.length} jobs</p>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Active Jobs</p>
            <p className="text-2xl font-medium text-slate-900">{activeJobs.length}</p>
            <p className="text-xs text-slate-500 mt-1">in progress</p>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Pending</p>
            <p className="text-2xl font-medium text-slate-900">{pendingJobs.length}</p>
            <p className="text-xs text-slate-500 mt-1">awaiting action</p>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Completed</p>
            <p className="text-2xl font-medium text-slate-900">{completedJobs.length}</p>
            <p className="text-xs text-slate-500 mt-1">jobs finished</p>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Customers</p>
            <p className="text-2xl font-medium text-slate-900">{customers?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">active clients</p>
          </div>
          
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Drivers</p>
            <p className="text-2xl font-medium text-slate-900">{drivers?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">available</p>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-slate-900 mb-6">Financial Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Total Revenue</p>
              <p className="text-xl font-medium text-slate-900">£{totalRevenue.toFixed(2)}</p>
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Outstanding</p>
              <p className="text-xl font-medium text-amber-600">£{stats?.outstandingRevenue?.toFixed(2) || '0'}</p>
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Uninvoiced</p>
              <p className="text-xl font-medium text-blue-600">{stats?.uninvoicedJobs || 0}</p>
            </div>
            
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">This Week</p>
              <p className="text-xl font-medium text-green-600">£{stats?.revenueThisWeek?.toFixed(2) || '0'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-slate-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            
            <Link href="/admin/jobs/new">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">New Job</p>
                <p className="text-xs text-slate-500 mt-1">Create transport</p>
              </button>
            </Link>
            
            <Link href="/admin/customers/new">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">Add Customer</p>
                <p className="text-xs text-slate-500 mt-1">New client</p>
              </button>
            </Link>
            
            <Link href="/admin/invoices">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">Invoices</p>
                <p className="text-xs text-slate-500 mt-1">Generate billing</p>
              </button>
            </Link>
            
            <Link href="/admin/planner">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">Planner</p>
                <p className="text-xs text-slate-500 mt-1">Schedule jobs</p>
              </button>
            </Link>
            
            <Link href="/admin/drivers">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">Drivers</p>
                <p className="text-xs text-slate-500 mt-1">Manage fleet</p>
              </button>
            </Link>
            
            <Link href="/admin/reports">
              <button className="w-full text-left p-4 border border-slate-200 hover:border-slate-400 transition-colors">
                <p className="font-medium text-slate-900">Reports</p>
                <p className="text-xs text-slate-500 mt-1">View analytics</p>
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-slate-900">Recent Jobs</h2>
            <Link href="/admin/jobs">
              <button className="text-sm text-[#00ABE7] hover:underline">View all jobs</button>
            </Link>
          </div>
          
          <div className="border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Job</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Customer</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Vehicle</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {jobs?.slice(0, 10).map((job, index) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/jobs/${job.jobNumber}`}>
                        <button className="text-sm font-medium text-[#00ABE7] hover:underline">
                          {job.jobNumber}
                        </button>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {job.customer?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {job.vehicle?.registration || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'active' ? 'bg-blue-500' :
                        job.status === 'pending' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}></span>
                      <span className="text-sm capitalize text-slate-900">{job.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      £{parseFloat(job.totalMovementFee || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        {stats?.topCustomers && stats.topCustomers.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-slate-900 mb-6">Top Customers</h2>
            <div className="border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Jobs</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-6 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {stats.topCustomers.slice(0, 5).map((customer, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {customer.jobCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        £{customer.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}