import { useQuery } from "@tanstack/react-query";
import MetricsCards from "@/components/dashboard/metrics-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, PoundSterling, FileText, Truck, AlertCircle, DollarSign, Users, CreditCard } from "lucide-react";

export default function Dashboard() {
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Vehicle movement system overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Vehicle movement system overview</p>
      </div>

      {/* Key Metrics Cards */}
      <MetricsCards stats={stats} />



      {/* Professional Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Overview Card */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-[#00ABE7]/10 rounded-lg">
                <PoundSterling className="h-5 w-5 text-[#00ABE7]" />
              </div>
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Total Movement Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  £{(() => {
                    if (!jobs?.length) return '0.00';
                    const totalMovementRevenue = jobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
                    return totalMovementRevenue.toFixed(2);
                  })()}
                </p>
                <p className="text-sm text-gray-500">From {jobs?.length || 0} completed jobs</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Outstanding Revenue</p>
                <p className="text-3xl font-bold text-[#00ABE7]">
                  £{(() => {
                    if (!jobs?.length) return '0.00';
                    const outstandingMovementRevenue = jobs
                      .filter(job => job.status === 'delivered' || job.status === 'invoiced')
                      .reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
                    return outstandingMovementRevenue.toFixed(2);
                  })()}
                </p>
                <p className="text-sm text-gray-500">{stats?.unpaidInvoices || 0} unpaid invoices</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Average Job Value</p>
                  <p className="text-2xl font-semibold text-gray-700">
                    £{(() => {
                      if (!jobs?.length) return '0.00';
                      const totalMovementRevenue = jobs.reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
                      const averageMovement = totalMovementRevenue / jobs.length;
                      return averageMovement.toFixed(2);
                    })()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">Weekly Profit</p>
                  <p className={`text-2xl font-semibold ${(stats?.weeklyProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    £{(stats?.weeklyProfit || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Revenue minus non-fuel expenses</p>
                </div>
              </div>
            </div>
            
            {/* Weekly Profit Breakdown */}
            <div className="border-t pt-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Weekly Profit Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-700 font-medium">Movement Revenue</p>
                    <p className="text-green-800 font-semibold">£{(stats?.weeklyMovementRevenue || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-red-700 font-medium">Non-fuel Expenses</p>
                    <p className="text-red-800 font-semibold">-£{(stats?.weeklyNonFuelExpenses || 0).toFixed(2)}</p>
                    <p className="text-xs text-red-600 mt-1">Uber, train, misc costs</p>
                  </div>
                  <div className={`p-3 rounded-lg ${(stats?.weeklyProfit || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <p className={`font-medium ${(stats?.weeklyProfit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Net Profit</p>
                    <p className={`font-bold ${(stats?.weeklyProfit || 0) >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                      £{(stats?.weeklyProfit || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  * Fuel expenses excluded as they can be charged to customers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Management Card */}
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-[#00ABE7]/10 rounded-lg">
                <FileText className="h-5 w-5 text-[#00ABE7]" />
              </div>
              Expense Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-[#00ABE7]/5 rounded-lg border border-[#00ABE7]/20 hover:bg-[#00ABE7]/10 transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-[#00ABE7] rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pending Approval</p>
                    <p className="text-xs text-gray-500">{stats?.pendingExpenseCount || 0} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-[#00ABE7]">
                    £{((stats?.pendingExpenseAmount || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50/80 rounded-lg border border-green-200 hover:bg-green-50 transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Approved</p>
                    <p className="text-xs text-gray-500">Ready for invoicing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-600">
                    £{((stats?.approvedExpenseAmount || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50/80 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer Chargeable</p>
                    <p className="text-xs text-gray-500">Billable amounts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-blue-600">
                    £{((stats?.customerChargeableAmount || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>









      {/* Top Customers - Keep this as requested */}
      <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-[#00ABE7]/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-[#00ABE7]" />
            </div>
            Top Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.topCustomers?.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#00ABE7]/10 rounded-full text-[#00ABE7] font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.jobCount} jobs this month</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">£{customer.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
