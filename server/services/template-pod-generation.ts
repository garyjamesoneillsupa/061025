import PDFDocument from 'pdfkit';

export interface TemplatePODData {
  job: any;
  customer: any;
  vehicleInspection: any;
  photos: Array<{ category: string; url: string; timestamp: string }>;
  damageMarkers: Array<{
    id: string;
    x: number;
    y: number;
    type: string;
    view: string;
    photos?: string[];
  }>;
}

export class TemplatePODGenerationService {
  static async generatePOD(data: TemplatePODData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          margin: 50, 
          size: 'A4',
          info: {
            Title: `Vehicle Delivery Report - ${data.job.jobNumber}`,
            Author: 'OVM Ltd',
            Subject: 'Vehicle Delivery Report',
            Creator: 'OVM Management System'
          }
        });
        
        const chunks: Buffer[] = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });

        // Extract inspection data
        const inspectionData = data.vehicleInspection.data as any || {};
        
        // Header Section
        this.addHeader(doc);
        
        // Main Title
        doc.fontSize(18).font('Helvetica-Bold')
           .text('VEHICLE DELIVERY REPORT', { align: 'center' });
        doc.moveDown(1.5);

        // Driver Information and Vehicle Details (side by side)
        this.addDriverAndVehicleDetails(doc, data, inspectionData);
        
        // Delivery Confirmation
        this.addDeliveryConfirmation(doc, inspectionData);
        
        // Vehicle Condition at Delivery
        this.addVehicleConditionAtDelivery(doc, inspectionData);
        
        // Transport Damage (if any new damage during transport)
        this.addTransportDamage(doc, data.damageMarkers, inspectionData);
        
        // Delivery Photos
        this.addDeliveryPhotos(doc, data.photos);
        
        // Customer Acceptance and Signatures
        this.addCustomerAcceptanceAndSignatures(doc, data.customer.name, inspectionData);
        
        // Footer
        this.addFooter(doc);
        
        doc.end();
        
      } catch (error) {
        console.error('POD generation error:', error);
        reject(error);
      }
    });
  }

  private static addHeader(doc: any) {
    doc.fontSize(12).font('Helvetica-Bold')
       .text('OVM Ltd', { align: 'right' });
    doc.fontSize(10).font('Helvetica')
       .text('272 Bath Street, Glasgow, G2 4JR', { align: 'right' })
       .text('Tel: 07783 490007', { align: 'right' })
       .text('movements@ovmtransport.com', { align: 'right' })
       .text('Company No: SC834621', { align: 'right' });
    doc.moveDown(2);
  }

  private static addDriverAndVehicleDetails(doc: any, data: TemplatePODData, inspectionData: any) {
    const startY = doc.y;
    
    // Driver Information (Left Column)
    doc.fontSize(14).font('Helvetica-Bold').text('DRIVER INFORMATION', 50, startY);
    doc.fontSize(10).font('Helvetica').text(`Name: ${inspectionData.driverName || 'Gary O\'Neill'}`, 50, startY + 25);
    doc.text('Delivery Address:', 50, startY + 40);
    
    const deliveryAddress = data.job.deliveryAddress;
    if (deliveryAddress) {
      doc.text(deliveryAddress.line1 || '', 50, startY + 55);
      doc.text(`${deliveryAddress.city || ''} ${deliveryAddress.postalCode || ''}`, 50, startY + 70);
    }

    // Vehicle Details (Right Column)
    doc.fontSize(14).font('Helvetica-Bold').text('VEHICLE DETAILS', 320, startY);
    doc.fontSize(10).font('Helvetica').text(`Order Number: ${data.job.jobNumber}`, 320, startY + 25);
    doc.text(`Registration: ${data.job.vehicle?.registration || 'N/A'}`, 320, startY + 40);
    doc.text(`Make: ${data.job.vehicle?.make || 'N/A'}`, 320, startY + 55);
    doc.text(`Fuel: ${data.job.vehicle?.fuelType || 'N/A'}          Colour: ${data.job.vehicle?.colour || 'N/A'}`, 320, startY + 70);

    doc.y = startY + 100;
    doc.moveDown(1);
  }

  private static addDeliveryConfirmation(doc: any, inspectionData: any) {
    doc.fontSize(14).font('Helvetica-Bold').text('DELIVERY CONFIRMATION');
    doc.moveDown(0.5);

    const deliveryQuestions = [
      { key: 'vehicleDeliveredCorrectLocation', text: 'Was the vehicle delivered to the correct location?' },
      { key: 'customerSatisfiedCondition', text: 'Is the customer satisfied with the vehicle condition?' },
      { key: 'allKeysHandedOver', text: 'Were all keys handed over to the customer?' },
      { key: 'customerConfirmedDelivery', text: 'Did the customer confirm delivery acceptance?' }
    ];

    doc.fontSize(10).font('Helvetica');
    
    deliveryQuestions.forEach(question => {
      const currentY = doc.y;
      doc.text(question.text, 50, currentY);
      
      // Yes/No boxes
      doc.rect(400, currentY - 2, 8, 8).stroke();
      doc.text('Yes', 415, currentY);
      doc.rect(450, currentY - 2, 8, 8).stroke(); 
      doc.text('No', 465, currentY);
      
      // Fill boxes based on data
      const answer = inspectionData.deliveryConfirmation?.[question.key];
      if (answer === true) {
        doc.text('✓', 401, currentY - 1);
      } else if (answer === false) {
        doc.text('✓', 451, currentY - 1);
      }
      
      doc.moveDown(0.4);
    });

    doc.moveDown(0.5);
  }

  private static addVehicleConditionAtDelivery(doc: any, inspectionData: any) {
    doc.fontSize(14).font('Helvetica-Bold').text('VEHICLE CONDITION AT DELIVERY');
    doc.moveDown(0.5);

    // Final mileage and fuel level
    doc.fontSize(10).font('Helvetica');
    doc.text(`Final Mileage: ${inspectionData.finalOdometerReading || 'N/A'} miles`);
    
    // Fuel Level at Delivery
    doc.text('Fuel Level at Delivery:', 50, doc.y);
    const fuelLevels = ['Empty', '1/4', '1/2', '3/4', 'Full'];
    let xPos = 200;
    fuelLevels.forEach((level, index) => {
      doc.text(level, xPos, doc.y);
      // Highlight selected fuel level
      if (inspectionData.finalFuelLevel === level || inspectionData.finalFuelLevel === index) {
        doc.rect(xPos - 5, doc.y - 2, doc.widthOfString(level) + 10, 12).stroke();
      }
      xPos += 60;
    });

    doc.moveDown(1.5);
  }

  private static addTransportDamage(doc: any, damageMarkers: any[], inspectionData: any) {
    doc.fontSize(14).font('Helvetica-Bold').text('TRANSPORT DAMAGE ASSESSMENT');
    doc.moveDown(0.5);

    // Filter damage markers for delivery stage (new damage during transport)
    const transportDamage = damageMarkers.filter(marker => marker.stage === 'delivery');

    if (transportDamage && transportDamage.length > 0) {
      doc.fontSize(10).font('Helvetica').text(`${transportDamage.length} NEW DAMAGE MARKER(S) FOUND DURING TRANSPORT:`);
      doc.moveDown(0.3);
      
      transportDamage.forEach((marker, index) => {
        doc.text(`${index + 1}. ${marker.type} - ${marker.view} (Transport damage)`);
        
        // Add damage photos if available
        if (marker.photos && marker.photos.length > 0) {
          doc.text(`   Photos: ${marker.photos.length} image(s) captured`, { indent: 20 });
        }
        doc.moveDown(0.2);
      });
    } else {
      doc.fontSize(10).font('Helvetica-Bold').text('✓ NO NEW DAMAGE DURING TRANSPORT - VEHICLE DELIVERED IN SAME CONDITION');
    }

    doc.moveDown(1);
  }

  private static addDeliveryPhotos(doc: any, photos: any[]) {
    doc.fontSize(14).font('Helvetica-Bold').text('DELIVERY PHOTOGRAPHS');
    doc.moveDown(0.5);

    const photoTypes = [
      { key: 'front', label: 'Front View:' },
      { key: 'rear', label: 'Rear View:' },
      { key: 'driverSide', label: 'Driver Side:' },
      { key: 'passengerSide', label: 'Passenger Side:' },
      { key: 'dashboard', label: 'Dashboard:' },
      { key: 'keys', label: 'Keys:' }
    ];

    doc.fontSize(10).font('Helvetica');
    
    let yPos = doc.y;
    photoTypes.forEach((photoType, index) => {
      if (index % 3 === 0 && index > 0) yPos += 20;
      const xPosition = 50 + (index % 3) * 170;
      
      doc.text(photoType.label, xPosition, yPos);
      doc.text('Taken', xPosition + 80, yPos);
      
      // Check box
      doc.rect(xPosition + 115, yPos - 2, 8, 8).stroke();
      
      // Fill based on photos taken
      const hasPhotos = photos.some(photo => photo.category.includes(photoType.key));
      if (hasPhotos) {
        doc.text('✓', xPosition + 116, yPos - 1);
      }
    });

    doc.y = yPos + 30;
    doc.moveDown(1);
  }

  private static addCustomerAcceptanceAndSignatures(doc: any, customerName: string, inspectionData: any) {
    doc.fontSize(12).font('Helvetica-Bold').text('CUSTOMER ACCEPTANCE');
    doc.moveDown(0.3);
    
    doc.fontSize(9).font('Helvetica').text(
      'I confirm that the vehicle has been delivered to the specified location in acceptable condition. I acknowledge that I have ' +
      'received all keys and documentation as agreed. Any concerns regarding the vehicle condition have been noted above.'
    );
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text('I confirm that I accept delivery of the vehicle.');
    doc.moveDown(1);

    // Signature section
    const currentY = doc.y;
    
    // Customer signature
    doc.text('Customer Acceptance:', 50, currentY);
    doc.moveTo(50, currentY + 20).lineTo(250, currentY + 20).stroke();
    doc.text(`Customer name: ${customerName}`, 50, currentY + 30);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}, ${new Date().toLocaleTimeString('en-GB')}`, 50, currentY + 45);

    // Driver signature
    doc.text('Delivered by (Driver):', 300, currentY);
    doc.moveTo(300, currentY + 20).lineTo(500, currentY + 20).stroke();
    doc.text(`Driver name: ${inspectionData.driverName || 'Gary O\'Neill'}`, 300, currentY + 30);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}, ${new Date().toLocaleTimeString('en-GB')}`, 300, currentY + 45);

    doc.y = currentY + 70;
  }

  private static addFooter(doc: any) {
    doc.fontSize(8).font('Helvetica')
       .text('© 2025 OVM Ltd • Company Number: SC834621 • Email: movements@ovmtransport.com • Phone: 07783 490007', 
             { align: 'center' });
  }
}