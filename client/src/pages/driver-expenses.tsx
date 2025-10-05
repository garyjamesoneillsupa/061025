import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Car } from "lucide-react";
import ExpenseForm from "@/components/driver/expense-form";
import { useState, useEffect } from "react";

interface DriverAuth {
  isAuthenticated: boolean;
  username: string;
  driverId: string;
}

export default function DriverExpenseCapture() {
  const { jobId } = useParams();
  const [, navigate] = useLocation();

  // Get driver auth from localStorage (same pattern as driver layout)
  const [driverAuth, setDriverAuth] = useState<DriverAuth>(() => {
    const session = localStorage.getItem("driverSession");
    const sessionExpiry = localStorage.getItem("driverSessionExpiry");
    
    if (session && sessionExpiry) {
      const expiryDate = new Date(sessionExpiry);
      const now = new Date();
      
      if (now <= expiryDate) {
        try {
          const parsedSession = JSON.parse(session);
          return {
            isAuthenticated: true,
            username: parsedSession.driver?.name || '',
            driverId: parsedSession.driver?.id || ''
          };
        } catch (error) {
          console.error('Failed to parse driver session:', error);
        }
      }
    }
    
    return {
      isAuthenticated: false,
      username: '',
      driverId: ''
    };
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!driverAuth.isAuthenticated) {
      navigate("/drivers", { replace: true });
    }
  }, [driverAuth.isAuthenticated, navigate]);

  if (!driverAuth.isAuthenticated || !jobId) {
    return null;
  }

  const handleExpenseSuccess = () => {
    // Navigate back to job details within the same layout to avoid white flash
    navigate(`/drivers/jobs/${jobId}`, { replace: true });
  };

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="expense-capture-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/drivers/jobs/${jobId}`, { replace: true })}
              className="p-2"
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900" data-testid="text-page-title">Add Expense</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Use the working ExpenseForm component */}
        <ExpenseForm 
          jobId={jobId} 
          driverId={driverAuth.driverId}
          onSuccess={handleExpenseSuccess}
        />
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-[#00ABE7] to-[#0096D1] rounded flex items-center justify-center">
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium bg-gradient-to-r from-[#00ABE7] to-[#0096D1] bg-clip-text text-transparent">
              OVM Pro
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Professional Vehicle Movement</p>
        </div>
      </div>
    </div>
  );
}