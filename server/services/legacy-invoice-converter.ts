import { GoldStandardInvoicePDFService } from './gold-standard-invoice-pdf';
import type { Invoice, Job, Customer, Vehicle, Expense, Driver } from '../../shared/schema';

interface LegacyInvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  movementFee: number;
  movementDetails?: string; // Collection > Delivery postcodes
  expenses: Array<{
    description: string;
    amount: number;
  }>;
  totalAmount: number;
  paymentTerms: string;
  dueDate: string;
}

export class LegacyInvoiceConverter {
  
  static async convertAndGenerateInvoice(legacyData: LegacyInvoiceData, distance?: number): Promise<Buffer> {
    // Convert legacy data to current system format
    const invoice = this.createInvoiceFromLegacy(legacyData);
    const customer = this.createCustomerFromLegacy(legacyData);
    const job = this.createJobFromLegacy(legacyData, distance);
    const expenses = this.createExpensesFromLegacy(legacyData);

    // Override the invoice date to use the legacy date
    const legacyDate = new Date(legacyData.date);
    const invoiceWithLegacyDate = {
      ...invoice,
      createdAt: legacyDate
    };

    // Generate using current Gold Standard template
    return await GoldStandardInvoicePDFService.generateInvoice({
      invoice: invoiceWithLegacyDate,
      job,
      customer,
      expenses
    });
  }

