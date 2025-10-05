import {
  customers,
  drivers,
  vehicles,
  jobs,
  jobProcessRecords,
  damageReports,
  photos,
  expenses,
  invoices,
  settings,
  customerAddresses,
  driverAvailability,
  collectionDrafts,
  invoiceBundles,
  bundleInvoices,
  wagePayments,
  type Customer,
  type InsertCustomer,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type Job,
  type InsertJob,
  type InsertJobProcessRecord,
  type DamageReport,
  type InsertDamageReport,
  type Photo,
  type InsertPhoto,
  type Expense,
  type InsertExpense,
  type Invoice,
  type InsertInvoice,
  type InvoiceBundle,
  type InsertInvoiceBundle,
  type BundleInvoice,
  type InsertBundleInvoice,
  type Setting,
  type InsertSetting,
  type CustomerAddress,
  type InsertCustomerAddress,
  type DriverAvailability,
  type InsertDriverAvailability,
  type JobStatus,
  type BundleStatus,
  userCredentials,
  type UserCredentials,
  type InsertUserCredentials,
  vehicleInspections,
  type VehicleInspection,
  environmentalConditions,
  type EnvironmentalConditions,
  emailTemplates,
  type EmailTemplate,
  type InsertEmailTemplate,
  artifacts,
  type Artifact,
  type InsertArtifact,
  type JobProcessRecord,
  type WagePayment,
  type InsertWagePayment,
  // Automation removed - manual admin control preferred
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, sql } from "drizzle-orm";
import { FileStorageService } from "./services/FileStorageService";

// Import JobProcessRecord from schema instead of redefining

export interface IStorage {
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;

  // Driver operations
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver>;
  getDriverByCredentials(username: string, pin: string): Promise<Driver | undefined>;
  getJobsByDriver(driverId: string): Promise<(Job & { customer?: Customer; vehicle?: Vehicle; releaseCode?: string; modelPin?: string })[]>;

  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleByRegistration(registration: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle>;

  // Job operations
  getJobs(): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle })[]>;
  getJob(id: string): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle }) | undefined>;
  getJobByNumber(jobNumber: string): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle }) | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, job: Partial<InsertJob>): Promise<Job>;
  updateJobStatus(id: string, status: JobStatus): Promise<Job>;
  getRecentJobs(limit?: number): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle })[]>;

  // Job process records  
  getJobProcessRecords(jobId: string): Promise<JobProcessRecord[]>;
  createJobProcessRecord(record: any): Promise<JobProcessRecord>;

  // Collection drafts for auto-save
  getCollectionDrafts(jobId: string): Promise<any[]>;

  // Damage reports
  getDamageReports(jobId: string): Promise<(DamageReport & { photos?: Photo[] })[]>;
  createDamageReport(report: InsertDamageReport): Promise<DamageReport>;

  // Photos
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  getPhotos(jobId: string): Promise<Photo[]>;
  getPhotosByDamageReport(damageReportId: string): Promise<Photo[]>;

  // Expenses
  getExpenses(jobId?: string): Promise<(Expense & { job?: Job; driver?: Driver; driverName?: string })[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  approveExpense(id: string, approvedBy: string, chargeToCustomer?: boolean): Promise<Expense>;
  rejectExpense(id: string, reason: string): Promise<void>;

  // Invoices
  getInvoices(): Promise<(Invoice & { job?: Job; customer?: Customer })[]>;
  getInvoice(id: string): Promise<(Invoice & { job?: Job; customer?: Customer }) | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    jobsInProgress: number;
    revenueThisWeek: number;
    uninvoicedJobs: number;
    totalCompletedJobs: number;
    unassignedJobs: number;
    statusCounts: Record<JobStatus, number>;
    topCustomers: Array<{ name: string; jobCount: number; revenue: number }>;
    outstandingRevenue: number;
    unpaidInvoices: number;
    // Expense tracking removed - streamlined to invoice workflow
    customerChargeableAmount?: number;
    weeklyProfit?: number;
    weeklyMovementRevenue?: number;
    // Weekly expense calculations removed - integrated to invoice
  }>;

  // Settings operations
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  createSetting(setting: InsertSetting): Promise<Setting>;

  // Email Templates
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  deleteEmailTemplate(id: string): Promise<void>;

  // Customer address operations
  getCustomerAddresses(customerId: string): Promise<CustomerAddress[]>;
  getAllCustomerAddresses(): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress>;
  deleteCustomerAddress(id: string): Promise<void>;

  // Invoice operations  
  getInvoiceByJobId(jobId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  getJobExpenses(jobId: string): Promise<Expense[]>;
  hasUnapprovedExpenses(jobId: string): Promise<boolean>;
  getApprovedExpenses(jobId: string): Promise<Expense[]>;

  // Automation methods removed - manual admin control preferred

  // Driver availability operations
  getDriverAvailability(driverId?: string): Promise<DriverAvailability[]>;
  createDriverAvailability(availability: InsertDriverAvailability): Promise<DriverAvailability>;
  updateDriverAvailability(id: string, availability: Partial<InsertDriverAvailability>): Promise<DriverAvailability>;
  deleteDriverAvailability(id: string): Promise<void>;

  // Authentication operations
  getUserCredentials(username: string): Promise<UserCredentials | null>;
  createUserCredentials(credentials: InsertUserCredentials): Promise<UserCredentials>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  updateUserStatus(userId: string, isActive: boolean): Promise<void>;
  recordUserLogin(userId: string, ipAddress: string): Promise<void>;
  getAllUsers(): Promise<UserCredentials[]>;

  // Vehicle inspection operations
  getVehicleInspections(jobId: string): Promise<VehicleInspection[]>;
  
  // Artifact operations for HMRC-compliant file tracking
  getArtifacts(jobId: string): Promise<Artifact[]>;
  createArtifact(artifact: InsertArtifact): Promise<Artifact>;
  updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact>;
  deleteArtifact(id: string): Promise<void>;
  getArtifactsByType(jobId: string, type: string): Promise<Artifact[]>;
  getJobFolderStructure(jobId: string): Promise<{
    year: string;
    month: string;
    folderName: string;
    canonicalPath: string;
  }>;

  // Bundle operations for invoice bundling system
  createBundle(bundle: InsertInvoiceBundle): Promise<InvoiceBundle>;
  getBundlesByCustomer(customerId: string): Promise<(InvoiceBundle & { customer?: Customer })[]>;
  getBundleWithInvoices(bundleId: string): Promise<(InvoiceBundle & { customer?: Customer; invoices?: (Invoice & { job?: Job })[] }) | undefined>;
  updateBundleStatus(bundleId: string, status: BundleStatus): Promise<InvoiceBundle>;

  // Wage payment operations
  getWeeklyDriverEarnings(weekStart: Date, weekEnd: Date): Promise<Array<{
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
  }>>;
  getWagePayment(driverId: string, weekStart: Date): Promise<WagePayment | undefined>;
  createWagePayment(payment: InsertWagePayment): Promise<WagePayment>;
  updateWagePayment(id: string, updates: Partial<WagePayment>): Promise<WagePayment>;
  getWagePaymentsByDriver(driverId: string): Promise<(WagePayment & { driver?: Driver })[]>;
  getAllWagePayments(): Promise<(WagePayment & { driver?: Driver })[]>;

  // Report operations
  getJobsForReport(startDate: Date, endDate: Date): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle; expenses?: Expense[] })[]>;
  getExpensesForReport(startDate: Date, endDate: Date): Promise<(Expense & { job?: Job; driver?: Driver })[]>;
  getWagesForReport(startDate: Date, endDate: Date): Promise<(WagePayment & { driver?: Driver })[]>;
}

