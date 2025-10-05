import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Car } from "lucide-react";

interface TodaysScheduleProps {
  jobs: any[] | undefined;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'created':
      return 'bg-gray-500 text-white';
    case 'assigned':
      return 'bg-pink-500 text-white';
    case 'collected':
      return 'bg-amber-500 text-white';
    case 'delivered':
      return 'bg-green-500 text-white';
    case 'invoiced':
      return 'bg-blue-500 text-white';
    case 'paid':
      return 'bg-black text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export default function TodaysSchedule({ jobs }: TodaysScheduleProps) {
  // Filter for today's jobs that are assigned or collected
  const today = new Date().toDateString();
  const todaysJobs = jobs?.filter(job => {
    const isAssignedOrCollected = job.status === 'assigned' || job.status === 'collected';
    const jobDate = new Date(job.createdAt).toDateString();
    const isToday = jobDate === today;
    return isAssignedOrCollected && isToday;
  }) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Clock className="mr-2 h-5 w-5 text-blue-500" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todaysJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No jobs scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysJobs.map((job) => (
              <div key={job.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <Badge className={`${getStatusColor(job.status || 'created')} text-xs`}>
                    {(job.status || 'created').replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">#{job.jobNumber}</span>
                    <Car className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{job.vehicle?.registration || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {job.driver?.name || 'Unassigned'}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.collectionAddress?.city} → {job.deliveryAddress?.city}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}