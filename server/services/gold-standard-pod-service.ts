import PDFDocument from 'pdfkit';
import path from 'path';

export interface GoldStandardDeliveryData {
  // Job Information
  jobReference: string;
  vehicleRegistration: string;
  make: string;
  model: string;
  mileageAtDelivery: string;
  fuelLevel: string;
  dateTime: string;
  deliveryLocation: string;
  gpsCoordinates?: string;

  // Damage Assessment (delivery-specific)
  sameAsCollection: boolean;
  newDamageMarkers?: Array<{
    id: string;
    view: 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'roof';
    position: { x: number; y: number };
    damageType: 'scratch' | 'dent' | 'chip' | 'crack' | 'rust' | 'broken_missing' | 'bad_repair' | 'paintwork';
    damageSize: 'small' | 'medium' | 'large';
    photoUrls: string[];
    label: number;
  }>;

  // Environmental Conditions
  weather: 'dry' | 'wet';
  vehicleCleanliness: 'clean' | 'dirty';
  lightingConditions: 'light' | 'dark';

  // Customer Information
  customerFullName: string;
  customerSignature: string;
  customerNotes: string;
  deliveryConfirmed: boolean;

  // Original collection data for reference
  originalCollectionData?: {
    damageCount: number;
    collectionDate: string;
    collectionLocation: string;
  };
}

export class GoldStandardPODGenerationService {
  static async generatePOD(deliveryData: GoldStandardDeliveryData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🚀 Generating Gold Standard POD...');
        
        const doc = new PDFDocument({ 
          margin: 50, 
          size: 'A4',
          info: {
            Title: `POD-${deliveryData.jobReference}`,
            Author: 'OVM Ltd',
            Subject: 'Proof of Delivery',
            Creator: 'OVM Management System'
          }
        });
        
        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          console.log('✅ Gold Standard POD generated successfully');
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);

        let currentY = 50;

        // HEADER - OVM Logo with perfect proportions
        try {
          const logoPath = path.join(process.cwd(), 'attached_assets', 'invoiceheaderlogo_1754920861250.png');
          doc.image(logoPath, 50, currentY, { 
            width: 180,
            height: 54,
            fit: [180, 54]
          });
          console.log('✅ OVM logo embedded with perfect proportions');
        } catch (logoError) {
          console.warn('⚠️ Logo file not found');
        }

        // Company details (matching invoice template)
        doc.fontSize(9).font('Helvetica');
        doc.fillColor('#666666');
        doc.text('OVM Ltd', 350, currentY + 5);
        doc.text('Professional Vehicle Transport', 350, currentY + 18);
        doc.text('www.ovm.co.uk', 350, currentY + 31);
        
        currentY += 80;

        // DOCUMENT TITLE
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#000000');
        doc.text('PROOF OF DELIVERY', 50, currentY, { align: 'center', width: 500 });
        
        currentY += 40;

        // Document number and date (right aligned like invoice)
        doc.fontSize(10).font('Helvetica');
        doc.text(`POD No: ${deliveryData.jobReference}`, 350, currentY);
        doc.text(`Date: ${new Date(deliveryData.dateTime).toLocaleDateString('en-GB')}`, 350, currentY + 15);
        doc.text(`Time: ${new Date(deliveryData.dateTime).toLocaleTimeString('en-GB')}`, 350, currentY + 30);
        
        currentY += 60;

        // VEHICLE DETAILS TABLE
        this.drawTableHeader(doc, 50, currentY, 'VEHICLE DETAILS');
        currentY += 30;

        const vehicleDetails = [
          ['Registration:', deliveryData.vehicleRegistration],
          ['Make & Model:', `${deliveryData.make} ${deliveryData.model}`],
          ['Mileage at Delivery:', `${deliveryData.mileageAtDelivery} miles`],
          ['Fuel Level:', deliveryData.fuelLevel]
        ];

        currentY = this.drawTable(doc, 50, currentY, vehicleDetails, [200, 300]);
        currentY += 20;

        // DELIVERY LOCATION
        this.drawTableHeader(doc, 50, currentY, 'DELIVERY DETAILS');
        currentY += 30;

        const locationDetails = [
          ['Delivery Address:', deliveryData.deliveryLocation],
          ['GPS Coordinates:', deliveryData.gpsCoordinates || 'Not recorded'],
          ['Delivery Date/Time:', new Date(deliveryData.dateTime).toLocaleString('en-GB')],
          ['Delivery Status:', deliveryData.deliveryConfirmed ? 'CONFIRMED ✓' : 'PENDING']
        ];

        currentY = this.drawTable(doc, 50, currentY, locationDetails, [200, 300]);
        currentY += 20;

        // COLLECTION REFERENCE
        if (deliveryData.originalCollectionData) {
          this.drawTableHeader(doc, 50, currentY, 'COLLECTION REFERENCE');
          currentY += 30;

          const collectionRef = [
            ['Original Collection Date:', deliveryData.originalCollectionData.collectionDate],
            ['Collection Location:', deliveryData.originalCollectionData.collectionLocation],
            ['Damage at Collection:', `${deliveryData.originalCollectionData.damageCount} item(s)`]
          ];

          currentY = this.drawTable(doc, 50, currentY, collectionRef, [200, 300]);
          currentY += 20;
        }

        // DELIVERY CONDITION ASSESSMENT
        this.drawTableHeader(doc, 50, currentY, 'DELIVERY CONDITION ASSESSMENT');
        currentY += 30;

