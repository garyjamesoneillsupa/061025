import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const jobStatusEnum = pgEnum('job_status', [
  'created',
  'assigned', 
  'collected',
  'delivered',
  'invoiced',
  'bundled',
  'paid',
  'aborted',
  'cancelled'
]);

export const damageTypeEnum = pgEnum('damage_type', [
  'light_scratch',
  'deep_scratch', 
  'small_dent',
  'large_dent',
  'paintwork_damage',
  'rust',
  'crack',
  'chip',
  'generic_damage'
]);

export const expenseTypeEnum = pgEnum('expense_type', [
  'fuel',
  'train',
  'bus',
  'taxi',
  'other'
]);

export const stageEnum = pgEnum('stage', [
  'collection',
  'delivery'
]);

// New HMRC-compliant enums
export const artifactTypeEnum = pgEnum('artifact_type', [
  'invoice',
  'pod', 
  'poc',
  'receipt',
  'vehicle_photo',
  'damage_photo',
  'customer_po',
  'note'
]);

export const photoCategoryEnum = pgEnum('photo_category', [
  'front',
  'rear', 
  'side',
  'interior',
  'odometer',
  'signature',
  'damage',
  'keys',
  'v5',
  'wheels'
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'fuel',
  'train',
  'uber', 
  'parking',
  'toll',
  'misc'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'card',
  'cash',
  'bank_transfer',
  'fuel_card',
  'company_account'
]);

export const vehiclePanelEnum = pgEnum('vehicle_panel', [
  'front_bumper',
  'bonnet',
  'windscreen',
  'front_grille',
  'ns_front_headlight',
  'os_front_headlight',
  'os_front_wing',
  'os_front_door',
  'os_rear_door',
  'os_rear_panel',
  'os_side_mirror',
  'ns_front_wing',
  'ns_front_door',
  'ns_rear_door',
  'ns_rear_panel',
  'ns_side_mirror',
  'rear_bumper',
  'tailgate_boot',
  'rear_windscreen',
  'ns_rear_light',
  'os_rear_light',
  'roof_panel',
  'roof_rails',
  'nsf_wheel',
  'nsr_wheel',
  'osf_wheel',
  'osr_wheel'
]);

// Customer type enum
export const customerTypeEnum = pgEnum('customer_type', ['business', 'individual']);

// Bundle status enum
export const bundleStatusEnum = pgEnum('bundle_status', ['draft', 'sent', 'paid']);

// Core tables
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  customerType: customerTypeEnum("customer_type").default('business').notNull(), // Business or Individual customer
  address: jsonb("address").$type<{
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }>(),
  billingCompanyName: text("billing_company_name").notNull(), // Company name for invoicing (may differ from main name)
  billingAddress: jsonb("billing_address").$type<{
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }>().notNull(), // Required billing address for invoices
  defaultPocEmails: jsonb("default_poc_emails").$type<string[]>().default([]), // Default email list for Proof of Collection
  defaultPodEmails: jsonb("default_pod_emails").$type<string[]>().default([]), // Default email list for Proof of Delivery  
  defaultInvoiceEmails: jsonb("default_invoice_emails").$type<string[]>().default([]), // Default email list for invoices
  costPerMile: decimal("cost_per_mile", { precision: 10, scale: 2 }), // Customer-specific cost per mile override
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer addresses table for multiple saved addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  name: text("name").notNull(), // e.g., "Main Showroom", "Prep Centre", "Auction House"
  type: text("type").notNull(), // 'collection' or 'delivery' or 'both'
  address: jsonb("address").$type<{
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }>().notNull(),
  contact: jsonb("contact").$type<{
    name?: string;
    phone?: string;
    email?: string;
  }>().notNull(),
  notes: text("notes"), // Special instructions, access codes, etc.
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({ 
  id: true, 
  createdAt: true 
});

