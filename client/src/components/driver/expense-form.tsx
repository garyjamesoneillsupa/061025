import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Receipt, 
  Camera, 
  Fuel, 
  Train, 
  Bus,
  Car,
  Package,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Simplified expense form schema
const expenseFormSchema = z.object({
  type: z.enum(["fuel", "train", "bus", "taxi", "other"], {
    required_error: "Please select an expense type",
  }),
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  description: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === "other" && !data.description) {
      return false;
    }
    return true;
  },
  {
    message: "Description is required for 'other' expenses",
    path: ["description"],
  }
);

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  jobId: string;
  driverId: string;
  jobNumber: string;
  vehicleRegistration: string;
  onSuccess?: () => void;
}

export default function ExpenseForm({ 
  jobId, 
  driverId, 
  jobNumber,
  vehicleRegistration,
  onSuccess 
}: ExpenseFormProps) {
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch job with vehicle info to get DVLA fuel type
  const { data: jobData } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId,
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      type: undefined,
      amount: "",
      description: "",
    },
  });

  const selectedType = form.watch("type");
  const autoFuelType = (jobData as any)?.vehicle?.fuelType || 'Not available';

  // Submit expense mutation
  const submitExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData & { receiptPhoto: File }) => {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('driverId', driverId);
      formData.append('type', data.type);
      formData.append('amount', data.amount);
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('receiptPhoto', data.receiptPhoto);
      formData.append('stage', 'collection');

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit expense');
      }

      return response.json();
    },
    onSuccess: () => {
      setSubmissionSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      toast({
        title: "Expense Submitted",
        description: "Your expense has been recorded successfully.",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit expense. Please try again.",
      });
    }
  });

  const handleSubmit = (data: ExpenseFormData) => {
    if (!receiptPhoto) {
      toast({
        variant: "destructive",
        title: "Receipt Photo Required",
        description: "Please take a photo of the receipt before submitting.",
      });
      return;
    }

    submitExpenseMutation.mutate({
      ...data,
      receiptPhoto,
    });
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptPhoto(file);
      toast({
        title: "Receipt Photo Captured",
        description: "Photo ready for submission",
      });
    }
  };

  if (submissionSuccess) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Expense Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Your expense has been recorded and is pending approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getExpenseIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <Fuel className="w-5 h-5" />;
      case 'train': return <Train className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      case 'taxi': return <Car className="w-5 h-5" />;
      case 'other': return <Package className="w-5 h-5" />;
      default: return <Receipt className="w-5 h-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Submit Expense
        </CardTitle>
        <div className="text-sm font-medium text-gray-700 mt-2 p-3 bg-slate-100 rounded-md border border-slate-200">
          {jobNumber} ({vehicleRegistration})
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Expense Type Dropdown */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expense Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    data-testid="select-expense-type"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select expense type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fuel">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-4 h-4" />
                          Fuel
                        </div>
                      </SelectItem>
                      <SelectItem value="train">
                        <div className="flex items-center gap-2">
                          <Train className="w-4 h-4" />
                          Train
                        </div>
                      </SelectItem>
                      <SelectItem value="bus">
                        <div className="flex items-center gap-2">
                          <Bus className="w-4 h-4" />
                          Bus
                        </div>
                      </SelectItem>
                      <SelectItem value="taxi">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4" />
                          Taxi
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Other
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Auto-filled Fuel Type (read-only, only for fuel expenses) */}
            {selectedType === 'fuel' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="text-sm font-medium text-blue-900">
                  Fuel Type (Auto-filled from DVLA)
                </Label>
                <div className="mt-1 text-lg font-semibold text-blue-700">
                  {autoFuelType}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Automatically populated from vehicle registration data
                </p>
              </div>
            )}

            {/* Description (only for "other" type) */}
            {selectedType === 'other' && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the expense (e.g., parking, tolls, etc.)"
                        className="min-h-[80px]"
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (£)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-8"
                        {...field}
                        data-testid="input-amount"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Receipt Photo */}
            <div className="space-y-2">
              <Label>Payment Proof (Receipt Photo) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {receiptPhoto ? (
                  <div className="space-y-3">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-900">
                      Receipt photo captured
                    </p>
                    <p className="text-xs text-gray-500">
                      {receiptPhoto.name}
                    </p>
                    <label htmlFor="receipt-retake">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('receipt-retake')?.click()}
                        data-testid="button-retake-photo"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Retake Photo
                      </Button>
                      <input
                        id="receipt-retake"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoCapture}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label htmlFor="receipt-photo">
                    <div className="cursor-pointer">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Take Receipt Photo
                      </p>
                      <p className="text-xs text-gray-500">
                        Required for all expenses
                      </p>
                      <Button
                        type="button"
                        size="lg"
                        className="mt-4"
                        onClick={() => document.getElementById('receipt-photo')?.click()}
                        data-testid="button-capture-receipt"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Receipt
                      </Button>
                    </div>
                    <input
                      id="receipt-photo"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoCapture}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Info Alert */}
            {selectedType && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-sm text-blue-900">
                  {selectedType === 'fuel' && 'Fuel type will be automatically populated from vehicle data. Just enter the amount and upload receipt.'}
                  {selectedType === 'train' && 'Enter the train fare amount and upload the ticket/receipt.'}
                  {selectedType === 'bus' && 'Enter the bus fare amount and upload the ticket/receipt.'}
                  {selectedType === 'taxi' && 'Enter the taxi fare amount and upload the receipt.'}
                  {selectedType === 'other' && 'Provide a description of the expense, amount, and upload the receipt.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitExpenseMutation.isPending || !receiptPhoto}
              data-testid="button-submit-expense"
            >
              {submitExpenseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5 mr-2" />
                  Submit Expense
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
