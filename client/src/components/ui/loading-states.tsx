import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineSync, SyncStatusIndicator } from '@/hooks/use-offline-sync';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

interface InlineLoadingProps {
  text: string;
  className?: string;
}

export function InlineLoading({ text, className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2 py-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <div className={cn('relative', className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <div className={loading ? 'opacity-50' : ''}>
        {children}
      </div>
    </div>
  );
}

// Enhanced loading state for forms
export function FormLoading({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
      <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

// Network status indicator
export function NetworkStatus() {
  const { isOffline, syncStatus } = useOfflineSync();

  return (
    <div className="flex items-center gap-2">
      {isOffline ? (
        <div className="flex items-center gap-1 text-amber-600">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">Offline</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-green-600">
          <Wifi className="w-4 h-4" />
          <span className="text-sm">Online</span>
        </div>
      )}
      <SyncStatusIndicator />
    </div>
  );
}

// Professional loading overlay
export function LoadingOverlay({ message = 'Loading...', visible }: { message?: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
        <LoadingSpinner size="lg" />
        <div>
          <p className="font-medium">{message}</p>
          <p className="text-sm text-gray-600">Please wait...</p>
        </div>
      </div>
    </div>
  );
}

// Smart loading state that adapts to content
export function AdaptiveLoading({ 
  loading, 
  children, 
  fallback,
  minHeight = 200 
}: { 
  loading: boolean; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  minHeight?: number;
}) {
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center animate-pulse"
        style={{ minHeight }}
      >
        {fallback || <LoadingSpinner size="lg" text="Loading content..." />}
      </div>
    );
  }

  return <>{children}</>;
}