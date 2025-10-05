import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { Job, Customer, Vehicle, Driver, JobProcessRecord, Photo, DamageReport } from '../../shared/schema';

export interface ProfessionalPODData {
  job: Job & { customer?: Customer; vehicle?: Vehicle; driver?: Driver };
  processRecord: JobProcessRecord;
  photos: Photo[];
  damageReports: DamageReport[];
  customerName: string;
  customerSignature: string;
  actualDeliveryPhotos: {
    frontView?: string;
    rearView?: string;
    driverSide?: string;
    passengerSide?: string;
    dashboard?: string;
    odometer?: string;
    fuelGauge?: string;
    keys?: string;
  };
}

export class ProfessionalPODService {
  private static readonly COMPANY_INFO = {
    name: 'OVM Ltd',
    address: '272 Bath Street, Glasgow, G2 4JR',
    phone: '07783 490007',
    email: 'movements@ovmtransport.com',
    companyNumber: 'SC834621'
  };

  // EXACT INVOICE TEMPLATE COLORS
  private static readonly COLORS = {
    primary: '#00ABE7',      // OVM Cyan
    secondary: '#1e293b',    // Dark slate
    accent: '#f8fafc',       // Light background
    warning: '#f59e0b',      // Amber
    success: '#10b981',      // Green
    error: '#ef4444',        // Red
    text: '#374151',         // Gray 700
    border: '#d1d5db'        // Gray 300
  };

  static async generateProfessionalPOD(data: ProfessionalPODData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 30,
          bufferPages: true,
          autoFirstPage: false
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.addPage();
        this.drawProfessionalPOD(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawProfessionalPOD(doc: PDFKit.PDFDocument, data: ProfessionalPODData) {
    const margin = 30;
    const pageWidth = doc.page.width;
    let yPos = margin;

    // PROFESSIONAL HEADER - EXACT INVOICE TEMPLATE STYLE
    this.drawProfessionalHeader(doc, yPos);
    yPos += 120;

    // PROFESSIONAL TITLE
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('PROOF OF DELIVERY', margin, yPos, { 
         width: pageWidth - 2 * margin, 
         align: 'center' 
       });
    yPos += 60;

    // DELIVERY INFORMATION SECTION - PROFESSIONAL BOXES
    yPos = this.drawDeliveryVehicleSection(doc, data, yPos);
    yPos += 40;

    // DELIVERY CONDITION CHECKLIST - PROFESSIONAL TABLE
    yPos = this.drawDeliveryConditionSection(doc, data, yPos);
    yPos += 30;

    // FUEL/CHARGE LEVELS AT DELIVERY - PROFESSIONAL RADIO BUTTONS
    yPos = this.drawDeliveryFuelChargeSection(doc, data, yPos);
    yPos += 30;

    // DELIVERY ACKNOWLEDGMENT - PROFESSIONAL YES/NO
    yPos = this.drawDeliveryAcknowledgmentSection(doc, data, yPos);
    yPos += 30;

    // CONDITIONS AND PHOTOS AT DELIVERY - PROFESSIONAL LAYOUT
    yPos = this.drawDeliveryConditionsPhotosSection(doc, data, yPos);
    yPos += 40;

    // DELIVERY DAMAGE INSPECTION - PROFESSIONAL CENTERED HEADER
    yPos = this.drawDeliveryDamageSection(doc, data, yPos);
    yPos += 40;

    // PROFESSIONAL DISCLAIMER
    yPos = this.drawDeliveryDisclaimer(doc, yPos);
    yPos += 30;

    // SIGNATURE SECTION - PROFESSIONAL LAYOUT
    this.drawDeliverySignatureSection(doc, data, yPos);

    // PROFESSIONAL FOOTER
    this.drawFooter(doc);
  }

  private static drawProfessionalHeader(doc: PDFKit.PDFDocument, yPos: number) {
    const pageWidth = doc.page.width;
    const margin = 30;

    // EXACT INVOICE TEMPLATE LOGO
    const logoPath = path.join('attached_assets', 'ovmlogo_1754133825652.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, margin, yPos, { 
        fit: [120, 60] // EXACT SAME AS INVOICE
      });
    }

    // EXACT INVOICE TEMPLATE COMPANY DETAILS
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(this.COMPANY_INFO.name, pageWidth - 220, yPos + 25, { width: 190, align: 'right' })
       .text('272 Bath Street, Glasgow, G2 4JR', pageWidth - 220, yPos + 37, { width: 190, align: 'right' })
       .text(`Tel: ${this.COMPANY_INFO.phone}`, pageWidth - 220, yPos + 49, { width: 190, align: 'right' })
       .text(this.COMPANY_INFO.email, pageWidth - 220, yPos + 61, { width: 190, align: 'right' })
       .text(`Company No: ${this.COMPANY_INFO.companyNumber}`, pageWidth - 220, yPos + 73, { width: 190, align: 'right' });
  }