        // Environmental conditions
        const environmentalDetails = [
          ['Weather Conditions:', deliveryData.weather === 'wet' ? 'Wet' : 'Dry'],
          ['Vehicle Cleanliness:', deliveryData.vehicleCleanliness === 'clean' ? 'Clean' : 'Dirty'],
          ['Lighting Conditions:', deliveryData.lightingConditions === 'light' ? 'Good Light' : 'Poor Light']
        ];

        currentY = this.drawTable(doc, 50, currentY, environmentalDetails, [200, 300]);
        currentY += 20;

        // DAMAGE ASSESSMENT AT DELIVERY
        this.drawTableHeader(doc, 50, currentY, 'DAMAGE ASSESSMENT AT DELIVERY');
        currentY += 20;

        if (deliveryData.sameAsCollection) {
          doc.rect(50, currentY, 500, 30).fillAndStroke('#d4edda', '#28a745');
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#155724');
          doc.text('✓ SAME AS COLLECTION', 60, currentY + 10);
          doc.fontSize(9).font('Helvetica');
          doc.text('No new damage identified during transport - vehicle delivered as collected', 250, currentY + 10);
          currentY += 40;
        } else if (deliveryData.newDamageMarkers && deliveryData.newDamageMarkers.length > 0) {
          doc.fontSize(10).font('Helvetica');
          doc.text(`${deliveryData.newDamageMarkers.length} NEW damage item(s) identified during transport:`, 50, currentY);
          currentY += 20;

          // New damage table header
          doc.rect(50, currentY, 500, 25).fillAndStroke('#ffc107', '#ffc107');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
          doc.text('Ref', 60, currentY + 8);
          doc.text('Location', 90, currentY + 8);
          doc.text('Type', 200, currentY + 8);
          doc.text('Size', 300, currentY + 8);
          doc.text('Photos', 400, currentY + 8);
          currentY += 30;

          // New damage items
          deliveryData.newDamageMarkers.forEach((marker, index) => {
            const bgColor = index % 2 === 0 ? '#fff3cd' : '#ffeaa7';
            doc.rect(50, currentY, 500, 20).fillAndStroke(bgColor, '#ffc107');
            doc.fontSize(8).font('Helvetica').fillColor('#000000');
            doc.text(`(${marker.label})`, 60, currentY + 6);
            doc.text(marker.view.replace(/_/g, ' ').toUpperCase(), 90, currentY + 6);
            doc.text(marker.damageType.replace(/_/g, ' ').toUpperCase(), 200, currentY + 6);
            doc.text(marker.damageSize.toUpperCase(), 300, currentY + 6);
            doc.text(`${marker.photoUrls.length} photo(s)`, 400, currentY + 6);
            currentY += 22;
          });
          currentY += 15;
        } else {
          doc.rect(50, currentY, 500, 30).fillAndStroke('#d4edda', '#28a745');
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#155724');
          doc.text('✓ NO NEW DAMAGE', 60, currentY + 10);
          doc.fontSize(9).font('Helvetica');
          doc.text('Vehicle delivered without additional damage', 250, currentY + 10);
          currentY += 40;
        }

        // CUSTOMER DELIVERY CONFIRMATION
        this.drawTableHeader(doc, 50, currentY, 'CUSTOMER DELIVERY CONFIRMATION');
        currentY += 30;

        doc.fontSize(10).font('Helvetica');
        doc.text('Customer Name:', 50, currentY);
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(deliveryData.customerFullName, 150, currentY);
        currentY += 20;

        if (deliveryData.customerNotes) {
          doc.fontSize(10).font('Helvetica');
          doc.text('Customer Notes:', 50, currentY);
          currentY += 15;
          doc.fontSize(9).font('Helvetica');
          doc.text(deliveryData.customerNotes, 50, currentY, { width: 500 });
          currentY += 30;
        }

        doc.fontSize(10).font('Helvetica');
        doc.text('I confirm receipt of the above vehicle in the condition stated:', 50, currentY);
        currentY += 20;

        doc.text('Customer Signature:', 50, currentY);
        doc.text('Date:', 350, currentY);
        
        // Signature lines
        doc.moveTo(160, currentY + 5).lineTo(300, currentY + 5).stroke();
        doc.moveTo(380, currentY + 5).lineTo(500, currentY + 5).stroke();
        
        currentY += 40;

        // FOOTER
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text('This document confirms the successful delivery of the above vehicle.', 50, currentY);
        doc.text('Customer signature acknowledges receipt in the stated condition.', 50, currentY + 12);
        doc.text(`Document generated: ${new Date().toLocaleString('en-GB')}`, 50, currentY + 30);
        doc.text('OVM Ltd - Professional Vehicle Transport Services', 350, currentY + 30);

        doc.end();

      } catch (error) {
        console.error('❌ Error generating Gold Standard POD:', error);
        reject(error);
      }
    });
  }

  private static drawTableHeader(doc: PDFKit.PDFDocument, x: number, y: number, title: string): void {
    doc.rect(x, y, 500, 25).fillAndStroke('#f8f9fa', '#e9ecef');
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
    doc.text(title, x + 10, y + 8);
  }

  private static drawTable(doc: PDFKit.PDFDocument, x: number, y: number, data: string[][], colWidths: number[]): number {
    let currentY = y;
    
    data.forEach((row, index) => {
      const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
      doc.rect(x, currentY, colWidths.reduce((a, b) => a + b), 20).fillAndStroke(bgColor, '#e9ecef');
      
      doc.fontSize(9).font('Helvetica').fillColor('#000000');
      doc.text(row[0], x + 10, currentY + 6, { width: colWidths[0] - 20 });
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(row[1], x + colWidths[0] + 10, currentY + 6, { width: colWidths[1] - 20 });
      
      currentY += 22;
    });
    
    return currentY;
  }
}