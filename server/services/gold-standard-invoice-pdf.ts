import PDFDocument from "pdfkit";
import type { Invoice, Job, Customer, Expense } from "@shared/schema";
import path from "path";
import fs from "fs";

interface GoldStandardInvoiceData {
  invoice: Invoice;
  job: Job & {
    customer?: Customer;
    vehicle?: {
      registration?: string;
      make?: string;
      model?: string;
      colour?: string;
      year?: number;
      fuelType?: string;
    };
  };
  customer: Customer;
  expenses: Expense[];
}

export class GoldStandardInvoicePDFService {
  private static readonly COMPANY_INFO = {
    name: "OVM Ltd",
    address: "272 Bath Street, Glasgow, G2 4JR",
    phone: "0141 459 1302",
    email: "info@ovmtransport.com",
    website: "ovmtransport.com",
    companyNumber: "SC834621",
    bankDetails: {
      name: "OVM Ltd",
      sortCode: "82-19-74",
      accountNumber: "70109500",
    },
  };

  private static readonly COLORS = {
    primary: "#00ABE7", // OVM Cyan
    secondary: "#1e293b", // Dark slate
    accent: "#f8fafc", // Light background
    warning: "#f59e0b", // Amber
    success: "#10b981", // Green
    error: "#ef4444", // Red
    text: "#374151", // Gray 700
    border: "#d1d5db", // Gray 300
  };

  static async generateInvoice(data: GoldStandardInvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 30,
          bufferPages: true,
          autoFirstPage: false,
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Add invoice page
        doc.addPage();
        this.drawInvoicePage(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawInvoicePage(
    doc: PDFKit.PDFDocument,
    data: GoldStandardInvoiceData,
  ) {
    const { invoice, job, customer, expenses } = data;
    let yPos = 30;

    // Header with logo
    this.drawHeader(doc, invoice, yPos);
    yPos += 120;

    // Invoice details section
    yPos = this.drawInvoiceDetails(doc, invoice, job, customer, yPos);
    yPos += 30;

    // Service details table
    yPos = this.drawServiceDetails(doc, job, invoice, yPos);
    yPos += 20;

    // Expenses table (if any)
    if (expenses.length > 0) {
      yPos = this.drawExpensesTable(doc, expenses, yPos);
      yPos += 20;
    }

    // Totals section
    yPos = this.drawTotals(doc, invoice, job, yPos);
    yPos += 40;

    // Payment details
    yPos = this.drawPaymentDetails(doc, invoice, yPos);
    yPos += 30;

    // Expense proof page removed as requested

    // Footer on main page
    this.drawFooter(doc);
  }

  private static drawHeader(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    yPos: number,
  ) {
    const pageWidth = doc.page.width;
    const margin = 30;

    // Logo - proper proportions to avoid deformation
    const logoPath = path.join("attached_assets", "ovmlogo_1754133825652.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, yPos, {
        fit: [120, 60],
      });
    }

    // INVOICE title - black text as requested
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("black")
      .text("INVOICE", pageWidth - 220, yPos, { width: 190, align: "right" });

    // Company details - even wider area to prevent "4JR" overlapping
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(this.COMPANY_INFO.name, pageWidth - 220, yPos + 25, {
        width: 190,
        align: "right",
      })
      .text("272 Bath Street, Glasgow, G2 4JR", pageWidth - 220, yPos + 37, {
        width: 190,
        align: "right",
      })
      .text(`Tel: ${this.COMPANY_INFO.phone}`, pageWidth - 220, yPos + 49, {
        width: 190,
        align: "right",
      })
      .text(this.COMPANY_INFO.email, pageWidth - 220, yPos + 61, {
        width: 190,
        align: "right",
      })
      .text(
        `Company No: ${this.COMPANY_INFO.companyNumber}`,
        pageWidth - 220,
        yPos + 73,
        { width: 190, align: "right" },
      );

    // Invoice status badge
    if (invoice.isPaid) {
      doc.rect(pageWidth - 100, yPos + 90, 70, 20).fill(this.COLORS.success);
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("white")
        .text("PAID", pageWidth - 95, yPos + 95, {
          width: 60,
          align: "center",
        });
    }
  }

