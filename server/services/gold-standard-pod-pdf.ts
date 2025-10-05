import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export interface GoldStandardPODData {
  jobNumber: string;
  completedAt: string;
  
  // Vehicle Information
  vehicleRegistration: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColour?: string;
  vehicleYear?: number;
  fuelType?: string;
  
  // Customer Information
  customerName: string;
  
  // Addresses
  collectionAddress: {
    line1: string;
    city: string;
    postcode: string;
  };
  deliveryAddress: {
    line1: string;
    city: string;
    postcode: string;
  };
  
  // Driver Information
  driverName: string;
  
  // Vehicle Condition at Delivery
  mileageReading: string;
  fuelLevel: string;
  numberOfKeys: number;
  
  // Environmental Conditions
  weather: string;
  cleanliness: string;
  lighting: string;
  
  // Damage Information
  damageMarkers: Array<{
    id: string;
    view: string;
    damageType: string;
    size: string;
    description?: string;
    photoUrls: string[];
  }>;
  
  // Customer Confirmation
  customerSignature?: string;
  deliveryConfirmed: boolean;
  additionalNotes?: string;
  
  // Photos
  photoCategories: {
    front?: string[];
    rear?: string[];
    left?: string[];
    right?: string[];
    keys?: string[];
    v5?: string[];
    serviceBook?: string[];
    interior?: string[];
    dashboard?: string[];
    odometer?: string[];
    fuel?: string[];
  };
}

export class GoldStandardPODPDFService {
  private static readonly COMPANY_INFO = {
    name: 'OVM Ltd',
    address: '272 Bath Street, Glasgow, G2 4JR',
    phone: '07783 490007',
    email: 'info@ovmtransport.com',
    website: 'www.ovmtransport.com',
    companyNumber: 'SC834621'
  };

