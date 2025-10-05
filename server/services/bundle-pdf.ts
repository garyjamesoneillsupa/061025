import PDFDocument from "pdfkit";
import PDFMerger from "pdf-merger-js";
import fs from "fs";
import path from "path";
import { PDFService } from "./pdf";
import { storage } from "../storage";
import type {
  InvoiceBundle,
  Invoice,
  Job,
  Customer,
  Expense,
} from "@shared/schema";

interface BundleData {
  bundle: InvoiceBundle & { customer?: Customer };
  invoices: (Invoice & { job?: Job; customer?: Customer; expenses?: Expense[] })[];
}

export class BundlePDFService {
  /**
   * Generate a combined PDF for an invoice bundle
   */
  static async generateBundlePDF(bundleId: string): Promise<Buffer> {
    // Fetch bundle data with all related invoices
    const bundleData = await storage.getBundleWithInvoices(bundleId);
    if (!bundleData) {
      throw new Error(`Bundle with ID ${bundleId} not found`);
    }

    if (!bundleData.invoices || bundleData.invoices.length === 0) {
      throw new Error(`Bundle ${bundleData.bundleNumber} contains no invoices`);
    }

    // Prepare the data structure
    const processedData: BundleData = {
      bundle: bundleData,
      invoices: [],
    };

    // Get full data for each invoice including customer and expenses
    for (const invoice of bundleData.invoices) {
      if (!invoice.id) continue;
      
      // Get the full invoice data
      const fullInvoice = await storage.getInvoice(invoice.id);
      if (!fullInvoice) continue;

      // Get job expenses
      const expenses = await storage.getJobExpenses(fullInvoice.jobId);

      processedData.invoices.push({
        ...fullInvoice,
        expenses,
      });
    }

    // Generate cover page PDF
    const coverPageBuffer = await this.generateCoverPage(processedData);

    // Generate individual invoice PDFs
    const invoicePDFBuffers: Buffer[] = [];
    for (const invoice of processedData.invoices) {
      if (!invoice.job) {
        // Get job data if not included
        const job = await storage.getJob(invoice.jobId);
        if (!job) continue;
        invoice.job = job;
      }

      if (!invoice.customer) {
        // Get customer data if not included
        const customer = await storage.getCustomer(invoice.customerId);
        if (!customer) continue;
        invoice.customer = customer;
      }

      const invoiceData = {
        invoice,
        job: invoice.job,
        customer: invoice.customer,
        expenses: invoice.expenses || [],
      };

      const invoicePDF = await PDFService.generateInvoice(invoiceData);
      invoicePDFBuffers.push(invoicePDF);
    }

    // Combine all PDFs using pdf-merger-js
    return await this.combinePDFs(coverPageBuffer, invoicePDFBuffers, bundleData.bundleNumber);
  }

