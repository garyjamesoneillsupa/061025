import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, User, Phone, Mail, Calendar, Truck, Building } from "lucide-react";
import JobStatusTimeline from "./job-status-timeline";
import type { Job, Customer, Driver, Vehicle } from "@shared/schema";

interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
}

interface JobViewDialogProps {
  job: JobWithRelations;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  const colors = {
    created: "bg-gray-100 text-gray-800",
    assigned: "bg-blue-100 text-blue-800",
    collected: "bg-yellow-100 text-yellow-800",
    delivered: "bg-green-100 text-green-800",
    invoiced: "bg-purple-100 text-purple-800",
    paid: "bg-emerald-100 text-emerald-800",
  };
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export default function JobViewDialog({ job, onClose }: JobViewDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Job {job.jobNumber}</DialogTitle>
            <Badge className={`${getStatusColor(job.status)} capitalize`}>
              {job.status.replace('_', ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Timeline */}
          <div>
            <h3 className="text-lg font-medium mb-3">Status Progress</h3>
            <JobStatusTimeline status={job.status} />
          </div>

          <Separator />

          {/* Vehicle Information */}
          <div>
            <h3 className="text-lg font-medium flex items-center mb-3">
              <Truck className="mr-2 h-5 w-5" />
              Vehicle Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Registration:</span> {job.vehicle?.registration || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Make:</span> {job.vehicle?.make || 'N/A'}
              </div>
              {job.vehicle?.colour && (
                <div>
                  <span className="font-medium">Colour:</span> {job.vehicle.colour}
                </div>
              )}
              {job.vehicle?.year && (
                <div>
                  <span className="font-medium">Year:</span> {job.vehicle.year}
                </div>
              )}
              {job.vehicle?.motStatus && (
                <div>
                  <span className="font-medium">MOT Status:</span> {job.vehicle.motStatus}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-medium flex items-center mb-3">
              <Building className="mr-2 h-5 w-5" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Company:</span> {job.customer?.name || 'N/A'}
              </div>
              {job.customer?.email && (
                <div>
                  <span className="font-medium">Email:</span> {job.customer.email}
                </div>
              )}
              {job.customer?.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {job.customer.phone}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Driver Information */}
          <div>
            <h3 className="text-lg font-medium flex items-center mb-3">
              <User className="mr-2 h-5 w-5" />
              Driver Assignment
            </h3>
            {job.driver ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Driver:</span> {job.driver.name}
                </div>
                {job.driver.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {job.driver.phone}
                  </div>
                )}
                {job.driver.email && (
                  <div>
                    <span className="font-medium">Email:</span> {job.driver.email}
                  </div>
                )}
                {job.driver.tradePlateNumber && (
                  <div>
                    <span className="font-medium">Trade Plate:</span> {job.driver.tradePlateNumber}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No driver assigned</div>
            )}
          </div>

          <Separator />

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Collection Address */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-3 text-green-700">
                <MapPin className="mr-2 h-5 w-5" />
                Collection Address
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">{job.collectionAddress.line1}</div>
                  {job.collectionAddress.line2 && <div>{job.collectionAddress.line2}</div>}
                  <div>{job.collectionAddress.city}, {job.collectionAddress.postcode}</div>
                </div>
                <div className="pt-2">
                  <div className="font-medium">Contact:</div>
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {job.collectionContact.name}
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-1 h-3 w-3" />
                    {job.collectionContact.phone}
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-1 h-3 w-3" />
                    {job.collectionContact.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <h3 className="text-lg font-medium flex items-center mb-3 text-red-700">
                <MapPin className="mr-2 h-5 w-5" />
                Delivery Address
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-medium">{job.deliveryAddress.line1}</div>
                  {job.deliveryAddress.line2 && <div>{job.deliveryAddress.line2}</div>}
                  <div>{job.deliveryAddress.city}, {job.deliveryAddress.postcode}</div>
                </div>
                <div className="pt-2">
                  <div className="font-medium">Contact:</div>
                  <div className="flex items-center">
                    <User className="mr-1 h-3 w-3" />
                    {job.deliveryContact.name}
                  </div>
                  <div className="flex items-center">
                    <Phone className="mr-1 h-3 w-3" />
                    {job.deliveryContact.phone}
                  </div>
                  <div className="flex items-center">
                    <Mail className="mr-1 h-3 w-3" />
                    {job.deliveryContact.email}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pricing & Details */}
          <div>
            <h3 className="text-lg font-medium mb-3">Job Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Distance:</span> {job.calculatedMileage || 'N/A'} miles
              </div>
              <div>
                <span className="font-medium">Rate per Mile:</span> £{job.ratePerMile || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Total Fee:</span> £{job.totalMovementFee || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(job.createdAt).toLocaleDateString()}
              </div>
              {job.assignedAt && (
                <div>
                  <span className="font-medium">Assigned:</span> {new Date(job.assignedAt).toLocaleDateString()}
                </div>
              )}
              {job.collectedAt && (
                <div>
                  <span className="font-medium">Collected:</span> {new Date(job.collectedAt).toLocaleDateString()}
                </div>
              )}
              {job.deliveredAt && (
                <div>
                  <span className="font-medium">Delivered:</span> {new Date(job.deliveredAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}