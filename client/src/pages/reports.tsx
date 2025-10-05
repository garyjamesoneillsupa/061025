import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { 
  PoundSterling, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  FileText, 
  Calendar as CalendarIcon,
  Receipt,
  Briefcase,
  DollarSign,
  BarChart3
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface PLSummary {
  totalRevenue: number;
  passThroughExpenses: number;
  absorbedExpenses: number;
  totalWages: number;
  netProfit: number;
}

interface JobDetail {
  id: string;
  jobNumber: string;
  customerName: string;
  date: string;
  movementFee: number;
  fuelPassThrough: number;
  otherExpenses: number;
  driverWage: number;
  netProfit: number;
}

interface PLData {
  summary: PLSummary;
  jobs: JobDetail[];
  expenses: any[];
  wages: any[];
}

const formatCurrency = (amount: number) => {
  return `£${amount.toFixed(2)}`;
};

type DateRangePreset = 'this-week' | 'this-month' | 'last-month' | 'custom';

export default function Reports() {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('this-month');
  const [customStartDate, setCustomStartDate] = useState<Date>(startOfMonth(new Date()));
  const [customEndDate, setCustomEndDate] = useState<Date>(endOfMonth(new Date()));

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (dateRangePreset) {
      case 'this-week':
        return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'this-month':
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      case 'custom':
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [dateRangePreset, customStartDate, customEndDate]);

  const { data: plData, isLoading } = useQuery<PLData>({
    queryKey: ['/api/reports/pl', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      const response = await fetch(`/api/reports/pl?${params}`);
      if (!response.ok) throw new Error('Failed to fetch P&L data');
      return response.json();
    }
  });

  const handleExportHMRC = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      const response = await fetch(`/api/reports/export-hmrc?${params}`);
      if (!response.ok) throw new Error('Failed to generate HMRC export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HMRC_Export_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "HMRC export package downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate HMRC export",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      const response = await fetch(`/api/reports/export-pdf?${params}`);
      if (!response.ok) throw new Error('Failed to generate PDF export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OVM Report (${format(startDate, 'dd.MM.yy')} - ${format(endDate, 'dd.MM.yy')}).pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "P&L report PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF export",
        variant: "destructive",
      });
    }
  };

  const chartData = useMemo(() => {
    if (!plData) return { revenue: [], expenses: [], profitByJob: [] };

    const jobsByDate = plData.jobs.reduce((acc, job) => {
      const date = format(new Date(job.date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, expenses: 0, wages: 0 };
      }
      acc[date].revenue += job.movementFee;
      acc[date].expenses += job.otherExpenses;
      acc[date].wages += job.driverWage;
      return acc;
    }, {} as Record<string, any>);

    const revenue = Object.values(jobsByDate);

    const expenses = [
      { name: 'Fuel (Pass-through)', value: plData.summary.passThroughExpenses, color: '#60a5fa' },
      { name: 'Other Expenses', value: plData.summary.absorbedExpenses, color: '#f87171' },
      { name: 'Driver Wages', value: plData.summary.totalWages, color: '#fbbf24' }
    ];

    const profitByJob = plData.jobs.slice(0, 10).map(job => ({
      jobNumber: job.jobNumber,
      revenue: job.movementFee,
      expenses: job.otherExpenses + job.driverWage,
      profit: job.netProfit
    }));

    return { revenue, expenses, profitByJob };
  }, [plData]);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            data-testid="button-export-pdf"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={handleExportHMRC}
            data-testid="button-export-hmrc"
          >
            <Download className="h-4 w-4 mr-2" />
            Export HMRC Package
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRangePreset === 'this-week' ? 'default' : 'outline'}
              onClick={() => setDateRangePreset('this-week')}
              data-testid="button-this-week"
            >
              This Week
            </Button>
            <Button
              variant={dateRangePreset === 'this-month' ? 'default' : 'outline'}
              onClick={() => setDateRangePreset('this-month')}
              data-testid="button-this-month"
            >
              This Month
            </Button>
            <Button
              variant={dateRangePreset === 'last-month' ? 'default' : 'outline'}
              onClick={() => setDateRangePreset('last-month')}
              data-testid="button-last-month"
            >
              Last Month
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={dateRangePreset === 'custom' ? 'default' : 'outline'}
                  data-testid="button-custom-range"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Custom Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Start Date</p>
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomStartDate(date);
                          setDateRangePreset('custom');
                        }
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">End Date</p>
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        if (date) {
                          setCustomEndDate(date);
                          setDateRangePreset('custom');
                        }
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <p className="text-sm text-muted-foreground mt-4" data-testid="text-selected-period">
            Selected Period: {format(startDate, 'dd MMM yyyy')} - {format(endDate, 'dd MMM yyyy')}
          </p>
        </CardContent>
      </Card>

      {plData && (
        <>
          <div className="grid gap-6 md:grid-cols-5 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <PoundSterling className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-revenue">{formatCurrency(plData.summary.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">Movement fees</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass-through Fuel</CardTitle>
                <Receipt className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-passthrough-expenses">{formatCurrency(plData.summary.passThroughExpenses)}</div>
                <p className="text-xs text-muted-foreground">Neutral to profit</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absorbed Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-absorbed-expenses">{formatCurrency(plData.summary.absorbedExpenses)}</div>
                <p className="text-xs text-muted-foreground">Reduces profit</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Driver Wages</CardTitle>
                <Briefcase className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-wages">{formatCurrency(plData.summary.totalWages)}</div>
                <p className="text-xs text-muted-foreground">50% of jobs</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${plData.summary.netProfit >= 0 ? 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800' : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net OVM Profit</CardTitle>
                {plData.summary.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${plData.summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-net-profit">
                  {formatCurrency(plData.summary.netProfit)}
                </div>
                <p className="text-xs text-muted-foreground">After all costs</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="table" className="space-y-4">
            <TabsList>
              <TabsTrigger value="table" data-testid="tab-table">P&L Statement</TabsTrigger>
              <TabsTrigger value="charts" data-testid="tab-charts">Charts</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Job-by-Job Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Number</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Movement Fee</TableHead>
                        <TableHead className="text-right">Fuel (Pass-through)</TableHead>
                        <TableHead className="text-right">Other Expenses</TableHead>
                        <TableHead className="text-right">Driver Wage (50%)</TableHead>
                        <TableHead className="text-right">Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plData.jobs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No jobs found for the selected period
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {plData.jobs.map((job) => (
                            <TableRow key={job.id} data-testid={`row-job-${job.jobNumber}`}>
                              <TableCell className="font-medium">{job.jobNumber}</TableCell>
                              <TableCell>{job.customerName}</TableCell>
                              <TableCell>{format(new Date(job.date), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-right">{formatCurrency(job.movementFee)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatCurrency(job.fuelPassThrough)}</TableCell>
                              <TableCell className="text-right text-orange-600 dark:text-orange-400">{formatCurrency(job.otherExpenses)}</TableCell>
                              <TableCell className="text-right text-yellow-600 dark:text-yellow-400">{formatCurrency(job.driverWage)}</TableCell>
                              <TableCell className={`text-right font-semibold ${job.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(job.netProfit)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={3}>TOTALS</TableCell>
                            <TableCell className="text-right" data-testid="text-total-movement-fee">{formatCurrency(plData.summary.totalRevenue)}</TableCell>
                            <TableCell className="text-right text-muted-foreground" data-testid="text-total-fuel-passthrough">{formatCurrency(plData.summary.passThroughExpenses)}</TableCell>
                            <TableCell className="text-right text-orange-600 dark:text-orange-400" data-testid="text-total-other-expenses">{formatCurrency(plData.summary.absorbedExpenses)}</TableCell>
                            <TableCell className="text-right text-yellow-600 dark:text-yellow-400" data-testid="text-total-driver-wages">{formatCurrency(plData.summary.totalWages)}</TableCell>
                            <TableCell className={`text-right ${plData.summary.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-total-net-profit">
                              {formatCurrency(plData.summary.netProfit)}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.revenue.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.revenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.expenses.some(e => e.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData.expenses}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.expenses.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No expenses in this period
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Profit by Job (Top 10)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.profitByJob.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.profitByJob}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="jobNumber" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                          <Bar dataKey="expenses" fill="#f87171" name="Expenses + Wages" />
                          <Bar dataKey="profit" fill="#10b981" name="Net Profit" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No jobs to display
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}