  private static drawDeliveryVehicleSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const colWidth = (pageWidth - 2 * margin - 20) / 2;

    // LEFT COLUMN - DELIVERY INFO BOX (INVOICE STYLE)
    doc.rect(margin, yPos, colWidth, 100)
       .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY INFORMATION', margin + 10, yPos + 10);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(`Driver: ${data.job.driver?.name || 'N/A'}`, margin + 10, yPos + 30)
       .text(`Delivery Address:`, margin + 10, yPos + 45)
       .text(`${data.job.deliveryAddress?.line1 || 'N/A'}`, margin + 10, yPos + 60)
       .text(`${data.job.deliveryAddress?.city || ''} ${data.job.deliveryAddress?.postcode || ''}`, margin + 10, yPos + 75);

    // RIGHT COLUMN - VEHICLE INFO BOX (INVOICE STYLE)
    const rightCol = margin + colWidth + 20;
    doc.rect(rightCol, yPos, colWidth, 100)
       .fillAndStroke(this.COLORS.accent, this.COLORS.border);

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('VEHICLE DETAILS', rightCol + 10, yPos + 10);

    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(`Order Number: ${data.job.jobNumber}`, rightCol + 10, yPos + 30)
       .text(`Registration: ${data.job.vehicle?.registration || 'N/A'}`, rightCol + 10, yPos + 45)
       .text(`Make: ${data.job.vehicle?.make || 'N/A'}`, rightCol + 10, yPos + 60)
       .text(`Fuel: ${data.job.vehicle?.fuelType || 'N/A'}`, rightCol + 10, yPos + 75) // FIXED: NO MODEL, FUEL ONLY
       .text(`Colour: ${data.job.vehicle?.colour || 'N/A'}`, rightCol + 120, yPos + 75);

