import { storage } from "../storage";
import { PDFService } from "./pdf";
import { EmailService } from "./email";
import { GoldStandardInvoicePDFService } from "./gold-standard-invoice-pdf";
import type { Job, Invoice } from "@shared/schema";

export class InvoiceService {
  private pdfService: PDFService;
  private emailService: EmailService;

  constructor() {
    this.pdfService = new PDFService();
    this.emailService = new EmailService();
  }

  async generateAndSendInvoice(jobId: string): Promise<Invoice> {
    try {
      // Get job details with customer and vehicle info
      const job = await storage.getJobWithDetails(jobId);
      if (!job) {
        throw new Error("Job not found");
      }

      // Get customer details
      const customer = await storage.getCustomer(job.customerId);
      if (!customer) {
        throw new Error("Customer not found");
      }

      // Get vehicle details for proper invoice display
      const vehicle = job.vehicleId ? await storage.getVehicle(job.vehicleId) : null;

      // Calculate total expenses for this job
      const jobExpenses = await storage.getJobExpenses(jobId);
      
      // Check for pending expenses
      const pendingExpenses = jobExpenses.filter(exp => !exp.isApproved);
      if (pendingExpenses.length > 0) {
        throw new Error(`Cannot generate invoice: ${pendingExpenses.length} expense(s) pending approval. All expenses must be approved or rejected before invoicing.`);
      }
      
      const approvedExpenses = jobExpenses.filter(exp => exp.isApproved && exp.chargeToCustomer);
      const expensesTotal = approvedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

      // Use job number as invoice number (agreed format)
      const invoiceNumber = job.jobNumber;

      // Calculate totals
      const movementFee = parseFloat(job.totalMovementFee);
      const totalAmount = movementFee + expensesTotal;

      // Create invoice record
      const invoiceData = {
        jobId: job.id,
        invoiceNumber,
        customerId: job.customerId,
        movementFee: job.totalMovementFee,
        expensesTotal: expensesTotal.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      };

      const invoice = await storage.createInvoice(invoiceData);

      // Generate PDF using gold standard invoice service with enriched job data
      const pdfBuffer = await GoldStandardInvoicePDFService.generateInvoice({
        invoice,
        job: { ...job, vehicle: vehicle || undefined },
        customer,
        expenses: approvedExpenses,
      });

      // Send email with invoice attached
      const emailRecipients = job.overrideInvoiceEmails || customer.defaultInvoiceEmails || [];
      if (emailRecipients.length > 0) {
        await this.emailService.sendInvoice({
          to: emailRecipients,
          invoiceNumber,
          customerName: customer.name,
          jobNumber: job.jobNumber,
          totalAmount: totalAmount.toFixed(2),
          pdfBuffer,
        });
      }

      // Update job status to invoiced
      await storage.updateJobStatus(jobId, 'invoiced');

      return invoice;
    } catch (error) {
      console.error("Error generating and sending invoice:", error);
      throw error;
    }
  }

  async markInvoicePaid(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await storage.updateInvoice(invoiceId, {
        isPaid: true,
        paidAt: new Date(),
      });

      // Update job status to paid
      if (invoice) {
        await storage.updateJobStatus(invoice.jobId, 'paid');
      }

      return invoice;
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      throw error;
    }
  }

  async sendReminderEmail(invoiceId: string): Promise<void> {
    try {
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const job = await storage.getJobWithDetails(invoice.jobId);
      const customer = await storage.getCustomer(invoice.customerId);

      if (!job || !customer || !customer.invoiceEmails) {
        throw new Error("Missing required data for reminder email");
      }

      const emailAddresses = customer.invoiceEmails.split(',').map(email => email.trim());
      
      await this.emailService.sendInvoiceReminder({
        to: emailAddresses,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customer.name,
        jobNumber: job.jobNumber,
        totalAmount: invoice.totalAmount,
        daysOverdue: Math.floor((Date.now() - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      });
    } catch (error) {
      console.error("Error sending reminder email:", error);
      throw error;
    }
  }
}