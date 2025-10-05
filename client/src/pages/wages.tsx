import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, PoundSterling, TrendingUp, CheckCircle, Clock, Briefcase } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

interface DriverEarnings {
  driverId: string;
  driverName: string;
  totalEarnings: number;
  jobs: Array<{
    id: string;
    jobNumber: string;
    movementFee: number;
    earnings: number;
    completedAt: Date;
  }>;
}

interface WagePayment {
  id: string;
  driverId: string;
  weekStartDate: string;
  weekEndDate: string;
  totalEarnings: string;
  isPaid: boolean;
  paidAt?: Date;
  paidBy?: string;
  notes?: string;
  driver?: {
    name: string;
  };
}

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `£${num.toFixed(2)}`;
};

const getMonday = (date: Date) => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

const getSunday = (date: Date) => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

export default function Wages() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const currentWeekEnd = getSunday(currentWeekStart);

  const { data: earnings, isLoading: loadingEarnings } = useQuery<DriverEarnings[]>({
    queryKey: ['/api/wages/weekly', currentWeekStart.toISOString(), currentWeekEnd.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        weekStart: currentWeekStart.toISOString().split('T')[0],
        weekEnd: currentWeekEnd.toISOString().split('T')[0]
      });
      const response = await fetch(`/api/wages/weekly?${params}`);
      if (!response.ok) throw new Error('Failed to fetch earnings');
      return response.json();
    }
  });

  const { data: payments } = useQuery<WagePayment[]>({
    queryKey: ['/api/wages/payments'],
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, isPaid, notes }: { id: string; isPaid: boolean; notes?: string }) => {
      return apiRequest(`/api/wages/payments/${id}`, 'PATCH', { isPaid, notes, paidBy: 'Admin' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wages/payments'] });
      toast({
        title: "Success",
        description: "Wage payment updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update wage payment",
        variant: "destructive",
      });
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest('/api/wages/payments', 'POST', paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wages/payments'] });
      toast({
        title: "Success",
        description: "Wage payment created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create wage payment",
        variant: "destructive",
      });
    }
  });

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handlePaymentToggle = async (driverEarnings: DriverEarnings, currentlyPaid: boolean, paymentId?: string, notes?: string) => {
    if (paymentId) {
      await updatePaymentMutation.mutateAsync({
        id: paymentId,
        isPaid: !currentlyPaid,
        notes
      });
    } else {
      await createPaymentMutation.mutateAsync({
        driverId: driverEarnings.driverId,
        weekStartDate: currentWeekStart.toISOString().split('T')[0],
        weekEndDate: currentWeekEnd.toISOString().split('T')[0],
        totalEarnings: driverEarnings.totalEarnings,
        isPaid: true,
        paidBy: 'Admin',
        notes: notes || ''
      });
    }
  };

  const getPaymentForDriver = (driverId: string): WagePayment | undefined => {
    return payments?.find(p => 
      p.driverId === driverId && 
      p.weekStartDate === currentWeekStart.toISOString().split('T')[0]
    );
  };

  const totalOwed = earnings?.reduce((sum, e) => sum + e.totalEarnings, 0) || 0;
  const totalPaid = earnings?.reduce((sum, e) => {
    const payment = getPaymentForDriver(e.driverId);
    return sum + (payment?.isPaid ? e.totalEarnings : 0);
  }, 0) || 0;
  const outstanding = totalOwed - totalPaid;

  if (loadingEarnings) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading wages...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Wages</h2>
      </div>

      <div className="flex items-center justify-between bg-card p-4 rounded-lg border mb-6">
        <Button
          variant="outline"
          onClick={handlePreviousWeek}
          data-testid="button-previous-week"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Week
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Week of</p>
          <p className="text-lg font-semibold" data-testid="text-week-range">
            {format(currentWeekStart, 'dd MMM')} - {format(currentWeekEnd, 'dd MMM yyyy')}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleNextWeek}
          data-testid="button-next-week"
        >
          Next Week
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
            <PoundSterling className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-owed">{formatCurrency(totalOwed)}</div>
            <p className="text-xs text-muted-foreground mt-1">This week's earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-paid">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Marked as paid</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-outstanding">{formatCurrency(outstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">Still to pay</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {!earnings || earnings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No completed jobs this week</p>
              <p className="text-sm text-muted-foreground mt-2">Driver earnings will appear here when jobs are completed</p>
            </CardContent>
          </Card>
        ) : (
          earnings.map((driverEarnings) => {
            const payment = getPaymentForDriver(driverEarnings.driverId);
            const isPaid = payment?.isPaid || false;
            const [notes, setNotes] = useState(payment?.notes || '');

            return (
              <Card
                key={driverEarnings.driverId}
                className={`${
                  isPaid
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
                    : 'bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 border-slate-200 dark:border-slate-800'
                }`}
                data-testid={`card-driver-${driverEarnings.driverId}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl" data-testid={`text-driver-name-${driverEarnings.driverId}`}>
                        {driverEarnings.driverName}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-3xl font-bold" data-testid={`text-earnings-${driverEarnings.driverId}`}>
                          {formatCurrency(driverEarnings.totalEarnings)}
                        </p>
                        <Badge variant={isPaid ? "default" : "secondary"} className="ml-2" data-testid={`badge-status-${driverEarnings.driverId}`}>
                          {isPaid ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Unpaid
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {driverEarnings.jobs.length} job{driverEarnings.jobs.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`paid-${driverEarnings.driverId}`} className="text-sm font-medium">
                        {isPaid ? 'Paid' : 'Mark as Paid'}
                      </Label>
                      <Switch
                        id={`paid-${driverEarnings.driverId}`}
                        checked={isPaid}
                        onCheckedChange={(checked) => handlePaymentToggle(driverEarnings, isPaid, payment?.id, notes)}
                        disabled={updatePaymentMutation.isPending || createPaymentMutation.isPending}
                        data-testid={`switch-payment-${driverEarnings.driverId}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Job Breakdown
                    </h4>
                    <div className="space-y-2">
                      {driverEarnings.jobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-lg"
                          data-testid={`job-${job.jobNumber}`}
                        >
                          <div>
                            <p className="font-medium" data-testid={`text-job-number-${job.jobNumber}`}>{job.jobNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              Movement: {formatCurrency(job.movementFee)} → Driver: {formatCurrency(job.earnings)} (50%)
                            </p>
                          </div>
                          <p className="font-semibold text-lg">{formatCurrency(job.earnings)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`notes-${driverEarnings.driverId}`}>Notes (optional)</Label>
                    <Textarea
                      id={`notes-${driverEarnings.driverId}`}
                      placeholder="Add payment notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onBlur={() => {
                        if (payment && notes !== payment.notes) {
                          updatePaymentMutation.mutate({
                            id: payment.id,
                            isPaid: payment.isPaid,
                            notes
                          });
                        }
                      }}
                      className="mt-1"
                      data-testid={`textarea-notes-${driverEarnings.driverId}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </main>
  );
}
