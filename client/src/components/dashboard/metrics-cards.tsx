import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Car, FileText, CheckCircle } from "lucide-react";

interface MetricsCardsProps {
  stats: {
    jobsInProgress: number;
    revenueThisWeek: number;
    uninvoicedJobs: number;
    totalCompletedJobs: number;
    unassignedJobs: number;
  } | undefined;
}

export default function MetricsCards({ stats }: MetricsCardsProps) {
  if (!stats) {
    return null;
  }

  const metrics = [
    {
      title: "Jobs In Progress",
      value: stats.jobsInProgress,
      icon: Car,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      subtitle: "Active",
    },
    {
      title: "Unassigned Jobs",
      value: stats.unassignedJobs || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      subtitle: "Needs Driver",
    },
    {
      title: "Jobs Awaiting Invoice",
      value: stats.uninvoicedJobs,
      icon: FileText,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      subtitle: "Pending",
    },
    {
      title: "Jobs Completed",
      value: stats.totalCompletedJobs.toLocaleString(),
      icon: CheckCircle,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: "All Time",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="metrics-card">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className={`p-3 ${metric.bgColor} rounded-lg`}>
                  <Icon className={`${metric.textColor} text-xl`} size={20} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">
                {metric.value}
              </h3>
              <p className="text-gray-600 text-sm">{metric.title}</p>

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
