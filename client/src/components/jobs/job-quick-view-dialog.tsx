import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Car, User, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `£${num.toFixed(2)}`;
};
import type { Job, Customer, Driver, Vehicle } from "@shared/schema";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface JobQuickViewDialogProps {
  job: JobWithRelations;
  onClose: () => void;
}

export default function JobQuickViewDialog({ job, onClose }: JobQuickViewDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-500';
      case 'assigned': return 'bg-pink-500';
      case 'collected': return 'bg-amber-500';
      case 'delivered': return 'bg-green-500';
      case 'invoiced': return 'bg-blue-500';
      case 'paid': return 'bg-black';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Job #{job.jobNumber}</DialogTitle>
            <Badge className={`${getStatusColor(job.status || 'created')} text-white font-semibold px-3 py-1`}>
              {(job.status || 'created').toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{job.customer?.name}</h3>
                <p className="text-sm text-gray-600">{job.customer?.email}</p>
                <p className="text-sm text-gray-600">{job.customer?.phone}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold">{job.vehicle?.registration}</h3>
                <p className="text-sm text-gray-600">{job.vehicle?.make}</p>
                <p className="text-sm text-gray-600">{job.vehicle?.colour}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Financial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm">Distance:</span>
                    <span className="text-sm font-semibold">{Math.ceil(Number(job.calculatedMileage) || 0)} miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Rate:</span>
                    <span className="text-sm font-semibold">{formatCurrency(job.ratePerMile || 0)}/mile</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Total:</span>
                    <span className="text-sm font-bold">{formatCurrency(job.totalMovementFee || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-600" />
                  Collection Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{job.collectionAddress.line1}</p>
                  {job.collectionAddress.line2 && <p>{job.collectionAddress.line2}</p>}
                  <p>{job.collectionAddress.city}</p>
                  <p className="font-semibold">{job.collectionAddress.postcode}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{job.deliveryAddress.line1}</p>
                  {job.deliveryAddress.line2 && <p>{job.deliveryAddress.line2}</p>}
                  <p>{job.deliveryAddress.city}</p>
                  <p className="font-semibold">{job.deliveryAddress.postcode}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Assignment */}
          {job.driver && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Driver Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{job.driver.name}</h3>
                    <p className="text-sm text-gray-600">{job.driver.phone}</p>
                    <p className="text-sm text-gray-600">{job.driver.email}</p>
                  </div>
                  {job.assignedAt && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Assigned</p>
                      <p className="text-sm font-semibold">{new Date(job.assignedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => {
                onClose();
                window.location.href = `/jobs/${job.id}`;
              }}
              className="flex items-center"
            >
              View Full Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}