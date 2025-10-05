import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Plus, MapPin, Edit, Trash2, Building, User, Phone, Mail, StickyNote, ArrowDownUp, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CustomerAddress } from "@shared/schema";

const addressFormSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  name: z.string().min(1, "Location name is required"),
  type: z.enum(['collection', 'delivery', 'both'], {
    required_error: "Address type is required",
  }),
  address: z.object({
    line1: z.string().min(1, "Address line 1 is required"),
    line2: z.string().optional().or(z.literal("")),
    city: z.string().min(1, "City is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  contact: z.object({
    name: z.string().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().optional().or(z.literal("")).refine(
      (val) => !val || val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Please enter a valid email address"
    ),
  }),
  notes: z.string().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressFormSchema>;

interface CustomerAddressManagerProps {
  customerId: string;
  onAddressSelect?: (address: CustomerAddress) => void;
  showSelector?: boolean;
  filterType?: 'collection' | 'delivery' | 'all'; // New: Filter addresses by type
}

export default function CustomerAddressManager({ 
  customerId, 
  onAddressSelect,
  showSelector = false,
  filterType = 'all' // Default to showing all addresses
}: CustomerAddressManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allAddresses, isLoading } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/customers", customerId, "addresses"],
  });

  // Filter addresses based on filterType
  const addresses = useMemo(() => {
    if (!allAddresses) return [];
    
    if (filterType === 'all') {
      return allAddresses;
    }
    
    // For collection: show "collection" and "both"
    // For delivery: show "delivery" and "both"
    return allAddresses.filter(address => 
      address.type === filterType || address.type === 'both'
    );
  }, [allAddresses, filterType]);

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      customerId,
      name: "",
      type: "both",
      address: {
        line1: "",
        line2: "",
        city: "",
        postcode: "",
      },
      contact: {
        name: "",
        phone: "",
        email: "",
      },
      notes: "",
      isDefault: false,
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await apiRequest(`/api/customers/${customerId}/addresses`, "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "addresses"] });
      toast({
        title: "✓ Address Saved",
        description: "Location added to address book",
      });
      handleCloseForm();
    },
    onError: (error: Error) => {
      console.error("Address save error:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Please check your details and try again",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: { id: string; address: Partial<AddressFormData> }) => {
      const response = await apiRequest(`/api/customer-addresses/${data.id}`, "PATCH", data.address);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "addresses"] });
      toast({
        title: "✓ Address Updated",
        description: "Changes saved successfully",
      });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/customer-addresses/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "addresses"] });
      toast({
        title: "✓ Deleted",
        description: "Address removed from address book",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddressFormData) => {
    console.log("Submitting address:", data);
    if (editingAddress) {
      updateAddressMutation.mutate({
        id: editingAddress.id,
        address: data,
      });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const handleEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    form.reset({
      customerId: address.customerId,
      name: address.name,
      type: address.type as "collection" | "delivery" | "both",
      address: address.address,
      contact: address.contact || { name: "", phone: "", email: "" },
      notes: address.notes || "",
      isDefault: address.isDefault || false,
    });
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingAddress(null);
    form.reset({
      customerId,
      name: "",
      type: filterType === 'collection' ? 'collection' : filterType === 'delivery' ? 'delivery' : 'both',
      address: {
        line1: "",
        line2: "",
        city: "",
        postcode: "",
      },
      contact: {
        name: "",
        phone: "",
        email: "",
      },
      notes: "",
      isDefault: false,
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "collection": return "Collection";
      case "delivery": return "Delivery";
      case "both": return "Both";
      default: return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "collection": return "bg-blue-500 text-white border-blue-500";
      case "delivery": return "bg-emerald-500 text-white border-emerald-500";
      case "both": return "bg-purple-500 text-white border-purple-500";
      default: return "bg-gray-500 text-white";
    }
  };

  const getFilterDescription = () => {
    if (filterType === 'collection') {
      return "Showing collection addresses only";
    } else if (filterType === 'delivery') {
      return "Showing delivery addresses only";
    }
    return "Manage all saved locations";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">
              {filterType === 'collection' ? 'Collection Addresses' :
               filterType === 'delivery' ? 'Delivery Addresses' :
               'Saved Addresses'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {getFilterDescription()}
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)} 
            size="default"
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            data-testid="button-add-address"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Address
          </Button>
        </div>

        {/* Filter indicator for job creation */}
        {filterType !== 'all' && addresses.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-md">
            <Filter className="h-3.5 w-3.5" />
            <span>
              Showing {filterType} addresses + addresses marked as "both"
            </span>
          </div>
        )}

        {/* Address List */}
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card 
                key={address.id} 
                className={`overflow-hidden transition-all hover:shadow-md ${
                  showSelector ? 'cursor-pointer hover:border-blue-400' : ''
                }`}
                onClick={() => showSelector && onAddressSelect?.(address)}
                data-testid={`card-address-${address.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Type Indicator */}
                    <div className={`w-2 ${
                      address.type === 'collection' ? 'bg-blue-500' :
                      address.type === 'delivery' ? 'bg-emerald-500' :
                      'bg-purple-500'
                    }`} />
                    
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-50">{address.name}</h4>
                            <Badge className={`${getTypeBadgeClass(address.type)} text-xs`}>
                              {getTypeLabel(address.type)}
                            </Badge>
                            {address.isDefault && (
                              <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                                Default
                              </Badge>
                            )}
                          </div>

                          {/* Address */}
                          <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span>{address.address.line1}</span>
                              {address.address.line2 && <span>, {address.address.line2}</span>}
                              <span>, {address.address.city}, {address.address.postcode}</span>
                            </div>
                          </div>

                          {/* Contact Info */}
                          {address.contact && (address.contact.name || address.contact.phone || address.contact.email) && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {address.contact.name && (
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{address.contact.name}</span>
                                </div>
                              )}
                              {address.contact.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="h-3.5 w-3.5" />
                                  <span>{address.contact.phone}</span>
                                </div>
                              )}
                              {address.contact.email && (
                                <div className="flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[200px]">{address.contact.email}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes */}
                          {address.notes && (
                            <div className="flex gap-2 bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-400 px-3 py-2 rounded">
                              <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-amber-900 dark:text-amber-100">{address.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!showSelector && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(address);
                              }}
                              className="h-9 w-9 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                              data-testid={`button-edit-${address.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete "${address.name}"?`)) {
                                  deleteAddressMutation.mutate(address.id);
                                }
                              }}
                              className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-${address.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-4">
                <Building className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {filterType === 'collection' ? 'No Collection Addresses' :
                 filterType === 'delivery' ? 'No Delivery Addresses' :
                 'No Addresses Yet'}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {filterType === 'collection' ? 'Add collection locations to speed up job creation' :
                 filterType === 'delivery' ? 'Add delivery locations to speed up job creation' :
                 'Save collection and delivery addresses to speed up job creation'}
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-add-first-address"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog - SIMPLE FORM */}
      <Dialog open={showCreateForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingAddress ? "Edit Address" : "New Address"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {/* Name & Type - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Location Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Main Depot" 
                          className="h-11"
                          {...field}
                          data-testid="input-address-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11" data-testid="select-address-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="both">
                            <span className="flex items-center gap-2">
                              <ArrowDownUp className="h-4 w-4" /> Both
                            </span>
                          </SelectItem>
                          <SelectItem value="collection">Collection</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                
                <FormField
                  control={form.control}
                  name="address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Street address" 
                          className="h-11"
                          {...field}
                          data-testid="input-address-line1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Building, unit (optional)" 
                          className="h-11"
                          {...field}
                          data-testid="input-address-line2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="City" 
                            className="h-11"
                            {...field}
                            data-testid="input-address-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Postcode" 
                            className="h-11"
                            {...field}
                            data-testid="input-address-postcode"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Section - Optional */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact (Optional)
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Leave blank if not applicable</p>
                </div>
                
                <FormField
                  control={form.control}
                  name="contact.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Contact name" 
                          className="h-11"
                          {...field}
                          data-testid="input-contact-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="tel"
                            placeholder="Phone" 
                            className="h-11"
                            {...field}
                            data-testid="input-contact-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="Email" 
                            className="h-11"
                            {...field}
                            data-testid="input-contact-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <StickyNote className="h-4 w-4" />
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Gate codes, parking instructions, special access details..." 
                        rows={3}
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Default Checkbox */}
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-default"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Set as default address for this customer
                    </FormLabel>
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={handleCloseForm}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                  data-testid="button-save-address"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending 
                    ? "Saving..." 
                    : editingAddress ? "Save Changes" : "Add Address"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