export class DatabaseStorage implements IStorage {
  private fileStorageService: FileStorageService;

  constructor() {
    this.fileStorageService = new FileStorageService();
  }
  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(customers.name);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const insertData = { ...customer };
    if (insertData.address && typeof insertData.address === 'object') {
      const addr = insertData.address as any;
      insertData.address = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    if (insertData.billingAddress && typeof insertData.billingAddress === 'object') {
      const addr = insertData.billingAddress as any;
      insertData.billingAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    const [newCustomer] = await db.insert(customers).values([insertData]).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const updateData = { ...customer };
    if (updateData.address && typeof updateData.address === 'object') {
      const addr = updateData.address as any;
      updateData.address = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    if (updateData.billingAddress && typeof updateData.billingAddress === 'object') {
      const addr = updateData.billingAddress as any;
      updateData.billingAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    const [updatedCustomer] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Driver operations
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(drivers.name);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver> {
    const [updatedDriver] = await db
      .update(drivers)
      .set(driver)
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }

  // Driver Availability operations
  async getDriverAvailability(driverId?: string): Promise<DriverAvailability[]> {
    if (driverId) {
      return await db
        .select()
        .from(driverAvailability)
        .where(eq(driverAvailability.driverId, driverId))
        .orderBy(driverAvailability.startDate);
    }
    return await db
      .select()
      .from(driverAvailability)
      .orderBy(driverAvailability.startDate);
  }

  async createDriverAvailability(availability: InsertDriverAvailability): Promise<DriverAvailability> {
    console.log("Storage: Creating availability with data:", availability);
    
    // Convert dates to proper format if needed
    const processedData = {
      ...availability,
      startDate: availability.startDate instanceof Date ? availability.startDate.toISOString().split('T')[0] : availability.startDate,
      endDate: availability.endDate instanceof Date ? availability.endDate.toISOString().split('T')[0] : availability.endDate,
    };
    
    console.log("Storage: Processed data:", processedData);
    
    const [newAvailability] = await db
      .insert(driverAvailability)
      .values(processedData)
      .returning();
    return newAvailability;
  }

  async updateDriverAvailability(id: string, data: Partial<InsertDriverAvailability>): Promise<DriverAvailability> {
    const updateData: any = { ...data };
    if (updateData.startDate) {
      updateData.startDate = updateData.startDate.toISOString();
    }
    if (updateData.endDate) {
      updateData.endDate = updateData.endDate.toISOString();
    }
    
    const [updatedAvailability] = await db
      .update(driverAvailability)
      .set(updateData)
      .where(eq(driverAvailability.id, id))
      .returning();
    return updatedAvailability;
  }

  async deleteDriverAvailability(id: string): Promise<void> {
    await db.delete(driverAvailability).where(eq(driverAvailability.id, id));
  }

  async getDriverByUsernameAndPin(username: string, pin: string): Promise<Driver | undefined> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(
        and(
          eq(drivers.username, username),
          eq(drivers.pin, pin)
        )
      );
    return driver;
  }

  async getDriverByCredentials(username: string, pin: string): Promise<Driver | undefined> {
    const [driver] = await db
      .select()
      .from(drivers)
      .where(
        and(
          sql`LOWER(${drivers.username}) = LOWER(${username})`,
          eq(drivers.pin, pin)
        )
      );
    return driver;
  }

  async getJobsByDriver(driverId: string): Promise<(Job & { customer?: Customer; vehicle?: Vehicle; releaseCode?: string; modelPin?: string })[]> {
    return await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(
        and(
          eq(jobs.driverId, driverId),
          // Only show assigned and collected jobs - delivered jobs go to backend system
          sql`${jobs.status} IN ('assigned', 'collected')`
        )
      )
      .orderBy(desc(jobs.createdAt))
      .then(rows => rows.map(row => {
        const job = row.jobs;
        // Extract releaseCode and modelPin from collectionContact JSONB
        const releaseCode = job.collectionContact && typeof job.collectionContact === 'object' 
          ? (job.collectionContact as any)?.releaseCode 
          : undefined;
        const modelPin = job.collectionContact && typeof job.collectionContact === 'object' 
          ? (job.collectionContact as any)?.modelPin 
          : undefined;
        
        return {
          ...job,
          customer: row.customers || undefined,
          driver: row.drivers || undefined,
          vehicle: row.vehicles || undefined,
          releaseCode,
          modelPin,
        };
      }));
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(vehicles.registration);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleByRegistration(registration: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registration, registration));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: string, vehicle: Partial<InsertVehicle>): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  // Job operations
  async getJobs(): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle })[]> {
    return await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .orderBy(desc(jobs.createdAt))
      .then(rows => rows.map(row => ({
        ...row.jobs,
        customer: row.customers || undefined,
        driver: row.drivers || undefined,
        vehicle: row.vehicles || undefined,
      })));
  }

