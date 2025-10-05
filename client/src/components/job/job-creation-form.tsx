import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search } from "lucide-react";

const jobFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  driverId: z.string().optional(),
  vehicleRegistration: z.string().min(1, "Vehicle registration is required"),
  requestedCollectionDate: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
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
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Valid email is required"),
    releaseCode: z.string().optional(),
    modelPin: z.string().optional(),
    notes: z.string().optional(),
  }),
  deliveryContact: z.object({
    name: z.string().min(1, "Contact name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().email("Valid email is required"),
    notes: z.string().optional(),
  }),
  totalMovementFee: z.string().min(1, "Total movement fee is required"),
});

type JobFormData = z.infer<typeof jobFormSchema>;

interface JobCreationFormProps {
  onClose: () => void;
  existingJob?: any;
}

export default function JobCreationForm({ onClose, existingJob }: JobCreationFormProps) {
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [calculatedMileage, setCalculatedMileage] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerId: "",
      driverId: "",
      vehicleRegistration: "",
      requestedCollectionDate: "",
      requestedDeliveryDate: "",
      collectionAddress: { line1: "", line2: "", city: "", postcode: "" },
      deliveryAddress: { line1: "", line2: "", city: "", postcode: "" },
      collectionContact: { name: "", phone: "", email: "", releaseCode: "", modelPin: "", notes: "" },
      deliveryContact: { name: "", phone: "", email: "", notes: "" },
      totalMovementFee: "0",
    },
  });

  // Reset form with existing job data when editing
  useEffect(() => {
    if (existingJob) {
      console.log("=== EDITING JOB SETUP ===");
      console.log("Existing job:", existingJob);
      console.log("Existing job ID:", existingJob.id);
      console.log("Existing job customerId:", existingJob.customerId);
      console.log("Existing job driverId:", existingJob.driverId);
      
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
      
      console.log("Form data being set:", formData);
      
      // Use setTimeout to ensure form resets after component is fully mounted
      setTimeout(() => {
        form.reset(formData);
        console.log("✅ Form reset completed for editing");
      }, 100);
      
      // Set vehicle details if editing
      if (existingJob.vehicle) {
        setVehicleDetails(existingJob.vehicle);
        console.log("✅ Vehicle details set:", existingJob.vehicle);
      }
      
      // Set calculated mileage if exists
      if (existingJob.calculatedMileage) {
        setCalculatedMileage(existingJob.calculatedMileage);
        console.log("✅ Calculated mileage set:", existingJob.calculatedMileage);
      }
    } else {
      console.log("=== CREATING NEW JOB ===");
      // Reset to empty form when not editing
      form.reset({
        customerId: "",
        driverId: "",
        vehicleRegistration: "",
        requestedCollectionDate: "",
        requestedDeliveryDate: "",
        collectionAddress: { line1: "", line2: "", city: "", postcode: "" },
        deliveryAddress: { line1: "", line2: "", city: "", postcode: "" },
        collectionContact: { name: "", phone: "", email: "", releaseCode: "", modelPin: "", notes: "" },
        deliveryContact: { name: "", phone: "", email: "", notes: "" },
        totalMovementFee: "0",
      });
      setVehicleDetails(null);
      setCalculatedMileage(null);
    }
  }, [existingJob, form]);

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const { data: drivers = [] } = useQuery<any[]>({
    queryKey: ["/api/drivers"],
  });

  const vehicleLookupMutation = useMutation({
    mutationFn: async (registration: string) => {
      const response = await apiRequest("GET", `/api/vehicles/lookup/${registration}`);
      return response.json();
    },
    onSuccess: (data) => {
      setVehicleDetails(data);
      toast({
        title: "Vehicle found",
        description: `${data.make} - ${data.colour}`,
      });
    },
    onError: (error) => {
      console.error("Vehicle lookup error:", error);
      toast({
        title: "Vehicle lookup failed",
        description: "Please check the registration and try again",
        variant: "destructive",
      });
    },
  });

  const mileageCalculationMutation = useMutation({
    mutationFn: async ({ fromPostcode, toPostcode }: { fromPostcode: string; toPostcode: string }) => {
      const response = await apiRequest("POST", "/api/mileage/calculate", {
        fromPostcode,
        toPostcode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCalculatedMileage(data.mileage);
      // Use global rate per mile of 0.80
      const defaultRate = 0.80;
      const totalFee = (data.mileage * defaultRate).toFixed(2);
      form.setValue("totalMovementFee", totalFee);
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const jobData = {
        customerId: data.customerId,
        driverId: data.driverId || null,
        vehicleId: vehicleDetails?.id || existingJob?.vehicleId,
        requestedCollectionDate: data.requestedCollectionDate ? new Date(data.requestedCollectionDate).toISOString() : null,
        requestedDeliveryDate: data.requestedDeliveryDate ? new Date(data.requestedDeliveryDate).toISOString() : null,
        collectionAddress: data.collectionAddress,
        deliveryAddress: data.deliveryAddress,
        collectionContact: data.collectionContact,
        deliveryContact: data.deliveryContact,
        calculatedMileage: calculatedMileage || existingJob?.calculatedMileage,
        ratePerMile: "0.80", // Global rate per mile
        totalMovementFee: data.totalMovementFee,
      };

      const method = existingJob ? "PATCH" : "POST";
      const url = existingJob ? `/api/jobs/${existingJob.id}` : "/api/jobs";
      
      console.log('🔥 MAKING REQUEST:', { method, url, jobData });
      console.log('🔍 Existing job ID:', existingJob?.id);
      
      const response = await apiRequest(method, url, jobData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: existingJob ? "Job updated successfully" : "Job created successfully",
        description: existingJob ? "The job has been updated successfully" : "The job has been created and is ready for assignment",
      });
      onClose();
    },
    onError: (error) => {
      console.error("=== JOB MUTATION ERROR ===");
      console.error("Job creation/update error:", error);
      console.error("Error details:", error.message);
      console.error("Full error object:", error);
      
      // Try to get more specific error message
      let errorMessage = "Please check all fields and try again";
      if (error.message.includes("validation")) {
        errorMessage = "Form validation failed. Please check required fields.";
      } else if (error.message.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message.includes("404")) {
        errorMessage = "Job not found. It may have been deleted.";
      } else if (error.message.includes("500")) {
        errorMessage = "Server error. Please try again in a moment.";
      }
      
      toast({
        title: existingJob ? "Failed to update job" : "Failed to create job",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobFormData) => {
    console.log("=== JOB FORM SUBMISSION ===");
    console.log("Form errors:", form.formState.errors);
    console.log("Submitting form data:", data);
    console.log("Existing job:", existingJob);
    console.log("Vehicle details:", vehicleDetails);
    
    // For new jobs, require vehicle lookup. For editing, allow if vehicle already exists in job
    if (!vehicleDetails && (!existingJob || !existingJob.vehicle)) {
      toast({
        title: "Vehicle lookup required",
        description: "Please lookup the vehicle registration first",
        variant: "destructive",
      });
      return;
    }
    
    console.log("✅ Form validation passed, calling mutation");
    createJobMutation.mutate(data);
  };

  const handleVehicleLookup = () => {
    const registration = form.getValues("vehicleRegistration");
    if (registration) {
      vehicleLookupMutation.mutate(registration);
    }
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Vehicle Registration Lookup */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
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
                >
                  <Search className="mr-2 h-4 w-4" />
                  {vehicleLookupMutation.isPending ? "Looking up..." : "Lookup"}
                </Button>
              </div>
            </div>

            {(vehicleDetails || existingJob?.vehicle) && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Vehicle Details {vehicleDetails ? "(Auto-filled from DVLA)" : "(From existing job)"}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Make: <span className="font-medium">{vehicleDetails?.make || existingJob?.vehicle?.make}</span></div>
                  <div>MOT Status: <span className="font-medium">{vehicleDetails?.motStatus || existingJob?.vehicle?.motStatus}</span></div>
                  <div>Colour: <span className="font-medium">{vehicleDetails?.colour || existingJob?.vehicle?.colour}</span></div>
                  <div>Fuel Type: <span className="font-medium">{vehicleDetails?.fuelType || existingJob?.vehicle?.fuelType}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer and Driver */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign later" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.map((driver: any) => (
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

        {/* Requested Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Requested Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="requestedCollectionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Collection Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestedDeliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Collection Address */}
        <Card>
          <CardHeader>
            <CardTitle>Collection Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="collectionAddress.line1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="collectionAddress.line2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
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
            <div className="space-y-4">
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
            <CardTitle>Delivery Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deliveryAddress.line1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deliveryAddress.line2"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address Line 2</FormLabel>
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
            <div className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calculated Mileage
                  </label>
                  <Input
                    type="number"
                    readOnly
                    value={calculatedMileage || ""}
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from postcodes</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rate per Mile
                  </label>
                  <Input
                    type="number"
                    readOnly
                    value="0.80"
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Global rate per mile</p>
                </div>
                <FormField
                  control={form.control}
                  name="totalMovementFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Movement Fee</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">Editable if manual override needed</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createJobMutation.isPending}>
            {createJobMutation.isPending 
              ? (existingJob ? "Updating..." : "Creating...") 
              : (existingJob ? "Save" : "Create Job")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
