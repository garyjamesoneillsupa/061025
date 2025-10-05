import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation } from "lucide-react";

interface JobsMapProps {
  jobs: any[] | undefined;
}

import { getStatusColor } from "@shared/status-utils";

export default function JobsMap({ jobs }: JobsMapProps) {
  // Filter for assigned or collected jobs only
  const activeJobs = jobs?.filter(job => 
    job.status === 'assigned' || job.status === 'collected'
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
          <Navigation className="mr-2 h-5 w-5 text-green-500" />
          Active Job Locations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No active jobs to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <Badge className={`${getStatusColor(job.status || 'created')} text-xs`}>
                    {(job.status || 'created').replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">#{job.jobNumber}</span>
                    <span className="text-sm text-gray-500">{job.vehicle?.registration}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-green-500" />
                      <span className="font-medium">From:</span>
                      <span className="ml-1">{job.collectionAddress?.city}, {job.collectionAddress?.postcode}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-red-500" />
                      <span className="font-medium">To:</span>
                      <span className="ml-1">{job.deliveryAddress?.city}, {job.deliveryAddress?.postcode}</span>
                    </div>
                  </div>
                  {job.calculatedMileage && (
                    <div className="mt-2 text-xs text-gray-500">
                      {Math.ceil(parseFloat(job.calculatedMileage))} miles • Driver: {job.driver?.name || 'Unassigned'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}