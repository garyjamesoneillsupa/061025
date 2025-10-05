import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  MoreVertical,
  Eye,
  Star,
  Archive,
  Building,
  Car
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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

const addressFormSchema = z.object({
  name: z.string().min(1, "Address name is required"),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  contact: z.object({
    name: z.string().min(1, "Contact name is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Valid email is required").optional().or(z.literal("")),
  }),
  type: z.enum(["collection", "delivery", "both"]),
  isDefault: z.boolean().default(false),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;
type AddressFormData = z.infer<typeof addressFormSchema>;

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showCreateAddress, setShowCreateAddress] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [deleteAddress, setDeleteAddress] = useState<CustomerAddress | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch addresses for selected customer
  const { data: customerAddresses, isLoading: addressesLoading } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customers", selectedCustomer?.id, "addresses"],
    enabled: !!selectedCustomer?.id,
  });

  // Fetch settings to get the default cost per mile rate
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Get the default cost per mile from settings array
  const getDefaultCostPerMile = () => {
    const defaultRateSetting = settings?.find(s => s.key === 'default_rate_per_mile');
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

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: "",
      address: { line1: "", line2: "", city: "", postcode: "" },
      contact: { name: "", phone: "", email: "" },
      type: "both",
      isDefault: false,
      notes: "",
    },
  });

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const customerData = { ...data, email: data.email || null };
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer created", description: "New customer has been added successfully" });
      setShowCreateCustomer(false);
      customerForm.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to create customer", description: error.message, variant: "destructive" });
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string; customer: CustomerFormData }) => {
      const customerData = { ...data.customer, email: data.customer.email || null };
      const response = await apiRequest("PATCH", `/api/customers/${data.id}`, customerData);
      return response.json();
    },
    onSuccess: (updatedCustomer) => {
      // Immediately update the selected customer to show changes
      setSelectedCustomer(updatedCustomer);
      // Then invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer updated", description: "Customer details have been updated successfully" });
      setEditingCustomer(null);
      customerForm.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to update customer", description: error.message, variant: "destructive" });
    },
  });

  // Address mutations
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiRequest("POST", `/api/customers/${selectedCustomer?.id}/addresses`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer?.id, "addresses"] });
      toast({ title: "Address saved", description: "New address has been added successfully" });
      setShowCreateAddress(false);
      addressForm.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to save address", description: error.message, variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: { id: string; address: AddressFormData }) => {
      const response = await apiRequest("PATCH", `/api/customer-addresses/${data.id}`, data.address);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer?.id, "addresses"] });
      toast({ title: "Address updated", description: "Address has been updated successfully" });
      setEditingAddress(null);
      addressForm.reset();
    },
    onError: (error) => {
      toast({ title: "Failed to update address", description: error.message, variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
      const response = await apiRequest("DELETE", `/api/customer-addresses/${addressId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCustomer?.id, "addresses"] });
      toast({ title: "Address deleted", description: "Address has been removed successfully" });
      setDeleteAddress(null);
    },
    onError: (error) => {
      toast({ title: "Failed to delete address", description: error.message, variant: "destructive" });
    },
  });

  // Filter customers
  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handlers
  const handleCreateCustomer = (data: CustomerFormData) => {
    createCustomerMutation.mutate(data);
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

  const handleUpdateCustomer = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, customer: data });
    }
  };

  const handleCreateAddress = (data: AddressFormData) => {
    createAddressMutation.mutate(data);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    addressForm.reset({
      name: address.name,
      address: address.address,
      contact: address.contact,
      type: address.type as "collection" | "delivery" | "both",
      isDefault: address.isDefault || false,
      notes: address.notes || "",
    });
  };

  const handleUpdateAddress = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, address: data });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "collection": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivery": return "bg-green-100 text-green-800 border-green-200";
      case "both": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (customersLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List Skeleton */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="h-5 w-5 mr-2" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-5 w-8 ml-2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-2" />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-4 border-l-4 border-transparent">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <div className="flex items-center mb-1">
                              <Skeleton className="h-3 w-3 mr-1" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <div className="flex items-center">
                              <Skeleton className="h-3 w-3 mr-1" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Details Skeleton */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-12 text-center">
                  <Skeleton className="h-16 w-16 mx-auto mb-4" />
                  <Skeleton className="h-6 w-40 mx-auto mb-2" />
                  <Skeleton className="h-4 w-64 mx-auto" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">
              Manage customers and their address books for faster job creation
            </p>
          </div>
          <Button onClick={() => setShowCreateCustomer(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Customers
                  <Badge variant="secondary" className="ml-2">
                    {filteredCustomers.length}
                  </Badge>
                </CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No customers found</p>
                    <p className="text-sm">Add your first customer to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-4 cursor-pointer border-l-4 transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-blue-50 border-blue-500'
                            : 'hover:bg-gray-50 border-transparent'
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{customer.name}</h3>
                            {customer.email && (
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Customer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteCustomer(customer)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Customer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Details & Addresses */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      {selectedCustomer.name}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => handleEditCustomer(selectedCustomer)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCustomer.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedCustomer.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {selectedCustomer.costPerMile 
                        ? `£${selectedCustomer.costPerMile} Per Mile (Custom Rate)` 
                        : `Uses default rate (£${getDefaultCostPerMile()} per mile)`
                      }
                    </span>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Primary Address</h4>
                    <div className="text-sm text-gray-600">
                      {selectedCustomer.address ? (
                        <>
                          <p>{selectedCustomer.address.line1}</p>
                          {selectedCustomer.address.line2 && <p>{selectedCustomer.address.line2}</p>}
                          <p>{selectedCustomer.address.city}, {selectedCustomer.address.postcode}</p>
                        </>
                      ) : (
                        <p className="text-gray-400 italic">No address provided</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Frequent Addresses */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Frequent Addresses
                      {customerAddresses && (
                        <Badge variant="secondary" className="ml-2">
                          {customerAddresses.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button 
                      onClick={() => setShowCreateAddress(true)} 
                      size="sm"
                      disabled={!selectedCustomer}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Save frequently used addresses for faster job creation and better workflow efficiency
                  </p>
                </CardHeader>
                <CardContent>
                  {addressesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Skeleton className="h-5 w-24" />
                                  <Skeleton className="h-5 w-16" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <Skeleton className="h-4 w-12 mb-1" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4 mb-1" />
                                    <Skeleton className="h-4 w-20" />
                                  </div>
                                  <div>
                                    <Skeleton className="h-4 w-12 mb-1" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-1/2" />
                                  </div>
                                </div>
                              </div>
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : customerAddresses && customerAddresses.length > 0 ? (
                    <div className="space-y-4">
                      {customerAddresses.map((address) => (
                        <Card key={address.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">{address.name}</h4>
                                  <Badge variant="outline" className={getTypeColor(address.type)}>
                                    {address.type}
                                  </Badge>
                                  {address.isDefault && (
                                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                      <Star className="h-3 w-3 mr-1" />
                                      Default
                                    </Badge>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">Address:</p>
                                    <div className="text-gray-600">
                                      <p>{address.address.line1}</p>
                                      {address.address.line2 && <p>{address.address.line2}</p>}
                                      <p>{address.address.city}, {address.address.postcode}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700 mb-1">Contact:</p>
                                    <div className="text-gray-600 space-y-1">
                                      <div className="flex items-center">
                                        <span className="font-medium mr-2">Name:</span>
                                        {address.contact.name}
                                      </div>
                                      <div className="flex items-center">
                                        <Phone className="h-3 w-3 mr-1" />
                                        {address.contact.phone}
                                      </div>
                                      {address.contact.email && (
                                        <div className="flex items-center">
                                          <Mail className="h-3 w-3 mr-1" />
                                          {address.contact.email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {address.notes && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                    <p className="font-medium text-gray-700">Notes:</p>
                                    <p className="text-gray-600">{address.notes}</p>
                                  </div>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditAddress(address)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Address
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteAddress(address)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Address
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No frequent addresses saved</p>
                      <p className="text-sm mb-4">
                        Add frequently used addresses to speed up job creation
                      </p>
                      <Button onClick={() => setShowCreateAddress(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Select a Customer</h3>
                <p>Choose a customer from the list to view their details and manage frequent addresses</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-6">
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Custom Cost Per Mile (£)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder={`Default: £${getDefaultCostPerMile()}`}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Leave blank to use system default
                      </p>
                    </FormItem>
                  )}
                />
              </div>

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

              {/* Billing Address Section */}
              <div className="space-y-4">
                <h3 className="font-medium">Billing Address (Optional)</h3>
                <p className="text-sm text-gray-600">If different from primary address. Used for invoices.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={customerForm.control}
                    name="billingAddress.line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
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
                        <FormLabel>City</FormLabel>
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
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Postcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Email Notification Settings</h3>
                <p className="text-sm text-gray-600">Email addresses for sending documents. Separate multiple emails with commas.</p>
                <div className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="pocEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof of Collection Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="email1@company.com, email2@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive POC documents when collection is completed
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="podEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof of Delivery Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="email1@company.com, email2@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive POD documents when delivery is completed
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="invoiceEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="accounts@company.com, finance@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive invoices when jobs are completed
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

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleUpdateCustomer)} className="space-y-6">
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>Custom Cost Per Mile (£)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder={`Default: £${getDefaultCostPerMile()}`}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-gray-500">
                        Leave blank to use system default
                      </p>
                    </FormItem>
                  )}
                />
              </div>

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

              {/* Billing Address Section */}
              <div className="space-y-4">
                <h3 className="font-medium">Billing Address (Optional)</h3>
                <p className="text-sm text-gray-600">If different from primary address. Used for invoices.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={customerForm.control}
                    name="billingAddress.line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
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
                        <FormLabel>City</FormLabel>
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
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Postcode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email Notification Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Email Notification Settings</h3>
                <p className="text-sm text-gray-600">Email addresses for sending documents. Separate multiple emails with commas.</p>
                <div className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="pocEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof of Collection Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="email1@company.com, email2@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive POC documents when collection is completed
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="podEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proof of Delivery Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="email1@company.com, email2@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive POD documents when delivery is completed
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={customerForm.control}
                    name="invoiceEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice Emails</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="accounts@company.com, finance@company.com" />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-gray-500">
                          These emails will receive invoices when jobs are completed
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

      {/* Create/Edit Address Dialog */}
      <Dialog open={showCreateAddress || !!editingAddress} onOpenChange={() => {
        setShowCreateAddress(false);
        setEditingAddress(null);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <Form {...addressForm}>
            <form onSubmit={addressForm.handleSubmit(editingAddress ? handleUpdateAddress : handleCreateAddress)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addressForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Main Warehouse, London Office" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addressForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Type *</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full p-2 border rounded-md">
                          <option value="both">Collection & Delivery</option>
                          <option value="collection">Collection Only</option>
                          <option value="delivery">Delivery Only</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Address Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={addressForm.control}
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
                    control={addressForm.control}
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
                    control={addressForm.control}
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
                    control={addressForm.control}
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

              <div className="space-y-4">
                <h3 className="font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={addressForm.control}
                    name="contact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Contact person" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="contact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="contact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Email address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={addressForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Special instructions, access codes, etc."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={addressForm.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded"
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Set as default address for this customer
                    </FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateAddress(false);
                  setEditingAddress(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                >
                  {editingAddress ? 
                    (updateAddressMutation.isPending ? "Updating..." : "Update Address") :
                    (createAddressMutation.isPending ? "Saving..." : "Save Address")
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteCustomer?.name}? This action cannot be undone.
              All associated addresses will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                // Add delete customer mutation here
                setDeleteCustomer(null);
              }}
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Address Confirmation */}
      <AlertDialog open={!!deleteAddress} onOpenChange={() => setDeleteAddress(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the address "{deleteAddress?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteAddress) {
                  deleteAddressMutation.mutate(deleteAddress.id);
                }
              }}
            >
              Delete Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </main>
  );
}