  private static readonly COLORS = {
    primary: '#00ABE7',
    secondary: '#1e293b',
    text: '#374151',
    border: '#d1d5db',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  static async generatePOD(data: GoldStandardPODData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
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

        // Page 1: Header and Summary
        doc.addPage();
        this.drawPage1(doc, data);

        // Page 2: Vehicle Photos (2x2 grid)
        doc.addPage();
        this.drawPage2(doc, data);

        // Page 3: Documentation Photos
        doc.addPage();
        this.drawPage3(doc, data);

        // Page 4: Damage Assessment
        if (data.damageMarkers && data.damageMarkers.length > 0) {
          doc.addPage();
          this.drawPage4(doc, data);
        }

        // Final Page: Customer Confirmation
        doc.addPage();
        this.drawFinalPage(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawPage1(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    const pageWidth = doc.page.width;
    let yPos = 30;

    // Header with job number and title
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    const rightAlign = pageWidth - 150;
    doc.text(`Job: ${data.jobNumber}`, rightAlign, yPos);
    
    yPos += 15;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('PROOF OF DELIVERY', 50, yPos);
    
    yPos += 15;
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Reg: ${data.vehicleRegistration}`, rightAlign, yPos);
    
    yPos += 15;
    const completedDate = new Date(data.completedAt);
    doc.text(`Date: ${completedDate.toLocaleDateString('en-GB')} ${completedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, rightAlign, yPos);
    
    yPos += 30;
    doc.text('Page 1', rightAlign, yPos);

    // Draw line
    yPos += 30;
    doc.strokeColor(this.COLORS.border).lineWidth(1);
    doc.moveTo(50, yPos).lineTo(pageWidth - 50, yPos).stroke();

    yPos += 30;

    // Summary section header
    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
    doc.text('SUMMARY', 50, yPos);

    yPos += 30;

    // Two-column layout for summary
    const leftCol = 50;
    const rightCol = 300;

    // Left column
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    
    doc.text('Registration', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.vehicleRegistration, leftCol + 80, yPos);
    doc.font('Helvetica').text('Delivery Address', rightCol, yPos);
    doc.font('Helvetica-Bold').text(`${data.deliveryAddress.line1}, ${data.deliveryAddress.city}, ${data.deliveryAddress.postcode}`, rightCol + 80, yPos, { width: 200 });

    yPos += 20;
    doc.font('Helvetica').text('Make', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.vehicleMake, leftCol + 80, yPos);
    doc.font('Helvetica').text('GPS', rightCol, yPos);
    doc.font('Helvetica-Bold').text('—', rightCol + 80, yPos);

    yPos += 20;
    doc.font('Helvetica').text('Model', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.vehicleModel, leftCol + 80, yPos);
    doc.font('Helvetica').text('Date / Time', rightCol, yPos);
    doc.font('Helvetica-Bold').text(`${completedDate.toLocaleDateString('en-GB')} ${completedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`, rightCol + 80, yPos);

    yPos += 20;
    doc.font('Helvetica').text('VIN', leftCol, yPos);
    doc.font('Helvetica-Bold').text('—', leftCol + 80, yPos);
    doc.font('Helvetica').text('Weather', rightCol, yPos);
    doc.font('Helvetica-Bold').text(data.weather, rightCol + 80, yPos);

    yPos += 20;
    doc.font('Helvetica').text('Mileage', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.mileageReading, leftCol + 80, yPos);
    doc.font('Helvetica').text('Cleanliness', rightCol, yPos);
    doc.font('Helvetica-Bold').text(data.cleanliness, rightCol + 80, yPos);

    yPos += 20;
    doc.font('Helvetica').text('Fuel', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.fuelLevel, leftCol + 80, yPos);
    doc.font('Helvetica').text('Lighting', rightCol, yPos);
    doc.font('Helvetica-Bold').text(data.lighting, rightCol + 80, yPos);

    yPos += 20;
    doc.font('Helvetica').text('Keys', leftCol, yPos);
    doc.font('Helvetica-Bold').text(data.numberOfKeys.toString(), leftCol + 80, yPos);

    yPos += 50;

    // Vehicle Exterior section header
    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
    doc.text('VEHICLE EXTERIOR', 50, yPos);

    yPos += 40;

    // 2x2 photo grid placeholders
    this.draw2x2PhotoGrid(doc, yPos, data.photoCategories);

    // Footer
    yPos = doc.page.height - 80;
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Professional POD generated on ${completedDate.toLocaleDateString('en-GB')} by OVM Management System`, 50, yPos);
  }

  private static drawPage2(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    const pageWidth = doc.page.width;
    let yPos = 30;

    // Page header
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Job: ${data.jobNumber}`, pageWidth - 150, yPos);
    yPos += 15;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('VEHICLE DOCUMENTATION', 50, yPos);
    yPos += 30;
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text('Page 2', pageWidth - 150, yPos);

    yPos += 60;

    // 2x2 documentation grid
    this.drawDocumentationGrid(doc, yPos, data.photoCategories);

    // Footer
    yPos = doc.page.height - 80;
    const completedDate = new Date(data.completedAt);
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Professional POD generated on ${completedDate.toLocaleDateString('en-GB')} by OVM Management System`, 50, yPos);
  }

  private static drawPage3(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    const pageWidth = doc.page.width;
    let yPos = 30;

    // Page header
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Job: ${data.jobNumber}`, pageWidth - 150, yPos);
    yPos += 15;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('DELIVERY CONDITION', 50, yPos);
    yPos += 30;
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text('Page 3', pageWidth - 150, yPos);

    yPos += 60;

    // Condition comparison section
    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
    doc.text('COLLECTION vs DELIVERY COMPARISON', 50, yPos);

    yPos += 40;

    // Two-column comparison
    const leftCol = 50;
    const rightCol = 300;

    doc.fontSize(12).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('AT COLLECTION', leftCol, yPos);
    doc.text('AT DELIVERY', rightCol, yPos);

    yPos += 30;

    // Mileage comparison
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text('Mileage:', leftCol, yPos);
    doc.text('Mileage:', rightCol, yPos);
    
    yPos += 15;
    doc.font('Helvetica-Bold');
    doc.text('—', leftCol + 50, yPos);
    doc.text(data.mileageReading, rightCol + 50, yPos);

    yPos += 25;
    doc.font('Helvetica').text('Fuel Level:', leftCol, yPos);
    doc.text('Fuel Level:', rightCol, yPos);
    
    yPos += 15;
    doc.font('Helvetica-Bold');
    doc.text('—', leftCol + 50, yPos);
    doc.text(data.fuelLevel, rightCol + 50, yPos);

    yPos += 25;
    doc.font('Helvetica').text('Keys:', leftCol, yPos);
    doc.text('Keys:', rightCol, yPos);
    
    yPos += 15;
    doc.font('Helvetica-Bold');
    doc.text('—', leftCol + 50, yPos);
    doc.text(data.numberOfKeys.toString(), rightCol + 50, yPos);

    yPos += 50;

    // Environmental conditions
    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
    doc.text('ENVIRONMENTAL CONDITIONS', 50, yPos);

    yPos += 30;
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Weather: ${data.weather}`, leftCol, yPos);
    doc.text(`Vehicle Cleanliness: ${data.cleanliness}`, rightCol, yPos);

    yPos += 20;
    doc.text(`Lighting Conditions: ${data.lighting}`, leftCol, yPos);

    // Footer
    yPos = doc.page.height - 80;
    const completedDate = new Date(data.completedAt);
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Professional POD generated on ${completedDate.toLocaleDateString('en-GB')} by OVM Management System`, 50, yPos);
  }