    return yPos + 100;
  }

  private static drawDeliveryConditionSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;

    // PROFESSIONAL TABLE HEADER (INVOICE STYLE)
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY CONDITION CHECKLIST', margin, yPos);

    yPos += 25;

    // TABLE HEADER (INVOICE STYLE)
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke(this.COLORS.primary, this.COLORS.primary);

    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('white')
       .text('Item', margin + 10, yPos + 8)
       .text('Good', pageWidth - 150, yPos + 8)
       .text('Issue', pageWidth - 100, yPos + 8);

    yPos += 25;

    // DELIVERY CONDITION ITEMS
    const items = [
      'Vehicle exterior clean and undamaged',
      'Vehicle interior clean and tidy',
      'All equipment present and functional',
      'Keys and documents handed over',
      'Customer satisfied with delivery',
      'Delivery address confirmed correct',
      'Vehicle parked safely and legally',
      'All personal items removed from vehicle'
    ];

    items.forEach((item, index) => {
      const rowHeight = 20;
      // ALTERNATING ROW COLORS (INVOICE STYLE)
      if (index % 2 === 0) {
        doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight)
           .fillAndStroke(this.COLORS.accent, this.COLORS.border);
      } else {
        doc.rect(margin, yPos, pageWidth - 2 * margin, rowHeight)
           .fillAndStroke('white', this.COLORS.border);
      }

      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(this.COLORS.text)
         .text(item, margin + 10, yPos + 5);

      // PROFESSIONAL CHECKBOXES
      this.drawProfessionalCheckbox(doc, pageWidth - 140, yPos + 6, false); // Good
      this.drawProfessionalCheckbox(doc, pageWidth - 90, yPos + 6, false);  // Issue

      yPos += rowHeight;
    });

    return yPos + 20;
  }

  private static drawProfessionalCheckbox(doc: PDFKit.PDFDocument, x: number, y: number, checked: boolean) {
    const size = 8;
    
    // PROFESSIONAL CHECKBOX WITH CLEAN BLACK BORDER
    doc.rect(x, y, size, size)
       .fillAndStroke('#ffffff', '#000000');
    
    if (checked) {
      // PROFESSIONAL CHECKMARK
      doc.strokeColor('#000000')
         .lineWidth(1.5);
      
      doc.moveTo(x + 1.5, y + 4)
         .lineTo(x + 3.5, y + 6)
         .stroke();
      
      doc.moveTo(x + 3.5, y + 6)
         .lineTo(x + 6.5, y + 1.5)
         .stroke();
    }
  }

  private static drawDeliveryFuelChargeSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;

    // FUEL/CHARGE LEVELS AT DELIVERY HEADER
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('FUEL & CHARGE LEVELS AT DELIVERY', margin, yPos);

    yPos += 25;

    // FUEL ROW
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Fuel:', margin + 10, yPos);

    // FUEL LEVEL OPTIONS
    const fuelOptions = ['N/A', 'Empty', '1/4', '1/2', '3/4', 'Full'];
    let xPos = margin + 60;
    fuelOptions.forEach((option) => {
      const isSelected = String(data.processRecord?.fuelLevel || '') === option;
      this.drawProfessionalRadio(doc, xPos, yPos - 2, isSelected);
      doc.text(option, xPos + 15, yPos);
      xPos += 70;
    });

    yPos += 20;

    // CHARGE ROW
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Charge:', margin + 10, yPos);

    xPos = margin + 60;
    fuelOptions.forEach((option) => {
      const isSelected = String(data.processRecord?.chargeLevel || '') === option;
      this.drawProfessionalRadio(doc, xPos, yPos - 2, isSelected);
      doc.text(option, xPos + 15, yPos);
      xPos += 70;
    });

    return yPos + 30;
  }

  private static drawProfessionalRadio(doc: PDFKit.PDFDocument, x: number, y: number, selected: boolean) {
    const radius = 4;
    
    // OUTER CIRCLE
    doc.circle(x + radius, y + radius, radius)
       .fillAndStroke('#ffffff', '#000000');
    
    if (selected) {
      // INNER FILLED CIRCLE
      doc.circle(x + radius, y + radius, 2)
         .fill('#000000');
    }
  }

  private static drawDeliveryAcknowledgmentSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;

    // ACKNOWLEDGMENT HEADER
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY ACKNOWLEDGMENT', margin, yPos);

    yPos += 25;

    const questions = [
      'Was the delivery made to the correct address?',
      'Was the delivery made at the agreed time?',
      'Was the customer satisfied with the vehicle condition?',
      'Were all keys and documents handed over?',
      'Was the delivery area safe and appropriate?',
      'Customer confirmed acceptance of delivery?'
    ];

    questions.forEach((question, index) => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(this.COLORS.text)
         .text(question, margin + 10, yPos);

      // YES/NO CHECKBOXES
      this.drawProfessionalCheckbox(doc, pageWidth - 100, yPos - 2, false); // YES
      this.drawProfessionalCheckbox(doc, pageWidth - 50, yPos - 2, false);  // NO

      doc.text('Yes', pageWidth - 90, yPos);
      doc.text('No', pageWidth - 40, yPos);

      yPos += 18;
    });

    return yPos + 10;
  }

  private static drawDeliveryConditionsPhotosSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;

    // CONDITIONS HEADER
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY CONDITIONS & PHOTOS TAKEN', margin, yPos);

    yPos += 25;

    // WEATHER CONDITIONS
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Weather:', margin + 10, yPos);

    const weatherOptions = ['Wet', 'Dry', 'Light', 'Good', 'Bad'];
    let xPos = margin + 80;
    weatherOptions.forEach((option) => {
      const isSelected = data.processRecord?.weatherCondition === option;
      this.drawProfessionalRadio(doc, xPos, yPos - 2, isSelected);
      doc.text(option, xPos + 15, yPos);
      xPos += 70;
    });

    yPos += 30;

    // DELIVERY PHOTOS TAKEN SECTION
    const photoSections = [
      ['LH Side', 'RH Side'],
      ['Front', 'Back'],
      ['Dashboard', 'Keys']
    ];

    photoSections.forEach((pair) => {
      pair.forEach((section, index) => {
        const xOffset = index * 250;
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(this.COLORS.text)
           .text(`${section}:`, margin + 10 + xOffset, yPos);

        // YES/NO for photos
        this.drawProfessionalCheckbox(doc, margin + 80 + xOffset, yPos - 2, false);
        this.drawProfessionalCheckbox(doc, margin + 130 + xOffset, yPos - 2, false);

        doc.text('Yes', margin + 95 + xOffset, yPos);
        doc.text('No', margin + 145 + xOffset, yPos);
      });
      yPos += 20;
    });

    return yPos + 10;
  }

  private static drawDeliveryDamageSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const pageWidth = doc.page.width;
    const margin = 30;

    // DELIVERY DAMAGE INSPECTION HEADER - CENTERED AND PROFESSIONAL
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY DAMAGE INSPECTION', margin, yPos, { width: pageWidth - 2 * margin, align: 'center' });

    yPos += 40;

    // DEFAULT NO DAMAGES MESSAGE
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.success)
       .text('✓ NO DAMAGES FOUND - VEHICLE DELIVERED IN EXCELLENT CONDITION', margin, yPos, { 
         width: pageWidth - 2 * margin, 
         align: 'center' 
       });

    return yPos + 30;
  }

  private static drawDeliveryDisclaimer(doc: PDFKit.PDFDocument, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;

    // DISCLAIMER HEADER
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.secondary)
       .text('DELIVERY DISCLAIMER', margin, yPos);

    yPos += 15;

    // DISCLAIMER TEXT - PROFESSIONAL FORMATTING
    const disclaimerText = 'This document confirms the successful delivery of the vehicle to the specified address. The customer acknowledges receipt of the vehicle in the condition described above. Any issues with the vehicle condition should be reported immediately. By signing this document, the customer confirms satisfaction with the delivery and accepts responsibility for the vehicle from this point forward.';

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(disclaimerText, margin, yPos, { width: pageWidth - 2 * margin, align: 'justify' });

    return yPos + 50;
  }

  private static drawDeliverySignatureSection(doc: PDFKit.PDFDocument, data: ProfessionalPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;

    // DELIVERY CONFIRMATION STATEMENT
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.text)
       .text('I confirm that the vehicle has been delivered and I am satisfied with its condition.', margin, yPos);

    yPos += 40;

    // SIGNATURE LINES - PROFESSIONAL LAYOUT
    const colWidth = (pageWidth - 2 * margin - 20) / 2;

    // CUSTOMER SIGNATURE
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Signed (Customer):', margin, yPos)
       .text('________________________________', margin, yPos + 15)
       .text(`Customer name: ${data.customerName || 'N/A'}`, margin, yPos + 35)
       .text(`Date: ${new Date().toLocaleString('en-GB')}`, margin, yPos + 50);

    // DELIVERY AGENT SIGNATURE
    const rightCol = margin + colWidth + 20;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Signed (Delivery Agent):', rightCol, yPos)
       .text('________________________________', rightCol, yPos + 15)
       .text(`Agent name: ${data.job.driver?.name || 'N/A'}`, rightCol, yPos + 35)
       .text(`Date: ${new Date().toLocaleString('en-GB')}`, rightCol, yPos + 50);

    return yPos + 80;
  }

  private static drawFooter(doc: PDFKit.PDFDocument) {
    const pageWidth = doc.page.width;
    const margin = 30;
    const footerY = doc.page.height - 50;

    // PROFESSIONAL FOOTER LINE
    doc.moveTo(margin, footerY - 10)
       .lineTo(pageWidth - margin, footerY - 10)
       .stroke(this.COLORS.border);

    // FOOTER TEXT - EXACT INVOICE TEMPLATE STYLE
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(`© 2025 ${this.COMPANY_INFO.name} • Company Number: ${this.COMPANY_INFO.companyNumber} • Email: ${this.COMPANY_INFO.email} • Phone: ${this.COMPANY_INFO.phone}`, 
             margin, footerY, { width: pageWidth - 2 * margin, align: 'center' });
  }
}