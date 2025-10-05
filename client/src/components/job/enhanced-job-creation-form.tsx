import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { InlineFeedback, ActionFeedback } from "@/components/ui/feedback-indicator";
import { apiRequest } from "@/lib/queryClient";
import { Search, Plus, User, MapPin, Car, Calendar, FileText, ArrowRight, ArrowLeft, Check, X, CalendarIcon, Mail, Building2, CreditCard, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import CustomerAddressManager from "@/components/customer/customer-address-manager";
import type { Customer, Driver, CustomerAddress, Setting } from "@shared/schema";

// Enhanced form schema with customer creation
const jobFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  driverId: z.string().optional(),
  vehicleRegistration: z.string().min(1, "Vehicle registration is required"),
  requestedCollectionDate: z.string().min(1, "Collection date is required"),
  requestedDeliveryDate: z.string().min(1, "Delivery date is required"),
  collectionAddress: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  deliveryAddress: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  collectionContact: z.object({
    name: z.string().min(1, "Contact name is required"),
    phone: z.string().min(1, "Contact phone is required"),
    email: z.string().email("Valid email is required"),
    releaseCode: z.string().optional(),
    modelPin: z.string().optional(),
    notes: z.string().optional(),
  }),
  deliveryContact: z.object({
    name: z.string().min(1, "Contact name is required"),
    phone: z.string().min(1, "Contact phone is required"),
    email: z.string().email("Valid email is required"),
    notes: z.string().optional(),
  }),
  totalMovementFee: z.string().min(1, "Total movement fee is required"),
});

// Customer creation schema
const customerFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  customerType: z.enum(['business', 'individual']).default('business'),
  costPerMile: z.string().optional(),
  billingCompanyName: z.string().min(1, "Billing company name is required"),
  billingAddress: z.object({
    line1: z.string().min(1, "Billing address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "Billing city is required"),
    postcode: z.string().min(1, "Billing postcode is required"),
  }),
  defaultPocEmails: z.array(z.string().email("Valid email is required")).default([]),
  defaultPodEmails: z.array(z.string().email("Valid email is required")).default([]),
  defaultInvoiceEmails: z.array(z.string().email("Valid email is required")).default([]),
});

type JobFormData = z.infer<typeof jobFormSchema>;
type CustomerFormData = z.infer<typeof customerFormSchema>;

