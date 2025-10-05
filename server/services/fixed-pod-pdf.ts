import PDFDocument from 'pdfkit';

interface CapturedPhoto {
  id: string;
  imageData: string;
  file: File;
  timestamp: number;
  category: string;
}

interface DocumentCheck {
  photos: CapturedPhoto[];
  status: 'provided' | 'not-provided';
  reason?: string;
}

interface DocumentPhotos {
  v5Document: DocumentCheck;
  motDocument: DocumentCheck;
  serviceBook: DocumentCheck;
  insuranceDocument: DocumentCheck;
}

interface WheelTyreCheck {
  wheelNumber: number;
  wheelPosition: string;
  wheelScuffed: boolean;
  wheelPhotos: CapturedPhoto[];
  tyreCondition: 'ok' | 'worn' | 'extremely-worn';
  tyrePhotos: CapturedPhoto[];
}

interface DamageMarker {
  id: string;
  x: number;
  y: number;
  view: 'front' | 'driver' | 'rear' | 'passenger' | 'roof';
  damageType: 'scratch' | 'dent' | 'chip' | 'crack' | 'broken' | 'bad-repair' | 'paintwork';
  size: 'small' | 'medium' | 'large';
  description: string;
  photos: CapturedPhoto[];
  timestamp: number;
  isNewDamage?: boolean;
}

interface VehicleCondition {
  fuelLevel: number;
  fuelPhotos: CapturedPhoto[];
  mileageReading: string;
  odometerPhotos: CapturedPhoto[];
}

interface CollectionData {
  documentPhotos: DocumentPhotos;
  numberOfKeys: number;
  wheelTyreChecks: WheelTyreCheck[];
  damageMarkers: DamageMarker[];
  vehicleCondition: VehicleCondition;
  customerName: string;
  customerSignature: string;
  additionalNotes: string;
}

interface DeliveryData {
  newDamageMarkers: DamageMarker[];
  vehicleCondition: VehicleCondition;
  customerName: string;
  customerSignature: string;
  additionalNotes: string;
  deliveryConfirmed: boolean;
}

export interface FixedPODData {
  jobNumber: string;
  customerName: string;
  vehicleDetails: string;
  collectionAddress: string;
  deliveryAddress: string;
  collectionData: CollectionData;
  deliveryData: DeliveryData;
  completedAt: string;
}

export class FixedPODPDFService {
  private static readonly COMPANY_INFO = {
    name: 'OVM Ltd',
    address: '272 Bath Street, Glasgow, G2 4JR',
    phone: '07783 490007',
    email: 'movements@ovmtransport.com',
    website: 'www.ovmtransport.com',
    companyNumber: 'SC834621'
  };

