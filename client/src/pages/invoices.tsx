import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, FileText, Download, Check, PoundSterling, Send, Package, Plus, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Job, Customer, InvoiceBundle } from "@shared/schema";

interface InvoiceWithRelations extends Invoice {
  job?: Job;
  customer?: Customer;
}

interface BundleWithData extends InvoiceBundle {
  customer?: Customer;
  invoiceCount?: number;
  invoices?: (Invoice & { job?: Job })[];
}

export default function InvoicesContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showCreateBundle, setShowCreateBundle] = useState(false);
  const [showBundleConfirm, setShowBundleConfirm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery<InvoiceWithRelations[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: bundles } = useQuery<BundleWithData[]>({
    queryKey: ["/api/bundles"],
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest(`/api/jobs/${jobId}/invoice`, "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Invoice generated",
        description: "Invoice has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest(`/api/invoices/${invoiceId}`, "PATCH", {
        isPaid: true,
        paidAt: new Date().toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice marked as paid",
        description: "Invoice status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update invoice",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest(`/api/invoices/${invoiceId}/send-email`, "POST");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invoice email sent",
        description: "Invoice has been sent to customer successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send invoice email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBundleMutation = useMutation({
    mutationFn: async ({ invoiceIds, customerId }: { invoiceIds: string[], customerId: string }) => {
      const response = await apiRequest("/api/bundles", "POST", { invoiceIds, customerId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      setSelectedInvoices([]);
      setShowCreateBundle(false);
      setShowBundleConfirm(false);
      toast({
        title: "Bundle created successfully",
        description: `Bundle ${data.bundle.bundleNumber} created with ${data.invoiceCount} invoices`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create bundle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBundleStatusMutation = useMutation({
    mutationFn: async ({ bundleId, status }: { bundleId: string, status: string }) => {
      const response = await apiRequest(`/api/bundles/${bundleId}/status`, "PATCH", { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundles"] });
      toast({
        title: "Bundle status updated",
        description: "Bundle status has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update bundle status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = invoices?.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.job?.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "paid" && invoice.isPaid) ||
      (statusFilter === "unpaid" && !invoice.isPaid) ||
      (statusFilter === "bundled" && invoice.bundleId) ||
      (statusFilter === "unbundled" && !invoice.bundleId);
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Bundle selection logic
  const selectedInvoiceData = filteredInvoices.filter(inv => selectedInvoices.includes(inv.id));
  const selectedCustomers = [...new Set(selectedInvoiceData.map(inv => inv.customerId).filter(Boolean))];
  const canCreateBundle = selectedInvoices.length > 1 && selectedCustomers.length === 1 && 
    selectedInvoiceData.every(inv => !inv.bundleId && !inv.isPaid);
  const selectedTotal = selectedInvoiceData.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  const handleInvoiceSelect = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAllForCustomer = (customerId: string) => {
    const customerInvoices = filteredInvoices.filter(inv => 
      inv.customerId === customerId && !inv.bundleId && !inv.isPaid
    );
    const customerInvoiceIds = customerInvoices.map(inv => inv.id);
    
    // If all customer invoices are selected, deselect them
    const allSelected = customerInvoiceIds.every(id => selectedInvoices.includes(id));
    
    if (allSelected) {
      setSelectedInvoices(prev => prev.filter(id => !customerInvoiceIds.includes(id)));
    } else {
      setSelectedInvoices(prev => {
        const newSelection = [...prev];
        customerInvoiceIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleCreateBundle = () => {
    if (!canCreateBundle) return;
    
    const customerId = selectedInvoiceData[0].customerId!;
    createBundleMutation.mutate({ invoiceIds: selectedInvoices, customerId });
  };

  const clearSelection = () => {
    setSelectedInvoices([]);
  };

  // Get jobs that can be invoiced (delivered but not yet invoiced)
  const invoiceableJobs = jobs?.filter((job) => 
    job.status === 'delivered' && !invoices?.some(inv => inv.jobId === job.id)
  ) || [];

  const totalInvoices = invoices?.length || 0;
  const paidInvoices = invoices?.filter(i => i.isPaid).length || 0;
  const unpaidInvoices = invoices?.filter(i => !i.isPaid).length || 0;
  const totalValue = invoices?.reduce((sum, i) => sum + Number(i.totalAmount), 0) || 0;
  const outstandingValue = invoices?.filter(i => !i.isPaid).reduce((sum, i) => sum + Number(i.totalAmount), 0) || 0;

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
        <p className="text-gray-600 mt-1">Manage invoicing and payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpaid</p>
                <p className="text-2xl font-bold text-gray-900">{unpaidInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <PoundSterling className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">£{totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-100 rounded-lg">
                <PoundSterling className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">£{outstandingValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Invoice */}
      {invoiceableJobs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-green-700">
              Ready to Invoice ({invoiceableJobs.length} jobs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {invoiceableJobs.map((job: any) => (
                <div key={job.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{job.jobNumber}</h3>
                      <p className="text-sm text-gray-600">{job.customer?.name}</p>
                      <p className="text-sm font-medium text-green-700">£{job.totalMovementFee}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => generateInvoiceMutation.mutate(job.id)}
                      disabled={generateInvoiceMutation.isPending}
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number, job, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="bundled">Bundled</SelectItem>
                <SelectItem value="unbundled">Unbundled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Selection Bar */}
      {selectedInvoices.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedInvoices.length} invoice{selectedInvoices.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                {selectedInvoices.length > 0 && (
                  <div className="text-sm text-blue-700">
                    Total: £{selectedTotal.toFixed(2)}
                  </div>
                )}
                {selectedCustomers.length > 1 && (
                  <div className="flex items-center space-x-1 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Multiple customers selected</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {canCreateBundle && (
                  <Button 
                    onClick={() => setShowBundleConfirm(true)}
                    disabled={createBundleMutation.isPending}
                    data-testid="button-create-bundle"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Create Bundle
                  </Button>
                )}
                <Button variant="outline" onClick={clearSelection} data-testid="button-clear-selection">
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
            {!canCreateBundle && selectedInvoices.length > 0 && (
              <div className="mt-2 text-sm text-amber-600">
                {selectedCustomers.length > 1 ? 
                  "All selected invoices must belong to the same customer" :
                  selectedInvoices.length === 1 ? 
                    "Select at least 2 invoices to create a bundle" :
                    "Selected invoices contain paid or already bundled items"
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bundle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      {invoices?.length === 0 
                        ? "No invoices generated yet"
                        : "No invoices match your search criteria"
                      }
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const canSelect = !invoice.bundleId && !invoice.isPaid;
                    const customerInvoices = filteredInvoices.filter(inv => 
                      inv.customerId === invoice.customerId && !inv.bundleId && !inv.isPaid
                    );
                    const customerInvoiceIds = customerInvoices.map(inv => inv.id);
                    const allCustomerSelected = customerInvoiceIds.length > 1 && 
                      customerInvoiceIds.every(id => selectedInvoices.includes(id));
                    
                    return (
                      <tr key={invoice.id} className={`hover:bg-gray-50 ${
                        selectedInvoices.includes(invoice.id) ? 'bg-blue-50' : ''
                      }`}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <Checkbox
                              checked={selectedInvoices.includes(invoice.id)}
                              onCheckedChange={(checked) => handleInvoiceSelect(invoice.id, checked as boolean)}
                              disabled={!canSelect}
                              data-testid={`checkbox-invoice-${invoice.id}`}
                            />
                            {customerInvoices.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleSelectAllForCustomer(invoice.customerId!)}
                                data-testid={`button-select-all-${invoice.customerId}`}
                                title={allCustomerSelected ? "Deselect all for customer" : "Select all for customer"}
                              >
                                {allCustomerSelected ? "Deselect" : "All"}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.customer?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{Number(invoice.totalAmount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={invoice.isPaid ? "default" : "secondary"}>
                          {invoice.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                        {invoice.isPaid && invoice.paidAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(invoice.paidAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {invoice.bundleId ? (
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            <Package className="h-3 w-3 mr-1" />
                            Bundled
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/invoices/${invoice.id}/pdf`;
                              link.download = `${invoice.invoiceNumber}.pdf`;
                              link.click();
                            }}
                            data-testid={`button-download-${invoice.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => sendInvoiceEmailMutation.mutate(invoice.id)}
                            disabled={sendInvoiceEmailMutation.isPending}
                            data-testid={`button-send-email-${invoice.id}`}
                            title="Send invoice email to customer"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          {!invoice.isPaid && (
                            <Button 
                              size="sm"
                              onClick={() => markPaidMutation.mutate(invoice.id)}
                              disabled={markPaidMutation.isPending}
                              data-testid={`button-mark-paid-${invoice.id}`}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Paid
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bundle Management Section */}
      {bundles && bundles.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Invoice Bundles ({bundles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bundle Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bundles.map((bundle) => (
                    <tr key={bundle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {bundle.bundleNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bundle.customer?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bundle.invoiceCount || 0} invoice{(bundle.invoiceCount || 0) !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          £{Number(bundle.totalAmount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select 
                          value={bundle.status}
                          onValueChange={(status) => updateBundleStatusMutation.mutate({ bundleId: bundle.id, status })}
                          disabled={updateBundleStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bundle.createdAt ? new Date(bundle.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/bundles/${bundle.id}/pdf`;
                              link.download = `Bundle-${bundle.bundleNumber}.pdf`;
                              link.click();
                            }}
                            data-testid={`button-download-bundle-${bundle.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bundle Creation Confirmation Dialog */}
      <AlertDialog open={showBundleConfirm} onOpenChange={setShowBundleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Invoice Bundle</AlertDialogTitle>
            <AlertDialogDescription>
              Create a bundle with {selectedInvoices.length} selected invoices?
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{selectedInvoiceData[0]?.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total invoices:</span>
                    <span className="font-medium">{selectedInvoices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total amount:</span>
                    <span className="font-medium">£{selectedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCreateBundle}
              disabled={createBundleMutation.isPending}
              data-testid="button-confirm-create-bundle"
            >
              {createBundleMutation.isPending ? "Creating..." : "Create Bundle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