  private static drawPage4(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    const pageWidth = doc.page.width;
    let yPos = 30;

    // Page header
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Job: ${data.jobNumber}`, pageWidth - 150, yPos);
    yPos += 15;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('DAMAGE ASSESSMENT', 50, yPos);
    yPos += 15;
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`${data.damageMarkers.length} damage${data.damageMarkers.length !== 1 ? 's' : ''} reported`, 50, yPos);
    yPos += 15;
    doc.text('Page 4', pageWidth - 150, yPos);

    yPos += 50;

    // Draw damage markers
    data.damageMarkers.forEach((marker, index) => {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(this.COLORS.text);
      doc.text(`${index + 1}. ${marker.damageType} • ${marker.size} • ${marker.view}`, 50, yPos);

      yPos += 25;
      doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
      doc.text(`Type: ${marker.damageType}`, 70, yPos);
      yPos += 15;
      doc.text(`Size: ${marker.size}`, 70, yPos);
      yPos += 15;
      doc.text(`View: ${marker.view}`, 70, yPos);
      yPos += 15;
      doc.text('Notes: Damage documented with photographic evidence', 70, yPos);

      yPos += 40;

      // Add page break if needed
      if (yPos > doc.page.height - 150 && index < data.damageMarkers.length - 1) {
        doc.addPage();
        yPos = 50;
      }
    });
  }

  private static drawFinalPage(doc: PDFKit.PDFDocument, data: GoldStandardPODData) {
    const pageWidth = doc.page.width;
    let yPos = 30;

    // Page header
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Job: ${data.jobNumber}`, pageWidth - 150, yPos);
    yPos += 15;
    doc.fontSize(16).font('Helvetica-Bold').fillColor(this.COLORS.primary);
    doc.text('CUSTOMER CONFIRMATION', 50, yPos);
    yPos += 30;
    doc.fontSize(12).font('Helvetica').fillColor(this.COLORS.text);
    doc.text('Final Page', pageWidth - 150, yPos);

    yPos += 60;

    // Delivery confirmation
    const confirmationColor = data.deliveryConfirmed ? this.COLORS.success : this.COLORS.error;
    const confirmationText = data.deliveryConfirmed ? '✓ DELIVERY CONFIRMED' : '✗ DELIVERY NOT CONFIRMED';
    
    doc.fontSize(18).font('Helvetica-Bold').fillColor(confirmationColor);
    doc.text(confirmationText, 50, yPos, { width: pageWidth - 100, align: 'center' });

    yPos += 50;

    // Customer details
    doc.fontSize(14).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
    doc.text('CUSTOMER CONFIRMATION', 50, yPos);

    yPos += 30;
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text('I confirm that I have received the vehicle described in this POD and acknowledge:', 50, yPos, { width: pageWidth - 100 });

