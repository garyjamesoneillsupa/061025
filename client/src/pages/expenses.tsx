import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Receipt, TrendingUp, PoundSterling, Clock, Search, FileText, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Expense {
  id: string;
  type: "fuel" | "train" | "uber" | "misc";
  jobId: string;
  driverId: string;
  driverName: string;
  item: string;
  amount: string;
  notes?: string;
  fuelType?: string;
  receiptPhotoPath?: string;
  isApproved: boolean;
  chargeToCustomer: boolean;
  submittedAt: string;
  job?: {
    jobNumber: string;
    customer?: { name: string };
  };
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `£${num.toFixed(2)}`;
};

const getExpenseTypeColor = (type: string) => {
  switch (type) {
    case 'fuel':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'train':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'uber':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'misc':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [addToInvoice, setAddToInvoice] = useState<boolean | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [selectedReceiptPath, setSelectedReceiptPath] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: allExpenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { expenseId: string; chargeToCustomer: boolean }) => {
      return apiRequest('PATCH', `/api/expenses/${data.expenseId}/approve`, {
        approvedBy: 'admin', // TODO: Get from authenticated admin session
        chargeToCustomer: data.chargeToCustomer
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setSelectedExpense(null);
      setAddToInvoice(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve expense. Please try again.",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { expenseId: string; reason?: string }) => {
      return apiRequest('PATCH', `/api/expenses/${data.expenseId}`, {
        isApproved: false,
        approvedBy: null,
        rejectionReason: data.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setSelectedExpense(null);
      setActionType(null);
      setRejectReason("");
      setAddToInvoice(null);
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Failed to reject expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (selectedExpense && addToInvoice !== null) {
      approveMutation.mutate({
        expenseId: selectedExpense.id,
        chargeToCustomer: addToInvoice
      });
    } else {
      toast({
        title: "Selection Required",
        description: "Please select whether to add this expense to invoice.",
        variant: "destructive",
      });
    }
  };

  const handleReject = () => {
    if (selectedExpense && rejectReason.trim()) {
      rejectMutation.mutate({
        expenseId: selectedExpense.id,
        reason: rejectReason.trim(),
      });
    }
  };

  const pendingExpenses = allExpenses.filter(expense => !expense.isApproved);
  const approvedExpenses = allExpenses.filter(expense => expense.isApproved);

  const filteredPending = pendingExpenses.filter(expense =>
    expense.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.job?.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.job?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredApproved = approvedExpenses.filter(expense =>
    expense.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.job?.jobNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.job?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate expense statistics
  const totalPending = pendingExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalApproved = approvedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const customerChargeableApproved = approvedExpenses
    .filter(exp => exp.chargeToCustomer)
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-1">Review and approve driver expenses before invoice generation</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-600 mt-2">Review and approve driver expenses before invoice generation</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-[#00ABE7]">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-gray-500">{pendingExpenses.length} items</p>
              </div>
              <div className="p-3 bg-[#00ABE7]/10 rounded-full">
                <Clock className="h-6 w-6 text-[#00ABE7]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</p>
                <p className="text-xs text-gray-500">{approvedExpenses.length} items</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Customer Chargeable</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(customerChargeableApproved)}</p>
                <p className="text-xs text-gray-500">Ready to invoice</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PoundSterling className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Avg. Amount</p>
                <p className="text-2xl font-bold text-purple-600">
                  {allExpenses.length > 0 ? formatCurrency(allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0) / allExpenses.length) : '£0.00'}
                </p>
                <p className="text-xs text-gray-500">Per expense</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card className="mb-6 border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search expenses by item, driver, job number, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#00ABE7] focus:ring-[#00ABE7] transition-colors duration-200"
              />
            </div>
            {searchTerm && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="bg-[#00ABE7] hover:bg-[#00ABE7]/90 whitespace-nowrap"
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
          <TabsList className="grid w-full grid-cols-2 bg-white h-auto p-4 gap-4 rounded-lg border-0">
            <TabsTrigger 
              value="pending" 
              className="flex items-center justify-center gap-3 h-12 px-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium bg-white data-[state=active]:border-[#00ABE7] data-[state=active]:bg-[#00ABE7] data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 data-[state=active]:hover:text-white"
            >
              <Clock className="h-4 w-4" />
              Pending Approval
              <span className="ml-2 px-2 py-1 text-xs bg-[#00ABE7] text-white rounded-full font-semibold data-[state=active]:bg-white data-[state=active]:text-[#00ABE7]">
                {pendingExpenses.length}
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="flex items-center justify-center gap-3 h-12 px-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 font-medium bg-white data-[state=active]:border-green-500 data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 hover:text-gray-900 data-[state=active]:hover:text-white"
            >
              <CheckCircle className="h-4 w-4" />
              Approved
              <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full font-semibold data-[state=active]:bg-white data-[state=active]:text-green-500">
                {approvedExpenses.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Card>

        <TabsContent value="pending" className="space-y-4">
          {filteredPending.length === 0 ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Expenses</h3>
                    <p className="text-gray-600">All expenses have been reviewed and approved.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPending.map((expense) => (
              <Card key={expense.id} className="border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header Section with Type and Amount */}
                  <div className="bg-gradient-to-r from-[#00ABE7]/10 to-[#00ABE7]/5 border-l-4 border-l-[#00ABE7] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getExpenseTypeColor(expense.type)} text-sm px-3 py-1 font-semibold`} variant="outline">
                          {expense.type === 'fuel' && expense.fuelType 
                            ? `${expense.fuelType.toUpperCase()}`
                            : expense.type.toUpperCase()}
                        </Badge>
                        <div className="text-3xl font-bold text-[#00ABE7]">{formatCurrency(expense.amount)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {expense.chargeToCustomer === true && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 px-3 py-1">
                            Customer Chargeable
                          </Badge>
                        )}
                        {expense.receiptPhotoPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              setSelectedReceiptPath(expense.receiptPhotoPath || null);
                              setReceiptDialogOpen(true);
                            }}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid Section */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Item</p>
                        <p className="text-base font-semibold text-gray-900">
                          {expense.type === 'fuel' && expense.fuelType 
                            ? expense.fuelType === 'electric_charge' 
                              ? 'Electric Charge' 
                              : expense.fuelType.charAt(0).toUpperCase() + expense.fuelType.slice(1)
                            : expense.item || expense.type.charAt(0).toUpperCase() + expense.type.slice(1)
                          }
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Driver</p>
                        <p className="text-base font-semibold text-gray-900">{expense.driverName || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Number</p>
                        <p className="text-base font-semibold text-gray-900">{expense.job?.jobNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</p>
                        <p className="text-base font-semibold text-gray-900">{expense.job?.customer?.name || 'N/A'}</p>
                      </div>
                    </div>

                    {expense.notes && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{expense.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex-1"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setActionType('approve');
                              setAddToInvoice(null);
                            }}
                            data-testid={`button-approve-${expense.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Expense</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Approving expense for <strong>{formatCurrency(expense.amount)}</strong></p>
                            
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Please specify whether this expense should be added to the customer invoice or absorbed by the company.
                              </AlertDescription>
                            </Alert>
                            
                            <div className="space-y-3">
                              <Label className="text-base font-medium">Add to Invoice?</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="addToInvoice-yes"
                                    checked={addToInvoice === true}
                                    onCheckedChange={() => setAddToInvoice(true)}
                                  />
                                  <Label htmlFor="addToInvoice-yes" className="text-sm font-normal">
                                    <strong>Yes</strong> - Add to customer invoice (customer pays)
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="addToInvoice-no"
                                    checked={addToInvoice === false}
                                    onCheckedChange={() => setAddToInvoice(false)}
                                  />
                                  <Label htmlFor="addToInvoice-no" className="text-sm font-normal">
                                    <strong>No</strong> - Company absorbs cost (internal expense)
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleApprove}
                              disabled={approveMutation.isPending || addToInvoice === null}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 shadow-md hover:shadow-lg transition-all duration-200 flex-1"
                            onClick={() => {
                              setSelectedExpense(expense);
                              setActionType('reject');
                              setRejectReason("");
                            }}
                            data-testid={`button-reject-${expense.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Expense</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to reject this expense for <strong>{formatCurrency(expense.amount)}</strong>?</p>
                            <div className="space-y-2">
                              <Label htmlFor="rejection-reason">Reason for rejection</Label>
                              <Textarea
                                id="rejection-reason"
                                placeholder="Please provide a reason for rejecting this expense..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleReject}
                              disabled={rejectMutation.isPending || !rejectReason.trim()}
                              variant="destructive"
                            >
                              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {filteredApproved.length === 0 ? (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Expenses</h3>
                    <p className="text-gray-600">No expenses have been approved yet.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredApproved.map((expense) => (
              <Card key={expense.id} className="border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  {/* Header Section with Type and Amount */}
                  <div className="bg-gradient-to-r from-green-50 to-green-25 border-l-4 border-l-green-500 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getExpenseTypeColor(expense.type)} text-sm px-3 py-1 font-semibold`} variant="outline">
                          {expense.type === 'fuel' && expense.fuelType 
                            ? `${expense.fuelType.toUpperCase()}`
                            : expense.type.toUpperCase()}
                        </Badge>
                        <div className="text-3xl font-bold text-green-600">{formatCurrency(expense.amount)}</div>
                        <Badge className="bg-green-100 text-green-800 border-green-300 px-3 py-1 font-semibold" variant="outline">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          APPROVED
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {expense.chargeToCustomer === true && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 px-3 py-1">
                            Customer Chargeable
                          </Badge>
                        )}
                        {expense.receiptPhotoPath && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 transition-colors"
                            onClick={() => {
                              setSelectedReceiptPath(expense.receiptPhotoPath || null);
                              setReceiptDialogOpen(true);
                            }}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            View Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid Section */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Item</p>
                        <p className="text-base font-semibold text-gray-900">
                          {expense.type === 'fuel' && expense.fuelType 
                            ? expense.fuelType === 'electric_charge' 
                              ? 'Electric Charge' 
                              : expense.fuelType.charAt(0).toUpperCase() + expense.fuelType.slice(1)
                            : expense.item || expense.type.charAt(0).toUpperCase() + expense.type.slice(1)
                          }
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Driver</p>
                        <p className="text-base font-semibold text-gray-900">{expense.driverName || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job Number</p>
                        <p className="text-base font-semibold text-gray-900">{expense.job?.jobNumber || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</p>
                        <p className="text-base font-semibold text-gray-900">{expense.job?.customer?.name || 'N/A'}</p>
                      </div>
                    </div>

                    {expense.notes && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-4">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{expense.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Receipt Preview Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReceiptPath ? (
              <div className="flex flex-col items-center space-y-4">
                <img 
                  src={`/${selectedReceiptPath}`}
                  alt="Receipt"
                  className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.alt = 'Receipt not available';
                    e.currentTarget.className = 'w-full h-64 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg';
                  }}
                />
                <p className="text-sm text-gray-500">Click outside or press ESC to close</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Receipt className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-gray-600">No receipt available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}