  private static drawInvoiceDetails(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    job: Job & { customer?: Customer; vehicle?: any },
    customer: Customer,
    yPos: number,
  ): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const totalWidth = pageWidth - 2 * margin;
    const colWidth = totalWidth / 2;
    const gapWidth = 15; // Enhanced gap between boxes for better visual appeal

    // Bill To section - exact width calculation for perfect flush alignment
    doc
      .rect(margin, yPos, colWidth - gapWidth / 2, 100)
      .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("BILL TO", margin + 10, yPos + 10);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(
        customer.billingCompanyName || customer.name,
        margin + 10,
        yPos + 30,
      );

    // Special handling for legacy invoices and all Henson Motor Group invoices
    if (
      job.jobNumber === "250725001" ||
      job.jobNumber === "250725002" ||
      customer.name === "Henson Motor Group"
    ) {
      // Use the correct address format for Henson Motor Group
      doc.text("Henson House, Ponteland Road", margin + 10, yPos + 45);
      doc.text("Newcastle", margin + 10, yPos + 60);
      doc.text("NE5 3DF", margin + 10, yPos + 75);
      // No email line for these invoices
    } else {
      // Standard billing address formatting for other invoices
      const billingAddr = customer.billingAddress || customer.address;
      if (billingAddr) {
        // Parse address line1 for multiline addresses (separated by \n)
        const addressLines = billingAddr.line1?.split("\n") || [];
        let currentYPos = yPos + 45;

        addressLines.forEach((line, index) => {
          if (line.trim()) {
            doc.text(line.trim(), margin + 10, currentYPos);
            currentYPos += 15;
          }
        });

        if (billingAddr.line2) {
          doc.text(billingAddr.line2, margin + 10, currentYPos);
          currentYPos += 15;
        }

        if (billingAddr.city) {
          doc.text(billingAddr.city, margin + 10, currentYPos);
          currentYPos += 15;
        }

        if (billingAddr.postcode) {
          doc.text(billingAddr.postcode, margin + 10, currentYPos);
        }
      } else {
        doc.text("No billing address on file", margin + 10, yPos + 45);
      }

      // Email address removed as requested
    }

    // Invoice Info section - perfectly aligned to be flush with Bill To section
    doc
      .rect(
        margin + colWidth + gapWidth / 2,
        yPos,
        colWidth - gapWidth / 2,
        100,
      )
      .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text(
        "INVOICE DETAILS",
        margin + colWidth + gapWidth / 2 + 10,
        yPos + 10,
      );

    // Special date formatting for legacy invoices starting with 150825
    let invoiceDate: string;
    if (job.job_number && job.job_number.startsWith("150825")) {
      invoiceDate = "15/08/25"; // Fixed date for all legacy Henson Motor Group invoices
    } else {
      invoiceDate = new Date(invoice.createdAt!).toLocaleDateString("en-GB");
    }

    const dueDate = new Date(invoice.createdAt!);
    dueDate.setDate(dueDate.getDate() + 14); // 14 days payment terms

    // Get vehicle registration for the new registration field
    const vehicle = (job as any).vehicle;
    const registration = vehicle?.registration || "N/A";

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(
        `Invoice Number: ${invoice.invoiceNumber}`,
        margin + colWidth + gapWidth / 2 + 10,
        yPos + 30,
      )
      .text(
        `Invoice Date: ${invoiceDate}`,
        margin + colWidth + gapWidth / 2 + 10,
        yPos + 45,
      )
      .text(
        `Due Date: ${dueDate.toLocaleDateString("en-GB")}`,
        margin + colWidth + gapWidth / 2 + 10,
        yPos + 60,
      )
      .text(
        `Registration: ${registration}`,
        margin + colWidth + gapWidth / 2 + 10,
        yPos + 75,
      );

