import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: boolean;
}

export function MobileOptimized({ 
  children, 
  className, 
  padding = 'md',
  maxWidth = true 
}: MobileOptimizedProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-2 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={cn(
      'w-full',
      maxWidth && 'max-w-4xl mx-auto',
      paddingClasses[padding],
      // Mobile-first responsive design
      'min-h-screen sm:min-h-0',
      // Ensure content is accessible
      'relative z-0',
      className
    )}>
      {children}
    </div>
  );
}

// Touch-friendly button wrapper
interface TouchFriendlyProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TouchFriendly({ children, className, size = 'md' }: TouchFriendlyProps) {
  const sizeClasses = {
    sm: 'min-h-[40px] min-w-[40px]',
    md: 'min-h-[44px] min-w-[44px]', // iOS recommended minimum
    lg: 'min-h-[48px] min-w-[48px]'
  };

  return (
    <div className={cn(
      sizeClasses[size],
      'flex items-center justify-center',
      // Touch-friendly spacing
      'touch-manipulation',
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-optimized form container
export function MobileForm({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn(
      'space-y-4 sm:space-y-6',
      // Better spacing on mobile
      '[&_input]:text-base', // Prevent zoom on iOS
      '[&_select]:text-base',
      '[&_textarea]:text-base',
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-optimized card grid
export function MobileGrid({ 
  children, 
  className,
  columns = { mobile: 1, tablet: 2, desktop: 3 }
}: { 
  children: ReactNode; 
  className?: string;
  columns?: { mobile: number; tablet: number; desktop: number };
}) {
  const gridClasses = `grid grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`;
  
  return (
    <div className={cn(
      gridClasses,
      'gap-3 sm:gap-4 lg:gap-6',
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-optimized navigation
export function MobileNav({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <nav className={cn(
      // Sticky mobile navigation
      'sticky top-0 z-50',
      'bg-white border-b',
      // Safe area insets for mobile
      'pt-safe-top pb-2',
      'px-4 sm:px-6',
      className
    )}>
      {children}
    </nav>
  );
}

// Professional spacing component for consistent layouts
export function ProfessionalSpacing({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: ReactNode; 
  variant?: 'tight' | 'default' | 'loose';
  className?: string;
}) {
  const spacingClasses = {
    tight: 'space-y-2 sm:space-y-3',
    default: 'space-y-4 sm:space-y-6',
    loose: 'space-y-6 sm:space-y-8'
  };

  return (
    <div className={cn(spacingClasses[variant], className)}>
      {children}
    </div>
  );
}