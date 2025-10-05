import type { 
  Job, 
  Customer, 
  Driver, 
  Vehicle, 
  Expense, 
  Invoice, 
  DamageReport, 
  JobProcessRecord,
  Photo,
  JobStatus,
  DamageType,
  ExpenseType,
  VehiclePanel
} from "@shared/schema";

// Extended types with relations
export interface JobWithRelations extends Job {
  customer?: Customer;
  driver?: Driver;
  vehicle?: Vehicle;
  processRecords?: JobProcessRecord[];
  damageReports?: (DamageReport & { photos?: Photo[] })[];
  photos?: Photo[];
  expenses?: (Expense & { driver?: Driver })[];
  invoice?: Invoice;
}

export interface ExpenseWithRelations extends Expense {
  job?: Job;
  driver?: Driver;
  photos?: Photo[];
}

export interface InvoiceWithRelations extends Invoice {
  job?: Job;
  customer?: Customer;
  expenses?: Expense[];
}

export interface DamageReportWithPhotos extends DamageReport {
  photos?: Photo[];
}

// Dashboard types
export interface DashboardStats {
  jobsInProgress: number;
  revenueThisWeek: number;
  uninvoicedJobs: number;
  totalCompletedJobs: number;
  statusCounts: Record<JobStatus, number>;
  topCustomers: Array<{
    name: string;
    jobCount: number;
    revenue: number;
  }>;
}

// Form types
export interface AddressForm {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}

export interface ContactForm {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface CollectionContactForm extends ContactForm {
  releaseCode?: string;
  modelPin?: string;
}

export interface JobFormData {
  customerId: string;
  driverId?: string;
  vehicleId?: string;
  collectionAddress: AddressForm;
  deliveryAddress: AddressForm;
  collectionContact: CollectionContactForm;
  deliveryContact: ContactForm;
  calculatedMileage?: number;
  ratePerMile: string;
  totalMovementFee: string;
}

// Vehicle lookup response
export interface VehicleLookupResponse {
  id?: string;
  registration: string;
  make: string;
  model: string;
  colour: string;
  fuelType: string;
  year?: number;
}

// Mileage calculation response
export interface MileageCalculationResponse {
  mileage: number;
  fromPostcode: string;
  toPostcode: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// File upload types
export interface FileUpload {
  file: File;
  category: 'odometer' | 'fuel_gauge' | 'damage' | 'checklist' | 'misc' | 'receipt';
  stage?: 'collection' | 'delivery';
}

// Process record types
export interface ProcessRecordData {
  jobId: string;
  stage: 'collection' | 'delivery';
  mileageReading?: number;
  fuelLevel?: number;
  isWet?: boolean;
  isDark?: boolean;
  isVehicleClean?: boolean;
  numberOfKeys?: number;
  v5Present?: boolean;
  lockingWheelNutPresent?: boolean;
  serviceHistoryPresent?: boolean;
  parcelShelfPresent?: boolean;
  additionalNotes?: string;
  customerName: string;
  customerSignature?: string;
  photos?: FileUpload[];
}

// Damage report types
export interface DamageReportData {
  jobId: string;
  panel: VehiclePanel;
  damageType: DamageType;
  stage: 'collection' | 'delivery';
  notes?: string;
  photos?: FileUpload[];
}

// Invoice generation types
export interface InvoiceGenerationData {
  jobId: string;
  customerId: string;
  movementFee: number;
  expensesTotal: number;
  totalAmount: number;
  chargeableExpenses: string[];
}

// PDF generation types
export interface PDFDocument {
  filename: string;
  buffer: Buffer;
  mimetype: string;
}

export interface POCData {
  job: JobWithRelations;
  processRecord: JobProcessRecord;
  damageReports: DamageReportWithPhotos[];
  photos: Photo[];
}

export interface PODData {
  job: JobWithRelations;
  processRecord: JobProcessRecord;
  damageReports: DamageReportWithPhotos[];
  photos: Photo[];
}

export interface InvoiceData {
  invoice: InvoiceWithRelations;
  job: JobWithRelations;
  customer: Customer;
  expenses: ExpenseWithRelations[];
}

// Email types
export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailData {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Search and filter types
export interface JobFilters {
  status?: JobStatus;
  customerId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ExpenseFilters {
  jobId?: string;
  driverId?: string;
  type?: ExpenseType;
  isApproved?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  category?: string;
}

// Notification types
export interface NotificationData {
  type: 'job_created' | 'job_assigned' | 'job_completed' | 'expense_submitted' | 'invoice_generated';
  title: string;
  message: string;
  recipientIds: string[];
  data?: any;
}

// Mobile interface types
export interface MobileJobView {
  job: JobWithRelations;
  currentStage: 'collection' | 'delivery' | 'completed';
  nextAction?: string;
  canProceed: boolean;
}

// Signature types
export interface SignatureData {
  points: Array<{ x: number; y: number }>;
  width: number;
  height: number;
  timestamp: string;
}

// Status timeline types
export interface StatusTimelineStep {
  status: JobStatus;
  label: string;
  icon: string;
  timestamp?: string;
  isActive: boolean;
  isCompleted: boolean;
}

// Settings types
export interface SystemSettings {
  defaultRatePerMile: number;
  vatRate: number;
  companyDetails: {
    name: string;
    address: AddressForm;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
}

export default {};
