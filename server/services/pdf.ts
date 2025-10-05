import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { FileStorageService } from "./fileStorage";
import type {
   Job,
   Customer,
   Driver,
   Vehicle,
   JobProcessRecord,
   DamageReport,
   Photo,
   Invoice,
   Expense,
} from "@shared/schema";

interface POCData {
   job: Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle };
   processRecord: JobProcessRecord;
   damageReports: (DamageReport & { photos?: Photo[] })[];
   photos: Photo[];
}

interface PODData {
   job: Job & { customer?: Customer; driver?: Driver; vehicle?: Vehicle };
   processRecord: JobProcessRecord;
   damageReports: (DamageReport & { photos?: Photo[] })[];
   photos: Photo[];
}

interface InvoiceData {
   invoice: Invoice;
   job: Job & { customer?: Customer; vehicle?: Vehicle };
   customer: Customer;
   expenses: (Expense & { driver?: Driver })[];
}

export class PDFService {
   // Generate regular invoice
   static async generateInvoice(invoiceData: InvoiceData): Promise<Buffer> {
      return new Promise((resolve, reject) => {
         try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks: Buffer[] = [];

            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const { invoice, job, customer, expenses } = invoiceData;
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
               .text("INVOICE", leftMargin, 30, {
                  align: "right",
                  width: contentEndX - leftMargin,
               });

            doc.fontSize(16)
               .font("Helvetica")
               .text(`#${invoice.invoiceNumber}`, leftMargin, 60, {
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
            doc.fontSize(10).text(`Date: ${formattedDate}`, leftMargin, 85, {
               align: "right",
               width: contentEndX - leftMargin,
            });

            // Payment terms
            const dueDate = new Date(currentDate);
            dueDate.setDate(currentDate.getDate() + 30);
            const formattedDueDate = dueDate.toLocaleDateString("en-GB", {
               day: "numeric",
               month: "short",
               year: "numeric",
            });

            doc.text("Payment Terms: 30 Days", leftMargin, 105, {
               align: "right",
               width: contentEndX - leftMargin,
            });
            doc.text(`Due Date: ${formattedDueDate}`, leftMargin, 120, {
               align: "right",
               width: contentEndX - leftMargin,
            });

            // Bill To
            let yPos = 154;
            doc.fontSize(11)
               .font("Helvetica-Bold")
               .text("Bill To:", leftMargin, yPos);

            yPos += 15;
            doc.fontSize(10)
               .font("Helvetica")
               .text(customer.name, leftMargin, yPos);

            // Movement details table
            yPos = 280;

            // Table headers - different for cancel/abort vs regular invoices
            const isCancelInvoice = invoice.invoiceNumber.endsWith("C");
            const isAbortInvoice = invoice.invoiceNumber.endsWith("A");

            doc.fontSize(11)
               .font("Helvetica-Bold")
               .text("Item", leftMargin, yPos);

            if (isCancelInvoice || isAbortInvoice) {
               // For cancel/abort - only Item and Amount columns, right-aligned to line edge
               doc.text("Amount", contentEndX - 60, yPos, {
                  align: "right",
                  width: 60,
               });
            } else {
               // For regular invoices - all columns
               doc.text("Miles", leftMargin + 280, yPos)
                  .text("Rate Per Mile", leftMargin + 350, yPos)
                  .text("Amount", leftMargin + 460, yPos);
            }

            yPos += 20;
            doc.moveTo(leftMargin, yPos).lineTo(contentEndX, yPos).stroke();
            yPos += 15;

            const registration = job.vehicle?.registration || job.jobNumber;

            if (isCancelInvoice || isAbortInvoice) {
               // Handle cancel/abort invoice - match perfect template layout exactly
               const movementType = isCancelInvoice
                  ? "Cancelled Movement"
                  : "Aborted Movement";
               const fee = isCancelInvoice ? job.cancellationFee : job.abortFee;
               const reason = isCancelInvoice
                  ? job.cancellationReason
                  : job.abortReason;

               // Main line item - clean layout with only Item and Amount, perfectly aligned to line edge
               doc.fontSize(10)
                  .font("Helvetica")
                  .text(`${movementType} (${registration})`, leftMargin, yPos)
                  .text(
                     `£${parseFloat(fee || "0").toFixed(2)}`,
                     contentEndX - 60,
                     yPos,
                     { align: "right", width: 60 },
                  );

               yPos += 15;

               // Add the reason underneath with slight indent
               if (reason) {
                  doc.fontSize(9)
                     .font("Helvetica")
                     .text(`  Reason: ${reason}`, leftMargin, yPos);
                  yPos += 20;
               } else {
                  yPos += 10;
               }

               // Add proper spacing and single line separator like perfect template
               yPos += 40;

               // Single line separator (like perfect template)
               doc.moveTo(leftMargin, yPos).lineTo(contentEndX, yPos).stroke();
               yPos += 20;

               // Balance Due section (perfectly aligned to the line edge like perfect template)
               const totalAmount = parseFloat(fee || "0");
               doc.fontSize(12)
                  .font("Helvetica-Bold")
                  .text("Balance Due:", contentEndX - 140, yPos)
                  .text(`£${totalAmount.toFixed(2)}`, contentEndX - 60, yPos, {
                     align: "right",
                     width: 60,
                  });
            } else {
               // Handle regular invoice
               const movementFee = parseFloat(invoice.movementFee || "0");
               const expensesTotal = parseFloat(invoice.expensesTotal || "0");

               // Movement line item - positioned like perfect template
               doc.fontSize(10)
                  .font("Helvetica")
                  .text(`Vehicle Movement (${registration})`, leftMargin, yPos)
                  .text(
                     job.calculatedMileage?.toString() || "0",
                     leftMargin + 280,
                     yPos,
                  )
                  .text(
                     `£${parseFloat(job.ratePerMile || "0").toFixed(2)}`,
                     leftMargin + 350,
                     yPos,
                  )
                  .text(`£${movementFee.toFixed(2)}`, leftMargin + 460, yPos);

               yPos += 20;

               // Expenses if any
               if (expensesTotal > 0) {
                  doc.text("Expenses", leftMargin, yPos)
                     .text("", leftMargin + 280, yPos)
                     .text("", leftMargin + 350, yPos)
                     .text(
                        `£${expensesTotal.toFixed(2)}`,
                        leftMargin + 460,
                        yPos,
                     );
                  yPos += 20;
               }

               // Add single line separator and Balance Due for regular invoices
               yPos += 40;

               // Single line separator (like perfect template)
               doc.moveTo(leftMargin, yPos).lineTo(contentEndX, yPos).stroke();
               yPos += 20;

               // Balance Due section (perfectly aligned like perfect template)
               const totalAmount = movementFee + expensesTotal;
               doc.fontSize(12)
                  .font("Helvetica-Bold")
                  .text("Balance Due:", contentEndX - 140, yPos)
                  .text(`£${totalAmount.toFixed(2)}`, contentEndX - 60, yPos, {
                     align: "right",
                     width: 60,
                  });
            }

            // Calculate total amount for final balance (outside the if/else blocks)
            const finalTotal = parseFloat(invoice.totalAmount || "0");

            // Payment details - positioned like perfect template
            yPos += 80;
            doc.fontSize(10)
               .font("Helvetica-Bold")
               .text("Payment Details:", leftMargin, yPos);

            yPos += 15;
            doc.font("Helvetica")
               .text("Name: OVM Ltd", leftMargin, yPos)
               .text("Sort Code: 82-19-74", leftMargin, yPos + 12)
               .text("Account Number: 70109500", leftMargin, yPos + 24);

            // Footer positioned much lower like perfect template
            yPos += 120;
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
               `Payment Reference: Please use ${invoice.invoiceNumber} as your payment reference`,
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
}