  /**
   * Generate a professional cover page for the bundle
   */
  private static async generateCoverPage(data: BundleData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const { bundle } = data;
        const pageWidth = 595;
        const leftMargin = 50;
        const rightMargin = 50;
        const contentEndX = pageWidth - rightMargin;

        // Company details
        doc.fontSize(10)
          .font("Helvetica")
          .text("272 Bath Street, Glasgow, G2 4JR", leftMargin, 77)
          .text("Company Number: SC834621", leftMargin, 92);

        // Logo
        const logoPath = path.join(process.cwd(), "assets/invoicelogo.png");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, leftMargin, 30, { width: 120 });
        }

        // Header
        doc.fontSize(24)
          .font("Helvetica-Bold")
          .text("INVOICE BUNDLE", leftMargin, 30, {
            align: "right",
            width: contentEndX - leftMargin,
          });

        doc.fontSize(16)
          .font("Helvetica")
          .text(`#${bundle.bundleNumber}`, leftMargin, 60, {
            align: "right",
            width: contentEndX - leftMargin,
          });

        // Date
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        doc.fontSize(10).text(`Bundle Date: ${formattedDate}`, leftMargin, 85, {
          align: "right",
          width: contentEndX - leftMargin,
        });

        // Bundle status
        doc.text(`Status: ${bundle.status.toUpperCase()}`, leftMargin, 105, {
          align: "right",
          width: contentEndX - leftMargin,
        });

        // Customer details
        let yPos = 154;
        doc.fontSize(11)
          .font("Helvetica-Bold")
          .text("Bundle For:", leftMargin, yPos);

        yPos += 15;
        doc.fontSize(10)
          .font("Helvetica")
          .text(bundle.customer?.name || "Unknown Customer", leftMargin, yPos);

        // Bundle summary
        yPos = 240;
        doc.fontSize(14)
          .font("Helvetica-Bold")
          .text("Bundle Summary", leftMargin, yPos);

        yPos += 25;

        // Table header
        doc.fontSize(11)
          .font("Helvetica-Bold")
          .text("Invoice Number", leftMargin, yPos)
          .text("Job Reference", leftMargin + 150, yPos)
          .text("Amount", leftMargin + 300, yPos);

        yPos += 20;
        doc.moveTo(leftMargin, yPos).lineTo(contentEndX, yPos).stroke();
        yPos += 15;

        // Invoice list
        doc.fontSize(10).font("Helvetica");
        
        let totalAmount = 0;
        for (const invoice of data.invoices) {
          const amount = parseFloat(invoice.totalAmount || "0");
          totalAmount += amount;

          doc.text(invoice.invoiceNumber, leftMargin, yPos)
            .text(invoice.job?.jobNumber || "N/A", leftMargin + 150, yPos)
            .text(`£${amount.toFixed(2)}`, leftMargin + 300, yPos);

          yPos += 15;
        }

        // Total line
        yPos += 10;
        doc.moveTo(leftMargin, yPos).lineTo(contentEndX, yPos).stroke();
        yPos += 15;

        doc.fontSize(12)
          .font("Helvetica-Bold")
          .text("Total Bundle Amount:", leftMargin + 200, yPos)
          .text(`£${totalAmount.toFixed(2)}`, leftMargin + 300, yPos);

        // Bundle information
        yPos += 50;
        doc.fontSize(10)
          .font("Helvetica")
          .text(`This bundle contains ${data.invoices.length} invoice(s).`, leftMargin, yPos)
          .text("Individual invoices follow on subsequent pages.", leftMargin, yPos + 15);

        // Payment details
        yPos += 60;
        doc.fontSize(10)
          .font("Helvetica-Bold")
          .text("Payment Details:", leftMargin, yPos);

        yPos += 15;
        doc.font("Helvetica")
          .text("Name: OVM Ltd", leftMargin, yPos)
          .text("Sort Code: 82-19-74", leftMargin, yPos + 12)
          .text("Account Number: 70109500", leftMargin, yPos + 24);

        // Footer
        yPos += 100;
        doc.fontSize(8)
          .font("Helvetica")
          .text(
            "© 2025 OVM Ltd | Company Number: SC834621 | Email: info@ovmtransport.com | Phone: 0141 459 1302",
            leftMargin,
            yPos,
            { align: "center", width: contentEndX - leftMargin },
          );

        yPos += 12;
        doc.font("Helvetica-Bold").text(
          `Payment Reference: Please use ${bundle.bundleNumber} as your payment reference`,
          leftMargin,
          yPos,
          { align: "center", width: contentEndX - leftMargin },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Combine cover page and invoice PDFs with proper page numbering
   */
  private static async combinePDFs(
    coverPageBuffer: Buffer,
    invoicePDFBuffers: Buffer[],
    bundleNumber: string
  ): Promise<Buffer> {
    const merger = new PDFMerger();

    try {
      // Add cover page
      await merger.add(coverPageBuffer);

      // Add each invoice PDF
      for (const invoiceBuffer of invoicePDFBuffers) {
        await merger.add(invoiceBuffer);
      }

      // Get the merged PDF buffer
      const mergedBuffer = await merger.saveAsBuffer();

      // Add page numbering with bundle reference
      return await this.addPageNumbering(mergedBuffer, bundleNumber);
    } catch (error) {
      throw new Error(`Failed to combine PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add page numbering with bundle reference to the combined PDF
   */
  private static async addPageNumbering(pdfBuffer: Buffer, bundleNumber: string): Promise<Buffer> {
    // For now, return the merged buffer as-is
    // Page numbering can be added with more advanced PDF manipulation libraries
    // if needed in the future (like pdf-lib or hummus-pdf-writer)
    return pdfBuffer;
  }
}