  async getJob(id: string): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle }) | undefined> {
    const [row] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(eq(jobs.id, id));

    if (!row) return undefined;

    return {
      ...row.jobs,
      customer: row.customers || undefined,
      driver: row.drivers || undefined,
      vehicle: row.vehicles || undefined,
    };
  }

  async getJobByNumber(jobNumber: string): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle }) | undefined> {
    const [row] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(eq(jobs.jobNumber, jobNumber));

    if (!row) return undefined;

    return {
      ...row.jobs,
      customer: row.customers || undefined,
      driver: row.drivers || undefined,
      vehicle: row.vehicles || undefined,
    };
  }

  async createJob(job: InsertJob): Promise<Job> {
    const insertData = { ...job };
    if (insertData.collectionAddress && typeof insertData.collectionAddress === 'object') {
      const addr = insertData.collectionAddress as any;
      insertData.collectionAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    if (insertData.deliveryAddress && typeof insertData.deliveryAddress === 'object') {
      const addr = insertData.deliveryAddress as any;
      insertData.deliveryAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    if (!insertData.jobNumber) {
      throw new Error('Job number is required');
    }
    const [newJob] = await db.insert(jobs).values([insertData]).returning();
    return newJob;
  }

  async updateJob(id: string, job: Partial<InsertJob>): Promise<Job> {
    console.log(`🔍 Storage: updateJob called for ID: ${id}`);
    console.log('🔍 Storage: Update data received:', JSON.stringify(job, null, 2));
    
    const updateData = { ...job };
    
    // Handle date fields - convert ISO strings to Date objects
    if (updateData.requestedCollectionDate && typeof updateData.requestedCollectionDate === 'string') {
      updateData.requestedCollectionDate = new Date(updateData.requestedCollectionDate);
    }
    if (updateData.requestedDeliveryDate && typeof updateData.requestedDeliveryDate === 'string') {
      updateData.requestedDeliveryDate = new Date(updateData.requestedDeliveryDate);
    }
    
    // Clean up addresses
    if (updateData.collectionAddress && typeof updateData.collectionAddress === 'object') {
      const addr = updateData.collectionAddress as any;
      updateData.collectionAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    if (updateData.deliveryAddress && typeof updateData.deliveryAddress === 'object') {
      const addr = updateData.deliveryAddress as any;
      updateData.deliveryAddress = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    
    console.log('🔍 Storage: Processed update data:', JSON.stringify(updateData, null, 2));
    
    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
      
    console.log('✅ Storage: Job updated successfully:', updatedJob?.id);
    return updatedJob;
  }

  async updateJobStatus(id: string, status: JobStatus): Promise<Job> {
    const updateData: any = { status };
    
    // Set appropriate timestamp based on status
    const now = new Date();
    switch (status) {
      case 'assigned':
        updateData.assignedAt = now;
        break;
      case 'collected':
        updateData.collectedAt = now;
        break;
      case 'delivered':
        updateData.deliveredAt = now;
        break;
      case 'invoiced':
        updateData.invoicedAt = now;
        break;
      case 'paid':
        updateData.paidAt = now;
        break;
    }

    const [updatedJob] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async getRecentJobs(limit = 10): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle })[]> {
    return await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .then(rows => rows.map(row => ({
        ...row.jobs,
        customer: row.customers || undefined,
        driver: row.drivers || undefined,
        vehicle: row.vehicles || undefined,
      })));
  }

  // Job process records
  async getJobProcessRecords(jobId: string): Promise<JobProcessRecord[]> {
    try {
      const records = await db
        .select()
        .from(jobProcessRecords)
        .where(eq(jobProcessRecords.jobId, jobId))
        .orderBy(desc(jobProcessRecords.createdAt));
      return records || [];
    } catch (error) {
      console.error('Error fetching job process records:', error);
      return [];
    }
  }

  async createJobProcessRecord(record: any): Promise<JobProcessRecord> {
    console.log('🚀 Creating job process record with data:', record);
    
    // Only insert into columns that actually exist in the database
    const insertData: any = {
      jobId: record.jobId,
      stage: record.stage,
      mileageReading: record.mileageReading,
      fuelLevel: record.fuelLevel,
      numberOfKeys: record.numberOfKeys,
      isWet: record.isWet,
      isDark: record.isDark,
      additionalNotes: record.additionalNotes,
      customerSignature: record.customerSignature
    };
    
    // Only add columns that exist in the database
    if (record.v5Present !== undefined) insertData.v5Present = record.v5Present;
    if (record.serviceHistoryPresent !== undefined) insertData.serviceHistoryPresent = record.serviceHistoryPresent;  
    if (record.lockingWheelNutPresent !== undefined) insertData.lockingWheelNutPresent = record.lockingWheelNutPresent;
    if (record.vehicleCleanExternally !== undefined) insertData.vehicleCleanExternally = record.vehicleCleanExternally;
    if (record.vehicleCleanInternally !== undefined) insertData.vehicleCleanInternally = record.vehicleCleanInternally;
    if (record.vehicleFreeDamageExternally !== undefined) insertData.vehicleFreeDamageExternally = record.vehicleFreeDamageExternally;
    if (record.vehicleFreeDamageInternally !== undefined) insertData.vehicleFreeDamageInternally = record.vehicleFreeDamageInternally;
    
    console.log('💾 Final insert data:', insertData);
    
    const [newRecord] = await db.insert(jobProcessRecords).values(insertData).returning();
    
    console.log('✅ Successfully created job process record:', newRecord.id);
    return newRecord;
  }

  // Collection drafts for auto-save
  async getCollectionDrafts(jobId: string): Promise<any[]> {
    try {
      const drafts = await db
        .select()
        .from(collectionDrafts)
        .where(eq(collectionDrafts.jobId, jobId))
        .orderBy(desc(collectionDrafts.lastSaved));
      
      console.log(`✅ Found ${drafts.length} collection drafts for job ${jobId}`);
      return drafts;
    } catch (error) {
      console.error('❌ Error fetching collection drafts:', error);
      return [];
    }
  }

  // Job photos alias
  async getJobPhotos(jobId: string): Promise<Photo[]> {
    return this.getPhotos(jobId);
  }

  // Job damage reports alias
  async getJobDamageReports(jobId: string): Promise<DamageReport[]> {
    return await db
      .select()
      .from(damageReports)
      .where(eq(damageReports.jobId, jobId))
      .orderBy(desc(damageReports.createdAt));
  }

  // Job expenses
  async getJobExpenses(jobId: string): Promise<Expense[]> {
    const results = await db
      .select()
      .from(expenses)
      .leftJoin(drivers, eq(expenses.driverId, drivers.id))
      .where(eq(expenses.jobId, jobId))
      .orderBy(desc(expenses.createdAt));
    
    // Map to include driverName
    return results.map(row => ({
      ...row.expenses,
      driverName: row.drivers?.name || null
    })) as Expense[];
  }

  // Damage reports
  async getDamageReports(jobId: string): Promise<(DamageReport & { photos?: Photo[] })[]> {
    const reports = await db
      .select()
      .from(damageReports)
      .where(eq(damageReports.jobId, jobId))
      .orderBy(desc(damageReports.createdAt));

    // Get photos for each damage report
    const reportsWithPhotos = await Promise.all(
      reports.map(async (report) => {
        const reportPhotos = await db
          .select()
          .from(photos)
          .where(eq(photos.damageReportId, report.id));
        return { ...report, photos: reportPhotos };
      })
    );

    return reportsWithPhotos;
  }

  async createDamageReport(report: InsertDamageReport): Promise<DamageReport> {
    const [newReport] = await db.insert(damageReports).values(report).returning();
    return newReport;
  }

  // Photos
  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async getPhotos(jobId: string): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.jobId, jobId))
      .orderBy(desc(photos.createdAt));
  }

  async getPhotosByDamageReport(damageReportId: string): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .where(eq(photos.damageReportId, damageReportId))
      .orderBy(desc(photos.createdAt));
  }

  // Expenses
  async getExpenses(jobId?: string): Promise<(Expense & { job?: Job; driver?: Driver; driverName?: string })[]> {
    const baseQuery = db
      .select()
      .from(expenses)
      .leftJoin(jobs, eq(expenses.jobId, jobs.id))
      .leftJoin(drivers, eq(expenses.driverId, drivers.id))
      .leftJoin(customers, eq(jobs.customerId, customers.id));

    const query = jobId 
      ? baseQuery.where(eq(expenses.jobId, jobId))
      : baseQuery;

    const rows = await query.orderBy(desc(expenses.createdAt));
    
    return rows.map(row => ({
      ...row.expenses,
      driverName: row.drivers?.name || undefined,
      job: row.jobs ? {
        ...row.jobs,
        customer: row.customers || undefined,
      } : undefined,
      driver: row.drivers || undefined,
    }));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const expenseData = {
      ...expense,
      amount: expense.amount?.toString() || '0',
      purchasedAt: expense.purchasedAt?.toISOString() || null,
      vatRate: expense.vatRate?.toString() || null
    };
    const [newExpense] = await db.insert(expenses).values([expenseData]).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const updateData: any = {
      ...expense,
      ...(expense.amount !== undefined && { amount: String(expense.amount) }),
      ...(expense.purchasedAt !== undefined && { purchasedAt: expense.purchasedAt?.toISOString() || null })
    };
    const [updatedExpense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async approveExpense(id: string, approvedBy: string, chargeToCustomer?: boolean): Promise<Expense> {
    const [approvedExpense] = await db
      .update(expenses)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy,
        ...(chargeToCustomer !== undefined && { chargeToCustomer })
      })
      .where(eq(expenses.id, id))
      .returning();
    return approvedExpense;
  }

  async rejectExpense(id: string, reason: string): Promise<void> {
    await db
      .update(expenses)
      .set({
        isApproved: false,
        notes: reason,
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(expenses.id, id));
  }

  // Invoices
  async getInvoices(): Promise<(Invoice & { job?: Job; customer?: Customer })[]> {
    return await db
      .select()
      .from(invoices)
      .leftJoin(jobs, eq(invoices.jobId, jobs.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt))
      .then(rows => rows.map(row => ({
        ...row.invoices,
        job: row.jobs || undefined,
        customer: row.customers || undefined,
      })));
  }

  async getInvoice(id: string): Promise<(Invoice & { job?: Job; customer?: Customer }) | undefined> {
    const [row] = await db
      .select()
      .from(invoices)
      .leftJoin(jobs, eq(invoices.jobId, jobs.id))
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.id, id));

    if (!row) return undefined;

    return {
      ...row.invoices,
      job: row.jobs || undefined,
      customer: row.customers || undefined,
    };
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getInvoiceByJobId(jobId: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.jobId, jobId));
    return invoice;
  }

  // Dashboard statistics
  async getDashboardStats() {
    // Get jobs in progress (assigned or collected)
    const [jobsInProgressResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(sql`${jobs.status} IN ('assigned', 'collected')`);

    // Get revenue this week (delivered but not yet paid)
    const [revenueResult] = await db
      .select({ total: sum(jobs.totalMovementFee) })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'delivered'),
          sql`${jobs.deliveredAt} >= NOW() - INTERVAL '7 days'`
        )
      );

    // Get uninvoiced jobs (delivered but not invoiced)
    const [uninvoicedResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, 'delivered'));

    // Get unassigned jobs (created but not assigned to a driver)
    const [unassignedResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.status, 'created'));

    // Get total completed jobs
    const [totalCompletedResult] = await db
      .select({ count: count() })
      .from(jobs)
      .where(sql`${jobs.status} IN ('delivered', 'invoiced', 'paid')`);

    // Get status counts
    const statusCountsRaw = await db
      .select({
        status: jobs.status,
        count: count(),
      })
      .from(jobs)
      .groupBy(jobs.status);

    const statusCounts = statusCountsRaw.reduce((acc, { status, count }) => {
      if (status) {
        acc[status] = Number(count);
      }
      return acc;
    }, {} as Record<JobStatus, number>);

    // Fill in missing statuses with 0
    const allStatuses: JobStatus[] = ['created', 'assigned', 'collected', 'delivered', 'invoiced', 'paid'];
    allStatuses.forEach(status => {
      if (!(status in statusCounts)) {
        statusCounts[status] = 0;
      }
    });

    // Expense statistics removed - streamlined to invoice generation workflow

    // Get top customers - FIXED: Sort by revenue DESC
    const topCustomersRaw = await db
      .select({
        customerId: jobs.customerId,
        customerName: customers.name,
        jobCount: count(jobs.id),
        revenue: sum(jobs.totalMovementFee),
      })
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .where(sql`${jobs.createdAt} >= NOW() - INTERVAL '30 days'`)
      .groupBy(jobs.customerId, customers.name)
      .orderBy(desc(sum(jobs.totalMovementFee))) // Sort by revenue DESC, not job count
      .limit(5);

    const topCustomers = topCustomersRaw.map(customer => ({
      name: customer.customerName || 'Unknown Customer',
      jobCount: Number(customer.jobCount),
      revenue: Number(customer.revenue || 0),
    }));

    // Get outstanding revenue from unpaid invoices
    const [outstandingResult] = await db
      .select({ total: sum(invoices.totalAmount) })
      .from(invoices)
      .where(eq(invoices.isPaid, false));

    // Get count of unpaid invoices
    const [unpaidInvoicesResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.isPaid, false));

    return {
      jobsInProgress: Number(jobsInProgressResult.count),
      revenueThisWeek: Number(revenueResult.total || 0),
      uninvoicedJobs: Number(uninvoicedResult.count),
      totalCompletedJobs: Number(totalCompletedResult.count),
      unassignedJobs: Number(unassignedResult.count),
      statusCounts,
      topCustomers,
      outstandingRevenue: Number(outstandingResult.total || 0),
      unpaidInvoices: Number(unpaidInvoicesResult.count),
      // Add expense statistics to dashboard stats
      // All expense tracking moved to invoice generation workflow
    };
  }

  // Settings operations
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings).orderBy(settings.key);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    try {
      // First try to update existing setting
      const [updatedSetting] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      
      if (updatedSetting) {
        return updatedSetting;
      }
      
      // If no setting was found, create it
      const [newSetting] = await db
        .insert(settings)
        .values({ key, value, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      
      return newSetting;
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      throw error;
    }
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const [newSetting] = await db.insert(settings).values([setting]).returning();
    return newSetting;
  }

  async hasUnapprovedExpenses(jobId: string): Promise<boolean> {
    const [result] = await db
      .select({ count: count() })
      .from(expenses)
      .where(and(eq(expenses.jobId, jobId), eq(expenses.isApproved, false)));
    return Number(result.count) > 0;
  }

  async getApprovedExpenses(jobId: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.jobId, jobId), eq(expenses.isApproved, true)));
  }

  // Customer address operations
  async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    return await db.select().from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), customerAddresses.name);
  }

  async getAllCustomerAddresses(): Promise<CustomerAddress[]> {
    return await db.select().from(customerAddresses)
      .orderBy(customerAddresses.customerId, desc(customerAddresses.isDefault), customerAddresses.name);
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const addressData = { ...address };
    if (addressData.address && typeof addressData.address === 'object') {
      const addr = addressData.address as any;
      addressData.address = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    const [newAddress] = await db.insert(customerAddresses).values([addressData]).returning();
    return newAddress;
  }

  async updateCustomerAddress(id: string, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress> {
    const updateData = { ...address };
    if (updateData.address && typeof updateData.address === 'object') {
      const addr = updateData.address as any;
      updateData.address = {
        line1: addr.line1,
        line2: (typeof addr.line2 === 'string') ? addr.line2 : undefined,
        city: addr.city,
        postcode: addr.postcode,
      };
    }
    const [updatedAddress] = await db
      .update(customerAddresses)
      .set(updateData)
      .where(eq(customerAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteCustomerAddress(id: string): Promise<void> {
    await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
  }

  // Additional methods needed for POC/POD generation
  async getJobWithDetails(jobId: string): Promise<any> {
    const [jobData] = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(eq(jobs.id, jobId));

    if (!jobData) {
      return null;
    }

    // Manually construct the response to handle null relationships
    const job = {
      ...jobData.jobs,
      customer: jobData.customers ? {
        id: jobData.customers.id,
        name: jobData.customers.name,
        address: jobData.customers.address,
        email: jobData.customers.email,
        phone: jobData.customers.phone,
        defaultPocEmails: jobData.customers.defaultPocEmails,
        defaultPodEmails: jobData.customers.defaultPodEmails,
        defaultInvoiceEmails: jobData.customers.defaultInvoiceEmails,
        billingAddress: jobData.customers.billingAddress
      } : null,
      driver: jobData.drivers ? {
        id: jobData.drivers.id,
        name: jobData.drivers.name,
        email: jobData.drivers.email,
        phone: jobData.drivers.phone
      } : null,
      vehicle: jobData.vehicles ? {
        id: jobData.vehicles.id,
        registration: jobData.vehicles.registration,
        make: jobData.vehicles.make,
        colour: jobData.vehicles.colour,
        year: jobData.vehicles.year
      } : null
    };
    
    return job;
  }



  // Authentication operations
  async getUserCredentials(username: string): Promise<UserCredentials | null> {
    const [user] = await db.select().from(userCredentials).where(eq(userCredentials.username, username));
    return user || null;
  }

  async createUserCredentials(credentials: InsertUserCredentials): Promise<UserCredentials> {
    const [newUser] = await db.insert(userCredentials).values(credentials).returning();
    return newUser;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db
      .update(userCredentials)
      .set({ hashedPassword, updatedAt: new Date() })
      .where(eq(userCredentials.id, userId));
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(userCredentials)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(userCredentials.id, userId));
  }

  async recordUserLogin(userId: string, ipAddress: string): Promise<void> {
    await db
      .update(userCredentials)
      .set({ 
        lastLogin: new Date(), 
        lastLoginIp: ipAddress,
        updatedAt: new Date() 
      })
      .where(eq(userCredentials.id, userId));
  }

  async getAllUsers(): Promise<UserCredentials[]> {
    return await db.select().from(userCredentials).orderBy(userCredentials.createdAt);
  }

  async getVehicleInspections(jobId: string): Promise<VehicleInspection[]> {
    console.log('🔍 Storage: Getting vehicle inspections for job:', jobId);
    const inspections = await db.select().from(vehicleInspections).where(eq(vehicleInspections.jobId, jobId));
    console.log('🔍 Storage: Found inspections:', inspections.length);
    inspections.forEach(inspection => {
      console.log('🔍 Storage: Inspection details:', {
        id: inspection.id,
        type: inspection.inspectionType,
        hasData: !!inspection.data,
        dataKeys: inspection.data ? Object.keys(inspection.data) : []
      });
    });
    return inspections;
  }

  async getEnvironmentalConditions(jobId: string): Promise<EnvironmentalConditions[]> {
    console.log('🔍 Storage: Getting environmental conditions for job:', jobId);
    const conditions = await db.select().from(environmentalConditions).where(eq(environmentalConditions.jobId, jobId));
    console.log('🔍 Storage: Found environmental conditions:', conditions.length);
    conditions.forEach(condition => {
      console.log('🔍 Storage: Environmental condition:', {
        id: condition.id,
        stage: condition.stage,
        isWet: condition.isWet,
        isDark: condition.isDark,
        isDirty: condition.isDirty
      });
    });
    return conditions;
  }

  // Duplicate function removed - using the one at line 759

  // Email Templates operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async getEmailTemplateByType(type: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.type, type));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values([template]).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: string, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updatedTemplate] = await db.update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: string): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  // Artifact operations for HMRC-compliant file tracking
  async getArtifacts(jobId: string): Promise<Artifact[]> {
    return await db.select().from(artifacts)
      .where(eq(artifacts.jobId, jobId))
      .orderBy(desc(artifacts.createdAt));
  }

  async createArtifact(artifact: InsertArtifact): Promise<Artifact> {
    const [newArtifact] = await db.insert(artifacts).values(artifact).returning();
    return newArtifact;
  }

  async updateArtifact(id: string, artifact: Partial<InsertArtifact>): Promise<Artifact> {
    const [updatedArtifact] = await db.update(artifacts)
      .set({ ...artifact, createdAt: new Date() }) // Using createdAt since no updatedAt column exists
      .where(eq(artifacts.id, id))
      .returning();
    return updatedArtifact;
  }

  async deleteArtifact(id: string): Promise<void> {
    await db.delete(artifacts).where(eq(artifacts.id, id));
  }

  async getArtifactsByType(jobId: string, type: string): Promise<Artifact[]> {
    return await db.select().from(artifacts)
      .where(and(eq(artifacts.jobId, jobId), eq(artifacts.type, type)))
      .orderBy(desc(artifacts.createdAt));
  }

  async getJobFolderStructure(jobId: string): Promise<{
    year: string;
    month: string;
    folderName: string;
    canonicalPath: string;
  }> {
    // Get job with vehicle info for canonical path building
    const jobData = await this.getJob(jobId);
    if (!jobData) {
      throw new Error(`Job not found: ${jobId}`);
    }

    // Use FileStorageService for consistent path building
    const vehicleReg = jobData.vehicle?.registration;
    return this.fileStorageService.buildCanonicalJobPath(jobData, vehicleReg);
  }

  // Batch invoicing automation removed - manual admin control preferred

  // Bundle operations for invoice bundling system
  async createBundle(bundle: InsertInvoiceBundle): Promise<InvoiceBundle> {
    const [newBundle] = await db.insert(invoiceBundles).values(bundle).returning();
    return newBundle;
  }

  async getBundlesByCustomer(customerId: string): Promise<(InvoiceBundle & { customer?: Customer })[]> {
    return await db
      .select()
      .from(invoiceBundles)
      .leftJoin(customers, eq(invoiceBundles.customerId, customers.id))
      .where(eq(invoiceBundles.customerId, customerId))
      .orderBy(desc(invoiceBundles.createdAt))
      .then(rows => rows.map(row => ({
        ...row.invoice_bundles,
        customer: row.customers || undefined,
      })));
  }

  async getBundleWithInvoices(bundleId: string): Promise<(InvoiceBundle & { customer?: Customer; invoices?: (Invoice & { job?: Job })[] }) | undefined> {
    // Get the bundle with customer
    const [bundleRow] = await db
      .select()
      .from(invoiceBundles)
      .leftJoin(customers, eq(invoiceBundles.customerId, customers.id))
      .where(eq(invoiceBundles.id, bundleId));

    if (!bundleRow) return undefined;

    // Get the invoices for this bundle
    const invoiceRows = await db
      .select()
      .from(bundleInvoices)
      .leftJoin(invoices, eq(bundleInvoices.invoiceId, invoices.id))
      .leftJoin(jobs, eq(invoices.jobId, jobs.id))
      .where(eq(bundleInvoices.bundleId, bundleId))
      .orderBy(invoices.createdAt);

    const bundleInvoicesList = invoiceRows.map(row => ({
      ...row.invoices!,
      job: row.jobs || undefined,
    }));

    return {
      ...bundleRow.invoice_bundles,
      customer: bundleRow.customers || undefined,
      invoices: bundleInvoicesList,
    };
  }

  async updateBundleStatus(bundleId: string, status: BundleStatus): Promise<InvoiceBundle> {
    const [updatedBundle] = await db
      .update(invoiceBundles)
      .set({ status })
      .where(eq(invoiceBundles.id, bundleId))
      .returning();
    return updatedBundle;
  }

  async getWeeklyDriverEarnings(weekStart: Date, weekEnd: Date): Promise<Array<{
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
  }>> {
    const completedJobs = await db
      .select()
      .from(jobs)
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .where(
        and(
          sql`${jobs.status} IN ('collected', 'delivered', 'invoiced', 'bundled', 'paid')`,
          sql`${jobs.deliveredAt} >= ${weekStart.toISOString()}`,
          sql`${jobs.deliveredAt} <= ${weekEnd.toISOString()}`,
          sql`${jobs.driverId} IS NOT NULL`
        )
      );

    const driverEarningsMap = new Map<string, {
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
    }>();

    for (const row of completedJobs) {
      const job = row.jobs;
      const driver = row.drivers;
      
      if (!driver || !job.driverId) continue;

      const movementFee = parseFloat(job.totalMovementFee?.toString() || '0');
      const earnings = movementFee * 0.5;

      if (!driverEarningsMap.has(job.driverId)) {
        driverEarningsMap.set(job.driverId, {
          driverId: job.driverId,
          driverName: driver.name,
          totalEarnings: 0,
          jobs: []
        });
      }

      const driverData = driverEarningsMap.get(job.driverId)!;
      driverData.totalEarnings += earnings;
      driverData.jobs.push({
        id: job.id,
        jobNumber: job.jobNumber,
        movementFee,
        earnings,
        completedAt: job.deliveredAt!
      });
    }

    return Array.from(driverEarningsMap.values());
  }

  async getWagePayment(driverId: string, weekStart: Date): Promise<WagePayment | undefined> {
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const [payment] = await db
      .select()
      .from(wagePayments)
      .where(
        and(
          eq(wagePayments.driverId, driverId),
          eq(wagePayments.weekStartDate, weekStartStr)
        )
      );
    return payment;
  }

  async createWagePayment(payment: InsertWagePayment): Promise<WagePayment> {
    const [newPayment] = await db
      .insert(wagePayments)
      .values({
        ...payment,
        totalEarnings: payment.totalEarnings.toString(),
        updatedAt: new Date()
      })
      .returning();
    return newPayment;
  }

  async updateWagePayment(id: string, updates: Partial<WagePayment>): Promise<WagePayment> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    if (updateData.totalEarnings !== undefined) {
      updateData.totalEarnings = updateData.totalEarnings.toString();
    }
    
    const [updatedPayment] = await db
      .update(wagePayments)
      .set(updateData)
      .where(eq(wagePayments.id, id))
      .returning();
    return updatedPayment;
  }

  async getWagePaymentsByDriver(driverId: string): Promise<(WagePayment & { driver?: Driver })[]> {
    const results = await db
      .select()
      .from(wagePayments)
      .leftJoin(drivers, eq(wagePayments.driverId, drivers.id))
      .where(eq(wagePayments.driverId, driverId))
      .orderBy(desc(wagePayments.weekStartDate));

    return results.map(row => ({
      ...row.wage_payments,
      driver: row.drivers || undefined
    }));
  }

  async getAllWagePayments(): Promise<(WagePayment & { driver?: Driver })[]> {
    const results = await db
      .select()
      .from(wagePayments)
      .leftJoin(drivers, eq(wagePayments.driverId, drivers.id))
      .orderBy(desc(wagePayments.weekStartDate));

    return results.map(row => ({
      ...row.wage_payments,
      driver: row.drivers || undefined
    }));
  }

  async getJobsForReport(startDate: Date, endDate: Date): Promise<(Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle; expenses?: Expense[] })[]> {
    const jobsData = await db
      .select()
      .from(jobs)
      .leftJoin(customers, eq(jobs.customerId, customers.id))
      .leftJoin(drivers, eq(jobs.driverId, drivers.id))
      .leftJoin(vehicles, eq(jobs.vehicleId, vehicles.id))
      .where(
        and(
          sql`${jobs.status} IN ('collected', 'delivered', 'invoiced', 'bundled', 'paid')`,
          sql`${jobs.deliveredAt} >= ${startDate.toISOString()}`,
          sql`${jobs.deliveredAt} <= ${endDate.toISOString()}`
        )
      )
      .orderBy(desc(jobs.deliveredAt));

    const jobsWithExpenses = await Promise.all(
      jobsData.map(async (row) => {
        const jobExpenses = await db
          .select()
          .from(expenses)
          .where(eq(expenses.jobId, row.jobs.id));

        return {
          ...row.jobs,
          customer: row.customers || undefined,
          driver: row.drivers || undefined,
          vehicle: row.vehicles || undefined,
          expenses: jobExpenses
        };
      })
    );

    return jobsWithExpenses;
  }

  async getExpensesForReport(startDate: Date, endDate: Date): Promise<(Expense & { job?: Job; driver?: Driver })[]> {
    const expensesData = await db
      .select()
      .from(expenses)
      .leftJoin(jobs, eq(expenses.jobId, jobs.id))
      .leftJoin(drivers, eq(expenses.driverId, drivers.id))
      .where(
        and(
          sql`${expenses.createdAt} >= ${startDate.toISOString()}`,
          sql`${expenses.createdAt} <= ${endDate.toISOString()}`
        )
      )
      .orderBy(desc(expenses.createdAt));

    return expensesData.map(row => ({
      ...row.expenses,
      job: row.jobs || undefined,
      driver: row.drivers || undefined
    }));
  }

  async getWagesForReport(startDate: Date, endDate: Date): Promise<(WagePayment & { driver?: Driver })[]> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const wagesData = await db
      .select()
      .from(wagePayments)
      .leftJoin(drivers, eq(wagePayments.driverId, drivers.id))
      .where(
        and(
          sql`${wagePayments.weekStartDate} >= ${startDateStr}`,
          sql`${wagePayments.weekEndDate} <= ${endDateStr}`
        )
      )
      .orderBy(desc(wagePayments.weekStartDate));

    return wagesData.map(row => ({
      ...row.wage_payments,
      driver: row.drivers || undefined
    }));
  }

  // Friday email automation removed - manual admin control preferred
}

export const storage = new DatabaseStorage();
