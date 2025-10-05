import PDFDocument from "pdfkit";
import { format } from "date-fns";

interface PLSummary {
  totalRevenue: number;
  passThroughExpenses: number;
  absorbedExpenses: number;
  totalWages: number;
  netProfit: number;
}

interface JobDetail {
  id: string;
  jobNumber: string;
  customerName: string;
  date: string;
  movementFee: number;
  fuelPassThrough: number;
  otherExpenses: number;
  driverWage: number;
  netProfit: number;
}

interface PLReportData {
  summary: PLSummary;
  jobs: JobDetail[];
  startDate: Date;
  endDate: Date;
}

export class PLReportPDFService {
  private static readonly COMPANY_INFO = {
    name: "OVM Ltd",
    address: "272 Bath Street, Glasgow, G2 4JR",
    phone: "0141 459 1302",
    email: "info@ovmtransport.com",
    website: "ovmtransport.com",
  };

  private static readonly COLORS = {
    primary: "#00ABE7",
    secondary: "#1e293b",
    text: "#374151",
    border: "#d1d5db",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
  };

  static async generateReport(data: PLReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        this.drawReport(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawReport(doc: PDFKit.PDFDocument, data: PLReportData) {
    let yPos = 40;

    // Header
    yPos = this.drawHeader(doc, data, yPos);
    yPos += 30;

    // Summary Cards
    yPos = this.drawSummary(doc, data.summary, yPos);
    yPos += 30;

    // Job Details Table
    this.drawJobsTable(doc, data.jobs, yPos);

    // Footer
    this.drawFooter(doc);
  }

  private static drawHeader(doc: PDFKit.PDFDocument, data: PLReportData, yPos: number): number {
    const pageWidth = doc.page.width;
    const margin = 40;

    // Company name
    doc
      .fontSize(24)
      .fillColor(this.COLORS.primary)
      .font("Helvetica-Bold")
      .text(this.COMPANY_INFO.name, margin, yPos);

    yPos += 30;

    // Report title
    doc
      .fontSize(18)
      .fillColor(this.COLORS.secondary)
      .text("Profit & Loss Statement", margin, yPos);

    // Date range on right
    const dateText = `${format(data.startDate, "dd MMM yyyy")} - ${format(data.endDate, "dd MMM yyyy")}`;
    doc
      .fontSize(12)
      .fillColor(this.COLORS.text)
      .text(dateText, pageWidth - margin - 200, yPos + 3, {
        width: 200,
        align: "right",
      });

    yPos += 30;

    // Generated date
    doc
      .fontSize(9)
      .fillColor(this.COLORS.text)
      .font("Helvetica")
      .text(`Generated: ${format(new Date(), "dd MMM yyyy HH:mm")}`, margin, yPos);

    return yPos + 10;
  }

  private static drawSummary(doc: PDFKit.PDFDocument, summary: PLSummary, yPos: number): number {
    const pageWidth = doc.page.width;
    const margin = 40;
    const cardWidth = (pageWidth - margin * 2 - 20) / 3;
    const cardHeight = 70;

    // Helper to draw a summary card
    const drawCard = (x: number, y: number, title: string, value: number, color: string) => {
      // Card background
      doc
        .rect(x, y, cardWidth, cardHeight)
        .fillAndStroke("#f8fafc", this.COLORS.border);

      // Title
      doc
        .fontSize(10)
        .fillColor(this.COLORS.text)
        .font("Helvetica")
        .text(title, x + 10, y + 10, { width: cardWidth - 20 });

      // Value
      const valueText = `£${value.toFixed(2)}`;
      doc
        .fontSize(18)
        .fillColor(color)
        .font("Helvetica-Bold")
        .text(valueText, x + 10, y + 30, { width: cardWidth - 20 });
    };

    // Row 1: Revenue, Pass-through, Absorbed
    drawCard(margin, yPos, "Total Revenue", summary.totalRevenue, this.COLORS.primary);
    drawCard(margin + cardWidth + 10, yPos, "Pass-through Fuel", summary.passThroughExpenses, "#06b6d4");
    drawCard(margin + (cardWidth + 10) * 2, yPos, "Absorbed Expenses", summary.absorbedExpenses, this.COLORS.warning);

    yPos += cardHeight + 10;

    // Row 2: Wages, Net Profit
    drawCard(margin, yPos, "Driver Wages (50%)", summary.totalWages, "#eab308");
    const profitColor = summary.netProfit >= 0 ? this.COLORS.success : this.COLORS.error;
    drawCard(margin + cardWidth + 10, yPos, "Net OVM Profit", summary.netProfit, profitColor);

    return yPos + cardHeight;
  }

  private static drawJobsTable(doc: PDFKit.PDFDocument, jobs: JobDetail[], startY: number) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;
    const bottomMargin = 60;
    let yPos = startY;

    // Table header
    doc
      .fontSize(14)
      .fillColor(this.COLORS.secondary)
      .font("Helvetica-Bold")
      .text("Job Breakdown", margin, yPos);

    yPos += 25;

    // Column definitions
    const columns = [
      { key: "jobNumber", label: "Job", width: 70 },
      { key: "customerName", label: "Customer", width: 100 },
      { key: "date", label: "Date", width: 70 },
      { key: "movementFee", label: "Revenue", width: 60, align: "right" as const },
      { key: "fuelPassThrough", label: "Fuel", width: 55, align: "right" as const },
      { key: "otherExpenses", label: "Expenses", width: 60, align: "right" as const },
      { key: "driverWage", label: "Wages", width: 60, align: "right" as const },
      { key: "netProfit", label: "Profit", width: 60, align: "right" as const },
    ];

    const tableWidth = pageWidth - margin * 2;

    // Draw header row
    let xPos = margin;
    doc.fontSize(9).fillColor(this.COLORS.text).font("Helvetica-Bold");

    columns.forEach((col) => {
      doc.text(col.label, xPos, yPos, {
        width: col.width,
        align: col.align || "left",
      });
      xPos += col.width;
    });

    yPos += 15;

    // Header underline
    doc
      .strokeColor(this.COLORS.border)
      .lineWidth(1)
      .moveTo(margin, yPos)
      .lineTo(pageWidth - margin, yPos)
      .stroke();

    yPos += 10;

    // Draw data rows
    doc.fontSize(8).font("Helvetica");

    jobs.forEach((job, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - bottomMargin) {
        doc.addPage();
        yPos = margin;

        // Redraw header on new page
        xPos = margin;
        doc.fontSize(9).fillColor(this.COLORS.text).font("Helvetica-Bold");
        columns.forEach((col) => {
          doc.text(col.label, xPos, yPos, {
            width: col.width,
            align: col.align || "left",
          });
          xPos += col.width;
        });
        yPos += 15;
        doc
          .strokeColor(this.COLORS.border)
          .lineWidth(1)
          .moveTo(margin, yPos)
          .lineTo(pageWidth - margin, yPos)
          .stroke();
        yPos += 10;
        doc.fontSize(8).font("Helvetica");
      }

      xPos = margin;

      // Job Number
      doc.fillColor(this.COLORS.text).text(job.jobNumber, xPos, yPos, {
        width: columns[0].width,
      });
      xPos += columns[0].width;

      // Customer Name (truncate if too long)
      const customerName = job.customerName.length > 20 
        ? job.customerName.substring(0, 17) + "..."
        : job.customerName;
      doc.text(customerName, xPos, yPos, {
        width: columns[1].width,
      });
      xPos += columns[1].width;

      // Date
      doc.text(format(new Date(job.date), "dd MMM yy"), xPos, yPos, {
        width: columns[2].width,
      });
      xPos += columns[2].width;

      // Movement Fee
      doc.text(`£${job.movementFee.toFixed(2)}`, xPos, yPos, {
        width: columns[3].width,
        align: "right",
      });
      xPos += columns[3].width;

      // Fuel Pass-through
      doc.fillColor("#94a3b8").text(`£${job.fuelPassThrough.toFixed(2)}`, xPos, yPos, {
        width: columns[4].width,
        align: "right",
      });
      xPos += columns[4].width;

      // Other Expenses
      doc.fillColor(this.COLORS.warning).text(`£${job.otherExpenses.toFixed(2)}`, xPos, yPos, {
        width: columns[5].width,
        align: "right",
      });
      xPos += columns[5].width;

      // Driver Wage
      doc.fillColor("#ca8a04").text(`£${job.driverWage.toFixed(2)}`, xPos, yPos, {
        width: columns[6].width,
        align: "right",
      });
      xPos += columns[6].width;

      // Net Profit
      const profitColor = job.netProfit >= 0 ? this.COLORS.success : this.COLORS.error;
      doc.fillColor(profitColor).text(`£${job.netProfit.toFixed(2)}`, xPos, yPos, {
        width: columns[7].width,
        align: "right",
      });

      yPos += 15;
    });

    // Totals row
    yPos += 5;
    doc
      .strokeColor(this.COLORS.border)
      .lineWidth(1)
      .moveTo(margin, yPos)
      .lineTo(pageWidth - margin, yPos)
      .stroke();
    yPos += 10;

    xPos = margin;
    doc.fontSize(9).fillColor(this.COLORS.text).font("Helvetica-Bold");

    // Calculate totals
    const totals = jobs.reduce(
      (acc, job) => ({
        movementFee: acc.movementFee + job.movementFee,
        fuelPassThrough: acc.fuelPassThrough + job.fuelPassThrough,
        otherExpenses: acc.otherExpenses + job.otherExpenses,
        driverWage: acc.driverWage + job.driverWage,
        netProfit: acc.netProfit + job.netProfit,
      }),
      {
        movementFee: 0,
        fuelPassThrough: 0,
        otherExpenses: 0,
        driverWage: 0,
        netProfit: 0,
      }
    );

    doc.text("TOTALS", xPos, yPos, { width: columns[0].width + columns[1].width + columns[2].width });
    xPos += columns[0].width + columns[1].width + columns[2].width;

    doc.text(`£${totals.movementFee.toFixed(2)}`, xPos, yPos, {
      width: columns[3].width,
      align: "right",
    });
    xPos += columns[3].width;

    doc.fillColor("#94a3b8").text(`£${totals.fuelPassThrough.toFixed(2)}`, xPos, yPos, {
      width: columns[4].width,
      align: "right",
    });
    xPos += columns[4].width;

    doc.fillColor(this.COLORS.warning).text(`£${totals.otherExpenses.toFixed(2)}`, xPos, yPos, {
      width: columns[5].width,
      align: "right",
    });
    xPos += columns[5].width;

    doc.fillColor("#ca8a04").text(`£${totals.driverWage.toFixed(2)}`, xPos, yPos, {
      width: columns[6].width,
      align: "right",
    });
    xPos += columns[6].width;

    const profitColor = totals.netProfit >= 0 ? this.COLORS.success : this.COLORS.error;
    doc.fillColor(profitColor).text(`£${totals.netProfit.toFixed(2)}`, xPos, yPos, {
      width: columns[7].width,
      align: "right",
    });
  }

  private static drawFooter(doc: PDFKit.PDFDocument) {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const margin = 40;
    const footerY = pageHeight - 30;

    doc
      .fontSize(8)
      .fillColor(this.COLORS.text)
      .font("Helvetica")
      .text(
        `${this.COMPANY_INFO.name} • ${this.COMPANY_INFO.address} • ${this.COMPANY_INFO.phone} • ${this.COMPANY_INFO.email}`,
        margin,
        footerY,
        {
          width: pageWidth - margin * 2,
          align: "center",
        }
      );
  }

  private static formatCurrency(amount: number): string {
    return `£${amount.toFixed(2)}`;
  }
}
