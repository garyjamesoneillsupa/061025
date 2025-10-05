import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Plus, Search, Filter, X } from "lucide-react";
import { useLocation } from "wouter";
import EnhancedJobCreationForm from "@/components/job/enhanced-job-creation-form";
import JobQuickViewDialog from "@/components/jobs/job-quick-view-dialog";
import JobStatusControls from "@/components/admin/job-status-controls";
import type { Job, Customer, Driver, Vehicle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
}

import { getStatusColor } from "@shared/status-utils";

export default function Jobs() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showJobCreation, setShowJobCreation] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobWithRelations | null>(null);
  const [editingJob, setEditingJob] = useState<JobWithRelations | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<JobWithRelations[]>({
    queryKey: ["/api/jobs"],
    staleTime: 0, // Always refetch to avoid cache issues
    gcTime: 0, // Don't cache results (was cacheTime in v4, now gcTime in v5)
  });



  // Handle URL parameters for view/edit actions
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewJobId = urlParams.get('view');
    const editJobId = urlParams.get('edit');
    
    if (jobs && viewJobId) {
      const job = jobs.find(j => j.id === viewJobId);
      if (job) {
        setSelectedJob(job);
        // Clear URL parameter
        window.history.replaceState({}, '', '/jobs');
      }
    }
    
    if (jobs && editJobId) {
      const job = jobs.find(j => j.id === editJobId);
      if (job) {
        setEditingJob(job);
        // Clear URL parameter
        window.history.replaceState({}, '', '/jobs');
      }
    }
  }, [jobs]);

  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle?.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.driver?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
            <p className="text-gray-600 mt-1">Manage vehicle transport jobs</p>
          </div>
          <Button onClick={() => setShowJobCreation(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by job ID, vehicle registration, customer, or driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="invoiced">Invoiced</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="aborted">Aborted</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Jobs ({filteredJobs.length})
            </CardTitle>
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
                      Pricing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {jobs?.length === 0 
                          ? "No jobs found. Create your first job to get started."
                          : "No jobs match your search criteria."
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          // Only navigate if clicking on the row itself, not on buttons/badges
                          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('td')?.classList.contains('clickable-cell')) {
                            setLocation(`/admin/jobs/${job.jobNumber}`);
                          }
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap clickable-cell">
                          <div className="text-sm font-medium text-gray-900">
                            {job.jobNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap clickable-cell">
                          <div className="text-sm text-gray-900">
                            {job.vehicle?.registration || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.vehicle?.make || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap clickable-cell">
                          <div className="text-sm text-gray-900">
                            {job.customer?.name || 'N/A'}
                          </div>
                          {job.customer?.email && (
                            <div className="text-sm text-gray-500">
                              {job.customer.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap clickable-cell">
                          <div className="text-sm text-gray-900">
                            {job.driver?.name || 'Unassigned'}
                          </div>
                          {job.driver?.phone && (
                            <div className="text-sm text-gray-500">
                              {job.driver.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <JobStatusControls 
                            job={job} 
                            currentUserRole="admin" 
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap clickable-cell">
                          <div className="text-sm text-gray-900">
                            £{job.totalMovementFee || '0'}
                          </div>
                          {job.calculatedMileage && (
                            <div className="text-sm text-gray-500">
                              {Math.ceil(parseFloat(job.calculatedMileage))} miles
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                              }}
                              title="Quick View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingJob(job);
                              }}
                              title="Edit Job"
                            >
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
      </main>

      {/* Job Creation Modal - Perfectly Centered */}
      {showJobCreation && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowJobCreation(false);
            }
          }}
          onScroll={() => {
            setTimeout(() => {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
              });
            }, 100);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ 
              position: 'fixed',
              top: '50vh',
              left: '50vw',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 2rem)', 
              maxWidth: 'calc(1280px - 4rem)',
              height: 'min(85vh, calc(100vh - 80px))',
              zIndex: 60
            }}
          >
            {/* Beautiful Header */}
            <div className="bg-gradient-to-r from-[#00ABE7] to-cyan-500 px-6 py-4 text-white relative flex-shrink-0">
              <button
                onClick={() => setShowJobCreation(false)}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Job</h2>
                  <p className="text-cyan-50 mt-1">Fill in the details to create a new transport job</p>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <EnhancedJobCreationForm onClose={() => setShowJobCreation(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal - Perfectly Centered */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ 
              position: 'fixed',
              top: '50vh',
              left: '50vw',
              transform: 'translate(-50%, -50%)',
              width: 'calc(100vw - 2rem)', 
              maxWidth: 'calc(1280px - 4rem)',
              height: 'min(85vh, calc(100vh - 80px))',
              zIndex: 60
            }}
          >
            {/* Beautiful Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white relative flex-shrink-0">
              <button
                onClick={() => setEditingJob(null)}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Job #{editingJob.jobNumber}</h2>
                  <p className="text-orange-50 mt-1">Update the job details below</p>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              <EnhancedJobCreationForm 
                existingJob={editingJob}
                onClose={() => setEditingJob(null)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick View Dialog */}
      {selectedJob && (
        <JobQuickViewDialog 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}



    </>
  );
}