// Add customer address relations
export const customerAddressesRelations = relations(customerAddresses, ({ one }) => ({
  customer: one(customers, {
    fields: [customerAddresses.customerId],
    references: [customers.id],
  }),
}));



export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  tradePlateNumber: text("trade_plate_number"),
  username: text("username").unique(),
  pin: text("pin"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Driver Availability table for tracking holidays, sick days, etc.
export const driverAvailability = pgTable("driver_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: varchar("reason", { length: 255 }).notNull(), // "Holiday", "Sick Day", "Personal Leave", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registration: text("registration").notNull().unique(),
  make: text("make").notNull(),
  colour: text("colour"),
  fuelType: text("fuel_type"),
  year: integer("year"),
  motStatus: text("mot_status"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: text("job_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  vehicleId: varchar("vehicle_id").references(() => vehicles.id),
  
  // Addresses
  collectionAddress: jsonb("collection_address").$type<{
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }>().notNull(),
  deliveryAddress: jsonb("delivery_address").$type<{
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  }>().notNull(),
  
  // Contacts
  collectionContact: jsonb("collection_contact").$type<{
    name: string;
    phone: string;
    email: string;
    releaseCode?: string;
    modelPin?: string;
    notes?: string;
  }>().notNull(),
  deliveryContact: jsonb("delivery_contact").$type<{
    name: string;
    phone: string;
    email: string;
    notes?: string;
  }>().notNull(),
  
  // Pricing
  calculatedMileage: decimal("calculated_mileage", { precision: 10, scale: 2 }),
  ratePerMile: decimal("rate_per_mile", { precision: 10, scale: 2 }),
  totalMovementFee: decimal("total_movement_fee", { precision: 10, scale: 2 }),
  
  // Requested dates
  requestedCollectionDate: timestamp("requested_collection_date"),
  requestedDeliveryDate: timestamp("requested_delivery_date"),
  
  // Status and timing
  status: jobStatusEnum("status").default('created'),
  createdAt: timestamp("created_at").defaultNow(),
  assignedAt: timestamp("assigned_at"),
  collectedAt: timestamp("collected_at"),
  deliveredAt: timestamp("delivered_at"),
  invoicedAt: timestamp("invoiced_at"),
  paidAt: timestamp("paid_at"),
  abortedAt: timestamp("aborted_at"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Cancellation/Abort fees and reasons
  abortFee: decimal("abort_fee", { precision: 10, scale: 2 }),
  cancellationFee: decimal("cancellation_fee", { precision: 10, scale: 2 }),
  abortReason: text("abort_reason"),
  cancellationReason: text("cancellation_reason"),
  
  // Payment tracking for individual customers
  paymentStatus: text("payment_status").default('pending'), // 'pending', 'paid', 'not_required' (for business customers)
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID for individual customers
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // Amount paid upfront by individual customers
  
  // Job-level email overrides (fallback to customer defaults if null)
  overridePocEmails: jsonb("override_poc_emails").$type<string[]>(), // Override emails for this job's POC
  overridePodEmails: jsonb("override_pod_emails").$type<string[]>(), // Override emails for this job's POD
  overrideInvoiceEmails: jsonb("override_invoice_emails").$type<string[]>(), // Override emails for this job's Invoice
});

export const jobProcessRecords = pgTable("job_process_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  stage: text("stage").notNull(), // 'collection' or 'delivery'
  
  // Mileage and fuel/charge
  mileageReading: varchar("mileage_reading"),
  fuelLevel: integer("fuel_level"), // 0-4 scale (Empty=0, 1/4=1, 1/2=2, 3/4=3, Full=4)
  chargeLevel: integer("charge_level"), // 0-4 scale for electric vehicles
  
  // Environmental conditions
  isWet: boolean("is_wet"),
  isDark: boolean("is_dark"),
  weatherCondition: varchar("weather_condition"), // Wet/Dry/Light/Good/Bad
  
  // AutoTrader Professional Checklist - Vehicle Equipment
  lockingWheelNutPresent: boolean("locking_wheel_nut_present"),
  spareWheelPresent: boolean("spare_wheel_present"),
  jackPresent: boolean("jack_present"),
  toolsPresent: boolean("tools_present"),
  chargingCablesPresent: boolean("charging_cables_present"),
  numberOfChargingCables: integer("number_of_charging_cables"),
  satNavWorking: boolean("sat_nav_working"),
  vehicleDeliveryPackPresent: boolean("vehicle_delivery_pack_present"),
  numberPlatesMatch: boolean("number_plates_match"),
  warningLightsOn: boolean("warning_lights_on"),
  headrestsPresent: boolean("headrests_present"),
  parcelShelfPresent: boolean("parcel_shelf_present"),
  v5Present: boolean("v5_present"),
  serviceHistoryPresent: boolean("service_history_present"),
  numberOfKeys: integer("number_of_keys"),
  
  // AutoTrader Professional Collection Acknowledgment
  vehicleCleanInternally: boolean("vehicle_clean_internally"),
  vehicleCleanExternally: boolean("vehicle_clean_externally"),
  vehicleFreeDamageInternally: boolean("vehicle_free_damage_internally"),
  vehicleFreeDamageExternally: boolean("vehicle_free_damage_externally"),
  collectedRightPlaceTime: boolean("collected_right_place_time"),
  handbookServiceBookPresent: boolean("handbook_service_book_present"),
  matsInPlace: boolean("mats_in_place"),
  handoverAccepted: boolean("handover_accepted"),
  
  // Photos taken checklist
  photoLeftSideTaken: boolean("photo_left_side_taken"),
  photoRightSideTaken: boolean("photo_right_side_taken"),
  photoFrontTaken: boolean("photo_front_taken"),
  photoBackTaken: boolean("photo_back_taken"),
  photoDashboardTaken: boolean("photo_dashboard_taken"),
  photoKeysTaken: boolean("photo_keys_taken"),
  
  // Notes and customer info
  additionalNotes: text("additional_notes"),
  customerName: text("customer_name"),
  customerSignature: text("customer_signature"), // Base64 encoded
  
  // Customer satisfaction (for delivery)
  customerSatisfactionRating: integer("customer_satisfaction_rating"), // 1-5 scale
  
  // Structured inspection data (JSON)
  inspectionData: jsonb("inspection_data"), // Stores categorized damage inspection results
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const damageReports = pgTable("damage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  panel: vehiclePanelEnum("panel").notNull(),
  damageType: damageTypeEnum("damage_type").notNull(),
  stage: text("stage").notNull(), // 'collection' or 'delivery'
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id),
  damageReportId: varchar("damage_report_id").references(() => damageReports.id),
  expenseId: varchar("expense_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull(), // 'odometer', 'fuel_gauge', 'damage', 'checklist', 'misc', 'receipt', 'inspection', 'additional'
  stage: text("stage"), // 'collection' or 'delivery'
  inspectionItem: text("inspection_item"), // For categorized damage inspection (e.g., 'driver_seat', 'front_bumper')
  createdAt: timestamp("created_at").defaultNow(),
});

// Artifacts table for HMRC-compliant file tracking
export const artifacts = pgTable("artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  stage: text("stage"), // collection, delivery, or null for job-level docs
  type: text("type").notNull(),
  category: text("category"), // for photo artifacts
  relatedId: varchar("related_id"), // expense.id, damageReport.id, etc.
  filePath: text("file_path").notNull(), // canonical path in hierarchical structure
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(), // for integrity verification
  createdBy: varchar("created_by").notNull(), // driver or admin ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id).notNull(),
  type: expenseTypeEnum("type").notNull(),
  category: text("category"), // HMRC category (optional now)
  fuelType: text("fuel_type"), // For fuel expenses: petrol, diesel, electric (auto-filled from DVLA)
  description: text("description"), // Required for "other" type expenses
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  
  // HMRC-compliant fields (optional)
  merchant: text("merchant"), // e.g., "Shell", "LNER", "Uber" 
  location: text("location"), // e.g., "M1 Services", "Leeds Station"
  purchasedAt: date("purchased_at"), // actual purchase date
  vatRate: decimal("vat_rate", { precision: 5, scale: 4 }), // e.g., 0.2000 for 20%
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }), // amount excluding VAT
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }), // amount including VAT
  paymentMethod: text("payment_method"),
  receiptArtifactId: varchar("receipt_artifact_id").references(() => artifacts.id),
  stage: text("stage"), // which stage this expense was incurred
  
  notes: text("notes"),
  receiptPhotoPath: varchar("receipt_photo_path", { length: 500 }), // legacy, keeping for compatibility
  isApproved: boolean("is_approved"),
  chargeToCustomer: boolean("charge_to_customer"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  bundleId: varchar("bundle_id").references(() => invoiceBundles.id),
  
  // Line items
  movementFee: decimal("movement_fee", { precision: 10, scale: 2 }).notNull(),
  expensesTotal: decimal("expenses_total", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  
  isPaid: boolean("is_paid").default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoice bundles table
export const invoiceBundles = pgTable("invoice_bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleNumber: text("bundle_number").notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: bundleStatusEnum("status").default('draft').notNull(),
  
  // Payment tracking fields (similar to jobs table pattern)
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID for bundle payments
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }), // Amount paid for the bundle
  paidAt: timestamp("paid_at"), // Timestamp when bundle was paid
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Bundle invoices junction table
export const bundleInvoices = pgTable("bundle_invoices", {
  bundleId: varchar("bundle_id").references(() => invoiceBundles.id).notNull(),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
}, (table) => ({
  pk: sql`PRIMARY KEY (${table.bundleId}, ${table.invoiceId})`,
}));

export const emailTemplateTypeEnum = pgEnum('email_template_type', [
  'job_assignment',
  'poc_ready', 
  'pod_ready',
  'invoice_ready',
  'job_completed',
  'payment_required',
  'bundle_invoice_ready',
  'bundle_payment_confirmation'
]);

export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  type: emailTemplateTypeEnum("type").notNull(),
  htmlContent: text("html_content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastUsed: timestamp("last_used"),
});

