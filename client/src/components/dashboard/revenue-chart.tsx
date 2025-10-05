import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface RevenueChartProps {
  jobs: any[] | undefined;
}

type ViewType = 'daily' | 'weekly' | 'monthly';

export default function RevenueChart({ jobs }: RevenueChartProps) {
  const [viewType, setViewType] = useState<ViewType>('weekly');

  // Generate real data based on actual job revenue
  const generateChartData = () => {
    if (!jobs || jobs.length === 0) return [];
    
    const now = new Date();
    
    if (viewType === 'daily') {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayRevenue = jobs
          .filter(job => {
            const jobDate = new Date(job.createdAt);
            return jobDate >= dayStart && jobDate <= dayEnd && (job.status === 'paid' || job.status === 'invoiced');
          })
          .reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
        
        return {
          name: date.toLocaleDateString('en-GB', { weekday: 'short' }),
          revenue: Math.round(dayRevenue),
        };
      });
    }
    
    if (viewType === 'weekly') {
      // Last 8 weeks
      return Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 7 * (7 - i)));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekRevenue = jobs
          .filter(job => {
            const jobDate = new Date(job.createdAt);
            return jobDate >= weekStart && jobDate <= weekEnd && (job.status === 'paid' || job.status === 'invoiced');
          })
          .reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
        
        return {
          name: `W${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          revenue: Math.round(weekRevenue),
        };
      });
    }
    
    // Monthly - Last 6 months
    return Array.from({ length: 6 }, (_, i) => {
      const month = new Date(now);
      month.setMonth(month.getMonth() - (5 - i));
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const monthRevenue = jobs
        .filter(job => {
          const jobDate = new Date(job.createdAt);
          return jobDate >= monthStart && jobDate <= monthEnd && (job.status === 'paid' || job.status === 'invoiced');
        })
        .reduce((sum, job) => sum + (parseFloat(job.totalMovementFee) || 0), 0);
      
      return {
        name: month.toLocaleDateString('en-GB', { month: 'short' }),
        revenue: Math.round(monthRevenue),
      };
    });
  };

  const chartData = generateChartData();
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = Math.round(totalRevenue / chartData.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
            Revenue Overview
          </CardTitle>
          <div className="flex space-x-1">
            {(['daily', 'weekly', 'monthly'] as ViewType[]).map((type) => (
              <Button
                key={type}
                variant={viewType === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType(type)}
                className="text-xs capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">£{totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">
              Total {viewType} revenue • Avg: £{avgRevenue.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2 text-green-600">
            <BarChart3 className="h-4 w-4" />
            <span className="text-sm font-medium">+12.5%</span>
          </div>
        </div>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                className="text-xs"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tickFormatter={(value) => `£${value}`}
              />
              <Tooltip
                formatter={(value: number) => [`£${value.toLocaleString()}`, 'Revenue']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}