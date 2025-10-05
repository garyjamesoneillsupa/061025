import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// Initialize Stripe with public key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface BundleStripePaymentFormProps {
  bundleId: string;
  amount: number;
  bundleNumber: string;
  invoiceCount: number;
  customerName: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

function BundlePaymentFormContent({ 
  bundleId, 
  amount, 
  bundleNumber, 
  invoiceCount, 
  customerName, 
  onPaymentSuccess, 
  onCancel 
}: BundleStripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create bundle payment intent on the server
      const response = await fetch(`/api/bundles/${bundleId}/payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment intent");
      }

      const { clientSecret, paymentIntentId } = await response.json();

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm the payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || "Payment failed");
      } else if (result.paymentIntent?.status === "succeeded") {
        setSucceeded(true);
        onPaymentSuccess(paymentIntentId);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during payment");
    } finally {
      setProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  if (succeeded) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Successful
          </CardTitle>
          <CardDescription>
            Your payment of £{amount.toFixed(2)} for bundle {bundleNumber} has been processed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All {invoiceCount} invoices in this bundle have been marked as paid. 
              You will receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bundle Payment</CardTitle>
          <CardDescription>
            Bundle {bundleNumber} - {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount to Pay</label>
            <div className="text-2xl font-bold">£{amount.toFixed(2)}</div>
            <p className="text-sm text-gray-600">
              This will pay for all {invoiceCount} invoices in the bundle
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Card Details</label>
            <div className="p-3 border rounded-md">
              <CardElement options={cardStyle} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={processing}
            data-testid="button-cancel-bundle-payment"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || processing}
            className="flex-1"
            data-testid="button-submit-bundle-payment"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay £${amount.toFixed(2)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export function BundleStripePaymentForm(props: BundleStripePaymentFormProps) {
  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment System Not Configured</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The payment system is not configured. Please contact support.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={props.onCancel}>
            Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BundlePaymentFormContent {...props} />
    </Elements>
  );
}