export const userCredentials = pgTable("user_credentials", {
  id: varchar("id").primaryKey().$type<string>(), // Keep existing uuid type, generated by database
  username: varchar("username", { length: 255 }).notNull().unique(), // Match existing length
  hashedPassword: text("hashed_password").notNull(),
  role: varchar("role", { length: 50 }).notNull(), // Match existing varchar(50)
  driverId: varchar("driver_id", { length: 255 }).references(() => drivers.id), // Match existing length
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  lastLoginIp: varchar("last_login_ip", { length: 255 }), // Match existing length
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wagePayments = pgTable("wage_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => drivers.id).notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paidAt: timestamp("paid_at"),
  paidBy: varchar("paid_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const vehicleInspections = pgTable("vehicle_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  jobNumber: text("job_number").notNull(),
  inspectionType: text("inspection_type").notNull(), // 'collection' or 'delivery'
  
  // Complete inspection data
  data: jsonb("data").$type<{
    customerDetails: {
      name: string;
      signature: string;
    };
    vehicleDetails: {
      mileageReading: string;
      fuelLevel: number;
      odometerPhoto: string;
    };
    damageMarkers: Array<{
      id: string;
      x: number;
      y: number;
      view: 'front' | 'driver' | 'rear' | 'passenger' | 'roof';
      damageType: 'scratch' | 'dent' | 'chip' | 'crack' | 'broken' | 'bad-repair' | 'paintwork';
      size: 'small' | 'medium' | 'large';
      description: string;
      photos: string[];
      timestamp: number;
    }>;
    wheelsAndTyres: Array<{
      wheelNumber: number;
      wheelPosition: string;
      wheelScuffed: boolean;
      wheelPhotos: string[];
      tyreCondition: 'ok' | 'worn';
      tyrePhotos: string[];
    }>;
    generalPhotos: string[];
    additionalNotes: string;
  }>(),
  
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collection drafts for reliable auto-save (especially iOS PWAs)
export const collectionDrafts = pgTable("collection_drafts", {
  jobId: varchar("job_id").primaryKey().references(() => jobs.id),
  collectionData: jsonb("collection_data").$type<any>().notNull(),
  currentStep: text("current_step").notNull(),
  lastSaved: timestamp("last_saved").defaultNow().notNull(),
});

// Delivery drafts for reliable auto-save (especially iOS PWAs)
export const deliveryDrafts = pgTable("delivery_drafts", {
  jobId: varchar("job_id").primaryKey().references(() => jobs.id),
  deliveryData: jsonb("delivery_data").$type<any>().notNull(),
  currentStep: text("current_step").notNull(),
  lastSaved: timestamp("last_saved").defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  jobs: many(jobs),
  invoices: many(invoices),
  addresses: many(customerAddresses),
  bundles: many(invoiceBundles),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  jobs: many(jobs),
  expenses: many(expenses),
  availability: many(driverAvailability),
}));

export const driverAvailabilityRelations = relations(driverAvailability, ({ one }) => ({
  driver: one(drivers, {
    fields: [driverAvailability.driverId],
    references: [drivers.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  driver: one(drivers, {
    fields: [jobs.driverId],
    references: [drivers.id],
  }),
  vehicle: one(vehicles, {
    fields: [jobs.vehicleId],
    references: [vehicles.id],
  }),
  processRecords: many(jobProcessRecords),
  damageReports: many(damageReports),
  photos: many(photos),
  expenses: many(expenses),
  artifacts: many(artifacts),
  invoice: one(invoices),
}));

export const jobProcessRecordsRelations = relations(jobProcessRecords, ({ one }) => ({
  job: one(jobs, {
    fields: [jobProcessRecords.jobId],
    references: [jobs.id],
  }),
}));

export const damageReportsRelations = relations(damageReports, ({ one, many }) => ({
  job: one(jobs, {
    fields: [damageReports.jobId],
    references: [jobs.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  job: one(jobs, {
    fields: [photos.jobId],
    references: [jobs.id],
  }),
  damageReport: one(damageReports, {
    fields: [photos.damageReportId],
    references: [damageReports.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  job: one(jobs, {
    fields: [expenses.jobId],
    references: [jobs.id],
  }),
  driver: one(drivers, {
    fields: [expenses.driverId],
    references: [drivers.id],
  }),
  receiptArtifact: one(artifacts, {
    fields: [expenses.receiptArtifactId],
    references: [artifacts.id],
  }),
}));

// Artifacts relations
export const artifactsRelations = relations(artifacts, ({ one }) => ({
  job: one(jobs, {
    fields: [artifacts.jobId],
    references: [jobs.id],
  }),
}));

export const userCredentialsRelations = relations(userCredentials, ({ one }) => ({
  driver: one(drivers, {
    fields: [userCredentials.driverId],
    references: [drivers.id],
  }),
}));

export const wagePaymentsRelations = relations(wagePayments, ({ one }) => ({
  driver: one(drivers, {
    fields: [wagePayments.driverId],
    references: [drivers.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  bundle: one(invoiceBundles, {
    fields: [invoices.bundleId],
    references: [invoiceBundles.id],
  }),
}));

// Invoice bundle relations
export const invoiceBundlesRelations = relations(invoiceBundles, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoiceBundles.customerId],
    references: [customers.id],
  }),
  bundleInvoices: many(bundleInvoices),
}));

// Bundle invoices junction relations
export const bundleInvoicesRelations = relations(bundleInvoices, ({ one }) => ({
  bundle: one(invoiceBundles, {
    fields: [bundleInvoices.bundleId],
    references: [invoiceBundles.id],
  }),
  invoice: one(invoices, {
    fields: [bundleInvoices.invoiceId],
    references: [invoices.id],
  }),
}));

// Insert schemas
export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDriverAvailabilitySchema = createInsertSchema(driverAvailability).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true, 
  createdAt: true 
});

export const insertJobSchema = createInsertSchema(jobs).omit({ 
  id: true, 
  createdAt: true,
  assignedAt: true,
  collectedAt: true,
  deliveredAt: true,
  invoicedAt: true,
  paidAt: true,
}).extend({
  jobNumber: z.string().optional(), // Allow jobNumber to be passed
  requestedCollectionDate: z.coerce.date().optional(),
  requestedDeliveryDate: z.coerce.date().optional(),
});

export const insertJobProcessRecordSchema = createInsertSchema(jobProcessRecords).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDamageReportSchema = createInsertSchema(damageReports).omit({ 
  id: true, 
  createdAt: true 
});

export const insertPhotoSchema = createInsertSchema(photos).omit({ 
  id: true, 
  createdAt: true 
});

// New insert schema for artifacts
export const insertArtifactSchema = createInsertSchema(artifacts).omit({
  id: true,
  createdAt: true
}).extend({
  purchasedAt: z.coerce.date().optional(), // For expense receipts
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({ 
  id: true, 
  createdAt: true,
  approvedAt: true,
  approvedBy: true,
}).extend({
  purchasedAt: z.coerce.date().optional(),
  amount: z.string().transform(Number), // Convert string input to number
  vatRate: z.string().transform(Number).optional(),
  vatAmount: z.string().transform(Number).optional(),
  netAmount: z.string().transform(Number).optional(),
  grossAmount: z.string().transform(Number).optional(),
});

export const insertWagePaymentSchema = createInsertSchema(wagePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true,
  paidAt: true,
});

// Bundle insert schemas
export const insertInvoiceBundleSchema = createInsertSchema(invoiceBundles).omit({ 
  id: true, 
  createdAt: true,
});

export const insertBundleInvoiceSchema = createInsertSchema(bundleInvoices);

// Batch invoicing automation removed - manual admin control preferred

// Batch invoices table removed - manual admin control preferred

// Batch invoice items and schedules removed - manual admin control preferred

// Batch invoicing relations removed - manual admin control preferred

// Batch invoicing insert schemas removed - manual admin control preferred

// All automation tables removed - manual admin control preferred

// Friday email relations removed - manual admin control preferred

// Automation types removed - manual admin control preferred

export const insertSettingSchema = createInsertSchema(settings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true,
  lastUsed: true
});

// Environmental conditions for collection/delivery
export const environmentalConditions = pgTable("environmental_conditions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: text("job_id").references(() => jobs.id).notNull(),
  stage: stageEnum("stage").notNull(),
  isWet: boolean("is_wet").notNull(),
  isDark: boolean("is_dark").notNull(), 
  isDirty: boolean("is_dirty").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Checklist items for collection/delivery
export const checklistItems = pgTable("checklist_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: text("job_id").references(() => jobs.id).notNull(),
  stage: stageEnum("stage").notNull(),
  numberOfKeys: integer("number_of_keys"),
  keysPhotoPath: varchar("keys_photo_path", { length: 500 }),
  hasV5: boolean("has_v5"),
  v5PhotoPath: varchar("v5_photo_path", { length: 500 }),
  hasLockingWheelNut: boolean("has_locking_wheel_nut"),
  lockingWheelNutPhotoPath: varchar("locking_wheel_nut_photo_path", { length: 500 }),
  hasServiceHistory: boolean("has_service_history"),
  serviceHistoryPhotoPath: varchar("service_history_photo_path", { length: 500 }),
  hasParcelShelf: boolean("has_parcel_shelf"),
  parcelShelfPhotoPath: varchar("parcel_shelf_photo_path", { length: 500 }),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Miscellaneous photos
export const miscellaneousPhotos = pgTable("miscellaneous_photos", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: text("job_id").references(() => jobs.id).notNull(),
  stage: stageEnum("stage").notNull(),
  photoPath: varchar("photo_path", { length: 500 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Email settings
export const emailSettings = pgTable("email_settings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
  smtpPort: integer("smtp_port").notNull(),
  smtpUser: varchar("smtp_user", { length: 255 }).notNull(),
  smtpPassword: varchar("smtp_password", { length: 255 }).notNull(),
  fromEmail: varchar("from_email", { length: 255 }).notNull(),
  fromName: varchar("from_name", { length: 255 }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEnvironmentalConditionsSchema = createInsertSchema(environmentalConditions).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistItemsSchema = createInsertSchema(checklistItems).omit({
  id: true,
  createdAt: true,
});

export const insertMiscellaneousPhotosSchema = createInsertSchema(miscellaneousPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEnvironmentalConditions = z.infer<typeof insertEnvironmentalConditionsSchema>;
export type EnvironmentalConditions = typeof environmentalConditions.$inferSelect;

export type InsertChecklistItems = z.infer<typeof insertChecklistItemsSchema>;
export type ChecklistItems = typeof checklistItems.$inferSelect;

export type InsertMiscellaneousPhotos = z.infer<typeof insertMiscellaneousPhotosSchema>;
export type MiscellaneousPhotos = typeof miscellaneousPhotos.$inferSelect;

export type InsertEmailSettings = z.infer<typeof insertEmailSettingsSchema>;
export type EmailSettings = typeof emailSettings.$inferSelect;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Types
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type DriverAvailability = typeof driverAvailability.$inferSelect;
export type InsertDriverAvailability = z.infer<typeof insertDriverAvailabilitySchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobProcessRecord = typeof jobProcessRecords.$inferSelect;
export type InsertJobProcessRecord = z.infer<typeof insertJobProcessRecordSchema>;

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type VehicleInspection = typeof vehicleInspections.$inferSelect;
export const insertVehicleInspectionSchema = createInsertSchema(vehicleInspections).omit({
  id: true,
  createdAt: true,
});
export type InsertVehicleInspection = z.infer<typeof insertVehicleInspectionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type UserCredentials = typeof userCredentials.$inferSelect;
export type InsertUserCredentials = typeof userCredentials.$inferInsert;

export type WagePayment = typeof wagePayments.$inferSelect;
export type InsertWagePayment = z.infer<typeof insertWagePaymentSchema>;

// New artifact types
export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = z.infer<typeof insertArtifactSchema>;

// Bundle types
export type InvoiceBundle = typeof invoiceBundles.$inferSelect;
export type InsertInvoiceBundle = z.infer<typeof insertInvoiceBundleSchema>;

export type BundleInvoice = typeof bundleInvoices.$inferSelect;
export type InsertBundleInvoice = z.infer<typeof insertBundleInvoiceSchema>;

// Updated enum types
export type JobStatus = typeof jobStatusEnum.enumValues[number];
export type DamageType = typeof damageTypeEnum.enumValues[number];
export type ExpenseType = typeof expenseTypeEnum.enumValues[number];
export type VehiclePanel = typeof vehiclePanelEnum.enumValues[number];
export type ArtifactType = typeof artifactTypeEnum.enumValues[number];
export type PhotoCategory = typeof photoCategoryEnum.enumValues[number];
export type ExpenseCategory = typeof expenseCategoryEnum.enumValues[number];
export type PaymentMethod = typeof paymentMethodEnum.enumValues[number];
export type BundleStatus = typeof bundleStatusEnum.enumValues[number];
