import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, CreditCard, Mail, Users, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import CustomerAddressManager from "@/components/customer/customer-address-manager";

interface CustomerFormSimpleProps {
  form: any;
  getDefaultRate: () => string;
  customerId?: string; // For editing existing customers to show address book
}

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
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            className="flex-1"
            data-testid={`input-add-${emailType}`}
          />
          <Button 
            type="button" 
            onClick={addEmail}
            disabled={!newEmail || emails.includes(newEmail)}
            data-testid={`button-add-${emailType}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {emails.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Recipients:</div>
            <div className="flex flex-wrap gap-2">
              {emails.map((email: string, index: number) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1" data-testid={`badge-${emailType}-${index}`}>
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="text-gray-500 hover:text-red-500 ml-1"
                    data-testid={`button-remove-${emailType}-${index}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <FormField
          control={form.control}
          name={emailType}
          render={() => (
            <FormItem>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function CustomerFormSimple({ form, getDefaultRate, customerId }: CustomerFormSimpleProps) {
  // Auto-sync billing information for individual customers
  useEffect(() => {
    const customerType = form.watch('customerType');
    if (customerType === 'individual') {
      // Auto-populate billing company name with individual's name
      const name = form.watch('name');
      if (name) {
        form.setValue('billingCompanyName', name);
      }
      
      // Auto-populate billing address with personal address
      const address = form.watch('address');
      if (address) {
        form.setValue('billingAddress', address);
      }
    }
  }, [form.watch('customerType'), form.watch('name'), form.watch('address')]);

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="billing">Billing Setup</TabsTrigger>
        <TabsTrigger value="notifications">Email Recipients</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
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
            control={form.control}
            name="name"
            render={({ field }) => {
              const customerType = form.watch('customerType');
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
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Primary Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="Enter email address" className="h-10" data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter phone number" className="h-10" data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costPerMile"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Rate Per Mile (£)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01" 
                    placeholder={`Default: £${getDefaultRate()}`} 
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

      <TabsContent value="addresses" className="space-y-6">
        <div className="space-y-6">
          {/* Primary Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" />
                Primary Address
              </CardTitle>
              <CardDescription>Main business address for this customer</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address.line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1 *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Street address" data-testid="input-address-line1" />
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
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Apartment, suite, etc." data-testid="input-address-line2" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" data-testid="input-address-city" />
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
                    <FormLabel>Postcode *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Postcode" data-testid="input-address-postcode" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Address Book - only show when editing existing customer */}
          {customerId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Address Book
                </CardTitle>
                <CardDescription>
                  Manage frequent collection and delivery addresses for this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerAddressManager 
                  customerId={customerId}
                  showSelector={false}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="billing" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
            <CardDescription>
              {form.watch('customerType') === 'individual' 
                ? 'For individuals, billing details will match your personal information'
                : 'Company and address for invoicing'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.watch('customerType') === 'business' ? (
              <FormField
                control={form.control}
                name="billingCompanyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Company name for invoices" data-testid="input-billing-company" />
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
                  Billing will be addressed to: <strong>{form.watch('name') || 'Enter name above'}</strong>
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Your personal address will be automatically used for billing
                </p>
              </div>
            )}
            {form.watch('customerType') === 'business' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="billingAddress.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Billing street address" data-testid="input-billing-line1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingAddress.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Apartment, suite, etc." data-testid="input-billing-line2" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingAddress.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing City *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Billing city" data-testid="input-billing-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="billingAddress.postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Postcode *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Billing postcode" data-testid="input-billing-postcode" />
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
                  <div>{form.watch('address.line1') || 'Address line 1 will appear here'}</div>
                  {form.watch('address.line2') && <div>{form.watch('address.line2')}</div>}
                  <div>{form.watch('address.city') || 'City'}, {form.watch('address.postcode') || 'Postcode'}</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This matches your personal address above
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications" className="space-y-6">
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Email Recipients Configuration</h3>
            <p className="text-gray-600 text-sm">Set up multiple email recipients for different document types</p>
          </div>
          
          <EmailRecipientsSection
            form={form}
            emailType="defaultPocEmails"
            title="Proof of Collection (POC) Recipients"
            description="Emails sent when a vehicle is collected from this customer"
          />
          
          <EmailRecipientsSection
            form={form}
            emailType="defaultPodEmails"
            title="Proof of Delivery (POD) Recipients"
            description="Emails sent when a vehicle is delivered to this customer"
          />
          
          <EmailRecipientsSection
            form={form}
            emailType="defaultInvoiceEmails"
            title="Invoice Recipients"
            description="Emails sent when invoices are generated for this customer"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}