  private static readonly COLORS = {
    primary: '#00ABE7',
    secondary: '#000000',  // Black for titles
    accent: '#f8fafc',
    text: '#000000',      // Black for text
    border: '#000000',    // Black for lines
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  static async generatePOD(data: FixedPODData): Promise<Buffer> {
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

        // Page 1: Header, Job Details, Delivery Summary
        doc.addPage();
        this.drawPage1(doc, data);

        // Page 2: Collection vs Delivery Comparison
        doc.addPage();
        this.drawPage2(doc, data);

        // Page 3: Damage Assessment & Changes
        doc.addPage();
        this.drawPage3(doc, data);

        // Page 4: Final Confirmation & Customer Sign-off
        doc.addPage();
        this.drawPage4(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static drawPage1(doc: PDFKit.PDFDocument, data: FixedPODData) {
    const pageWidth = 595.28;
    
    // Header with company branding
    doc.fillColor(this.COLORS.primary)
       .rect(0, 0, pageWidth, 80)
       .fill();

    doc.fillColor('white')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('PROOF OF DELIVERY', 50, 20)
       .fontSize(14)
       .font('Helvetica')
       .text(`Job #${data.jobNumber}`, pageWidth - 150, 45);

    // Company information
    doc.fillColor(this.COLORS.text)
       .fontSize(10)
       .font('Helvetica')
       .text(this.COMPANY_INFO.name, 50, 100)
       .text(this.COMPANY_INFO.address, 50, 115)
       .text(`Phone: ${this.COMPANY_INFO.phone}`, 50, 130)
       .text(`Email: ${this.COMPANY_INFO.email}`, 50, 145)
       .text(`Company: ${this.COMPANY_INFO.companyNumber}`, 50, 160);

    // Date and time
    const completedDate = new Date(data.completedAt);
    doc.text(`Date: ${completedDate.toLocaleDateString('en-GB')}`, pageWidth - 180, 100)
       .text(`Time: ${completedDate.toLocaleTimeString('en-GB')}`, pageWidth - 180, 115);

    // Job Details Section
    let yPos = 200;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('DELIVERY DETAILS', 50, yPos);

    yPos += 30;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Customer Name:', 50, yPos)
       .font('Helvetica-Bold')
       .text(data.customerName, 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .text('Vehicle Details:', 50, yPos)
       .font('Helvetica-Bold')
       .text(data.vehicleDetails, 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .text('Collection Address:', 50, yPos)
       .font('Helvetica-Bold')
       .text(data.collectionAddress, 150, yPos, { width: 350, height: 40 });

    yPos += 40;
    doc.font('Helvetica')
       .text('Delivery Address:', 50, yPos)
       .font('Helvetica-Bold')
       .text(data.deliveryAddress, 150, yPos, { width: 350, height: 40 });

    // Delivery Summary
    yPos += 70;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('DELIVERY SUMMARY', 50, yPos);

    yPos += 30;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Number of Keys:', 50, yPos)
       .font('Helvetica-Bold')
       .text(`${data.collectionData.numberOfKeys === 4 ? '4+' : data.collectionData.numberOfKeys} key${data.collectionData.numberOfKeys > 1 ? 's' : ''} delivered`, 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .text('Delivery Status:', 50, yPos)
       .fillColor(data.deliveryData.deliveryConfirmed ? this.COLORS.success : this.COLORS.error)
       .font('Helvetica-Bold')
       .text(data.deliveryData.deliveryConfirmed ? '✓ CONFIRMED BY CUSTOMER' : '✗ NOT CONFIRMED', 150, yPos);

    // Vehicle Condition Changes
    yPos += 40;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('VEHICLE CONDITION CHANGES', 50, yPos);

    yPos += 30;
    const fuelLevels = ['Empty (0/8)', '1/8 Tank', '2/8 Tank (1/4)', '3/8 Tank', '4/8 Tank (1/2)', '5/8 Tank', '6/8 Tank (3/4)', '7/8 Tank', 'Full Tank (8/8)'];
    
    // Mileage comparison
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Mileage Change:', 50, yPos);
    
    const collectionMileage = parseInt(data.collectionData.vehicleCondition.mileageReading) || 0;
    const deliveryMileage = parseInt(data.deliveryData.vehicleCondition.mileageReading) || 0;
    const mileageDiff = deliveryMileage - collectionMileage;
    
    doc.font('Helvetica-Bold')
       .text(`${data.collectionData.vehicleCondition.mileageReading} → ${data.deliveryData.vehicleCondition.mileageReading} miles (+${mileageDiff})`, 150, yPos);

    yPos += 20;
    // Fuel comparison
    doc.font('Helvetica')
       .text('Fuel Change:', 50, yPos)
       .font('Helvetica-Bold')
       .text(`${fuelLevels[data.collectionData.vehicleCondition.fuelLevel]} → ${fuelLevels[data.deliveryData.vehicleCondition.fuelLevel]}`, 150, yPos);

    // Damage Summary
    yPos += 40;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('DAMAGE ASSESSMENT SUMMARY', 50, yPos);

    yPos += 30;
    const collectionDamageCount = data.collectionData.damageMarkers.length;
    const newDamageCount = data.deliveryData.newDamageMarkers.length;
    const totalDamageCount = collectionDamageCount + newDamageCount;

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Collection Damage:', 50, yPos)
       .font('Helvetica-Bold')
       .fillColor(collectionDamageCount > 0 ? this.COLORS.warning : this.COLORS.success)
       .text(`${collectionDamageCount} item${collectionDamageCount !== 1 ? 's' : ''} recorded`, 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('New Delivery Damage:', 50, yPos)
       .font('Helvetica-Bold')
       .fillColor(newDamageCount > 0 ? this.COLORS.error : this.COLORS.success)
       .text(newDamageCount > 0 ? `${newDamageCount} NEW item${newDamageCount !== 1 ? 's' : ''} discovered` : '✓ NO NEW DAMAGE', 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Total Damage at Delivery:', 50, yPos)
       .font('Helvetica-Bold')
       .fillColor(totalDamageCount > 0 ? this.COLORS.warning : this.COLORS.success)
       .text(`${totalDamageCount} item${totalDamageCount !== 1 ? 's' : ''} total`, 150, yPos);

    // Customer Confirmation Section
    yPos += 60;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('CUSTOMER CONFIRMATION', 50, yPos);

    yPos += 30;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Receiving Customer:', 50, yPos)
       .font('Helvetica-Bold')
       .text(data.deliveryData.customerName, 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .text('Customer Signature:', 50, yPos);

    // Signature box
    doc.strokeColor(this.COLORS.border)
       .rect(50, yPos + 15, 200, 40)
       .stroke();

    if (data.deliveryData.customerSignature) {
      doc.fillColor(this.COLORS.success)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('✓ SIGNED & CONFIRMED', 100, yPos + 28);
    }

    // Footer
    yPos = 750;
    doc.strokeColor(this.COLORS.border)
       .moveTo(50, yPos)
       .lineTo(pageWidth - 50, yPos)
       .stroke();

    yPos += 20;
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(`Professional POD generated on ${completedDate.toLocaleDateString('en-GB')} at ${completedDate.toLocaleTimeString('en-GB')}`, 50, yPos)
       .text('This document confirms successful vehicle delivery by OVM Management System', 50, yPos + 15);
  }

  private static drawPage2(doc: PDFKit.PDFDocument, data: FixedPODData) {
    const pageWidth = 595.28;
    
    // Page header
    doc.fillColor(this.COLORS.secondary)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('COLLECTION vs DELIVERY COMPARISON', 50, 50);

    let yPos = 100;

    // Document Status Comparison
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('DOCUMENT STATUS', 50, yPos);

    yPos += 30;
    this.drawDocumentCheckStatus(doc, 50, yPos, 'V5 Registration Document', data.collectionData.documentPhotos.v5Document, true);
    yPos += 25;
    this.drawDocumentCheckStatus(doc, 50, yPos, 'MOT Certificate', data.collectionData.documentPhotos.motDocument, false);
    yPos += 25;
    this.drawDocumentCheckStatus(doc, 50, yPos, 'Service Book', data.collectionData.documentPhotos.serviceBook, false);
    yPos += 25;
    this.drawDocumentCheckStatus(doc, 50, yPos, 'Insurance Certificate', data.collectionData.documentPhotos.insuranceDocument, false);

    // Vehicle Condition Detailed Comparison
    yPos += 60;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('DETAILED VEHICLE CONDITION', 50, yPos);

    yPos += 40;
    // Create two columns for comparison
    const leftCol = 50;
    const rightCol = 300;

    // Collection column header
    doc.fillColor('#1e40af')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('COLLECTION', leftCol, yPos)
       .fillColor('#dc2626')
       .text('DELIVERY', rightCol, yPos);

    yPos += 30;

    // Mileage comparison
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Mileage:', leftCol, yPos)
       .text('Mileage:', rightCol, yPos);

    yPos += 15;
    doc.font('Helvetica-Bold')
       .text(data.collectionData.vehicleCondition.mileageReading + ' miles', leftCol, yPos)
       .text(data.deliveryData.vehicleCondition.mileageReading + ' miles', rightCol, yPos);

    yPos += 25;
    // Fuel comparison
    const fuelLevels = ['Empty (0/8)', '1/8 Tank', '2/8 Tank (1/4)', '3/8 Tank', '4/8 Tank (1/2)', '5/8 Tank', '6/8 Tank (3/4)', '7/8 Tank', 'Full Tank (8/8)'];
    
    doc.font('Helvetica')
       .text('Fuel Level:', leftCol, yPos)
       .text('Fuel Level:', rightCol, yPos);

    yPos += 15;
    doc.font('Helvetica-Bold')
       .text(fuelLevels[data.collectionData.vehicleCondition.fuelLevel], leftCol, yPos)
       .text(fuelLevels[data.deliveryData.vehicleCondition.fuelLevel], rightCol, yPos);

    yPos += 25;
    // Photos comparison
    doc.font('Helvetica')
       .text('Photos Captured:', leftCol, yPos)
       .text('Photos Captured:', rightCol, yPos);

    yPos += 15;
    const collectionPhotos = data.collectionData.vehicleCondition.odometerPhotos.length + data.collectionData.vehicleCondition.fuelPhotos.length;
    const deliveryPhotos = data.deliveryData.vehicleCondition.odometerPhotos.length + data.deliveryData.vehicleCondition.fuelPhotos.length;
    
    doc.font('Helvetica-Bold')
       .text(`${collectionPhotos} verification photos`, leftCol, yPos)
       .text(`${deliveryPhotos} verification photos`, rightCol, yPos);

    // Wheels & Tyres Summary
    yPos += 60;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('WHEELS & TYRES INSPECTION RESULTS', 50, yPos);

    yPos += 30;
    const scuffedWheels = data.collectionData.wheelTyreChecks.filter(w => w.wheelScuffed).length;
    const wornTyres = data.collectionData.wheelTyreChecks.filter(w => w.tyreCondition !== 'ok').length;

    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Wheel Condition:', 50, yPos)
       .font('Helvetica-Bold')
       .fillColor(scuffedWheels > 0 ? this.COLORS.warning : this.COLORS.success)
       .text(scuffedWheels > 0 ? `${scuffedWheels} wheel${scuffedWheels > 1 ? 's' : ''} with scuffs` : '✓ All wheels in good condition', 150, yPos);

    yPos += 20;
    doc.font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Tyre Condition:', 50, yPos)
       .font('Helvetica-Bold')
       .fillColor(wornTyres > 0 ? this.COLORS.warning : this.COLORS.success)
       .text(wornTyres > 0 ? `${wornTyres} tyre${wornTyres > 1 ? 's' : ''} showing wear` : '✓ All tyres in good condition', 150, yPos);

    // Additional Notes
    yPos += 60;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('ADDITIONAL NOTES', 50, yPos);

    yPos += 30;
    if (data.deliveryData.additionalNotes.trim()) {
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(this.COLORS.text)
         .text('Delivery Notes:', 50, yPos);
      
      yPos += 20;
      doc.text(data.deliveryData.additionalNotes, 50, yPos, { 
        width: pageWidth - 100,
        height: 80
      });
    } else {
      doc.fontSize(11)
         .fillColor('#6b7280')
         .text('No additional delivery notes provided.', 50, yPos);
    }
  }

  private static drawPage3(doc: PDFKit.PDFDocument, data: FixedPODData) {
    const pageWidth = 595.28;
    
    // Page header
    doc.fillColor(this.COLORS.secondary)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('DAMAGE ASSESSMENT REPORT', 50, 50);

    let yPos = 100;

    // Collection Damage Section
    if (data.collectionData.damageMarkers.length > 0) {
      doc.fillColor(this.COLORS.warning)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('COLLECTION DAMAGE (Pre-existing)', 50, yPos);

      yPos += 30;
      data.collectionData.damageMarkers.forEach((marker, index) => {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(this.COLORS.text)
           .text(`${index + 1}. ${marker.view.toUpperCase()} - ${marker.damageType.replace('-', ' ').toUpperCase()}`, 50, yPos)
           .text(`Size: ${marker.size.toUpperCase()}`, 250, yPos)
           .text(`Photos: ${marker.photos.length}`, 350, yPos);

        yPos += 15;
        if (marker.description) {
          doc.fillColor('#6b7280')
             .text(`   "${marker.description}"`, 50, yPos, { width: pageWidth - 100 });
          yPos += 15;
        }
        yPos += 10;
      });
    } else {
      doc.fillColor(this.COLORS.success)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('✓ NO DAMAGE AT COLLECTION', 50, yPos);
      yPos += 40;
    }

    // New Delivery Damage Section
    yPos += 20;
    if (data.deliveryData.newDamageMarkers.length > 0) {
      doc.fillColor(this.COLORS.error)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('NEW DAMAGE DISCOVERED AT DELIVERY', 50, yPos);

      yPos += 30;
      data.deliveryData.newDamageMarkers.forEach((marker, index) => {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor(this.COLORS.text)
           .text(`${index + 1}. ${marker.view.toUpperCase()} - ${marker.damageType.replace('-', ' ').toUpperCase()}`, 50, yPos)
           .text(`Size: ${marker.size.toUpperCase()}`, 250, yPos)
           .text(`Photos: ${marker.photos.length}`, 350, yPos);

        yPos += 15;
        if (marker.description) {
          doc.fillColor('#6b7280')
             .text(`   "${marker.description}"`, 50, yPos, { width: pageWidth - 100 });
          yPos += 15;
        }
        yPos += 10;
      });

      // New damage disclaimer
      yPos += 20;
      doc.fillColor(this.COLORS.error)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('⚠ IMPORTANT:', 50, yPos);
      
      yPos += 20;
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(this.COLORS.text)
         .text('The above damage was discovered during delivery inspection and was not present at collection. This damage may have occurred during transport.', 50, yPos, { width: pageWidth - 100 });

    } else {
      doc.fillColor(this.COLORS.success)
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('✓ NO NEW DAMAGE AT DELIVERY', 50, yPos);
      
      yPos += 30;
      doc.fontSize(12)
         .font('Helvetica')
         .fillColor(this.COLORS.success)
         .text('Vehicle delivered in same condition as collected. No damage occurred during transport.', 50, yPos, { width: pageWidth - 100 });
    }
  }

  private static drawPage4(doc: PDFKit.PDFDocument, data: FixedPODData) {
    const pageWidth = 595.28;
    
    // Page header
    doc.fillColor(this.COLORS.secondary)
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('FINAL CONFIRMATION & SIGN-OFF', 50, 50);

    let yPos = 120;

    // Delivery Confirmation Box
    doc.strokeColor(data.deliveryData.deliveryConfirmed ? this.COLORS.success : this.COLORS.error)
       .lineWidth(3)
       .rect(50, yPos, pageWidth - 100, 100)
       .stroke();

    doc.fillColor(data.deliveryData.deliveryConfirmed ? this.COLORS.success : this.COLORS.error)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(data.deliveryData.deliveryConfirmed ? '✓ DELIVERY CONFIRMED' : '✗ DELIVERY NOT CONFIRMED', 0, yPos + 35, { 
         align: 'center',
         width: pageWidth 
       });

    yPos += 130;

    // Customer Details Section
    doc.fillColor(this.COLORS.secondary)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('CUSTOMER CONFIRMATION DETAILS', 50, yPos);

    yPos += 40;
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('I confirm that I have received the vehicle described in this POD and that:', 50, yPos, { width: pageWidth - 100 });

    yPos += 30;
    const confirmationPoints = [
      'The vehicle has been delivered to the correct address',
      'I have received the correct number of keys as specified',
      'I have been made aware of any damage noted in this report',
      'I accept the vehicle in its current condition',
      'All documentation has been provided or status confirmed'
    ];

    confirmationPoints.forEach(point => {
      doc.fontSize(11)
         .font('Helvetica')
         .text(`• ${point}`, 70, yPos);
      yPos += 20;
    });

    yPos += 20;

    // Customer signature section
    doc.fillColor(this.COLORS.secondary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Customer Name:', 50, yPos);
    
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(data.deliveryData.customerName, 160, yPos);

    yPos += 40;
    doc.fillColor(this.COLORS.secondary)
       .font('Helvetica-Bold')
       .text('Customer Signature:', 50, yPos);

    // Large signature box - wider and consistent
    doc.strokeColor(this.COLORS.border)
       .lineWidth(2)            // Thicker line
       .rect(50, yPos + 20, 450, 80)  // Wider box for consistency
       .stroke();

    if (data.deliveryData.customerSignature) {
      doc.fillColor(this.COLORS.success)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('✓ DIGITALLY SIGNED', 120, yPos + 50);
    }

    yPos += 120;
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text('Date:', 50, yPos);
    
    const completedDate = new Date(data.completedAt);
    doc.font('Helvetica-Bold')
       .text(completedDate.toLocaleDateString('en-GB'), 90, yPos);

    doc.font('Helvetica')
       .text('Time:', 200, yPos);
    
    doc.font('Helvetica-Bold')
       .text(completedDate.toLocaleTimeString('en-GB'), 240, yPos);

    // Company signature section
    yPos += 60;
    doc.fillColor(this.COLORS.secondary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('OVM Ltd Representative:', 50, yPos);

    yPos += 30;
    doc.strokeColor(this.COLORS.border)
       .rect(50, yPos, 200, 40)
       .stroke();

    doc.fillColor(this.COLORS.primary)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Driver Signature', 110, yPos + 18);

    // Footer with legal text
    yPos = 650;
    doc.strokeColor(this.COLORS.border)
       .moveTo(50, yPos)
       .lineTo(pageWidth - 50, yPos)
       .stroke();

    yPos += 20;
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('This Proof of Delivery (POD) constitutes confirmation of successful vehicle delivery. By signing this document, the customer acknowledges receipt of the vehicle and confirms the accuracy of all details recorded herein. This document is generated electronically by the OVM Management System and serves as legal proof of delivery completion.', 50, yPos, {
         width: pageWidth - 100,
         height: 60,
         align: 'justify'
       });

    yPos += 60;
    doc.text(`Document generated: ${completedDate.toLocaleDateString('en-GB')} ${completedDate.toLocaleTimeString('en-GB')}`, 50, yPos)
       .text(`OVM Ltd | ${this.COMPANY_INFO.phone} | ${this.COMPANY_INFO.email}`, 50, yPos + 15);
  }

  private static drawDocumentCheckStatus(doc: PDFKit.PDFDocument, x: number, y: number, name: string, documentCheck: DocumentCheck, required: boolean) {
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor(this.COLORS.text)
       .text(name + ':', x, y);

    let statusColor: string;
    let statusText: string;

    if (documentCheck.status === 'provided') {
      statusColor = this.COLORS.success;
      statusText = `✓ ${documentCheck.photos.length} photo${documentCheck.photos.length !== 1 ? 's' : ''} captured`;
    } else if (documentCheck.status === 'not-provided') {
      statusColor = required ? this.COLORS.warning : '#6b7280';
      statusText = required ? `⚠ Not provided: ${documentCheck.reason || 'No reason given'}` : `○ Not provided: ${documentCheck.reason || 'Optional'}`;
    } else {
      statusColor = this.COLORS.error;
      statusText = '✗ Status unknown';
    }
    
    doc.fillColor(statusColor)
       .font('Helvetica-Bold')
       .text(statusText, x + 200, y, { width: 300 });
  }
}