  private static createInvoiceFromLegacy(data: LegacyInvoiceData): Invoice {
    const invoiceDate = new Date(data.date);
    const dueDate = new Date(data.dueDate);

    return {
      id: `legacy-${data.invoiceNumber}`,
      jobId: `legacy-job-${data.invoiceNumber}`,
      invoiceNumber: data.invoiceNumber,
      customerId: `legacy-customer-${data.invoiceNumber}`,
      movementFee: data.movementFee.toFixed(2),
      expensesTotal: data.expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2),
      totalAmount: data.totalAmount.toFixed(2),
      isPaid: false,
      paidAt: null,
      createdAt: invoiceDate
    };
  }

  private static createCustomerFromLegacy(data: LegacyInvoiceData): Customer {
    // Parse the customer address properly to separate line1, city, and postcode
    const addressLines = data.customerAddress.split('\n');
    console.log('📮 Address lines:', addressLines);
    
    // data.customerAddress = 'Henson House, Ponteland Road\nNewcastle\nNE5 3DF'
    const line1 = addressLines[0]; // 'Henson House, Ponteland Road'
    const city = addressLines[1];  // 'Newcastle'  
    const postcode = addressLines[2]; // 'NE5 3DF'
    
    console.log('🏠 Parsed address:', { line1, city, postcode });

    const customer = {
      id: `legacy-customer-${data.invoiceNumber}`,
      name: data.customerName,
      email: null,
      phone: null,
      customerType: 'business' as const,
      address: {
        line1: line1,
        line2: undefined,
        city: city,
        postcode: postcode
      },
      billingAddress: {
        line1: line1,
        line2: undefined,
        city: city, 
        postcode: postcode
      },
      billingCompanyName: data.customerName,
      defaultInvoiceEmails: [],
      defaultPocEmails: [],
      defaultPodEmails: [],
      costPerMile: null,
      isActive: true,
      createdAt: new Date()
    };
    
    console.log('👤 Final customer object:', customer);
    return customer;
  }

  private static createJobFromLegacy(data: LegacyInvoiceData, distance?: number): Job & { customer: Customer; vehicle: Vehicle } {
    const vehicle: Vehicle = {
      id: `legacy-vehicle-${data.invoiceNumber}`,
      registration: data.vehicleRegistration,
      make: data.vehicleMake,
      year: null,
      colour: undefined,
      fuelType: null,
      motStatus: null,
      createdAt: new Date()
    };

    const customer: Customer = this.createCustomerFromLegacy(data);

    // Parse movement details to extract collection and delivery postcodes
    const movementParts = data.movementDetails?.split(' > ') || ['Unknown', 'Unknown'];
    const collectionPostcode = movementParts[0] || 'Unknown';
    const deliveryPostcode = movementParts[1] || 'Unknown';

    const job: Job & { customer: Customer; vehicle: Vehicle } = {
      id: `legacy-job-${data.invoiceNumber}`,
      jobNumber: data.invoiceNumber,
      customerId: customer.id,
      vehicleId: vehicle.id,
      status: 'paid',
      collectionAddress: {
        line1: 'Collection Point',
        city: 'Collection',
        postcode: collectionPostcode
      },
      deliveryAddress: {
        line1: 'Delivery Point', 
        city: 'Delivery',
        postcode: deliveryPostcode
      },
      collectionContact: {
        name: customer.name,
        phone: '',
        email: ''
      },
      deliveryContact: {
        name: customer.name,
        phone: '',
        email: ''
      },
      collectedAt: new Date(data.date),
      deliveredAt: new Date(data.date),
      totalMovementFee: data.movementFee.toFixed(2),
      calculatedMileage: distance ? distance.toString() : '0',
      driverId: null,
      driver: null,
      overrideInvoiceEmails: [],
      notes: `Legacy invoice conversion from ${data.invoiceNumber}`,
      createdAt: new Date(data.date),
      updatedAt: new Date(),
      customer,
      vehicle
    };

    return job;
  }

  private static createExpensesFromLegacy(data: LegacyInvoiceData): (Expense & { driver?: Driver })[] {
    return data.expenses.map((expense, index) => ({
      id: `legacy-expense-${data.invoiceNumber}-${index}`,
      jobId: `legacy-job-${data.invoiceNumber}`,
      createdAt: new Date(data.date),
      type: 'fuel' as const,
      category: 'fuel',
      notes: expense.description,
      driverId: `legacy-driver-${data.invoiceNumber}`,
      fuelType: null,
      stage: null,
      merchant: null,
      location: null,
      paymentMethod: null,
      receiptId: null,
      vatAmount: null,
      purchasedAt: data.date,
      vatRate: null,
      netAmount: null,
      grossAmount: null,
      receiptArtifactId: null,
      amount: expense.amount.toFixed(2),
      receiptPhotoPath: null,
      submittedAt: new Date(data.date),
      isApproved: true,
      chargeToCustomer: true,
      approvedAt: new Date(data.date),
      approvedBy: 'Legacy System',
      driver: {
        id: `legacy-driver-${data.invoiceNumber}`,
        name: 'Legacy Driver',
        email: 'legacy@ovmtransport.com',
        phone: null,
        address: null,
        licenseNumber: null,
        isActive: true,
        createdAt: new Date(data.date)
      }
    }));
  }

  // Extract data from the provided PDFs
  static extractInvoice1993(): LegacyInvoiceData {
    return {
      invoiceNumber: '250725001',
      date: '2025-07-25',
      customerName: 'Henson Motor Group',
      customerAddress: 'Henson House, Ponteland Road\nNewcastle\nNE5 3DF',
      vehicleRegistration: 'DS20FBB',
      vehicleMake: 'Vauxhall',
      vehicleModel: 'Grandland',
      movementFee: 120.00,
      expenses: [
        {
          description: 'Diesel',
          amount: 30.00
        }
      ],
      totalAmount: 150.00,
      paymentTerms: '14 Days',
      dueDate: '2025-08-08'
    };
  }

  static extractInvoice1994(): LegacyInvoiceData {
    return {
      invoiceNumber: '250725002',
      date: '2025-07-25',
      customerName: 'Henson Motor Group',
      customerAddress: 'Henson House, Ponteland Road\nNewcastle\nNE5 3DF',
      vehicleRegistration: 'KV18RXH',
      vehicleMake: 'Citroën',
      vehicleModel: 'Grand Picasso',
      movementFee: 116.00,
      expenses: [],
      totalAmount: 116.00,
      paymentTerms: '14 Days',
      dueDate: '2025-08-08'
    };
  }
}