// Email Recipients Component for consistency with main customer form
function EmailRecipientsSection({ form, emailType, title, description }: { 
  form: any; 
  emailType: 'defaultPocEmails' | 'defaultPodEmails' | 'defaultInvoiceEmails'; 
  title: string; 
  description: string; 
}) {
  const [newEmail, setNewEmail] = useState('');
  const emails = form.watch(emailType) || [];

  const addEmail = () => {
    if (newEmail && !emails.includes(newEmail)) {
      const currentEmails = form.getValues(emailType) || [];
      form.setValue(emailType, [...currentEmails, newEmail]);
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const currentEmails = form.getValues(emailType) || [];
    form.setValue(emailType, currentEmails.filter((email: string) => email !== emailToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addEmail();
              }
            }}
            className="flex-1 h-8 text-sm"
          />
          <Button 
            type="button" 
            onClick={addEmail}
            disabled={!newEmail || emails.includes(newEmail)}
            size="sm"
            className="h-8"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        {emails.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Recipients:</div>
            <div className="flex flex-wrap gap-1">
              {emails.map((email: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EnhancedJobCreationFormProps {
  onClose: () => void;
  existingJob?: any;
}

const FORM_STEPS = [
  { id: 'customer', title: 'Customer', icon: User },
  { id: 'vehicle', title: 'Vehicle', icon: Car },
  { id: 'addresses', title: 'Addresses', icon: MapPin },
  { id: 'schedule', title: 'Schedule', icon: Calendar },
  { id: 'review', title: 'Review', icon: FileText },
] as const;

export default function EnhancedJobCreationForm({ onClose, existingJob }: EnhancedJobCreationFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [calculatedMileage, setCalculatedMileage] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [currentRate, setCurrentRate] = useState<number>(0.80);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAddressManager, setShowAddressManager] = useState(false);
  const [addressManagerContext, setAddressManagerContext] = useState<'all' | 'collection' | 'delivery'>('all');
  
  // Using inline feedback instead of toast notifications
  const queryClient = useQueryClient();

  // Fetch settings to get the default cost per mile rate
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Get the default cost per mile from settings array
  const getDefaultCostPerMile = () => {
    const defaultRateSetting = settings?.find(s => s.key === 'default_rate_per_mile');
    return defaultRateSetting?.value ? parseFloat(defaultRateSetting.value) : 0.80;
  };

  // Update currentRate when settings change or when no customer is selected
  useEffect(() => {
    if (settings && !selectedCustomer) {
      setCurrentRate(getDefaultCostPerMile());
    }
  }, [settings, selectedCustomer]);

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerId: "",
      driverId: "",
      vehicleRegistration: "",
      requestedCollectionDate: "",
      requestedDeliveryDate: "",
      collectionContact: {
        name: "",
        phone: "",
        email: "",
        releaseCode: "",
        modelPin: "",
        notes: "",
      },
      deliveryContact: {
        name: "",
        phone: "",
        email: "",
        notes: "",
      },
      collectionAddress: { line1: "", line2: "", city: "", postcode: "" },
      deliveryAddress: { line1: "", line2: "", city: "", postcode: "" },
      totalMovementFee: "0",
    },
  });

  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      customerType: "business",
      costPerMile: "",
      address: { line1: "", line2: "", city: "", postcode: "" },
      billingCompanyName: "",
      billingAddress: { line1: "", line2: "", city: "", postcode: "" },
      defaultPocEmails: [],
      defaultPodEmails: [],
      defaultInvoiceEmails: [],
    },
  });

  // Auto-sync billing information for individual customers
  useEffect(() => {
    const customerType = customerForm.watch('customerType');
    if (customerType === 'individual') {
      // Auto-populate billing company name with individual's name
      const name = customerForm.watch('name');
      if (name) {
        customerForm.setValue('billingCompanyName', name);
      }
      
      // Auto-populate billing address with personal address
      const address = customerForm.watch('address');
      if (address) {
        customerForm.setValue('billingAddress', address);
      }
    }
  }, [customerForm.watch('customerType'), customerForm.watch('name'), customerForm.watch('address')]);

  // Load existing job data if editing
  useEffect(() => {
    if (existingJob) {
      const formData = {
        customerId: existingJob.customerId || "",
        driverId: existingJob.driverId || "",
        vehicleRegistration: existingJob.vehicle?.registration || "",
        requestedCollectionDate: existingJob.requestedCollectionDate ? new Date(existingJob.requestedCollectionDate).toISOString().split('T')[0] : "",
        requestedDeliveryDate: existingJob.requestedDeliveryDate ? new Date(existingJob.requestedDeliveryDate).toISOString().split('T')[0] : "",
        collectionAddress: existingJob.collectionAddress || { line1: "", line2: "", city: "", postcode: "" },
        deliveryAddress: existingJob.deliveryAddress || { line1: "", line2: "", city: "", postcode: "" },
        collectionContact: existingJob.collectionContact || { name: "", phone: "", email: "", releaseCode: "", modelPin: "", notes: "" },
        deliveryContact: existingJob.deliveryContact || { name: "", phone: "", email: "", notes: "" },
        totalMovementFee: existingJob.totalMovementFee?.toString() || "0",
      };
      
      setTimeout(() => {
        form.reset(formData);
        if (existingJob.vehicle) {
          setVehicleDetails(existingJob.vehicle);
        }
        if (existingJob.calculatedMileage) {
          setCalculatedMileage(existingJob.calculatedMileage);
        }
        if (existingJob.customer) {
          setSelectedCustomer(existingJob.customer);
          // Set customer's rate or default
          const rate = existingJob.customer.costPerMile ? parseFloat(existingJob.customer.costPerMile) : getDefaultCostPerMile();
          setCurrentRate(rate);
        }
      }, 100);
    }
  }, [existingJob, form]);

  const { data: customers = [], refetch: refetchCustomers } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Fetch customer addresses when customer is selected
  const { data: customerAddresses = [], isLoading: addressesLoading } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customers", selectedCustomer?.id, "addresses"],
    enabled: !!selectedCustomer?.id,
  });

  // Address Book integration working properly

  // Filter customers based on search term - more comprehensive search
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return customer.name.toLowerCase().includes(searchLower) ||
           customer.email?.toLowerCase().includes(searchLower) ||
           customer.phone?.toLowerCase().includes(searchLower);
  });

  // Create new customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return response.json();
    },
    onSuccess: (newCustomer) => {
      // Immediately update the customers list and select the new customer
      queryClient.setQueryData(["/api/customers"], (oldCustomers: Customer[] = []) => {
        return [...oldCustomers, newCustomer];
      });
      form.setValue("customerId", newCustomer.id);
      setSelectedCustomer(newCustomer);
      // Update rate for new customer (will use default since new customer won't have custom rate)
      setCurrentRate(0.80);
      setShowNewCustomerDialog(false);
      customerForm.reset();
      setCustomerSearchTerm(""); // Clear search term
      // Auto-proceed to next step after customer creation
      setTimeout(() => {
        setCurrentStep(1);
      }, 300);
    },
    onError: () => {
      // Silent error handling
    },
  });

  const vehicleLookupMutation = useMutation({
    mutationFn: async (registration: string) => {
      const response = await apiRequest(`/api/vehicles/lookup/${registration}`, "GET");
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVehicleDetails(data);
      setActionFeedback({
        type: 'success',
        message: `Vehicle found: ${data.make} - ${data.colour}`
      });
    },
    onError: (error: any) => {
      console.error('Vehicle lookup error:', error);
      setActionFeedback({
        type: 'error',
        message: error.message || 'Vehicle lookup failed. Please check the registration and try again.'
      });
      setVehicleDetails(null);
    },
  });

  const mileageCalculationMutation = useMutation({
    mutationFn: async ({ fromPostcode, toPostcode }: { fromPostcode: string; toPostcode: string }) => {
      const response = await apiRequest("/api/mileage/calculate", "POST", {
        fromPostcode,
        toPostcode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCalculatedMileage(data.mileage);
      // Use current rate (customer's custom rate or default)
      const totalFee = (data.mileage * currentRate).toFixed(2);
      form.setValue("totalMovementFee", totalFee);
      // Silent calculation - no toast needed
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      try {
        console.log("🚀 Starting job creation...");
        console.log("Form data received:", data);
        console.log("Vehicle details:", vehicleDetails);
        console.log("Calculated mileage:", calculatedMileage);
        console.log("Selected customer:", selectedCustomer);

        // Validate required fields before submission
        if (!data.customerId) {
          throw new Error("Customer is required");
        }
        if (!vehicleDetails?.id) {
          throw new Error("Vehicle details are required - please look up vehicle first");
        }
        if (!calculatedMileage) {
          throw new Error("Mileage calculation is required - please calculate distance");
        }
        if (!data.requestedCollectionDate) {
          throw new Error("Collection date is required");
        }
        if (!data.requestedDeliveryDate) {
          throw new Error("Delivery date is required");
        }

        const jobData = {
          customerId: data.customerId,
          driverId: data.driverId || null,
          vehicleId: vehicleDetails.id,
          requestedCollectionDate: new Date(data.requestedCollectionDate).toISOString(),
          requestedDeliveryDate: new Date(data.requestedDeliveryDate).toISOString(),
          collectionAddress: data.collectionAddress,
          deliveryAddress: data.deliveryAddress,
          collectionContact: data.collectionContact,
          deliveryContact: data.deliveryContact,
          calculatedMileage: Math.ceil(calculatedMileage).toString(),
          ratePerMile: "0.80",
          totalMovementFee: data.totalMovementFee,
        };

        console.log("📝 Final job data for submission:", JSON.stringify(jobData, null, 2));
        
        const method = existingJob ? "PATCH" : "POST";
        const url = existingJob ? `/api/jobs/${existingJob.id}` : "/api/jobs";
        
        const response = await apiRequest(url, method, jobData);
        const result = await response.json();
        
        console.log("✅ Job creation successful:", result);
        return result;
      } catch (error) {
        console.error("❌ Job creation failed:", error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log("🎉 Job creation mutation succeeded:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
    },
    onError: (error) => {
      console.error("💥 Job creation mutation failed:", error);
    },
  });

  const onSubmit = (data: JobFormData) => {
    console.log("🔍 Form submission started with data:", data);
    
    // Client-side pre-validation
    if (!data.customerId) {
      console.error("❌ Customer not selected");
      return;
    }
    if (!vehicleDetails?.id && (!existingJob || !existingJob.vehicle)) {
      console.error("❌ Vehicle not looked up");
      return;
    }
    if (!calculatedMileage) {
      console.error("❌ Mileage not calculated");
      return;
    }
    if (!data.requestedCollectionDate) {
      console.error("❌ Collection date not provided");
      return;
    }
    if (!data.requestedDeliveryDate) {
      console.error("❌ Delivery date not provided");
      return;
    }
    
    console.log("✅ All pre-validation checks passed, proceeding to review stage...");
    // Move to review step instead of immediately creating job
    setCurrentStep(4); // Review step
  };

  const handleVehicleLookup = () => {
    const registration = form.getValues("vehicleRegistration");
    if (!registration || registration.trim() === '') {
      setActionFeedback({
        type: 'error',
        message: 'Please enter a vehicle registration first'
      });
      return;
    }
    
    // Clear any previous feedback
    setActionFeedback(null);
    setVehicleDetails(null);
    
    vehicleLookupMutation.mutate(registration.trim());
  };

  const handleMileageCalculation = () => {
    const collectionPostcode = form.getValues("collectionAddress.postcode");
    const deliveryPostcode = form.getValues("deliveryAddress.postcode");
    
    if (collectionPostcode && deliveryPostcode) {
      mileageCalculationMutation.mutate({
        fromPostcode: collectionPostcode,
        toPostcode: deliveryPostcode,
      });
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      form.setValue("customerId", customerId);
      setCustomerSearchTerm("");
      setShowCustomerDropdown(false);
      
      // Update rate based on customer's custom rate or default
      const rate = customer.costPerMile ? parseFloat(customer.costPerMile) : getDefaultCostPerMile();
      setCurrentRate(rate);
      
      // Recalculate total fee if mileage already exists
      if (calculatedMileage) {
        const totalFee = (calculatedMileage * rate).toFixed(2);
        form.setValue("totalMovementFee", totalFee);
      }
      
      // Force query refetch to ensure addresses are loaded
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "addresses"] });
    }
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    form.setValue("customerId", "");
    setCustomerSearchTerm("");
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 0: // Customer step
        return form.getValues("customerId") !== "";
      case 1: // Vehicle step
        return form.getValues("vehicleRegistration") !== "" && vehicleDetails;
      case 2: // Addresses step
        const collectionValid = form.getValues("collectionAddress.line1") && 
                              form.getValues("collectionAddress.city") && 
                              form.getValues("collectionAddress.postcode");
        const deliveryValid = form.getValues("deliveryAddress.line1") && 
                             form.getValues("deliveryAddress.city") && 
                             form.getValues("deliveryAddress.postcode");
        return collectionValid && deliveryValid;
      case 3: // Schedule step
        const collectionDate = form.getValues("requestedCollectionDate");
        const deliveryDate = form.getValues("requestedDeliveryDate");
        return collectionDate !== "" && deliveryDate !== "";
      case 4: // Review step
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {FORM_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const canAccess = index <= currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => canAccess && setCurrentStep(index)}
                  disabled={!canAccess}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-green-600 border-green-600 text-white' 
                      : isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : canAccess
                          ? 'border-gray-300 text-gray-500 hover:border-gray-400'
                          : 'border-gray-200 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                <div className="ml-3 text-left">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < FORM_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 0: Customer Selection */}
            {currentStep === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Select Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      type="button" 
                      onClick={() => setShowNewCustomerDialog(true)}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Customer
                    </Button>
                  </div>

                  {selectedCustomer && (
                    <div className={`p-4 rounded-lg mb-4 ${
                      selectedCustomer.customerType === 'individual' 
                        ? 'bg-purple-50 border border-purple-200' 
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            selectedCustomer.customerType === 'individual' 
                              ? 'text-purple-900' 
                              : 'text-blue-900'
                          }`}>{selectedCustomer.name}</h4>
                          <p className={`text-sm ${
                            selectedCustomer.customerType === 'individual' 
                              ? 'text-purple-700' 
                              : 'text-blue-700'
                          }`}>
                            {selectedCustomer.email} • {selectedCustomer.phone}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={`${
                            selectedCustomer.customerType === 'individual' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>Selected</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCustomer}
                            className={`h-8 w-8 p-0 ${
                              selectedCustomer.customerType === 'individual' 
                                ? 'text-purple-400 hover:text-white hover:bg-purple-600' 
                                : 'text-blue-400 hover:text-white hover:bg-blue-600'
                            }`}
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Search Customers</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder={selectedCustomer ? "Search for a different customer..." : "Type customer name, email, or phone to search..."}
                              value={customerSearchTerm}
                              onChange={(e) => {
                                setCustomerSearchTerm(e.target.value);
                                setShowCustomerDropdown(e.target.value.length > 0);
                              }}
                              onFocus={() => {
                                if (customerSearchTerm.length > 0) {
                                  setShowCustomerDropdown(true);
                                }
                              }}
                              onBlur={() => {
                                // Delay hiding to allow clicks on dropdown items
                                setTimeout(() => setShowCustomerDropdown(false), 150);
                              }}
                              className="w-full text-lg p-4 pr-12"
                              disabled={!!selectedCustomer}
                            />
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            
                            {showCustomerDropdown && customerSearchTerm && filteredCustomers.length > 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-auto">
                                {filteredCustomers.map((customer) => (
                                  <button
                                    key={customer.id}
                                    type="button"
                                    className={`w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 focus:outline-none transition-all duration-150 ${
                                      customer.customerType === 'individual' 
                                        ? 'hover:bg-purple-50 focus:bg-purple-50' 
                                        : 'hover:bg-blue-50 focus:bg-blue-50'
                                    }`}
                                    onMouseDown={(e) => {
                                      e.preventDefault(); // Prevent input blur
                                      handleCustomerSelect(customer.id);
                                    }}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        customer.customerType === 'individual' 
                                          ? 'bg-purple-100' 
                                          : 'bg-blue-100'
                                      }`}>
                                        {customer.customerType === 'individual' ? (
                                          <User className="w-5 h-5 text-purple-600" />
                                        ) : (
                                          <Building2 className="w-5 h-5 text-blue-600" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="font-medium text-gray-900">{customer.name}</div>
                                          {customer.customerType === 'individual' ? (
                                            <Badge className="text-xs bg-purple-100 text-purple-800">
                                              Individual
                                            </Badge>
                                          ) : (
                                            <Badge className="text-xs bg-blue-100 text-blue-800">
                                              Business
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                          {customer.email && (
                                            <span className="flex items-center space-x-1">
                                              <span>📧</span>
                                              <span>{customer.email}</span>
                                            </span>
                                          )}
                                          {customer.phone && (
                                            <span className="flex items-center space-x-1">
                                              <span>📞</span>
                                              <span>{customer.phone}</span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {showCustomerDropdown && customerSearchTerm && filteredCustomers.length === 0 && (
                              <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl">
                                <div className="px-4 py-6 text-center">
                                  <div className="text-gray-400 mb-2">
                                    <Search className="w-8 h-8 mx-auto" />
                                  </div>
                                  <div className="text-gray-500">
                                    No customers found matching "{customerSearchTerm}"
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => {
                                      setShowNewCustomerDialog(true);
                                      setShowCustomerDropdown(false);
                                    }}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Create New Customer
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 1: Vehicle Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-3">
                    <FormField
                      control={form.control}
                      name="vehicleRegistration"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Vehicle Registration</FormLabel>
                          <FormControl>
                            <Input placeholder="AB21 XYZ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleVehicleLookup}
                        disabled={vehicleLookupMutation.isPending}
                        className="bg-[#00ABE7] hover:bg-[#0099d3] text-white"
                      >
                        <Search className="mr-2 h-4 w-4" />
                        {vehicleLookupMutation.isPending ? "Looking up..." : "DVLA Lookup"}
                      </Button>
                    </div>
                  </div>

                  {/* DVLA Lookup Feedback */}
                  {actionFeedback && (
                    <div className={`p-4 rounded-lg border ${
                      actionFeedback.type === 'success' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        actionFeedback.type === 'success' 
                          ? 'text-green-700' 
                          : 'text-red-700'
                      }`}>
                        {actionFeedback.message}
                      </p>
                    </div>
                  )}

                  {(vehicleDetails || existingJob?.vehicle) && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-600 mb-2 font-medium">Vehicle Details Found</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>Make: <span className="font-medium">{vehicleDetails?.make || existingJob?.vehicle?.make}</span></div>
                        <div>Colour: <span className="font-medium">{vehicleDetails?.colour || existingJob?.vehicle?.colour}</span></div>
                        <div>Fuel Type: <span className="font-medium">{vehicleDetails?.fuelType || existingJob?.vehicle?.fuelType}</span></div>
                        <div>MOT Status: <span className="font-medium">{vehicleDetails?.motStatus || existingJob?.vehicle?.motStatus}</span></div>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assign driver later" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 2: Addresses */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Collection Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Collection Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Address Management */}
                    {selectedCustomer && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-green-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Quick Select from {selectedCustomer.name}'s Address Book
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddressManagerContext('collection');
                              setShowAddressManager(true);
                            }}
                            className="text-green-700 border-green-200 hover:bg-green-100"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Manage Addresses
                          </Button>
                        </div>
                        
                        {customerAddresses.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {customerAddresses
                              .filter(addr => addr.type === 'collection' || addr.type === 'both')
                              .map((address) => (
                              <button
                                key={address.id}
                                type="button"
                                onClick={(event) => {
                                  form.setValue("collectionAddress.line1", address.address.line1);
                                  form.setValue("collectionAddress.line2", address.address.line2 || "");
                                  form.setValue("collectionAddress.city", address.address.city);
                                  form.setValue("collectionAddress.postcode", address.address.postcode);
                                  form.setValue("collectionContact.name", address.contact?.name || "");
                                  form.setValue("collectionContact.phone", address.contact?.phone || "");
                                  form.setValue("collectionContact.email", address.contact?.email || "");
                                  form.setValue("collectionContact.notes", address.notes || "");
                                  // Visual feedback - highlight the button briefly
                                  const button = event.currentTarget;
                                  button.classList.add('bg-green-200', 'border-green-300');
                                  setTimeout(() => {
                                    button.classList.remove('bg-green-200', 'border-green-300');
                                  }, 500);
                                }}
                                className="text-left p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-colors group"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-green-900 truncate">{address.name}</p>
                                    <p className="text-sm text-green-700 truncate">
                                      {address.address.line1}, {address.address.city}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                      Contact: {address.contact.name}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    {address.isDefault && (
                                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                        Default
                                      </span>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      address.type === 'collection' ? 'bg-green-100 text-green-800' :
                                      address.type === 'both' ? 'bg-purple-100 text-purple-800' : ''
                                    }`}>
                                      {address.type === 'both' ? 'Collection & Delivery' : 'Collection'}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-green-700">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No saved addresses yet for {selectedCustomer.name}</p>
                            <p className="text-xs opacity-75">Click "Manage Addresses" to add frequent collection/delivery locations</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="collectionAddress.line1"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 1</FormLabel>
                            <AddressAutocomplete
                              value={field.value}
                              onChange={field.onChange}
                              onAddressSelect={(address) => {
                                form.setValue("collectionAddress.line1", address.line1);
                                form.setValue("collectionAddress.city", address.city);
                                form.setValue("collectionAddress.postcode", address.postcode);
                                if (address.line2) {
                                  form.setValue("collectionAddress.line2", address.line2);
                                }
                              }}
                              placeholder="Start typing collection address..."
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collectionAddress.line2"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collectionAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="collectionAddress.postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode</FormLabel>
                            <FormControl>
                              <Input {...field} onBlur={handleMileageCalculation} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Collection Contact */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900">Collection Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="collectionContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="collectionContact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="collectionContact.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="collectionContact.releaseCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Release Code (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="collectionContact.modelPin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model PIN (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="collectionContact.notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Collection Notes</FormLabel>
                            <FormControl>
                              <Textarea rows={3} placeholder="Notes visible to driver..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Address Management */}
                    {selectedCustomer && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-blue-900 flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            Quick Select from {selectedCustomer.name}'s Address Book
                          </h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddressManagerContext('delivery');
                              setShowAddressManager(true);
                            }}
                            className="text-blue-700 border-blue-200 hover:bg-blue-100"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Manage Addresses
                          </Button>
                        </div>
                        
                        {customerAddresses.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {customerAddresses
                            .filter(addr => addr.type === 'delivery' || addr.type === 'both')
                            .map((address) => (
                            <button
                              key={address.id}
                              type="button"
                              onClick={() => {
                                form.setValue("deliveryAddress.line1", address.address.line1);
                                form.setValue("deliveryAddress.line2", address.address.line2 || "");
                                form.setValue("deliveryAddress.city", address.address.city);
                                form.setValue("deliveryAddress.postcode", address.address.postcode);
                                form.setValue("deliveryContact.name", address.contact?.name || "");
                                form.setValue("deliveryContact.phone", address.contact?.phone || "");
                                form.setValue("deliveryContact.email", address.contact?.email || "");
                                form.setValue("deliveryContact.notes", address.notes || "");
                                // Auto-calculate mileage when both addresses are complete
                                const collectionPostcode = form.getValues("collectionAddress.postcode");
                                if (collectionPostcode && address.address.postcode) {
                                  handleMileageCalculation();
                                }
                              }}
                              className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors group"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-blue-900 truncate">{address.name}</p>
                                  <p className="text-sm text-blue-700 truncate">
                                    {address.address.line1}, {address.address.city}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Contact: {address.contact.name}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {address.isDefault && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      Default
                                    </span>
                                  )}
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    address.type === 'delivery' ? 'bg-blue-100 text-blue-800' :
                                    address.type === 'both' ? 'bg-purple-100 text-purple-800' : ''
                                  }`}>
                                    {address.type === 'both' ? 'Collection & Delivery' : 'Delivery'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        ) : (
                          <div className="text-center py-6 text-blue-700">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No saved addresses yet for {selectedCustomer.name}</p>
                            <p className="text-xs opacity-75">Click "Manage Addresses" to add frequent collection/delivery locations</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryAddress.line1"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 1</FormLabel>
                            <AddressAutocomplete
                              value={field.value}
                              onChange={field.onChange}
                              onAddressSelect={(address) => {
                                form.setValue("deliveryAddress.line1", address.line1);
                                form.setValue("deliveryAddress.city", address.city);
                                form.setValue("deliveryAddress.postcode", address.postcode);
                                if (address.line2) {
                                  form.setValue("deliveryAddress.line2", address.line2);
                                }
                                // Auto-calculate mileage when both addresses are complete
                                const collectionPostcode = form.getValues("collectionAddress.postcode");
                                if (collectionPostcode && address.postcode) {
                                  handleMileageCalculation();
                                }
                              }}
                              placeholder="Start typing delivery address..."
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.line2"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deliveryAddress.postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode</FormLabel>
                            <FormControl>
                              <Input {...field} onBlur={handleMileageCalculation} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Delivery Contact */}
                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900">Delivery Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="deliveryContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryContact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deliveryContact.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="deliveryContact.notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Notes</FormLabel>
                            <FormControl>
                              <Textarea rows={3} placeholder="Notes visible to driver..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {calculatedMileage && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Distance Calculated</p>
                            <p className="text-xl font-bold text-green-900">{Math.ceil(calculatedMileage)} miles</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-600">Rate: £{currentRate.toFixed(2)}/mile</p>
                            <p className="text-xl font-bold text-green-900">£{form.getValues("totalMovementFee")}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="requestedCollectionDate"
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>Requested Collection Date</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                    setOpen(false); // Close popover after selection
                                  }}
                                  disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="requestedDeliveryDate"
                      render={({ field }) => {
                        const [open, setOpen] = useState(false);
                        return (
                          <FormItem className="flex flex-col">
                            <FormLabel>Requested Delivery Date</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={(date) => {
                                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                                    setOpen(false); // Close popover after selection
                                  }}
                                  disabled={(date) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="totalMovementFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Movement Fee (£)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Review Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Customer Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{selectedCustomer?.name || 'No customer selected'}</p>
                      {selectedCustomer?.email && (
                        <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                      )}
                      {selectedCustomer?.phone && (
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Vehicle Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Vehicle</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{form.getValues("vehicleRegistration")}</p>
                      <p className="text-sm text-gray-600">
                        {vehicleDetails?.make} {vehicleDetails?.model} - {vehicleDetails?.colour}
                      </p>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Route</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">Collection</p>
                        <p className="text-sm text-green-700">
                          {form.getValues("collectionAddress.line1")}, {form.getValues("collectionAddress.city")}, {form.getValues("collectionAddress.postcode")}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Delivery</p>
                        <p className="text-sm text-blue-700">
                          {form.getValues("deliveryAddress.line1")}, {form.getValues("deliveryAddress.city")}, {form.getValues("deliveryAddress.postcode")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Pricing</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {calculatedMileage ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Distance:</span>
                            <span className="font-medium text-gray-900">{Math.ceil(calculatedMileage)} miles</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Rate:</span>
                            <span className="font-medium text-gray-900">£{currentRate.toFixed(2)} per mile</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="font-medium text-gray-700">Total Movement Fee:</span>
                            <span className="font-bold text-gray-900 text-lg">£{form.getValues("totalMovementFee")}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Mileage will be calculated automatically based on addresses</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={currentStep === 0 ? onClose : prevStep}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 0 ? "Cancel" : "Previous"}
              </Button>

              {currentStep < FORM_STEPS.length - 1 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!canProceedToNextStep()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={() => {
                    const formData = form.getValues();
                    createJobMutation.mutate(formData);
                  }}
                  disabled={createJobMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createJobMutation.isPending 
                    ? (existingJob ? "Updating..." : "Creating...") 
                    : (existingJob ? "Update Job" : "Create Job")
                  }
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form 
              onSubmit={customerForm.handleSubmit((data) => createCustomerMutation.mutate(data))} 
              className="space-y-6"
            >
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="addresses">Addresses</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="notifications">Email Recipients</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={customerForm.control}
                      name="customerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Customer Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || 'business'}>
                            <FormControl>
                              <SelectTrigger className="h-10" data-testid="select-customer-type">
                                <SelectValue placeholder="Select customer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="business">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>Business</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="individual">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Individual</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Business customers receive Net 14 days payment terms. Individual customers require upfront payment.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="name"
                      render={({ field }) => {
                        const customerType = customerForm.watch('customerType');
                        const isIndividual = customerType === 'individual';
                        return (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              {isIndividual ? 'Name *' : 'Company Name *'}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder={isIndividual ? 'Enter full name' : 'Enter company name'} 
                                className="h-10" 
                                data-testid="input-company-name" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Primary Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} placeholder="Enter email address" className="h-10" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} placeholder="Enter phone number" className="h-10" data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="costPerMile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Rate Per Mile (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              {...field} 
                              placeholder="Leave blank for default" 
                              className="h-10"
                              data-testid="input-rate"
                            />
                          </FormControl>
                          <FormDescription>Leave blank to use default rate</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="addresses" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5" />
                        Primary Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={customerForm.control}
                        name="address.line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Street address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apartment, suite, etc." />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="address.postcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postcode *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Postcode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="billing" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5" />
                        Billing Information
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {customerForm.watch('customerType') === 'individual' 
                          ? 'For individuals, billing details will match your personal information'
                          : 'Company and address for invoicing'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {customerForm.watch('customerType') === 'business' ? (
                        <FormField
                          control={customerForm.control}
                          name="billingCompanyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Billing Company Name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Company name for invoices" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1">
                            <Users className="h-4 w-4" />
                            Individual Customer Billing
                          </div>
                          <p className="text-blue-700 text-sm">
                            Billing will be addressed to: <strong>{customerForm.watch('name') || 'Enter name above'}</strong>
                          </p>
                          <p className="text-blue-600 text-xs mt-1">
                            Your personal address will be automatically used for billing
                          </p>
                        </div>
                      )}
                      {customerForm.watch('customerType') === 'business' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={customerForm.control}
                            name="billingAddress.line1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Address Line 1 *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Billing street address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={customerForm.control}
                            name="billingAddress.line2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Address Line 2</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Apartment, suite, etc." />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={customerForm.control}
                            name="billingAddress.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing City *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Billing city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={customerForm.control}
                            name="billingAddress.postcode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Billing Postcode *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Billing postcode" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Billing Address</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>{customerForm.watch('address.line1') || 'Address line 1 will appear here'}</div>
                            {customerForm.watch('address.line2') && <div>{customerForm.watch('address.line2')}</div>}
                            <div>{customerForm.watch('address.city') || 'City'}, {customerForm.watch('address.postcode') || 'Postcode'}</div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            This matches your personal address above
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <Mail className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <h3 className="text-base font-semibold">Email Recipients Configuration</h3>
                      <p className="text-gray-600 text-xs">Set up multiple email recipients for different document types</p>
                    </div>
                    
                    <EmailRecipientsSection
                      form={customerForm}
                      emailType="defaultPocEmails"
                      title="Proof of Collection (POC) Recipients"
                      description="Emails sent when a vehicle is collected from this customer"
                    />
                    
                    <EmailRecipientsSection
                      form={customerForm}
                      emailType="defaultPodEmails"
                      title="Proof of Delivery (POD) Recipients"
                      description="Emails sent when a vehicle is delivered to this customer"
                    />
                    
                    <EmailRecipientsSection
                      form={customerForm}
                      emailType="defaultInvoiceEmails"
                      title="Invoice Recipients"
                      description="Emails sent when invoices are generated for this customer"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowNewCustomerDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCustomerMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Customer Address Manager Dialog */}
      {showAddressManager && selectedCustomer && (
        <Dialog open={showAddressManager} onOpenChange={setShowAddressManager}>
          <DialogContent 
            className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto"
            style={{ 
              width: 'calc(100vw - 2rem)', 
              maxWidth: 'calc(1280px - 4rem)',
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {addressManagerContext === 'collection' ? 'Collection Addresses' :
                 addressManagerContext === 'delivery' ? 'Delivery Addresses' :
                 'Manage Addresses'} for {selectedCustomer.name}
              </DialogTitle>
            </DialogHeader>
            <CustomerAddressManager 
              customerId={selectedCustomer.id}
              filterType={addressManagerContext}
              onAddressSelect={(address) => {
                // Auto-populate current step if on addresses
                if (currentStep === 2) {
                  if (address.type === 'collection' || address.type === 'both') {
                    form.setValue("collectionAddress.line1", address.address.line1);
                    form.setValue("collectionAddress.line2", address.address.line2 || "");
                    form.setValue("collectionAddress.city", address.address.city);
                    form.setValue("collectionAddress.postcode", address.address.postcode);
                    form.setValue("collectionContact.name", address.contact?.name || "");
                    form.setValue("collectionContact.phone", address.contact?.phone || "");
                    form.setValue("collectionContact.email", address.contact?.email || "");
                  }
                  if (address.type === 'delivery' || address.type === 'both') {
                    form.setValue("deliveryAddress.line1", address.address.line1);
                    form.setValue("deliveryAddress.line2", address.address.line2 || "");
                    form.setValue("deliveryAddress.city", address.address.city);
                    form.setValue("deliveryAddress.postcode", address.address.postcode);
                    form.setValue("deliveryContact.name", address.contact?.name || "");
                    form.setValue("deliveryContact.phone", address.contact?.phone || "");
                    form.setValue("deliveryContact.email", address.contact?.email || "");
                  }
                }
                setShowAddressManager(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}