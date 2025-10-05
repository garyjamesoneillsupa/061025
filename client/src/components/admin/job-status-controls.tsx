import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStatusBgColor, getStatusLabel, type JobStatus } from "@shared/status-utils";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Customer } from "@shared/schema";

// Extended Job interface with customer relation
interface JobWithCustomer extends Job {
  customer?: Customer;
}

// The Job interface from schema already includes these fields
type JobWithFees = JobWithCustomer;

interface JobStatusControlsProps {
  job: JobWithFees;
  currentUserRole: string;
}

export default function JobStatusControls({ job, currentUserRole }: JobStatusControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // No manual invoice buttons needed - invoices auto-generated on abort/cancel
  
  // Dialog states
  const [showAbortDialog, setShowAbortDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [abortFee, setAbortFee] = useState("0");
  const [abortReason, setAbortReason] = useState("");
  const [cancellationFee, setCancellationFee] = useState("0");
  const [cancellationReason, setCancellationReason] = useState("");

  // Abort job mutation
  const abortJobMutation = useMutation({
    mutationFn: async (data: { abortFee: string; reason: string }) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/jobs/${job.id}/abort`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to abort job");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Aborted",
        description: `Job ${job.jobNumber} has been successfully aborted.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setShowAbortDialog(false);
      setAbortFee("0");
      setAbortReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to abort job",
        variant: "destructive",
      });
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (data: { cancellationFee: string; reason: string }) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/jobs/${job.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel job");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Cancelled",
        description: `Job ${job.jobNumber} has been successfully cancelled.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setShowCancelDialog(false);
      setCancellationFee("0");
      setCancellationReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel job",
        variant: "destructive",
      });
    },
  });

  const handleAbortSubmit = () => {
    if (!abortReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for aborting this job.",
        variant: "destructive",
      });
      return;
    }
    abortJobMutation.mutate({ abortFee, reason: abortReason });
  };

  const handleCancelSubmit = () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Reason Required", 
        description: "Please provide a reason for cancelling this job.",
        variant: "destructive",
      });
      return;
    }
    cancelJobMutation.mutate({ cancellationFee, reason: cancellationReason });
  };

  // Invoices automatically generated - no manual generation needed

  // Only show admin controls to admin users
  if (currentUserRole !== 'admin') {
    return (
      <Badge className={getStatusBgColor(job.status as JobStatus)}>
        {getStatusLabel(job.status as JobStatus)}
      </Badge>
    );
  }

  const canAbortOrCancel = ['created', 'assigned'].includes(job.status || '');
  const hasAbortFee = job.status === 'aborted' && job.abortFee && parseFloat(job.abortFee) > 0;
  const hasCancellationFee = job.status === 'cancelled' && job.cancellationFee && parseFloat(job.cancellationFee) > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={getStatusBgColor(job.status as JobStatus)}>
          {getStatusLabel(job.status as JobStatus)}
        </Badge>

        {/* Payment status badge for individual customers */}
        {job.customer?.customerType === 'individual' && (
          <>
            {job.paymentStatus === 'paid' ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Paid
              </Badge>
            ) : job.paymentStatus === 'pending' ? (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" />
                Payment Pending
              </Badge>
            ) : null}
          </>
        )}

        {/* Show warning if trying to assign unpaid individual customer job */}
        {job.customer?.customerType === 'individual' && 
         job.paymentStatus === 'pending' && 
         ['created'].includes(job.status || '') && (
          <Badge 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-300"
            title="Payment required before driver assignment"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Requires Payment
          </Badge>
        )}

        {/* Admin-only controls */}
        {canAbortOrCancel && (
          <>
            <Badge 
              className="bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer border-red-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAbortDialog(true);
              }}
            >
              Abort
            </Badge>

            <Badge 
              className="bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer border-orange-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCancelDialog(true);
              }}
            >
              Cancel
            </Badge>
          </>
        )}

        {/* Abort/Cancel fees automatically generate invoices - no manual buttons needed */}
      </div>

      {/* Show reason for cancelled/aborted jobs */}
      {(job.status === 'cancelled' && job.cancellationReason) && (
        <div className="px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs text-orange-800 max-w-64">
          <span className="font-medium">Reason:</span> {job.cancellationReason}
        </div>
      )}

      {(job.status === 'aborted' && job.abortReason) && (
        <div className="px-3 py-1 bg-red-50 border border-red-200 rounded-full text-xs text-red-800 max-w-64">
          <span className="font-medium">Reason:</span> {job.abortReason}
        </div>
      )}

      {/* Abort Dialog */}
      <Dialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abort Job #{job.jobNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="abortFee">Abort Fee (£)</Label>
              <Input
                id="abortFee"
                type="number"
                step="0.01"
                min="0"
                value={abortFee}
                onChange={(e) => setAbortFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="abortReason">Reason for Abort</Label>
              <Textarea
                id="abortReason"
                value={abortReason}
                onChange={(e) => setAbortReason(e.target.value)}
                placeholder="Please provide a reason for aborting this job..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAbortDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAbortSubmit}
                disabled={abortJobMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {abortJobMutation.isPending ? "Aborting..." : "Abort Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Job #{job.jobNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancellationFee">Cancellation Fee (£)</Label>
              <Input
                id="cancellationFee"
                type="number"
                step="0.01"
                min="0"
                value={cancellationFee}
                onChange={(e) => setCancellationFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="cancellationReason">Reason for Cancellation</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this job..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCancelSubmit}
                disabled={cancelJobMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {cancelJobMutation.isPending ? "Cancelling..." : "Cancel Job"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}