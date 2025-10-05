import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MapPin, 
  Car, 
  User, 
  Calendar,
  Phone,
  LogOut,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DriverSession {
  driver: {
    id: string;
    name: string;
  };
}

interface JobWithDetails {
  id: string;
  jobNumber: string;
  status: string;
  assignedDriverId: string;
  collectionDate?: string;
  deliveryDate?: string;
  customer?: {
    id: string;
    name: string;
  };
  vehicle?: {
    registration: string;
    make: string;
    model: string;
    vin?: string;
    colour?: string;
  };
  collectionContact?: {
    name: string;
    address: string;
    postcode: string;
    phone?: string;
    notes?: string;
  };
  deliveryContact?: {
    name: string;
    address: string;
    postcode: string;
    phone?: string;
    notes?: string;
  };
  specialInstructions?: string;
}

export default function DriverDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [driverSession, setDriverSession] = useState<DriverSession | null>(null);

  // Check driver authentication
  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem("driverSession");
      const sessionExpiry = localStorage.getItem("driverSessionExpiry");
      
      if (session && sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        if (new Date() <= expiryDate) {
          try {
            const parsedSession = JSON.parse(session) as DriverSession;
            setDriverSession(parsedSession);
          } catch (error) {
            navigate('/driver/login');
          }
        } else {
          navigate('/driver/login');
        }
      } else {
        navigate('/driver/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch assigned jobs for the driver
  const { data: jobs = [], isLoading, refetch } = useQuery<JobWithDetails[]>({
    queryKey: ['/api/drivers', driverSession?.driver?.id, 'jobs'],
    enabled: !!driverSession?.driver?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const handleLogout = () => {
    localStorage.removeItem("driverSession");
    localStorage.removeItem("driverSessionExpiry");
    navigate('/driver/login');
    window.location.reload();
  };

  // Show all jobs returned by the API since it already filters by driver
  const assignedJobs = jobs.filter(job => 
    ['assigned', 'collected'].includes(job.status)
  );

  // Filter jobs based on search term
  const filteredJobs = assignedJobs.filter(job => 
    job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.vehicle?.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
`${job.vehicle?.make}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'assigned': 
        return { 
          label: 'Ready to Collect', 
          color: 'bg-[#00ABE7]', 
          textColor: 'text-white',
          icon: Clock
        };
      case 'collected': 
        return { 
          label: 'Ready for Delivery', 
          color: 'bg-amber-500', 
          textColor: 'text-white',
          icon: Truck
        };
      default: 
        return { 
          label: status, 
          color: 'bg-gray-500', 
          textColor: 'text-white',
          icon: AlertCircle
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBC';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading || !driverSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#00ABE7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Portal</h1>
              <p className="text-gray-600">Welcome back, {driverSession.driver.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar - Sticky on mobile */}
      <div className="bg-white border-b sticky top-[73px] z-5">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search jobs by number, customer, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-base rounded-lg border-gray-300 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
            />
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <AnimatePresence>
          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No matching jobs found' : 'No active jobs'}
              </h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Check back later for new assignments'}
              </p>
            </motion.div>
          ) : (
            filteredJobs.map((job, index) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md hover:border-[#00ABE7] transition-all duration-200 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {job.jobNumber}
                        </CardTitle>
                        <Badge className={`${statusConfig.color} ${statusConfig.textColor} px-3 py-1`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Vehicle Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Car className="w-5 h-5 text-[#00ABE7]" />
                          <h4 className="font-semibold text-gray-900">Vehicle</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-bold text-gray-900">
                            {job.vehicle?.registration || 'N/A'}
                          </p>
                          <p className="text-gray-600">
                            {job.vehicle?.make}
                            {job.vehicle?.colour && ` • ${job.vehicle.colour}`}
                          </p>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-[#00ABE7]" />
                        <div>
                          <p className="font-semibold text-gray-900">{job.customer?.name || 'Unknown Customer'}</p>
                          <p className="text-sm text-gray-600">Customer</p>
                        </div>
                      </div>

                      {/* Collection Address - Only show for assigned jobs */}
                      {job.status === 'assigned' && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Collection</p>
                            <p className="text-sm text-gray-600">
                              {job.collectionContact?.address || 'Address not specified'}
                              {job.collectionContact?.postcode && `, ${job.collectionContact.postcode}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(job.collectionDate)}
                            </p>
                            {job.collectionContact?.notes && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <span className="font-medium text-blue-900 text-sm">Note: </span>
                                <span className="text-blue-800 text-sm">{job.collectionContact.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivery Address - Only show for collected jobs */}
                      {job.status === 'collected' && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900">Delivery</p>
                            <p className="text-sm text-gray-600">
                              {job.deliveryContact?.address || 'Address not specified'}
                              {job.deliveryContact?.postcode && `, ${job.deliveryContact.postcode}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(job.deliveryDate)}
                            </p>
                            {job.deliveryContact?.notes && (
                              <div className="bg-green-50 border border-green-200 rounded p-2 mt-2">
                                <span className="font-medium text-green-900 text-sm">Note: </span>
                                <span className="text-green-800 text-sm">{job.deliveryContact.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contact Phone - Show only relevant contact */}
                      {job.status === 'assigned' && job.collectionContact?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-[#00ABE7]" />
                          <a 
                            href={`tel:${job.collectionContact.phone}`}
                            className="text-sm text-[#00ABE7] hover:underline font-medium"
                          >
                            Contact: {job.collectionContact.phone}
                          </a>
                        </div>
                      )}
                      {job.status === 'collected' && job.deliveryContact?.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-[#00ABE7]" />
                          <a 
                            href={`tel:${job.deliveryContact.phone}`}
                            className="text-sm text-[#00ABE7] hover:underline font-medium"
                          >
                            Contact: {job.deliveryContact.phone}
                          </a>
                        </div>
                      )}

                      {/* Special Instructions - Show collection notes for assigned, delivery notes for collected */}
                      {job.status === 'assigned' && job.collectionContact?.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">Special Instructions:</span> {job.collectionContact.notes}
                          </p>
                        </div>
                      )}
                      {job.status === 'collected' && job.deliveryContact?.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800">
                            <span className="font-semibold">Special Instructions:</span> {job.deliveryContact.notes}
                          </p>
                        </div>
                      )}

                      <Separator />

                      {/* Action Button */}
                      <div className="pt-2">
                        <Link href={`/driver/collection/${job.id}`}>
                          <Button 
                            className="w-full bg-[#00ABE7] hover:bg-[#0095d1] text-white font-semibold py-3 text-base rounded-lg transition-colors"
                            size="lg"
                          >
                            {job.status === 'assigned' ? 'Start Collection' : 'Start Delivery'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}