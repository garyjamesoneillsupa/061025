import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BundleStripePaymentForm } from "@/components/payment/bundle-stripe-payment-form";
import { Loader2, FileText, Calendar, Receipt, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BundlePaymentPageProps {
  bundleId: string;
}

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  movementFee: string;
  expensesTotal: string;
  totalAmount: string;
  isPaid: boolean;
  job?: {
    id: string;
    jobNumber: string;
    collectionAddress: any;
    deliveryAddress: any;
  };
}

interface BundleData {
  id: string;
  bundleNumber: string;
  totalAmount: string;
  status: 'draft' | 'sent' | 'paid';
  createdAt: string;
  paidAt?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  invoices?: InvoiceItem[];
}

function BundlePaymentPageContent({ bundleId }: BundlePaymentPageProps) {
  const [, navigate] = useLocation();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch bundle details
  const { data: bundle, isLoading, error } = useQuery<BundleData>({
    queryKey: ['bundle', bundleId],
    queryFn: async () => {
      const response = await fetch(`/api/bundles/${bundleId}`);
      if (!response.ok) {
        throw new Error('Bundle not found');
      }
      return response.json();
    },
  });

  // Payment confirmation mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const response = await fetch(`/api/bundles/${bundleId}/payment-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment confirmation failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setPaymentSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['bundle', bundleId] });
    },
  });

  const handlePaymentSuccess = (paymentIntentId: string) => {
    confirmPaymentMutation.mutate(paymentIntentId);
  };

  const handleCancel = () => {
    setShowPaymentForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading bundle details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Bundle Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                The requested invoice bundle could not be found or is not available for payment.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bundle) {
    return null;
  }

  // Check if bundle is already paid
  if (bundle.status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Complete
            </CardTitle>
            <CardDescription>
              Bundle {bundle.bundleNumber} has already been paid.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                This bundle was paid on {bundle.paidAt ? new Date(bundle.paidAt).toLocaleDateString() : 'Unknown date'}.
                All invoices in this bundle have been marked as paid.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if bundle is not in 'sent' status
  if (bundle.status !== 'sent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Payment Not Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                This bundle is not currently available for payment. Please contact us if you believe this is an error.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Successful
            </CardTitle>
            <CardDescription>
              Your payment for bundle {bundle.bundleNumber} has been processed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment of £{parseFloat(bundle.totalAmount).toFixed(2)} has been received. 
                All {bundle.invoices?.length || 0} invoices in this bundle have been marked as paid.
                You will receive a confirmation email shortly.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment form
  if (showPaymentForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <BundleStripePaymentForm
            bundleId={bundleId}
            amount={parseFloat(bundle.totalAmount)}
            bundleNumber={bundle.bundleNumber}
            invoiceCount={bundle.invoices?.length || 0}
            customerName={bundle.customer?.name || 'Customer'}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    );
  }

  // Main bundle payment page
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Bundle Payment</h1>
          <p className="text-gray-600">Review and pay for your invoice bundle</p>
        </div>

        {/* Bundle Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bundle {bundle.bundleNumber}
                </CardTitle>
                <CardDescription>
                  Customer: {bundle.customer?.name || 'Unknown'}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Bundle Date</p>
                <p className="font-medium">
                  {new Date(bundle.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="font-medium">{bundle.invoices?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  £{parseFloat(bundle.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Included Invoices
            </CardTitle>
            <CardDescription>
              The following invoices are included in this bundle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bundle.invoices?.map((invoice, index) => (
                <div key={invoice.id}>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">Invoice {invoice.invoiceNumber}</h4>
                        {invoice.job && (
                          <Badge variant="outline" className="text-xs">
                            Job {invoice.job.jobNumber}
                          </Badge>
                        )}
                      </div>
                      {invoice.job && (
                        <div className="text-sm text-gray-600 mt-1">
                          <p>Collection: {typeof invoice.job.collectionAddress === 'string' 
                            ? invoice.job.collectionAddress 
                            : invoice.job.collectionAddress?.line1 || 'N/A'}</p>
                          <p>Delivery: {typeof invoice.job.deliveryAddress === 'string' 
                            ? invoice.job.deliveryAddress 
                            : invoice.job.deliveryAddress?.line1 || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">£{parseFloat(invoice.totalAmount).toFixed(2)}</p>
                      <div className="text-sm text-gray-500">
                        <p>Movement: £{parseFloat(invoice.movementFee).toFixed(2)}</p>
                        {parseFloat(invoice.expensesTotal) > 0 && (
                          <p>Expenses: £{parseFloat(invoice.expensesTotal).toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < (bundle.invoices?.length || 0) - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Pay the total amount for all invoices in this bundle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg mb-6">
              <span className="text-lg font-medium">Total Amount Due:</span>
              <span className="text-2xl font-bold text-blue-600">
                £{parseFloat(bundle.totalAmount).toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-4">
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  By proceeding with payment, all {bundle.invoices?.length || 0} invoices 
                  in this bundle will be automatically marked as paid.
                </AlertDescription>
              </Alert>
              
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowPaymentForm(true)}
                data-testid="button-pay-bundle"
              >
                Pay £{parseFloat(bundle.totalAmount).toFixed(2)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BundlePaymentPage({ bundleId }: BundlePaymentPageProps) {
  return <BundlePaymentPageContent bundleId={bundleId} />;
}