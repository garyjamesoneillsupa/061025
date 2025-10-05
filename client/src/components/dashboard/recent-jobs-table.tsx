import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Plus, Search } from "lucide-react";
import EnhancedJobCreationForm from "@/components/job/enhanced-job-creation-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Job, Customer, Driver, Vehicle } from "@shared/schema";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface RecentJobsTableProps {
  jobs: JobWithRelations[] | undefined;
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'created':
      return 'bg-gray-500 text-white hover:bg-gray-600';
    case 'assigned':
      return 'bg-pink-500 text-white hover:bg-pink-600';
    case 'collected':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    case 'delivered':
      return 'bg-green-500 text-white hover:bg-green-600';
    case 'invoiced':
      return 'bg-blue-500 text-white hover:bg-blue-600';
    case 'paid':
      return 'bg-black text-white hover:bg-gray-800';
    default:
      return 'bg-gray-500 text-white hover:bg-gray-600';
  }
};

export default function RecentJobsTable({ jobs, isLoading }: RecentJobsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showJobCreation, setShowJobCreation] = useState(false);

  const filteredJobs = jobs?.filter(job => 
    job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.vehicle?.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.driver?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Recent Jobs
            </CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowJobCreation(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Job
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No jobs found. Create your first job to get started.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {job.jobNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {job.vehicle?.registration || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {job.vehicle?.make || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {job.customer?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {job.driver?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`${getStatusColor(job.status || 'created')} capitalize`}>
                          {(job.status || 'created').replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/jobs?view=${job.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => window.location.href = `/jobs?edit=${job.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showJobCreation} onOpenChange={setShowJobCreation}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
          </DialogHeader>
          <EnhancedJobCreationForm onClose={() => setShowJobCreation(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
