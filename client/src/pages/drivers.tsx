import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Plus, Calendar, Edit, Trash2, Users, UserCheck, UserX } from "lucide-react";
import { format, parseISO, isBefore, isAfter } from "date-fns";
import type { Driver, DriverAvailability, InsertDriver, InsertDriverAvailability } from "@shared/schema";

interface DriverWithAvailability extends Driver {
  availability?: DriverAvailability[];
}

export default function DriversPage() {
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    email: "",
    phone: "",
    tradePlateNumber: "",
    username: "",
    pin: "",
  });

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [showEditDriverDialog, setShowEditDriverDialog] = useState(false);
  const [showAddAvailabilityDialog, setShowAddAvailabilityDialog] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<DriverAvailability | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>("");

  const { toast } = useToast();

  // Fetch drivers and availability
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: availability = [], isLoading: availabilityLoading } = useQuery<DriverAvailability[]>({
    queryKey: ["/api/driver-availability"],
  });

  // Group availability by driver
  const driversWithAvailability: DriverWithAvailability[] = (drivers as Driver[]).map((driver: Driver) => ({
    ...driver,
    availability: (availability as DriverAvailability[]).filter((a: DriverAvailability) => a.driverId === driver.id),
  }));

  // Calculate stats
  const getDriverStats = () => {
    const today = new Date();
    let activeDrivers = 0;
    let inactiveDrivers = 0;
    let unavailableDrivers = 0;

    driversWithAvailability.forEach(driver => {
      if (!driver.isActive) {
        inactiveDrivers++;
        return;
      }

      const isCurrentlyUnavailable = driver.availability?.some(
        (a) => {
          const startDate = typeof a.startDate === 'string' ? parseISO(a.startDate) : a.startDate;
          const endDate = typeof a.endDate === 'string' ? parseISO(a.endDate) : a.endDate;
          return !isBefore(today, startDate) && !isAfter(today, endDate);
        }
      );

      if (isCurrentlyUnavailable) {
        unavailableDrivers++;
      } else {
        activeDrivers++;
      }
    });

    return { activeDrivers, inactiveDrivers, unavailableDrivers };
  };

  const stats = getDriverStats();

  // Mutations
  const createDriver = useMutation({
    mutationFn: (data: InsertDriver) => apiRequest("/api/drivers", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setShowAddDriverDialog(false);
      setNewDriverData({
        name: "",
        email: "",
        phone: "",
        tradePlateNumber: "",
        username: "",
        pin: "",
      });
      toast({
        title: "Success",
        description: "Driver added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add driver",
        variant: "destructive",
      });
    },
  });

  const updateDriver = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDriver> }) => 
      apiRequest(`/api/drivers/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setShowEditDriverDialog(false);
      setEditingDriver(null);
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update driver",
        variant: "destructive",
      });
    },
  });

  const createAvailability = useMutation({
    mutationFn: (data: InsertDriverAvailability) => apiRequest("/api/driver-availability", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-availability"] });
      setShowAddAvailabilityDialog(false);
      setEditingAvailability(null);
      setSelectedDriver("");
      toast({
        title: "Success",
        description: "Driver unavailability added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add unavailability",
        variant: "destructive",
      });
    },
  });

  const deleteAvailability = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/driver-availability/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/driver-availability"] });
      toast({
        title: "Success",
        description: "Unavailability period deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unavailability",
        variant: "destructive",
      });
    },
  });

  const handleSubmitDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createDriver.mutate(newDriverData);
  };

  const handleSubmitEditDriver = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDriver) return;
    
    const formData = new FormData(e.currentTarget);
    const driverData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      tradePlateNumber: formData.get("tradePlateNumber") as string,
      username: formData.get("username") as string,
      pin: formData.get("pin") as string,
    };
    
    updateDriver.mutate({ id: editingDriver.id, data: driverData });
  };

  const handleSubmitAvailability = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const availabilityData: InsertDriverAvailability = {
      driverId: formData.get("driverId") as string,
      startDate: new Date(formData.get("startDate") as string),
      endDate: new Date(formData.get("endDate") as string),
      reason: formData.get("reason") as string,
    };

    createAvailability.mutate(availabilityData);
  };

  const getDriverStatus = (driver: DriverWithAvailability) => {
    if (!driver.isActive) {
      return { status: "inactive", label: "Inactive", color: "bg-gray-500" };
    }

    const today = new Date();
    const currentUnavailable = driver.availability?.find(
      (a) => {
        const startDate = typeof a.startDate === 'string' ? parseISO(a.startDate) : a.startDate;
        const endDate = typeof a.endDate === 'string' ? parseISO(a.endDate) : a.endDate;
        return !isBefore(today, startDate) && !isAfter(today, endDate);
      }
    );
    
    if (currentUnavailable) {
      return { 
        status: "unavailable", 
        label: "Unavailable", 
        color: "bg-red-500", 
        reason: currentUnavailable.reason 
      };
    }
    
    return { status: "active", label: "Available", color: "bg-green-500" };
  };

  if (driversLoading || availabilityLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600 mt-1">Manage drivers and availability schedules</p>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
            <p className="text-gray-600 mt-1">Manage drivers and availability schedules</p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Driver</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitDriver} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newDriverData.name}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDriverData.email}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newDriverData.phone}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tradePlateNumber">Trade Plate Number</Label>
                    <Input
                      id="tradePlateNumber"
                      value={newDriverData.tradePlateNumber}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, tradePlateNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newDriverData.username}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pin">Login PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={newDriverData.pin}
                      onChange={(e) => setNewDriverData(prev => ({ ...prev, pin: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowAddDriverDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createDriver.isPending}>
                      {createDriver.isPending ? "Adding..." : "Add Driver"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddAvailabilityDialog} onOpenChange={setShowAddAvailabilityDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Unavailability
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Driver Unavailability</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitAvailability} className="space-y-4">
                  <div>
                    <Label htmlFor="driverId">Driver</Label>
                    <select
                      id="driverId"
                      name="driverId"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingAvailability?.driverId || selectedDriver || ""}
                      required
                    >
                      <option value="">Select Driver</option>
                      {(drivers as Driver[]).map((driver: Driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      name="reason"
                      placeholder="e.g., Holiday, Sick leave, Personal"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddAvailabilityDialog(false);
                        setEditingAvailability(null);
                        setSelectedDriver("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAvailability.isPending}>
                      {createAvailability.isPending ? "Adding..." : "Add Unavailability"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards - Matching Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unavailable Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unavailableDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserX className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {driversWithAvailability.map((driver) => {
          const driverStatus = getDriverStatus(driver);
          
          return (
            <Card key={driver.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">{driver.name}</CardTitle>
                      {driver.tradePlateNumber && (
                        <p className="text-sm text-gray-500">Trade Plate: {driver.tradePlateNumber}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={`${driverStatus.color} text-white text-xs`}>
                      {driverStatus.label}
                    </Badge>
                    {driverStatus.status === "unavailable" && driverStatus.reason && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                        {driverStatus.reason}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{driver.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{driver.phone || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Username:</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{driver.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Login PIN:</span>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-right">{driver.pin}</span>
                  </div>
                </div>

                {driver.availability && driver.availability.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-3">Unavailability Periods:</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {driver.availability.map((period) => (
                        <div
                          key={period.id}
                          className="text-xs p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-start"
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-800">
                              {format(typeof period.startDate === 'string' ? parseISO(period.startDate) : period.startDate, "MMM dd")} - {format(typeof period.endDate === 'string' ? parseISO(period.endDate) : period.endDate, "MMM dd, yyyy")}
                            </div>
                            <div className="text-gray-600 mt-1">{period.reason}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteAvailability.mutate(period.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingDriver(driver);
                      setShowEditDriverDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {driversWithAvailability.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No drivers found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first driver to the system.</p>
          <Button onClick={() => setShowAddDriverDialog(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Add First Driver
          </Button>
        </div>
      )}

      {/* Edit Driver Dialog */}
      <Dialog open={showEditDriverDialog} onOpenChange={setShowEditDriverDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
          </DialogHeader>
          {editingDriver && (
            <form onSubmit={handleSubmitEditDriver} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingDriver.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingDriver.email}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingDriver.phone || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tradePlateNumber">Trade Plate Number</Label>
                <Input
                  id="edit-tradePlateNumber"
                  name="tradePlateNumber"
                  defaultValue={editingDriver.tradePlateNumber || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  name="username"
                  defaultValue={editingDriver.username || ""}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-pin">Login PIN</Label>
                <Input
                  id="edit-pin"
                  name="pin"
                  type="text"
                  defaultValue={editingDriver.pin || ""}
                  placeholder="Enter 4-digit PIN"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditDriverDialog(false);
                    setEditingDriver(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDriver.isPending}>
                  {updateDriver.isPending ? "Updating..." : "Update Driver"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}