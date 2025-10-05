import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Car, AlertCircle, PoundSterling, Users, CreditCard, AlertTriangle, FileText, CheckCircle } from "lucide-react";

export default function EnhancedDashboard() {
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

  if (isStatsLoading || isJobsLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Executive Summary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Today */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue Today</p>
                  <p className="text-2xl font-medium text-gray-900 mt-1">
                    £{(() => {
                      const today = new Date().toISOString().split('T')[0];
                      const todayRevenue = jobs?.filter(job => 
                        job.createdAt?.startsWith(today)
                      ).reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0) || 0;
                      return todayRevenue.toFixed(2);
                    })()}
                  </p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Jobs In Progress */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Jobs In Progress</p>
                  <p className="text-2xl font-medium text-gray-900 mt-1">{stats?.jobsInProgress || 0}</p>
                </div>
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Profit */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weekly Profit</p>
                  <p className={`text-2xl font-medium mt-1 ${(stats?.weeklyProfit || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    £{Math.abs(stats?.weeklyProfit || 0).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className={`h-8 w-8 ${(stats?.weeklyProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Revenue */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-medium text-orange-700 mt-1">£{stats?.outstandingRevenue?.toFixed(2) || '0'}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Revenue Analytics */}
          <Card className="bg-white border border-gray-200 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Jobs This Week</p>
                  <p className="text-xl font-medium text-gray-900">
                    {(() => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
                      return jobs?.filter(job => job.createdAt && job.createdAt >= startOfWeekStr).length || 0;
                    })()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Jobs This Month</p>
                  <p className="text-xl font-medium text-gray-900">
                    {(() => {
                      const thisMonth = new Date().toISOString().slice(0, 7);
                      return jobs?.filter(job => job.createdAt?.startsWith(thisMonth)).length || 0;
                    })()}
                  </p>
                </div>
              </div>
              
              {/* Weekly Profit Breakdown */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Cash Flow Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weekly Movement Revenue</span>
                    <span className="font-medium text-green-600">£{stats?.weeklyMovementRevenue?.toFixed(2) || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weekly Non-Fuel Expenses</span>
                    <span className="font-medium text-red-600">-£{stats?.weeklyNonFuelExpenses?.toFixed(2) || '0'}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Net Weekly Profit</span>
                    <span className={`font-medium ${(stats?.weeklyProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      £{Math.abs(stats?.weeklyProfit || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.topCustomers?.length ? (
                  stats.topCustomers
                    .slice(0, 5)
                    .map((customer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-600">{customer.jobCount} jobs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">£{customer.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No customer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Time Statistics */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">All Time Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-medium text-gray-900">{jobs?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-medium text-gray-900">
                      £{(() => {
                        if (!jobs?.length) return '0';
                        const totalRevenue = jobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
                        return totalRevenue.toFixed(2);
                      })()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Business Milestones</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Jobs Delivered</span>
                      <span className="font-medium text-green-600">{jobs?.filter(job => job.deliveredAt).length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Customers</span>
                      <span className="font-medium text-blue-600">{stats?.topCustomers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Invoices Paid</span>
                      <span className="font-medium text-purple-600">{jobs?.filter(job => job.paidAt).length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}