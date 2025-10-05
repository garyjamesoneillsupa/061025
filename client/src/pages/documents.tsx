import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Download, Eye, Calendar, User, Car } from "lucide-react";
import { getStatusColor } from "@shared/status-utils";
import type { Job, Customer, Vehicle } from "@shared/schema";

interface JobWithDetails extends Job {
  customer?: Customer;
  vehicle?: Vehicle;
}

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [downloadingJobs, setDownloadingJobs] = useState<Set<string>>(new Set());

  const { data: jobs, isLoading } = useQuery<JobWithDetails[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Filter jobs based on search and filters - show ALL jobs regardless of document availability
  const filteredJobs = jobs?.filter(job => {
    const matchesSearch = 
      job.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vehicle?.registration?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesCustomer = filterCustomer === "all" || job.customerId === filterCustomer;

    return matchesSearch && matchesStatus && matchesCustomer;
  });



  const getAvailableDocuments = (job: JobWithDetails) => {
    const docs = [];
    if (job.status === 'collected' || job.status === 'delivered' || job.status === 'invoiced' || job.status === 'paid') {
      docs.push({ type: 'POC', label: 'Proof of Collection' });
    }
    if (job.status === 'delivered' || job.status === 'invoiced' || job.status === 'paid') {
      docs.push({ type: 'POD', label: 'Proof of Delivery' });
    }
    // Removed invoice from documents view as requested
    return docs;
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Documents (POCs & PODs)</h2>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Documents (POCs & PODs)</h2>
        <p className="text-gray-600 mt-1">View and download Proof of Collection and Proof of Delivery documents</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by job number, customer, or registration..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <FileText className="mr-2 h-4 w-4" />
              {filteredJobs?.length || 0} jobs found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs && filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Main Job Information */}
                  <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{job.jobNumber}</h3>
                      {job.status ? (
                        <span className={`${getStatusColor(job.status)} px-3 py-1 text-sm font-medium rounded-full`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      ) : (
                        <span className="bg-gray-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                          Unknown
                        </span>
                      )}
                      <div className="text-sm text-gray-500">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                      </div>
                    </div>
                    
                    {/* Customer and Vehicle Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Customer:</span>
                        <span className="text-sm text-gray-900 font-medium">{job.customer?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                        <span className="text-sm text-gray-900 font-medium">{job.vehicle?.registration || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-md p-3 border-l-4 border-blue-500">
                        <div className="text-sm font-medium text-gray-700 mb-1">Collection Address</div>
                        <div className="text-sm text-gray-600">
                          {job.collectionAddress ? (
                            <>
                              {job.collectionAddress.line1}
                              {job.collectionAddress.line2 && <>, {job.collectionAddress.line2}</>}
                              <br />
                              <span className="font-medium">{job.collectionAddress.city}, {job.collectionAddress.postcode}</span>
                            </>
                          ) : (
                            <span className="italic">Not specified</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 border-l-4 border-green-500">
                        <div className="text-sm font-medium text-gray-700 mb-1">Delivery Address</div>
                        <div className="text-sm text-gray-600">
                          {job.deliveryAddress ? (
                            <>
                              {job.deliveryAddress.line1}
                              {job.deliveryAddress.line2 && <>, {job.deliveryAddress.line2}</>}
                              <br />
                              <span className="font-medium">{job.deliveryAddress.city}, {job.deliveryAddress.postcode}</span>
                            </>
                          ) : (
                            <span className="italic">Not specified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="ml-6 flex flex-col gap-2">
                    {getAvailableDocuments(job).map((doc) => (
                      <Button
                        key={doc.type}
                        variant="outline"
                        size="sm"
                        disabled={downloadingJobs.has(`${job.id}-${doc.type}`)}
                        onClick={() => {
                          const downloadKey = `${job.id}-${doc.type}`;
                          console.log(`Direct download ${doc.type} for job ${job.id}`);
                          
                          // Set loading state
                          setDownloadingJobs(prev => new Set(prev).add(downloadKey));
                          
                          const endpoint = doc.type === 'POC' 
                            ? `/api/flawless/generate-poc/${job.id}`
                            : `/api/jobs/${job.id}/generate-pod`;
                          
                          // Create a form and submit it to trigger download
                          const form = document.createElement('form');
                          form.method = 'POST';
                          form.action = endpoint;
                          form.target = '_blank';
                          form.style.display = 'none';
                          
                          document.body.appendChild(form);
                          form.submit();
                          document.body.removeChild(form);
                          
                          // Clear loading state after a delay
                          setTimeout(() => {
                            setDownloadingJobs(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(downloadKey);
                              return newSet;
                            });
                          }, 2000);
                          
                          console.log(`Form submitted for ${doc.type} download`);
                        }}
                        className="min-w-[120px] justify-center font-medium"
                      >
                        {downloadingJobs.has(`${job.id}-${doc.type}`) ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download {doc.type}
                          </>
                        )}
                      </Button>
                    ))}
                    
                    {getAvailableDocuments(job).length === 0 && (
                      <div className="text-sm text-gray-500 italic text-center py-3 min-w-[120px]">
                        No documents<br />available yet
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== "all" || filterCustomer !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Documents will appear here once jobs reach collection stage"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}