    return yPos + 100;
  }

  private static drawServiceDetails(
    doc: PDFKit.PDFDocument,
    job: Job,
    invoice: Invoice,
    yPos: number,
  ): number {
    const margin = 30;
    const tableWidth = doc.page.width - 2 * margin;

    // Table header - changed to "JOB DETAILS"
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("JOB DETAILS", margin, yPos);

    yPos += 25;

    // Table headers
    const headers = ["Description", "Details", "Amount"];
    const colWidths = [tableWidth * 0.4, tableWidth * 0.4, tableWidth * 0.2];

    // Header background - perfectly flush
    doc
      .rect(margin, yPos, tableWidth, 25)
      .fillAndStroke(this.COLORS.primary, this.COLORS.primary);

    // Header text
    let xPos = margin;
    doc.fontSize(10).font("Helvetica-Bold").fillColor("white");

    headers.forEach((header, index) => {
      const alignment = index === 2 ? "right" : "left"; // Right align "Amount" header
      doc.text(header, xPos + 10, yPos + 8, {
        width: colWidths[index] - 20,
        align: alignment,
      });
      xPos += colWidths[index];
    });

    yPos += 25;

    // Service row - perfectly flush with header
    doc
      .rect(margin, yPos, tableWidth, 40)
      .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    xPos = margin;
    doc.fontSize(10).font("Helvetica").fillColor(this.COLORS.text);

    // Description - Always Vehicle Movement
    doc.text("Vehicle Movement", xPos + 10, yPos + 8);
    xPos += colWidths[0];

    // Details - proper postcode format and whole number distance
    const collectionPostcode = job.collectionAddress?.postcode || "Unknown";
    const deliveryPostcode = job.deliveryAddress?.postcode || "Unknown";

    // Handle calculatedMileage as either string or number - convert to whole number
    const mileage =
      typeof job.calculatedMileage === "string"
        ? Math.round(parseFloat(job.calculatedMileage))
        : Math.round(job.calculatedMileage || 0);

    // Special handling for legacy invoices with specific postcodes
    if (job.jobNumber === "250725001") {
      doc.text("ML1 5NB > NE12 6RZ", xPos + 10, yPos + 8, {
        width: colWidths[1] - 20,
      });
      doc.text(`Distance: ${mileage} miles`, xPos + 10, yPos + 20, {
        width: colWidths[1] - 20,
      });
    } else if (job.jobNumber === "250725002") {
      doc.text("KY3 0AB > NE12 6RZ", xPos + 10, yPos + 8, {
        width: colWidths[1] - 20,
      });
      doc.text(`Distance: ${mileage} miles`, xPos + 10, yPos + 20, {
        width: colWidths[1] - 20,
      });
    } else {
      // Format: {Collection Postcode} > {Delivery Postcode} with line break, then Distance
      doc.text(
        `${collectionPostcode} > ${deliveryPostcode}`,
        xPos + 10,
        yPos + 8,
        { width: colWidths[1] - 20 },
      );
      doc.text(`Distance: ${mileage} miles`, xPos + 10, yPos + 20, {
        width: colWidths[1] - 20,
      });
    }
    xPos += colWidths[1];

    // Amount - Perfectly aligned to the right, matching header alignment
    doc
      .font("Helvetica-Bold")
      .text(
        `£${parseFloat(invoice.movementFee).toFixed(2)}`,
        xPos + 10,
        yPos + 8,
        { width: colWidths[2] - 20, align: "right" },
      );

    return yPos + 40;
  }

  private static drawExpensesTable(
    doc: PDFKit.PDFDocument,
    expenses: Expense[],
    yPos: number,
  ): number {
    const margin = 30;
    const tableWidth = doc.page.width - 2 * margin;

    // Section header
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("ADDITIONAL EXPENSES", margin, yPos);

    yPos += 25;

    // Table headers - removed Type column
    const headers = ["Description", "Amount"];
    const colWidths = [tableWidth * 0.8, tableWidth * 0.2];

    // Header background - perfectly flush
    doc
      .rect(margin, yPos, tableWidth, 20)
      .fillAndStroke(this.COLORS.primary, this.COLORS.primary);

    // Header text
    let xPos = margin;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("white");

    headers.forEach((header, index) => {
      const alignment = index === 1 ? "right" : "left"; // Right align "Amount" header
      doc.text(header, xPos + 10, yPos + 6, {
        width: colWidths[index] - 20,
        align: alignment,
      });
      xPos += colWidths[index];
    });

    yPos += 20;

    // Expense rows - perfectly flush with proper borders
    expenses.forEach((expense, index) => {
      const rowHeight = 25;

      // Alternating row colors with consistent borders
      if (index % 2 === 0) {
        doc
          .rect(margin, yPos, tableWidth, rowHeight)
          .fillAndStroke(this.COLORS.accent, this.COLORS.border);
      } else {
        doc
          .rect(margin, yPos, tableWidth, rowHeight)
          .fillAndStroke("white", this.COLORS.border);
      }

      let xPos = margin;
      doc.fontSize(9).font("Helvetica").fillColor(this.COLORS.text);

      // Professional expense description display
      let descriptionDisplay = "";

      if (expense.type === "fuel" && expense.fuelType) {
        // Professional fuel type display
        switch (expense.fuelType) {
          case "petrol":
            descriptionDisplay = "Petrol";
            break;
          case "diesel":
            descriptionDisplay = "Diesel";
            break;
          case "electric_charge":
            descriptionDisplay = "Electric Charge";
            break;
          default:
            descriptionDisplay =
              expense.fuelType.charAt(0).toUpperCase() +
              expense.fuelType.slice(1);
        }
      } else {
        // Other expense types
        descriptionDisplay =
          expense.notes ||
          expense.type.charAt(0).toUpperCase() + expense.type.slice(1);
      }

      // Cap description at 60 characters for professional presentation
      if (descriptionDisplay.length > 60) {
        descriptionDisplay = descriptionDisplay.substring(0, 57) + "...";
      }

      // Description (now wider since no Type column)
      doc.text(descriptionDisplay, xPos + 10, yPos + 8, {
        width: colWidths[0] - 20,
      });
      xPos += colWidths[0];

      // Amount - Perfectly right aligned
      const amount = parseFloat(expense.amount).toFixed(2);
      doc
        .font("Helvetica-Bold")
        .fillColor(this.COLORS.text)
        .text(`£${amount}`, xPos + 10, yPos + 8, {
          width: colWidths[1] - 20,
          align: "right",
        });

      yPos += rowHeight;
    });

    return yPos;
  }

  private static drawTotals(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    job: Job & { customer?: Customer; vehicle?: any },
    yPos: number,
  ): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const totalsWidth = 250;
    const xStart = pageWidth - margin - totalsWidth;

    // Totals box
    doc
      .rect(xStart, yPos, totalsWidth, 90)
      .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    // Dynamic fee label based on job status
    let feeLabel = "Movement Fee:";
    if (job.status === "aborted") {
      feeLabel = "Aborted Fee:";
    } else if (job.status === "cancelled") {
      feeLabel = "Cancellation Fee:";
    }

    const lineItems = [
      [feeLabel, `£${parseFloat(invoice.movementFee).toFixed(2)}`],
      [
        "Additional Expenses:",
        `£${parseFloat(invoice.expensesTotal || "0").toFixed(2)}`,
      ],
      ["", ""],
      ["TOTAL DUE:", `£${parseFloat(invoice.totalAmount).toFixed(2)}`],
    ];

    let currentY = yPos + 10;
    lineItems.forEach((item, index) => {
      if (index === 3) {
        // Total line
        doc
          .rect(xStart, currentY - 5, totalsWidth, 25)
          .fill(this.COLORS.primary);

        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor("white")
          .text(item[0], xStart + 10, currentY)
          .text(item[1], xStart + 10, currentY, {
            width: totalsWidth - 20,
            align: "right",
          });
      } else if (item[0]) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(this.COLORS.text)
          .text(item[0], xStart + 10, currentY)
          .text(item[1], xStart + 10, currentY, {
            width: totalsWidth - 20,
            align: "right",
          });
      }
      currentY += 20;
    });

    return yPos + 90;
  }

  private static drawPaymentDetails(
    doc: PDFKit.PDFDocument,
    invoice: Invoice,
    yPos: number,
  ): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const boxWidth = pageWidth - 2 * margin;

    // Payment details box - updated height for new format
    doc
      .rect(margin, yPos, boxWidth, 90)
      .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.secondary)
      .text("PAYMENT DETAILS", margin + 10, yPos + 10);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(this.COLORS.text)
      .text(
        `Name: ${this.COMPANY_INFO.bankDetails.name}`,
        margin + 10,
        yPos + 30,
      )
      .text(
        `Sort Code: ${this.COMPANY_INFO.bankDetails.sortCode}`,
        margin + 10,
        yPos + 45,
      )
      .text(
        `Account Number: ${this.COMPANY_INFO.bankDetails.accountNumber}`,
        margin + 10,
        yPos + 60,
      )
      .text(
        `Payment Reference: ${invoice.invoiceNumber}`,
        margin + 10,
        yPos + 75,
      );

    return yPos + 90;
  }

  private static drawExpenseProofPage(
    doc: PDFKit.PDFDocument,
    expenses: Expense[],
  ) {
    // Add new page for expense proofs
    doc.addPage();

    const margin = 30;
    const pageWidth = doc.page.width;
    let yPos = margin;

    // Page header - clean design without company details
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor(this.COLORS.primary)
      .text("EXPENSE PROOF", margin, yPos, {
        width: pageWidth - 2 * margin,
        align: "center",
      });

    yPos += 60;

    const receiptsWithPhotos = expenses.filter(
      (e) => e.receiptPhotoPath && fs.existsSync(e.receiptPhotoPath),
    );

    if (receiptsWithPhotos.length === 0) {
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(this.COLORS.text)
        .text("No receipt photos found for expenses.", margin, yPos);
      return;
    }

    // Draw each receipt
    receiptsWithPhotos.forEach((expense, index) => {
      if (yPos > 650) {
        // If running out of space, add new page
        doc.addPage();
        yPos = margin;
      }

      // Expense description header
      let description = "";
      if (expense.type === "fuel" && expense.fuelType) {
        switch (expense.fuelType) {
          case "petrol":
            description = "Petrol";
            break;
          case "diesel":
            description = "Diesel";
            break;
          case "electric_charge":
            description = "Electric Charge";
            break;
          default:
            description =
              expense.fuelType.charAt(0).toUpperCase() +
              expense.fuelType.slice(1);
        }
      } else {
        description =
          expense.notes ||
          expense.type.charAt(0).toUpperCase() + expense.type.slice(1);
      }

      // Receipt header
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(this.COLORS.secondary)
        .text(
          `${description} - £${parseFloat(expense.amount).toFixed(2)}`,
          margin,
          yPos,
        );

      yPos += 25;

      try {
        // Embed receipt photo
        const maxImageWidth = pageWidth - 2 * margin;
        const maxImageHeight = 250;

        doc.image(expense.receiptPhotoPath!, margin, yPos, {
          fit: [maxImageWidth, maxImageHeight],
          align: "center",
        });

        yPos += maxImageHeight + 10;

        // Perfect labeling underneath
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(this.COLORS.text)
          .text(
            `Receipt for ${description} expense submitted on ${new Date(expense.submittedAt!).toLocaleDateString("en-GB")}`,
            margin,
            yPos,
            { width: pageWidth - 2 * margin, align: "center" },
          );

        yPos += 40;
      } catch (error) {
        console.error(`Error embedding receipt photo: ${error}`);
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(this.COLORS.text)
          .text(
            `Receipt photo could not be displayed for ${description}`,
            margin,
            yPos,
          );
        yPos += 30;
      }
    });
  }

  private static drawFooter(doc: PDFKit.PDFDocument) {
    const margin = 30;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Calculate footer position - fixed at absolute bottom of A4 page
    const footerHeight = 20;
    const footerY = pageHeight - margin - footerHeight;

    // Ensure footer is positioned at the very bottom of the page
    doc.fontSize(8).font("Helvetica").fillColor(this.COLORS.text);

    // Draw footer at absolute bottom of A4 page
    doc.text(
      `© 2025 ${this.COMPANY_INFO.name} | Company Number: ${this.COMPANY_INFO.companyNumber} | Email: ${this.COMPANY_INFO.email} | Phone: ${this.COMPANY_INFO.phone}`,
      margin,
      footerY,
      { width: pageWidth - 2 * margin, align: "center" },
    );
  }
}
