import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, User, Car } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor } from "@shared/status-utils";

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  collectionContact?: { name: string };
  deliveryContact?: { name: string };
  vehicle?: { registration: string };
  driver?: { name: string };
  createdAt: string;
}

export default function AdminDocuments() {
  const [generatingPOC, setGeneratingPOC] = useState<string | null>(null);
  const [generatingPOD, setGeneratingPOD] = useState<string | null>(null);

  const { data: completedJobs = [], isLoading, error } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      const jobs = await response.json();
      // Only return jobs that have POC or POD documents available
      return jobs.filter((job: any) => ['collected', 'delivered', 'invoiced', 'paid'].includes(job.status));
    }
  });

  const handleDownloadPOC = async (job: Job) => {
    try {
      setGeneratingPOC(job.id);
      
      const response = await fetch(`/api/flawless/generate-poc/${job.id}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Fresh POC');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${job.jobNumber} (POC).pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Fresh POC",
        variant: "destructive"
      });
    } finally {
      setGeneratingPOC(null);
    }
  };

  const handleDownloadPOD = async (job: Job) => {
    try {
      setGeneratingPOD(job.id);
      
      const response = await fetch(`/api/fresh/generate-fresh-pod/${job.id}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Fresh POD');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Fresh-POD-${job.jobNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate Fresh POD",
        variant: "destructive"
      });
    } finally {
      setGeneratingPOD(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">Manage POC and POD documents for completed collections</p>
        </div>

        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="space-x-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load collections. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
        <p className="text-gray-600 mt-1">
          Shows only jobs with POC or POD documents available for download
        </p>
      </div>

      {completedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No jobs available for document generation.</p>
            <p className="text-sm text-muted-foreground mt-2">Jobs must be collected or delivered to generate documents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Found {completedJobs.length} job(s) with documents available
          </div>
          
          <div className="grid gap-4">
            {completedJobs.map((job: Job) => {
              const createdDate = new Date(job.createdAt).toLocaleDateString();
              const driverName = job.driver?.name || 'Driver TBC';
              const vehicleReg = job.vehicle?.registration || 'N/A';
              
              // Determine which buttons to show based on status
              const showPOC = ['collected', 'delivered', 'invoiced', 'paid'].includes(job.status);
              const showPOD = ['delivered', 'invoiced', 'paid'].includes(job.status);
              
              return (
                <Card key={job.id} className="transition-all hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">
                            Job {job.jobNumber}
                          </CardTitle>
                          <span className={`${getStatusColor(job.status as any)} px-3 py-1 text-xs font-medium rounded-full`}>
                            {job.status.toUpperCase()}
                          </span>
                          <Badge variant="outline">
                            <Calendar className="w-3 h-3 mr-1" />
                            {createdDate}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {driverName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="w-3 h-3" />
                            {vehicleReg}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {showPOC && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPOC(job)}
                            disabled={generatingPOC === job.id}
                            className="min-w-24"
                          >
                            {generatingPOC === job.id ? (
                              "Generating..."
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                POC
                              </>
                            )}
                          </Button>
                        )}
                        
                        {showPOD && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPOD(job)}
                            disabled={generatingPOD === job.id}
                            className="min-w-24"
                          >
                            {generatingPOD === job.id ? (
                              "Generating..."
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                POD
                              </>
                            )}
                          </Button>
                        )}
                        
                        {!showPOC && !showPOD && (
                          <Badge variant="outline">
                            Job not ready for documents
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <CardDescription>
                      {job.status === 'collected' && "POC available for download"}
                      {job.status === 'delivered' && "POC and POD available for download"}
                      {['invoiced', 'paid'].includes(job.status) && "All documents available"}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}