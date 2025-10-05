import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { Job, Customer, Vehicle, Driver, JobProcessRecord, Photo, DamageReport } from '../../shared/schema';

export interface GoldStandardPODData {
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

export class GoldStandardPODService {
  private static readonly COMPANY_INFO = {
    name: 'OVM Ltd',
    address: '272 Bath Street, Glasgow, G2 4JR',
    phone: '07783 490007',
    email: 'movements@ovmtransport.com',
    companyNumber: 'SC834621'
  };

  private static readonly COLORS = {
    primary: '#000000',
    secondary: '#333333',
    border: '#000000',
    text: '#000000',
    lightGray: '#f5f5f5'
  };

  static async generateGoldStandardPOD(data: GoldStandardPODData): Promise<Buffer> {
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

  private static drawProfessionalPOD(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    let yPos = 30;

    // PROFESSIONAL HEADER with REAL LOGO
    yPos = this.drawProfessionalHeader(doc, yPos);
    
    // DOCUMENT TITLE
    yPos = this.drawTitle(doc, yPos);
    
    // JOB INFORMATION SECTION
    yPos = this.drawJobInformation(doc, data, yPos);
    
    // VEHICLE INFORMATION SECTION
    yPos = this.drawVehicleInformation(doc, data, yPos);
    
    // DELIVERY DETAILS
    yPos = this.drawDeliveryDetails(doc, data, yPos);
    
    // EQUIPMENT AND CONDITION CHECKLIST
    yPos = this.drawEquipmentChecklist(doc, data, yPos);
    
    // VEHICLE PHOTOS
    yPos = this.drawVehiclePhotos(doc, data, yPos);
    
    // DAMAGE INSPECTION
    yPos = this.drawDamageInspection(doc, data, yPos);
    
    // CUSTOMER SATISFACTION
    yPos = this.drawCustomerSatisfaction(doc, data, yPos);
    
    // CUSTOMER ACKNOWLEDGMENT
    yPos = this.drawCustomerAcknowledgment(doc, data, yPos);
    
    // SIGNATURES
    yPos = this.drawSignatures(doc, data, yPos);
    
    // FOOTER
    this.drawFooter(doc);
  }

  private static drawProfessionalHeader(doc: PDFKit.PDFDocument, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Professional border for header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 80)
       .fillAndStroke(this.COLORS.lightGray, this.COLORS.border);
    
    // Real OVM Logo
    const logoPath = './attached_assets/invoiceheaderlogo_1753992208625.png';
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, margin + 10, yPos + 10, { width: 150, height: 60 });
      } catch (error) {
        this.drawFallbackLogo(doc, margin + 10, yPos + 20);
      }
    } else {
      this.drawFallbackLogo(doc, margin + 10, yPos + 20);
    }
    
    // Company Information - Right aligned
    const companyX = pageWidth - margin - 200;
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.text)
       .text(this.COMPANY_INFO.name, companyX, yPos + 10)
       .fontSize(9)
       .font('Helvetica')
       .text(this.COMPANY_INFO.address, companyX, yPos + 25)
       .text(`Tel: ${this.COMPANY_INFO.phone}`, companyX, yPos + 38)
       .text(this.COMPANY_INFO.email, companyX, yPos + 51)
       .text(`Company No: ${this.COMPANY_INFO.companyNumber}`, companyX, yPos + 64);
    
    return yPos + 95;
  }

  private static drawFallbackLogo(doc: PDFKit.PDFDocument, x: number, y: number) {
    doc.fontSize(32)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('OVM', x, y);
    doc.fontSize(24)
       .text('Ltd', x + 80, y + 8);
  }

  private static drawTitle(doc: PDFKit.PDFDocument, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Title background
    doc.rect(margin, yPos, pageWidth - 2 * margin, 40)
       .fillAndStroke('#e8e8e8', this.COLORS.border);
    
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('PROOF OF DELIVERY', margin, yPos + 12, { 
         width: pageWidth - 2 * margin, 
         align: 'center' 
       });
    
    return yPos + 55;
  }

  private static drawJobInformation(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const sectionWidth = (pageWidth - 2 * margin - 20) / 2;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('JOB INFORMATION', margin + 10, yPos + 8);
    
    yPos += 35;
    
    // Left column - Job details
    doc.rect(margin, yPos, sectionWidth, 120)
       .stroke(this.COLORS.border);
    
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.text)
       .text('Job Number:', margin + 10, yPos + 10);
    doc.font('Helvetica')
       .text(data.job.jobNumber, margin + 80, yPos + 10);
    
    const deliveryDate = data.processRecord?.createdAt 
      ? new Date(data.processRecord.createdAt).toLocaleDateString('en-GB')
      : new Date().toLocaleDateString('en-GB');
    
    doc.font('Helvetica-Bold')
       .text('Delivery Date:', margin + 10, yPos + 25);
    doc.font('Helvetica')
       .text(deliveryDate, margin + 85, yPos + 25);
    
    doc.font('Helvetica-Bold')
       .text('Customer:', margin + 10, yPos + 40);
    doc.font('Helvetica')
       .text(data.job.customer?.name || 'N/A', margin + 60, yPos + 40);
    
    doc.font('Helvetica-Bold')
       .text('Delivery Address:', margin + 10, yPos + 55);
    
    if (data.job.deliveryAddress) {
      const addr = data.job.deliveryAddress;
      doc.font('Helvetica')
         .text(addr.line1, margin + 10, yPos + 70);
      if (addr.line2) {
        doc.text(addr.line2, margin + 10, yPos + 85);
        doc.text(`${addr.city} ${addr.postcode}`, margin + 10, yPos + 100);
      } else {
        doc.text(`${addr.city} ${addr.postcode}`, margin + 10, yPos + 85);
      }
    }
    
    // Right column - Driver & Contact
    const rightColX = margin + sectionWidth + 20;
    doc.rect(rightColX, yPos, sectionWidth, 120)
       .stroke(this.COLORS.border);
    
    doc.font('Helvetica-Bold')
       .text('Driver:', rightColX + 10, yPos + 10);
    doc.font('Helvetica')
       .text(data.job.driver?.name || 'N/A', rightColX + 50, yPos + 10);
    
    doc.font('Helvetica-Bold')
       .text('Contact Person:', rightColX + 10, yPos + 25);
    doc.font('Helvetica')
       .text(data.job.deliveryContact?.name || 'N/A', rightColX + 95, yPos + 25);
    
    doc.font('Helvetica-Bold')
       .text('Phone:', rightColX + 10, yPos + 40);
    doc.font('Helvetica')
       .text(data.job.deliveryContact?.phone || 'N/A', rightColX + 50, yPos + 40);
    
    doc.font('Helvetica-Bold')
       .text('Delivery Time:', rightColX + 10, yPos + 55);
    const deliveryTime = data.processRecord?.createdAt 
      ? new Date(data.processRecord.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    doc.font('Helvetica')
       .text(deliveryTime, rightColX + 80, yPos + 55);
    
    return yPos + 135;
  }

  private static drawVehicleInformation(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('VEHICLE INFORMATION', margin + 10, yPos + 8);
    
    yPos += 35;
    
    // Vehicle details in professional table format
    doc.rect(margin, yPos, pageWidth - 2 * margin, 80)
       .stroke(this.COLORS.border);
    
    const colWidth = (pageWidth - 2 * margin) / 3;
    
    // Column 1
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Registration:', margin + 10, yPos + 10);
    doc.font('Helvetica')
       .text(data.job.vehicle?.registration || 'N/A', margin + 10, yPos + 25);
    
    doc.font('Helvetica-Bold')
       .text('Make:', margin + 10, yPos + 45);
    doc.font('Helvetica')
       .text(data.job.vehicle?.make || 'N/A', margin + 10, yPos + 60);
    
    // Column 2
    const col2X = margin + colWidth;
    doc.font('Helvetica-Bold')
       .text('Model:', col2X, yPos + 10);
    doc.font('Helvetica')
       .text(data.job.vehicle?.model || 'N/A', col2X, yPos + 25);
    
    doc.font('Helvetica-Bold')
       .text('Year:', col2X, yPos + 45);
    doc.font('Helvetica')
       .text(data.job.vehicle?.year?.toString() || 'N/A', col2X, yPos + 60);
    
    // Column 3
    const col3X = margin + (2 * colWidth);
    doc.font('Helvetica-Bold')
       .text('Colour:', col3X, yPos + 10);
    doc.font('Helvetica')
       .text(data.job.vehicle?.colour || 'N/A', col3X, yPos + 25);
    
    doc.font('Helvetica-Bold')
       .text('Fuel Type:', col3X, yPos + 45);
    doc.font('Helvetica')
       .text(data.job.vehicle?.fuelType || 'N/A', col3X, yPos + 60);
    
    return yPos + 95;
  }

  private static drawDeliveryDetails(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('DELIVERY DETAILS', margin + 10, yPos + 8);
    
    yPos += 35;
    
    // Details in professional layout
    doc.rect(margin, yPos, pageWidth - 2 * margin, 60)
       .stroke(this.COLORS.border);
    
    const colWidth = (pageWidth - 2 * margin) / 4;
    
    // Mileage
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Mileage Reading:', margin + 10, yPos + 10);
    doc.font('Helvetica')
       .text(data.processRecord?.mileageReading || 'N/A', margin + 10, yPos + 25);
    
    // Fuel Level
    const col2X = margin + colWidth;
    doc.font('Helvetica-Bold')
       .text('Fuel Level:', col2X, yPos + 10);
    let fuelDisplay = 'N/A';
    if (data.processRecord?.fuelLevel !== null && data.processRecord?.fuelLevel !== undefined) {
      const levels = ['Empty', '1/4', '1/2', '3/4', 'Full'];
      fuelDisplay = levels[data.processRecord.fuelLevel] || 'N/A';
    }
    doc.font('Helvetica')
       .text(fuelDisplay, col2X, yPos + 25);
    
    // Keys
    const col3X = margin + (2 * colWidth);
    doc.font('Helvetica-Bold')
       .text('Number of Keys:', col3X, yPos + 10);
    doc.font('Helvetica')
       .text((data.processRecord?.numberOfKeys || '2').toString(), col3X, yPos + 25);
    
    // Weather
    const col4X = margin + (3 * colWidth);
    doc.font('Helvetica-Bold')
       .text('Weather Conditions:', col4X, yPos + 10);
    doc.font('Helvetica')
       .text(data.processRecord?.weatherCondition || 'Good', col4X, yPos + 25);
    
    return yPos + 75;
  }

  private static drawEquipmentChecklist(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('EQUIPMENT & CONDITION CHECKLIST', margin + 10, yPos + 8);
    
    yPos += 35;
    
    // Professional checklist in bordered sections
    const checklistHeight = 150;
    doc.rect(margin, yPos, pageWidth - 2 * margin, checklistHeight)
       .stroke(this.COLORS.border);
    
    const colWidth = (pageWidth - 2 * margin) / 2;
    
    // Left column items
    const leftItems = [
      { label: 'Spare Wheel Present', checked: data.processRecord?.spareWheelPresent !== false },
      { label: 'Jack Present', checked: data.processRecord?.jackPresent !== false },
      { label: 'Tools Present', checked: data.processRecord?.toolsPresent !== false },
      { label: 'Locking Wheel Nut', checked: data.processRecord?.lockingWheelNutPresent !== false },
      { label: 'V5 Document', checked: data.processRecord?.v5Present !== false },
      { label: 'Number Plates Match', checked: data.processRecord?.numberPlatesMatch !== false },
      { label: 'Charging Cables', checked: data.processRecord?.chargingCablesPresent !== false }
    ];
    
    // Right column items
    const rightItems = [
      { label: 'No Warning Lights', checked: data.processRecord?.warningLightsOn !== true },
      { label: 'SatNav Working', checked: data.processRecord?.satNavWorking !== false },
      { label: 'Handbook Present', checked: data.processRecord?.handbookServiceBookPresent !== false },
      { label: 'Vehicle Clean Internal', checked: data.processRecord?.vehicleCleanInternally !== false },
      { label: 'Vehicle Clean External', checked: data.processRecord?.vehicleCleanExternally !== false },
      { label: 'No Internal Damage', checked: data.processRecord?.vehicleFreeDamageInternally !== false },
      { label: 'No External Damage', checked: data.processRecord?.vehicleFreeDamageExternally !== false }
    ];
    
    doc.fontSize(10).font('Helvetica');
    
    // Draw left column
    leftItems.forEach((item, index) => {
      const itemY = yPos + 10 + (index * 18);
      this.drawProfessionalCheckbox(doc, margin + 10, itemY, item.checked);
      doc.text(item.label, margin + 25, itemY - 2);
    });
    
    // Draw right column
    rightItems.forEach((item, index) => {
      const itemY = yPos + 10 + (index * 18);
      const rightX = margin + colWidth + 10;
      this.drawProfessionalCheckbox(doc, rightX, itemY, item.checked);
      doc.text(item.label, rightX + 15, itemY - 2);
    });
    
    return yPos + checklistHeight + 15;
  }

  private static drawVehiclePhotos(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('VEHICLE PHOTOGRAPHS AT DELIVERY', margin + 10, yPos + 8);
    
    yPos += 35;
    
    const photoWidth = 120;
    const photoHeight = 90;
    const photoSpacing = 20;
    
    const photos = [
      { label: 'Front View', key: 'frontView' },
      { label: 'Rear View', key: 'rearView' },
      { label: 'Driver Side', key: 'driverSide' },
      { label: 'Passenger Side', key: 'passengerSide' }
    ];
    
    // 2x2 Professional photo grid
    photos.forEach((photo, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const xPos = margin + 20 + (col * (photoWidth + photoSpacing + 60));
      const photoY = yPos + (row * (photoHeight + 40));
      
      // Photo frame with professional border
      doc.rect(xPos, photoY, photoWidth, photoHeight)
         .fillAndStroke('#ffffff', this.COLORS.border);
      
      // Photo label
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text(photo.label, xPos, photoY - 15, { width: photoWidth, align: 'center' });
      
      // Try to embed real photo
      const photoPath = data.actualDeliveryPhotos[photo.key as keyof typeof data.actualDeliveryPhotos];
      
      if (photoPath && fs.existsSync(photoPath)) {
        try {
          doc.image(photoPath, xPos + 2, photoY + 2, { 
            width: photoWidth - 4, 
            height: photoHeight - 4,
            fit: [photoWidth - 4, photoHeight - 4]
          });
        } catch (error) {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#666')
             .text('Photo Available', xPos + 2, photoY + 42, { width: photoWidth - 4, align: 'center' });
        }
      } else {
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#999')
           .text('Photo Required', xPos + 2, photoY + 42, { width: photoWidth - 4, align: 'center' });
      }
    });
    
    return yPos + (2 * (photoHeight + 40)) + 20;
  }

  private static drawDamageInspection(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const deliveryDamages = data.damageReports?.filter(d => d.stage === 'delivery') || [];
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('DAMAGE INSPECTION AT DELIVERY', margin + 10, yPos + 8);
    
    yPos += 35;
    
    if (deliveryDamages.length === 0) {
      doc.rect(margin, yPos, pageWidth - 2 * margin, 30)
         .stroke(this.COLORS.border);
      
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#006600')
         .text('✓ NO NEW DAMAGES FOUND - VEHICLE DELIVERED IN EXCELLENT CONDITION', margin + 10, yPos + 10);
      
      return yPos + 45;
    }
    
    const damageHeight = Math.max(60, deliveryDamages.length * 20 + 20);
    doc.rect(margin, yPos, pageWidth - 2 * margin, damageHeight)
       .stroke(this.COLORS.border);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text);
    
    deliveryDamages.forEach((damage, index) => {
      const itemY = yPos + 10 + (index * 20);
      doc.text(`${index + 1}. ${damage.panel}: ${damage.damageType}`, margin + 10, itemY);
      if (damage.notes) {
        doc.fontSize(9)
           .fillColor('#666')
           .text(`Notes: ${damage.notes}`, margin + 20, itemY + 12);
      }
    });
    
    return yPos + damageHeight + 15;
  }

  private static drawCustomerSatisfaction(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('CUSTOMER SATISFACTION RATING', margin + 10, yPos + 8);
    
    yPos += 35;
    
    doc.rect(margin, yPos, pageWidth - 2 * margin, 50)
       .stroke(this.COLORS.border);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text('Overall satisfaction with delivery service:', margin + 10, yPos + 10);
    
    // Professional rating scale 1-5
    const rating = data.processRecord?.customerSatisfactionRating || 5;
    const startX = margin + 250;
    
    for (let i = 1; i <= 5; i++) {
      const circleX = startX + (i * 25);
      const circleY = yPos + 25;
      
      // Professional circles
      doc.circle(circleX, circleY, 10)
         .fillAndStroke(i <= rating ? '#006600' : '#ffffff', this.COLORS.border);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor(i <= rating ? 'white' : this.COLORS.text)
         .text(i.toString(), circleX - 3, circleY - 4);
    }
    
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Poor', startX + 5, yPos + 40)
       .text('Excellent', startX + 100, yPos + 40);
    
    return yPos + 65;
  }

  private static drawCustomerAcknowledgment(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    
    // Section header
    doc.rect(margin, yPos, pageWidth - 2 * margin, 25)
       .fillAndStroke('#f0f0f0', this.COLORS.border);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(this.COLORS.primary)
       .text('CUSTOMER ACKNOWLEDGMENT', margin + 10, yPos + 8);
    
    yPos += 35;
    
    doc.rect(margin, yPos, pageWidth - 2 * margin, 40)
       .stroke(this.COLORS.border);
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('I confirm that the vehicle has been delivered in satisfactory condition and that all items listed in the equipment checklist have been verified. I acknowledge receipt of the vehicle and any associated documentation.', 
             margin + 10, yPos + 10, { width: pageWidth - 2 * margin - 20, align: 'justify' });
    
    return yPos + 55;
  }

  private static drawSignatures(doc: PDFKit.PDFDocument, data: GoldStandardPODData, yPos: number): number {
    const margin = 30;
    const pageWidth = doc.page.width;
    const colWidth = (pageWidth - 2 * margin - 40) / 2;
    
    // Customer signature
    doc.rect(margin, yPos, colWidth, 80)
       .stroke(this.COLORS.border);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Customer Signature', margin + 10, yPos + 10);
    
    // Signature line
    doc.moveTo(margin + 10, yPos + 35)
       .lineTo(margin + colWidth - 10, yPos + 35)
       .stroke();
    
    if (data.customerSignature && data.customerSignature !== 'N/A') {
      doc.fontSize(9)
         .font('Helvetica-Oblique')
         .text('Signature on file', margin + 10, yPos + 40);
    }
    
    doc.fontSize(9)
       .font('Helvetica')
       .text(`Name: ${data.customerName}`, margin + 10, yPos + 55)
       .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin + 10, yPos + 68);
    
    // Driver signature
    const rightColX = margin + colWidth + 40;
    doc.rect(rightColX, yPos, colWidth, 80)
       .stroke(this.COLORS.border);
    
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Driver Signature', rightColX + 10, yPos + 10);
    
    // Signature line
    doc.moveTo(rightColX + 10, yPos + 35)
       .lineTo(rightColX + colWidth - 10, yPos + 35)
       .stroke();
    
    doc.fontSize(9)
       .font('Helvetica')
       .text('OVM Representative', rightColX + 10, yPos + 40)
       .text(`Name: ${data.job.driver?.name || 'Driver'}`, rightColX + 10, yPos + 55)
       .text(`Date: ${new Date().toLocaleDateString('en-GB')}`, rightColX + 10, yPos + 68);
    
    return yPos + 95;
  }

  private static drawFooter(doc: PDFKit.PDFDocument) {
    const margin = 30;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 40;
    
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#666')
       .text(`© 2025 ${this.COMPANY_INFO.name} • Company Number: ${this.COMPANY_INFO.companyNumber} • Email: ${this.COMPANY_INFO.email} • Phone: ${this.COMPANY_INFO.phone}`, 
             margin, footerY, { width: pageWidth - 2 * margin, align: 'center' });
  }

  private static drawProfessionalCheckbox(doc: PDFKit.PDFDocument, x: number, y: number, checked: boolean) {
    const size = 12;
    
    // Professional checkbox
    doc.rect(x, y, size, size)
       .fillAndStroke('#ffffff', this.COLORS.border);
    
    if (checked) {
      doc.strokeColor('#006600')
         .lineWidth(2);
      
      // Professional checkmark
      doc.moveTo(x + 2, y + 6)
         .lineTo(x + 5, y + 9)
         .lineTo(x + 10, y + 3)
         .stroke();
    }
  }
}