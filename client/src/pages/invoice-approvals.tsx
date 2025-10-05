import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Job, Customer, Driver, Vehicle } from "@shared/schema";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface Expense {
  id: string;
  type: string;
  amount: string;
  isApproved: boolean;
  chargeToCustomer: boolean;
  notes?: string;
}

// Component to show expenses summary for a job
function ExpensesSummary({ jobId }: { jobId: string }) {
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: [`/api/jobs/${jobId}/expenses`],
  });

  const approvedExpenses = expenses?.filter((exp: any) => exp.isApproved && exp.chargeToCustomer) || [];
  const expensesTotal = approvedExpenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);

  if (approvedExpenses.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Expenses: £0.00
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="text-gray-900 font-medium">
        Expenses: £{expensesTotal.toFixed(2)}
      </div>
      <div className="text-gray-500 text-xs">
        {approvedExpenses.map((exp: any) => `${exp.type}: £${exp.amount}`).join(', ')}
      </div>
    </div>
  );
}

// Component for sending invoice with total calculation
function TotalWithExpenses({ job, onSendInvoice, isLoading }: { 
  job: JobWithRelations; 
  onSendInvoice: () => void; 
  isLoading: boolean;
}) {
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: [`/api/jobs/${job.id}/expenses`],
  });

  const approvedExpenses = expenses?.filter((exp: any) => exp.isApproved && exp.chargeToCustomer) || [];
  const expensesTotal = approvedExpenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
  const movementFee = parseFloat(job.totalMovementFee || '0');
  const grandTotal = movementFee + expensesTotal;

  const hasEmailRecipients = job.customer?.defaultInvoiceEmails && job.customer.defaultInvoiceEmails.length > 0;
  
  return (
    <Button
      onClick={onSendInvoice}
      disabled={isLoading || !hasEmailRecipients}
      className="bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
      title={`Total: £${grandTotal.toFixed(2)} (Movement: £${movementFee.toFixed(2)} + Expenses: £${expensesTotal.toFixed(2)})`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
          Sending...
        </>
      ) : (
        <>
          <Send className="h-3 w-3 mr-2" />
          Send £{grandTotal.toFixed(2)}
        </>
      )}
    </Button>
  );
}

export default function InvoiceApprovalsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery<JobWithRelations[]>({
    queryKey: ["/api/jobs"],
    staleTime: 0,
    gcTime: 0,
  });

  // Get invoices to check which jobs already have sent invoices
  const { data: invoices } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
    staleTime: 0,
    gcTime: 0,
  });

  // Filter to only delivered jobs that don't have sent invoices yet (ready for invoice approval)
  const deliveredJobs = jobs ? jobs.filter((job: JobWithRelations) => {
    // Only show delivered jobs
    if (job.status !== 'delivered') return false;
    
    // Check if this job already has an invoice (meaning it's been sent)
    const hasInvoice = invoices?.some(invoice => 
      invoice.jobId === job.id || 
      invoice.invoiceNumber === job.jobNumber
    );
    
    // Exclude jobs that already have invoices
    if (hasInvoice) return false;
    
    // Apply search filter
    return (job.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.vehicle?.registration?.toLowerCase().includes(searchTerm.toLowerCase()));
  }) : [];

  // Invoice email mutation
  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async ({ jobId, invoiceNumber, totalAmount }: { jobId: string, invoiceNumber: string, totalAmount: string }) => {
      return await apiRequest(`/api/jobs/${jobId}/send-invoice-email`, 'POST', {
        invoiceNumber,
        totalAmount
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Invoice Email Sent Successfully",
        description: `Invoice ${variables.invoiceNumber} has been emailed to customer recipients`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Invoice Email",
        description: error?.message || "An error occurred while sending the invoice email",
        variant: "destructive"
      });
    }
  });

  const handleSendInvoiceEmail = (job: JobWithRelations) => {
    const invoiceNumber = job.jobNumber; // Remove INV- prefix here too
    const totalAmount = job.totalMovementFee || '0';
    
    sendInvoiceEmailMutation.mutate({
      jobId: job.id,
      invoiceNumber,
      totalAmount
    });
  };

  const handlePreviewInvoice = async (jobId: string) => {
    try {
      // Make authenticated request to get PDF
      const response = await fetch(`/api/jobs/${jobId}/invoice-preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice preview');
      }

      // Get PDF blob and create object URL
      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window
      window.open(pdfUrl, '_blank');
      
      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice preview",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-64"></div>
            <div className="h-64 bg-white rounded-lg shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Approvals</h1>
              <p className="mt-2 text-gray-600">
                Review and approve invoice emails for delivered jobs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                <Clock className="h-3 w-3 mr-1" />
                {deliveredJobs.length} Awaiting Approval
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by job number, customer, or vehicle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Jobs Ready for Invoice Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deliveredJobs.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  All Caught Up!
                </h3>
                <p className="text-gray-600">
                  {jobs?.length === 0 
                    ? "No jobs found."
                    : searchTerm 
                    ? "No delivered jobs match your search criteria."
                    : "No delivered jobs awaiting invoice approval."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount & Expenses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveredJobs.map((job: JobWithRelations) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <Link href={`/admin/jobs/${job.jobNumber}`}>
                              <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                                {job.jobNumber}
                              </div>
                            </Link>
                            <div className="text-sm text-gray-500">
                              Delivered: {job.deliveredAt ? new Date(job.deliveredAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {job.customer?.name || 'N/A'}
                          </div>
                          {job.customer?.email && (
                            <div className="text-sm text-gray-500">
                              {job.customer.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {job.vehicle?.registration || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.vehicle?.make} {job.vehicle?.model}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {job.customer?.defaultInvoiceEmails && job.customer.defaultInvoiceEmails.length > 0 ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  Primary: {job.customer.defaultInvoiceEmails[0]}
                                </div>
                                {job.customer.defaultInvoiceEmails.length > 1 && (
                                  <div className="text-gray-500">
                                    +{job.customer.defaultInvoiceEmails.length - 1} BCC
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-600">
                                <AlertCircle className="h-3 w-3" />
                                <span className="text-xs">No email configured</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Movement: £{job.totalMovementFee || '0'}
                            </div>
                            <ExpensesSummary jobId={job.id} />
                            {job.calculatedMileage && (
                              <div className="text-sm text-gray-500">
                                {Math.ceil(parseFloat(job.calculatedMileage))} miles
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewInvoice(job.id)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <TotalWithExpenses 
                              job={job} 
                              onSendInvoice={() => handleSendInvoiceEmail(job)}
                              isLoading={sendInvoiceEmailMutation.isPending}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Admin Approval Process</p>
              <p className="mt-1">
                Invoice emails require manual approval and are sent only after admin review. 
                Each email includes a professional PDF invoice with job details and any approved expenses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}