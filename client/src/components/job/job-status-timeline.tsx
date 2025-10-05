import { Check, Truck, Package, FileText, CreditCard, AlertTriangle, XCircle } from "lucide-react";
import type { JobStatus } from "@shared/schema";

interface JobStatusTimelineProps {
  status: JobStatus;
  compact?: boolean;
  driverView?: boolean; // Add driver view mode
}

const statusSteps = [
  { key: 'created', label: 'Created', icon: Check },
  { key: 'assigned', label: 'Assigned', icon: Truck },
  { key: 'collected', label: 'Collected', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: Check },
  { key: 'invoiced', label: 'Invoiced', icon: FileText },
  { key: 'paid', label: 'Paid', icon: CreditCard },
  { key: 'aborted', label: 'Aborted', icon: AlertTriangle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
] as const;

// Driver-specific status steps (only what drivers need to see)
const driverStatusSteps = [
  { key: 'collected', label: 'Collected', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: Check },
] as const;

export default function JobStatusTimeline({ status, compact = false, driverView = false }: JobStatusTimelineProps) {
  // Use driver-specific steps if in driver view
  const steps = driverView ? driverStatusSteps : statusSteps;
  const currentStepIndex = steps.findIndex(step => step.key === status);

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center">
              <div 
                className={`w-3 h-3 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? `status-dot-${step.key}` 
                    : 'bg-gray-300'
                }`}
              >
                {isCompleted && (
                  <Icon className="w-2 h-2 text-white" strokeWidth={3} />
                )}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-4 h-0.5 mx-1 ${
                    isCompleted ? `status-dot-${step.key}` : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? `status-dot-${step.key} text-white` 
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <span 
                className={`text-xs mt-1 ${
                  isCurrent 
                    ? 'font-medium text-gray-900' 
                    : isCompleted 
                      ? 'text-gray-700' 
                      : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-1 mx-2 ${
                  isCompleted ? `status-dot-${step.key}` : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
