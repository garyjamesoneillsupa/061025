import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, DollarSign, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getStatusBgColor, getStatusLabel } from "@shared/status-utils";

export default function JobAbort() {
  const { jobNumber } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [abortFee, setAbortFee] = useState("0");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch job by job number
  const { data: job, isLoading } = useQuery({
    queryKey: ["/api/jobs/by-number", jobNumber],
    queryFn: () => apiRequest(`/api/jobs/by-number/${jobNumber}`)
  });

  const abortJobMutation = useMutation({
    mutationFn: (data: { abortFee: string; reason: string }) =>
      apiRequest(`/api/jobs/${job.id}/abort`, "POST", data),
    onSuccess: () => {
      toast({
        title: "Job Aborted",
        description: `Job ${jobNumber} has been successfully aborted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setLocation("/admin/jobs");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to abort job",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for aborting this job.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await abortJobMutation.mutateAsync({ abortFee, reason });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-4">Job #{jobNumber} could not be found.</p>
            <Button onClick={() => setLocation("/admin/jobs")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          onClick={() => setLocation("/admin/jobs")} 
          variant="outline" 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>
        
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Abort Job #{jobNumber}</h1>
          <Badge className={getStatusBgColor(job.status)}>
            {getStatusLabel(job.status)}
          </Badge>
        </div>
        <p className="text-gray-600">
          This action will permanently abort the job and set it to "Aborted" status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Customer</Label>
              <p className="font-medium">{job.customer?.name || 'No customer'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Vehicle</Label>
              <p className="font-medium">{job.vehicle?.registration || 'No vehicle'} ({job.vehicle?.make})</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Collection</Label>
              <p className="text-sm">{job.collectionAddress.city}, {job.collectionAddress.postcode}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Delivery</Label>
              <p className="text-sm">{job.deliveryAddress.city}, {job.deliveryAddress.postcode}</p>
            </div>
            {job.totalMovementFee && (
              <div>
                <Label className="text-sm text-gray-500">Original Fee</Label>
                <p className="font-medium text-green-600">£{job.totalMovementFee}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Abort Form */}
        <Card className="border-red-200 bg-red-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Abort Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reason" className="text-sm font-medium">
                  Reason for Abort <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter the reason for aborting this job..."
                  required
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="abortFee" className="text-sm font-medium">
                  Abort Fee (£)
                </Label>
                <div className="flex items-center mt-1">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <Input
                    id="abortFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={abortFee}
                    onChange={(e) => setAbortFee(e.target.value)}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  If a fee is set above £0, an invoice will be automatically generated.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/admin/jobs")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isSubmitting || !reason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? "Aborting Job..." : "Abort Job"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}