import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Settings, Building2, Trash2, Edit, Mail, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Customer, CustomerAddress, Setting } from "@shared/schema";
import { EmailListManager } from "@/components/ui/email-list-manager";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const customerFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  phone: z.string().optional(),
  costPerMile: z.string().optional(),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
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

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultRatePerMile, setDefaultRatePerMile] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch settings for default rate
  const { data: settings = [] } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      return apiRequest("/api/customers", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setShowCreateCustomer(false);
      customerForm.reset();
      toast({ title: "Customer created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error creating customer", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      if (!editingCustomer) throw new Error("No customer selected");
      return apiRequest(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
      customerForm.reset();
      toast({ title: "Customer updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating customer", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return apiRequest(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setDeletingCustomer(null);
      toast({ title: "Customer deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error deleting customer", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (value: string) => {
      return apiRequest("/api/settings/default_rate_per_mile", {
        method: "PATCH",
        body: { value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setShowSettings(false);
      toast({ title: "Default rate updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error updating default rate", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Helper function to get default rate
  const getDefaultRate = () => {
    const defaultRateSetting = settings.find(s => s.key === "default_rate_per_mile");
    return defaultRateSetting?.value || '0.80';
  };

  // Forms
  const customerForm = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      costPerMile: "",
      address: { line1: "", line2: "", city: "", postcode: "" },
      billingCompanyName: "",
      billingAddress: { line1: "", line2: "", city: "", postcode: "" },
      defaultPocEmails: [],
      defaultPodEmails: [],
      defaultInvoiceEmails: [],
    },
  });

  // Form handlers
  const handleCreateCustomer = async (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
  };

  const handleUpdateCustomer = async (data: CustomerFormData) => {
    updateCustomerMutation.mutate(data);
  };

  const handleDeleteCustomer = () => {
    if (deletingCustomer) {
      deleteCustomerMutation.mutate(deletingCustomer.id);
    }
  };

  const handleUpdateDefaultRate = () => {
    updateSettingMutation.mutate(defaultRatePerMile);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    customerForm.reset({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      costPerMile: customer.costPerMile || "",
      address: customer.address || { line1: "", line2: "", city: "", postcode: "" },
      billingCompanyName: customer.billingCompanyName || "",
      billingAddress: customer.billingAddress || { line1: "", line2: "", city: "", postcode: "" },
      defaultPocEmails: customer.defaultPocEmails || [],
      defaultPodEmails: customer.defaultPodEmails || [],
      defaultInvoiceEmails: customer.defaultInvoiceEmails || [],
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading customers...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage your customer database and billing information</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Customer Settings</DialogTitle>
                <DialogDescription>
                  Configure default settings for new customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Rate Per Mile (£)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={defaultRatePerMile || getDefaultRate()}
                    onChange={(e) => setDefaultRatePerMile(e.target.value)}
                    placeholder="0.80"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateDefaultRate}
                    disabled={updateSettingMutation.isPending}
                  >
                    {updateSettingMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer with billing address and email notification settings
                </DialogDescription>
              </DialogHeader>
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={customerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter company name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Enter email address" />
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
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter phone number" />
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
                            <FormLabel>Rate Per Mile (£)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                step="0.01" 
                                placeholder={`Default: £${getDefaultRate()}`} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Primary Address */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Primary Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <FormMessage />
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
                    </div>
                  </div>

                  {/* Billing Company Name */}
                  <div className="space-y-4">
                    <FormField
                      control={customerForm.control}
                      name="billingCompanyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Company name for invoicing (may differ from main name)" />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-gray-500">
                            This name appears on invoices. Can be different from main company name for sister companies.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Billing Address */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Billing Address *</h3>
                    <p className="text-sm text-gray-600">Required address for invoice "Bill To" section.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={customerForm.control}
                        name="billingAddress.line1"
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
                        name="billingAddress.line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Apartment, suite, etc." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="billingAddress.city"
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
                        name="billingAddress.postcode"
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
                    </div>
                  </div>

                  {/* Default Email Recipients */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Default Email Recipients</h3>
                    <p className="text-sm text-gray-600">Default email addresses for documents. Can be overridden per job.</p>
                    <div className="space-y-6">
                      <FormField
                        control={customerForm.control}
                        name="defaultPocEmails"
                        render={({ field }) => (
                          <FormItem>
                            <EmailListManager
                              emails={field.value}
                              onChange={field.onChange}
                              label="Proof of Collection Recipients"
                              placeholder="Enter email for POC documents"
                            />
                            <p className="text-xs text-gray-500">
                              Default recipients for POC documents. Can be overridden when creating specific jobs.
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="defaultPodEmails"
                        render={({ field }) => (
                          <FormItem>
                            <EmailListManager
                              emails={field.value}
                              onChange={field.onChange}
                              label="Proof of Delivery Recipients"
                              placeholder="Enter email for POD documents"
                            />
                            <p className="text-xs text-gray-500">
                              Default recipients for POD documents. Can be overridden when creating specific jobs.
                            </p>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={customerForm.control}
                        name="defaultInvoiceEmails"
                        render={({ field }) => (
                          <FormItem>
                            <EmailListManager
                              emails={field.value}
                              onChange={field.onChange}
                              label="Invoice Recipients"
                              placeholder="Enter email for invoices"
                            />
                            <p className="text-xs text-gray-500">
                              Default recipients for invoices. Can be overridden when creating specific jobs.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateCustomer(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending ? "Creating..." : "Create Customer"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer) => (
          <Card key={customer.id} className="h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingCustomer(customer)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Primary Contact Info */}
              {customer.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📞</span>
                  <span>{customer.phone}</span>
                </div>
              )}

              {/* Address */}
              {customer.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="text-gray-600">
                    <div>{customer.address.line1}</div>
                    {customer.address.line2 && <div>{customer.address.line2}</div>}
                    <div>{customer.address.city}, {customer.address.postcode}</div>
                  </div>
                </div>
              )}

              {/* Rate Per Mile */}
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span>£{customer.costPerMile || getDefaultRate()}/mile</span>
              </div>

              {/* Email Recipients Summary */}
              <div className="space-y-2">
                <Separator />
                <div className="text-xs text-gray-500">Email Recipients:</div>
                {customer.defaultPocEmails && customer.defaultPocEmails.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    POC: {customer.defaultPocEmails.length}
                  </Badge>
                )}
                {customer.defaultPodEmails && customer.defaultPodEmails.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    POD: {customer.defaultPodEmails.length}
                  </Badge>
                )}
                {customer.defaultInvoiceEmails && customer.defaultInvoiceEmails.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Invoice: {customer.defaultInvoiceEmails.length}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleUpdateCustomer)} className="space-y-6">
              {/* Same form fields as create customer */}
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={customerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Enter email address" />
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
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter phone number" />
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
                        <FormLabel>Rate Per Mile (£)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01" 
                            placeholder={`Default: £${getDefaultRate()}`} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Primary Address */}
              <div className="space-y-4">
                <h3 className="font-medium">Primary Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormMessage />
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
                </div>
              </div>

              {/* Billing Company Name */}
              <div className="space-y-4">
                <FormField
                  control={customerForm.control}
                  name="billingCompanyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Company name for invoicing (may differ from main name)" />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        This name appears on invoices. Can be different from main company name for sister companies.
                      </p>
                    </FormItem>
                  )}
                />
              </div>

              {/* Billing Address */}
              <div className="space-y-4">
                <h3 className="font-medium">Billing Address *</h3>
                <p className="text-sm text-gray-600">Required address for invoice "Bill To" section.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={customerForm.control}
                    name="billingAddress.line1"
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
                    name="billingAddress.line2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Apartment, suite, etc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="billingAddress.city"
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
                    name="billingAddress.postcode"
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
                </div>
              </div>

              {/* Default Email Recipients */}
              <div className="space-y-4">
                <h3 className="font-medium">Default Email Recipients</h3>
                <p className="text-sm text-gray-600">Default email addresses for documents. Can be overridden per job.</p>
                <div className="space-y-6">
                  <FormField
                    control={customerForm.control}
                    name="defaultPocEmails"
                    render={({ field }) => (
                      <FormItem>
                        <EmailListManager
                          emails={field.value}
                          onChange={field.onChange}
                          label="Proof of Collection Recipients"
                          placeholder="Enter email for POC documents"
                        />
                        <p className="text-xs text-gray-500">
                          Default recipients for POC documents. Can be overridden when creating specific jobs.
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="defaultPodEmails"
                    render={({ field }) => (
                      <FormItem>
                        <EmailListManager
                          emails={field.value}
                          onChange={field.onChange}
                          label="Proof of Delivery Recipients"
                          placeholder="Enter email for POD documents"
                        />
                        <p className="text-xs text-gray-500">
                          Default recipients for POD documents. Can be overridden when creating specific jobs.
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="defaultInvoiceEmails"
                    render={({ field }) => (
                      <FormItem>
                        <EmailListManager
                          emails={field.value}
                          onChange={field.onChange}
                          label="Invoice Recipients"
                          placeholder="Enter email for invoices"
                        />
                        <p className="text-xs text-gray-500">
                          Default recipients for invoices. Can be overridden when creating specific jobs.
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? "Updating..." : "Update Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCustomer?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}