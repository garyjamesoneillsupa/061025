// Comprehensive job status system with consistent colors system-wide

export type JobStatus = 'created' | 'assigned' | 'collected' | 'delivered' | 'invoiced' | 'paid' | 'aborted' | 'cancelled';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  hoverColor: string;
  adminOnly?: boolean;
}

export const STATUS_CONFIGS: Record<JobStatus, StatusConfig> = {
  created: {
    label: 'Created',
    color: 'bg-gray-500',
    bgColor: 'bg-gray-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-gray-600',
    adminOnly: false
  },
  assigned: {
    label: 'Assigned',
    color: 'bg-pink-500',
    bgColor: 'bg-pink-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-pink-600',
    adminOnly: false
  },
  collected: {
    label: 'Collected',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-amber-600',
    adminOnly: false
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-500',
    bgColor: 'bg-green-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-green-600',
    adminOnly: false
  },
  invoiced: {
    label: 'Invoiced',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    hoverColor: 'hover:bg-blue-600',
    adminOnly: false
  },
  paid: {
    label: 'Paid',
    color: 'bg-black',
    bgColor: 'bg-black',
    textColor: 'text-white',
    hoverColor: 'hover:bg-gray-800',
    adminOnly: false
  },
  aborted: {
    label: 'Aborted',
    color: 'bg-red-600',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    hoverColor: 'hover:bg-red-700',
    adminOnly: true
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-orange-600',
    bgColor: 'bg-orange-600',
    textColor: 'text-white',
    hoverColor: 'hover:bg-orange-700',
    adminOnly: true
  }
};

// Helper function to get status styling
export const getStatusColor = (status: JobStatus): string => {
  const config = STATUS_CONFIGS[status];
  return `${config.bgColor} ${config.textColor} ${config.hoverColor}`;
};

// Helper function to get just the background color class
export const getStatusBgColor = (status: JobStatus): string => {
  return STATUS_CONFIGS[status].bgColor;
};

// Helper function to get status label
export const getStatusLabel = (status: JobStatus): string => {
  return STATUS_CONFIGS[status].label;
};

// Helper function to check if status change is admin-only
export const isAdminOnlyStatus = (status: JobStatus): boolean => {
  return STATUS_CONFIGS[status].adminOnly || false;
};

// Get all status options for dropdowns
export const getAllStatuses = (): JobStatus[] => {
  return Object.keys(STATUS_CONFIGS) as JobStatus[];
};

// Get statuses available to drivers (non-admin-only)
export const getDriverStatuses = (): JobStatus[] => {
  return getAllStatuses().filter(status => !isAdminOnlyStatus(status));
};

// Get admin-only statuses
export const getAdminOnlyStatuses = (): JobStatus[] => {
  return getAllStatuses().filter(status => isAdminOnlyStatus(status));
};