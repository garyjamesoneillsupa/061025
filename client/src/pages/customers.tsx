import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Building2, Trash2, Edit, Mail, MapPin, DollarSign, Users, Phone, MessageSquare, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Customer, Setting, CustomerAddress } from "@shared/schema";
import { CustomerFormSimple } from "@/components/CustomerFormSimple";
import CustomerAddressManager from "@/components/customer/customer-address-manager";
import { useToast } from "@/hooks/use-toast";

const customerFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.union([
    z.string().email("Please enter a valid email address"),
    z.literal("")
  ]).optional(),
  phone: z.string().optional(),
  customerType: z.enum(['business', 'individual']).default('business'),
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddressManager, setShowAddressManager] = useState<string | null>(null);

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

  // Fetch all customer addresses for display in cards
  const { data: allCustomerAddresses = [] } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customer-addresses/all"],
    queryFn: async () => {
      const response = await fetch("/api/customer-addresses/all");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper function to get default rate
  const getDefaultRate = () => {
    const defaultRateSetting = settings.find(s => s.key === "default_rate_per_mile");
    return defaultRateSetting?.value || '0.80';
  };

  // Helper function to get customer addresses
  const getCustomerAddresses = (customerId: string) => {
    return allCustomerAddresses.filter(addr => addr.customerId === customerId);
  };

  // Forms
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

  // Mutations
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create customer");
      return response.json();
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
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update customer");
      return response.json();
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
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete customer");
      return response.json();
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600 mt-1">Manage customer database, billing information, and email notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
            <DialogTrigger asChild>
              <Button className="h-10" data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl">Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a comprehensive customer profile with billing and notification settings
                </DialogDescription>
              </DialogHeader>
              <Form {...customerForm}>
                <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-6">
                  <CustomerFormSimple 
                    form={customerForm} 
                    getDefaultRate={getDefaultRate}
                  />
                  <div className="flex justify-end space-x-2 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowCreateCustomer(false)} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCustomerMutation.isPending}
                      className="min-w-[120px]"
                      data-testid="button-create-customer"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-total-customers">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Custom Rates</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-custom-rates">
                  {customers.filter(c => c.costPerMile && c.costPerMile.trim() !== '').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Email Setup</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-email-setup">
                  {customers.filter(c => 
                    (c.defaultPocEmails && c.defaultPocEmails.length > 0) ||
                    (c.defaultPodEmails && c.defaultPodEmails.length > 0) ||
                    (c.defaultInvoiceEmails && c.defaultInvoiceEmails.length > 0)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search customers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")} data-testid="button-clear-search">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No customers found" : "No customers yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : "Get started by adding your first customer"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateCustomer(true)} data-testid="button-add-first-customer">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Customer
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow duration-200" data-testid={`card-customer-${customer.id}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      customer.customerType === 'individual' 
                        ? 'bg-purple-100' 
                        : 'bg-blue-100'
                    }`}>
                      {customer.customerType === 'individual' ? (
                        <User className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold" data-testid={`text-customer-name-${customer.id}`}>{customer.name}</CardTitle>
                      <div className="flex gap-2 mt-1">
                        {customer.customerType === 'individual' ? (
                          <Badge className="text-xs bg-purple-100 text-purple-800">
                            Individual
                          </Badge>
                        ) : (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            Business
                          </Badge>
                        )}
                        {customer.billingCompanyName && customer.billingCompanyName !== customer.name && (
                          <Badge variant="outline" className="text-xs">
                            Bills as: {customer.billingCompanyName}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCustomer(customer)}
                      className="h-8 w-8 p-0"
                      data-testid={`button-edit-${customer.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCustomer(customer)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      data-testid={`button-delete-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate" data-testid={`text-email-${customer.id}`}>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span data-testid={`text-phone-${customer.id}`}>{customer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="leading-5" data-testid={`text-address-${customer.id}`}>
                      <div>{customer.address.line1}</div>
                      {customer.address.line2 && <div>{customer.address.line2}</div>}
                      <div>{customer.address.city}, {customer.address.postcode}</div>
                    </div>
                  </div>
                )}

                {/* Rate */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-medium" data-testid={`text-rate-${customer.id}`}>£{customer.costPerMile || getDefaultRate()}/mile</span>
                </div>

                {/* Address Book */}
                {(() => {
                  const customerAddresses = getCustomerAddresses(customer.id);
                  const collectionCount = customerAddresses.filter(a => a.type === 'collection' || a.type === 'both').length;
                  const deliveryCount = customerAddresses.filter(a => a.type === 'delivery' || a.type === 'both').length;
                  
                  return (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Address Book</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddressManager(customer.id)}
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          data-testid={`button-manage-addresses-${customer.id}`}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Manage
                        </Button>
                      </div>
                      
                      {customerAddresses.length > 0 ? (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-lg font-semibold text-green-800">{collectionCount}</div>
                            <div className="text-xs text-green-600">Collection</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-lg font-semibold text-blue-800">{deliveryCount}</div>
                            <div className="text-xs text-blue-600">Delivery</div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-500">No saved addresses</div>
                          <div className="text-xs text-gray-400">Click 'Manage' to add frequent locations</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer profile, billing, and notification settings
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleUpdateCustomer)} className="space-y-6">
              <CustomerFormSimple 
                form={customerForm} 
                getDefaultRate={getDefaultRate}
                customerId={editingCustomer?.id}
              />
              <div className="flex justify-end space-x-2 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateCustomerMutation.isPending}
                  className="min-w-[120px]"
                  data-testid="button-update-customer"
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
              Are you sure you want to delete <strong>{deletingCustomer?.name}</strong>? 
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCustomer}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              data-testid="button-confirm-delete"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Address Manager Dialog */}
      {showAddressManager && (
        <Dialog open={!!showAddressManager} onOpenChange={() => setShowAddressManager(null)}>
          <DialogContent 
            className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto"
            style={{ 
              width: 'calc(100vw - 2rem)', 
              maxWidth: 'calc(1280px - 4rem)',
            }}
          >
            <DialogHeader>
              <DialogTitle>
                Manage Addresses for {customers.find(c => c.id === showAddressManager)?.name}
              </DialogTitle>
              <DialogDescription>
                Add and manage frequent collection and delivery addresses for faster job creation
              </DialogDescription>
            </DialogHeader>
            <CustomerAddressManager 
              customerId={showAddressManager}
              onAddressSelect={() => {
                // Refresh the addresses after any changes
                queryClient.invalidateQueries({ queryKey: ["/api/customer-addresses/all"] });
                setShowAddressManager(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}