    yPos += 30;
    const confirmationPoints = [
      'The vehicle has been delivered to the correct address',
      'I have received the correct number of keys as specified',
      'I have been made aware of any damage noted in this report',
      'I accept the vehicle in its current condition'
    ];

    confirmationPoints.forEach(point => {
      doc.text(`• ${point}`, 70, yPos);
      yPos += 20;
    });

    yPos += 30;

    // Customer name
    doc.fontSize(12).font('Helvetica-Bold').fillColor(this.COLORS.text);
    doc.text('Customer Name:', 50, yPos);
    doc.font('Helvetica').text(data.customerName, 150, yPos);

    yPos += 40;

    // Signature section
    doc.font('Helvetica-Bold').text('Customer Signature:', 50, yPos);
    
    // Signature box
    doc.strokeColor(this.COLORS.border).lineWidth(1);
    doc.rect(50, yPos + 20, 300, 60).stroke();

    yPos += 100;

    // Additional notes
    if (data.additionalNotes) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(this.COLORS.secondary);
      doc.text('ADDITIONAL NOTES', 50, yPos);
      yPos += 20;
      doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
      doc.text(data.additionalNotes, 50, yPos, { width: pageWidth - 100 });
    }

    // Footer
    yPos = doc.page.height - 80;
    const completedDate = new Date(data.completedAt);
    doc.fontSize(10).font('Helvetica').fillColor(this.COLORS.text);
    doc.text(`Professional POD completed on ${completedDate.toLocaleDateString('en-GB')} by ${data.driverName}`, 50, yPos);
    doc.text('This document confirms successful vehicle delivery by OVM Management System', 50, yPos + 15);
  }

  private static draw2x2PhotoGrid(doc: PDFKit.PDFDocument, yPos: number, photos: any) {
    const gridSize = 120;
    const spacing = 20;
    const startX = 100;

    // Row 1
    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.COLORS.text);
    doc.text('FRONT VIEW', startX, yPos, { width: gridSize, align: 'center' });
    doc.text('PASSENGER SIDE', startX + gridSize + spacing, yPos, { width: gridSize, align: 'center' });

    // Photo placeholders row 1
    doc.strokeColor(this.COLORS.border).lineWidth(1);
    doc.rect(startX, yPos + 20, gridSize, gridSize).stroke();
    doc.rect(startX + gridSize + spacing, yPos + 20, gridSize, gridSize).stroke();

    // Row 2
    const row2Y = yPos + gridSize + 60;
    doc.text('REAR VIEW', startX, row2Y, { width: gridSize, align: 'center' });
    doc.text('DRIVER SIDE', startX + gridSize + spacing, row2Y, { width: gridSize, align: 'center' });

    // Photo placeholders row 2
    doc.rect(startX, row2Y + 20, gridSize, gridSize).stroke();
    doc.rect(startX + gridSize + spacing, row2Y + 20, gridSize, gridSize).stroke();
  }

  private static drawDocumentationGrid(doc: PDFKit.PDFDocument, yPos: number, photos: any) {
    const gridSize = 120;
    const spacing = 20;
    const startX = 100;

    // Row 1
    doc.fontSize(10).font('Helvetica-Bold').fillColor(this.COLORS.text);
    doc.text('V5 LOGBOOK', startX, yPos, { width: gridSize, align: 'center' });
    doc.text('KEYS', startX + gridSize + spacing, yPos, { width: gridSize, align: 'center' });

    // Photo placeholders row 1
    doc.strokeColor(this.COLORS.border).lineWidth(1);
    doc.rect(startX, yPos + 20, gridSize, gridSize).stroke();
    doc.rect(startX + gridSize + spacing, yPos + 20, gridSize, gridSize).stroke();

    // Row 2
    const row2Y = yPos + gridSize + 60;
    doc.text('SERVICE HISTORY', startX, row2Y, { width: gridSize, align: 'center' });
    doc.text('LOCKING WHEEL NUT', startX + gridSize + spacing, row2Y, { width: gridSize, align: 'center' });

    // Photo placeholders row 2
    doc.rect(startX, row2Y + 20, gridSize, gridSize).stroke();
    doc.rect(startX + gridSize + spacing, row2Y + 20, gridSize, gridSize).stroke();
  }
}