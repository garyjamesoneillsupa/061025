import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface FeedbackIndicatorProps {
  type: FeedbackType;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

const typeConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 border-green-200',
    textColor: 'text-green-800',
    iconColor: 'text-green-600'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-800',
    iconColor: 'text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-800',
    iconColor: 'text-amber-600'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-600'
  }
};

export function FeedbackIndicator({ type, message, className, onDismiss }: FeedbackIndicatorProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 border rounded-lg transition-all duration-200",
      config.bgColor,
      className
    )}>
      <Icon className={cn("w-5 h-5 flex-shrink-0", config.iconColor)} />
      <p className={cn("text-sm font-medium flex-1", config.textColor)}>
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn("text-sm font-medium hover:underline", config.textColor)}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

// Inline feedback component for form fields
interface InlineFeedbackProps {
  type: FeedbackType;
  message: string;
  className?: string;
}

export function InlineFeedback({ type, message, className }: InlineFeedbackProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2 mt-1", className)}>
      <Icon className={cn("w-4 h-4", config.iconColor)} />
      <span className={cn("text-sm", config.textColor)}>
        {message}
      </span>
    </div>
  );
}

// Success feedback for actions (replacement for toast)
export function ActionFeedback({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium",
      className
    )}>
      <CheckCircle className="w-4 h-4" />
      {message}
    </div>
  );
}