import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, MapPin, Clock, User, Car, FileText, Phone, Mail, PoundSterling } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBgColor } from "@shared/status-utils";
import type { Job, Expense, Customer, Driver, Vehicle } from "@shared/schema";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver; 
  vehicle?: Vehicle;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

const generateGoogleMapsUrl = (address: { line1: string; line2?: string; city: string; postcode: string }) => {
  const addressString = [address.line1, address.line2, address.city, address.postcode]
    .filter(Boolean)
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
};

export default function JobDetails() {
  const [, params] = useRoute("/admin/jobs/:jobNumber");
  const jobNumber = params?.jobNumber || null;
  
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);









  const { data: job, isLoading } = useQuery<JobWithRelations>({
    queryKey: ["/api/jobs/by-number", jobNumber],
    queryFn: () => fetch(`/api/jobs/by-number/${jobNumber}`).then(res => res.json()),
    enabled: !!jobNumber,
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/jobs", job?.id, "expenses"],
    queryFn: () => fetch(`/api/jobs/${job?.id}/expenses`, {
      headers: { 'Cache-Control': 'no-cache' }
    }).then(res => res.json()),
    enabled: !!job?.id,
  });



  if (isLoading || !job || !jobNumber) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/admin/jobs">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Jobs
                  </Button>
                </Link>
                <div className="border-l border-gray-300 pl-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">Job #{job.jobNumber}</h1>
                      <p className="text-sm text-gray-500">
                        Created {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short',
                          day: 'numeric'
                        }) : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Badge 
                className={cn(
                  "px-3 py-1 text-xs font-semibold text-white rounded-full",
                  getStatusBgColor(job.status || 'created')
                )}
              >
                {(job.status || 'created').toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Customer</p>
                  <p className="text-lg font-bold text-gray-900">{job.customer?.name}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Mail className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-600">{job.customer?.email}</p>
                  </div>
                  <div className="flex items-center mt-1 space-x-2">
                    <Phone className="h-3 w-3 text-gray-500" />
                    <p className="text-xs text-gray-600">{job.customer?.phone}</p>
                  </div>
                </div>
                <User className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Vehicle</p>
                  <p className="text-lg font-bold text-gray-900">{job.vehicle?.registration}</p>
                  <p className="text-sm text-gray-700">{job.vehicle?.make}</p>
                  <p className="text-xs text-gray-600 mt-1">{job.vehicle?.colour} • {job.vehicle?.year}</p>
                </div>
                <Car className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Distance</p>
                  <p className="text-lg font-bold text-gray-900">{Math.ceil(Number(job.calculatedMileage) || 0)} miles</p>
                  <p className="text-sm text-gray-700">{formatCurrency(job.ratePerMile || 0)}/mile</p>
                  <p className="text-xs text-gray-600 mt-1">Movement Rate</p>
                </div>
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Fee</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(job.totalMovementFee || 0)}</p>
                  <p className="text-xs text-gray-600 mt-1">Movement Fee</p>
                </div>
                <PoundSterling className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="details" className="space-y-6">
          <div className="border-b border-gray-200">
            <TabsList className="h-auto p-0 bg-transparent border-0 space-x-8">
              <TabsTrigger 
                value="details" 
                className="px-0 py-4 border-0 bg-transparent text-gray-500 hover:text-gray-700 data-[state=active]:text-cyan-600 data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent rounded-none"
              >
                Job Details
              </TabsTrigger>
              <TabsTrigger 
                value="addresses" 
                className="px-0 py-4 border-0 bg-transparent text-gray-500 hover:text-gray-700 data-[state=active]:text-cyan-600 data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent rounded-none"
              >
                Addresses
              </TabsTrigger>
              <TabsTrigger 
                value="expenses" 
                className="px-0 py-4 border-0 bg-transparent text-gray-500 hover:text-gray-700 data-[state=active]:text-cyan-600 data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent rounded-none relative"
              >
                Expenses
                {expenses.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-cyan-100 text-cyan-700 hover:bg-cyan-100 flex items-center justify-center">
                    {expenses.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="px-0 py-4 border-0 bg-transparent text-gray-500 hover:text-gray-700 data-[state=active]:text-cyan-600 data-[state=active]:border-b-2 data-[state=active]:border-cyan-600 data-[state=active]:bg-transparent rounded-none"
              >
                Timeline
              </TabsTrigger>
            </TabsList>
          </div>

        <TabsContent value="details" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-cyan-500" />
                  Driver Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.driver ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-cyan-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.driver.name}</h3>
                        <p className="text-sm text-gray-500">Assigned Driver</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-13">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{job.driver.phone}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">{job.driver.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No driver assigned</p>
                    <p className="text-sm text-gray-400">This job is available for assignment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-cyan-500" />
                  Requested Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-800">C</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Collection</p>
                        <p className="text-xs text-gray-500">Requested date</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {job.requestedCollectionDate 
                        ? new Date(job.requestedCollectionDate).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })
                        : 'Not specified'
                      }
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-800">D</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delivery</p>
                        <p className="text-xs text-gray-500">Requested date</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {job.requestedDeliveryDate 
                        ? new Date(job.requestedDeliveryDate).toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })
                        : 'Not specified'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="addresses" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-purple-800">C</span>
                    </div>
                    Collection Address
                  </div>
                  {job.collectionAddress && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-purple-700 border-purple-300 hover:bg-purple-100 hover:border-purple-400 hover:text-purple-800 transition-colors"
                      onClick={() => window.open(generateGoogleMapsUrl(job.collectionAddress), '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View on Map
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-purple-50 rounded-lg">
                  {job.collectionAddress ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{job.collectionAddress.line1}</p>
                      {job.collectionAddress.line2 && (
                        <p className="text-gray-700">{job.collectionAddress.line2}</p>
                      )}
                      <p className="text-gray-700">{job.collectionAddress.city}</p>
                      <p className="font-semibold text-purple-700 text-lg">{job.collectionAddress.postcode}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Collection address not set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-indigo-800">D</span>
                    </div>
                    Delivery Address
                  </div>
                  {job.deliveryAddress && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-indigo-700 border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 hover:text-indigo-800 transition-colors"
                      onClick={() => window.open(generateGoogleMapsUrl(job.deliveryAddress), '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View on Map
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  {job.deliveryAddress ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{job.deliveryAddress.line1}</p>
                      {job.deliveryAddress.line2 && (
                        <p className="text-gray-700">{job.deliveryAddress.line2}</p>
                      )}
                      <p className="text-gray-700">{job.deliveryAddress.city}</p>
                      <p className="font-semibold text-indigo-700 text-lg">{job.deliveryAddress.postcode}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">Delivery address not set</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          

        </TabsContent>

        <TabsContent value="expenses" className="mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-cyan-500" />
                  Job Expenses
                </div>
                {expenses.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total: {expenses.length} Expense{expenses.length > 1 ? 's' : ''}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                    </p>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses recorded</h3>
                  <p className="text-gray-500">No expenses have been submitted for this job yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense, index) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {expense.type === 'fuel' && expense.fuelType 
                              ? `${expense.fuelType.charAt(0).toUpperCase() + expense.fuelType.slice(1)} - ${expense.notes || 'Fuel Expense'}`
                              : expense.notes || 'Expense'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {expense.type.charAt(0).toUpperCase() + expense.type.slice(1)} • Submitted {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={expense.isApproved ? "default" : "secondary"}
                            className={cn(
                              "text-xs font-medium",
                              expense.isApproved 
                                ? "bg-green-100 text-green-700 hover:bg-green-100" 
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                            )}
                          >
                            {expense.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          {expense.chargeToCustomer && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                              Billable
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-cyan-500" />
                Job Progress Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-8">
                  {/* Job Created - Always present */}
                  <div className="relative flex items-start space-x-4">
                    <div className="relative z-10 w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Job Created</h3>
                          <p className="text-sm text-gray-600">
                            {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown date'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Initial job setup and customer details recorded</p>
                        </div>
                        <Badge className="bg-gray-100 text-gray-700 border-gray-300">CREATED</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Driver Assigned */}
                  {job.status !== 'created' && job.assignedAt ? (
                    <div className="relative flex items-start space-x-4">
                      <div className="relative z-10 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Driver Assigned</h3>
                            <p className="text-sm text-gray-600">
                              {job.assignedAt ? new Date(job.assignedAt).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown date'}
                            </p>
                            <div className="mt-2 flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-medium text-gray-900">{job.driver?.name || 'Unknown driver'}</p>
                            </div>
                            {job.driver?.email && (
                              <p className="text-xs text-gray-500 mt-1 ml-6">{job.driver.email}</p>
                            )}
                          </div>
                          <Badge className="bg-pink-100 text-pink-700 border-pink-300">ASSIGNED</Badge>
                        </div>
                      </div>
                    </div>
                ) : job.status === 'created' ? (
                  <div className="relative flex items-start space-x-4 opacity-50">
                    <div className="relative z-10 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-semibold text-gray-400">Awaiting Driver Assignment</h3>
                      <p className="text-sm text-gray-400">Pending...</p>
                    </div>
                  </div>
                ) : null}
                
                {/* Vehicle Collected */}
                {job.status && ['collected', 'delivered', 'invoiced', 'paid'].includes(job.status) && job.collectedAt ? (
                  <div className="relative flex items-start space-x-4">
                    <div className="relative z-10 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Vehicle Collected</h3>
                          <p className="text-sm text-gray-600">
                            {job.collectedAt ? new Date(job.collectedAt).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown date'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">POC document generated • Driver: {job.driver?.name || 'Unknown'}</p>
                        </div>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300">COLLECTED</Badge>
                      </div>
                    </div>
                  </div>
                ) : job.status && ['assigned'].includes(job.status) ? (
                  <div className="relative flex items-start space-x-4 opacity-50">
                    <div className="relative z-10 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-semibold text-gray-400">Awaiting Collection</h3>
                      <p className="text-sm text-gray-400">Pending...</p>
                    </div>
                  </div>
                ) : null}
                
                {/* Vehicle Delivered */}
                {job.status && ['delivered', 'invoiced', 'paid'].includes(job.status) && job.deliveredAt ? (
                  <div className="relative flex items-start space-x-4">
                    <div className="relative z-10 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Vehicle Delivered</h3>
                          <p className="text-sm text-gray-600">
                            {job.deliveredAt ? new Date(job.deliveredAt).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown date'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">POD document generated • Driver: {job.driver?.name || 'Unknown'}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-green-300">DELIVERED</Badge>
                      </div>
                    </div>
                  </div>
                ) : job.status && ['assigned', 'collected'].includes(job.status) ? (
                  <div className="relative flex items-start space-x-4 opacity-50">
                    <div className="relative z-10 w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-semibold text-gray-400">Awaiting Delivery</h3>
                      <p className="text-sm text-gray-400">Pending...</p>
                    </div>
                  </div>
                ) : null}
                
                {/* Invoice Generated */}
                {job.status && ['invoiced', 'paid'].includes(job.status) && job.invoicedAt ? (
                  <div className="relative flex items-start space-x-4">
                    <div className="relative z-10 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Invoice Generated</h3>
                          <p className="text-sm text-gray-600">
                            {job.invoicedAt ? new Date(job.invoicedAt).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Unknown date'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Invoice #{job.jobNumber}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300">INVOICED</Badge>
                      </div>
                    </div>
                  </div>
                ) : job.status && ['delivered'].includes(job.status) ? (
                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-400">Awaiting Invoice Generation</p>
                      <p className="text-sm text-gray-400">Pending...</p>
                    </div>
                  </div>
                ) : null}
                
                {/* Payment Received */}
                {job.status === 'paid' && job.paidAt ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-semibold">Payment Received</p>
                      <p className="text-sm text-gray-600">{new Date(job.paidAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Job Complete</p>
                    </div>
                    <Badge variant="outline" className="bg-gray-100 text-gray-700">PAID</Badge>
                  </div>
                ) : job.status && ['invoiced'].includes(job.status) ? (
                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-400">Awaiting Payment</p>
                      <p className="text-sm text-gray-400">Pending...</p>
                    </div>
                  </div>
                ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <Dialog open={!!selectedExpense} onOpenChange={() => setSelectedExpense(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Item</label>
                  <p className="text-lg font-semibold">{selectedExpense.notes || 'Expense'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedExpense.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Driver</label>
                  <p>{(selectedExpense as any).driverName || `Driver ${selectedExpense.driverId}`}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p>{selectedExpense.createdAt ? new Date(selectedExpense.createdAt).toLocaleDateString() : 'Unknown date'}</p>
                </div>
              </div>
              
              {selectedExpense.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedExpense.notes}</p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Badge
                  variant={selectedExpense.isApproved ? "default" : "secondary"}
                  className={selectedExpense.isApproved ? "bg-green-500" : "bg-yellow-500"}
                >
                  {selectedExpense.isApproved ? "Approved" : "Pending Approval"}
                </Badge>
                {selectedExpense.chargeToCustomer && (
                  <Badge variant="outline">Will appear on invoice</Badge>
                )}
              </div>
              
              {selectedExpense.receiptPhotoPath && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Receipt</label>
                  <div className="mt-2 max-h-[60vh] overflow-auto">
                    <img
                      src={`/api/expenses/${selectedExpense.id}/receipt`}
                      alt="Expense receipt"
                      className="max-w-[400px] h-auto rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </div>
  );
}