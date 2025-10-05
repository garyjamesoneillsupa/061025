import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export interface FreshDeliveryData {
  // Vehicle Information
  vehicleRegistration: string;
  make: string;
  model?: string;
  
  // Delivery Location
  deliveryAddress: string;
  
  // Job Information
  jobReference: string;
  deliveryDate: string;
  driverName: string;
  
  // Vehicle Condition at Delivery
  finalMileage: string;
  finalFuelLevel: string;
  
  // Delivery Assessment
  exteriorCondition: string;
  exteriorNotes: string;
  
  interiorCondition: string;
  interiorNotes: string;
  
  // New Damage Assessment (damage found during transport)
  newDamageMarkers: Array<{
    id: string;
    view: string;
    damageType: string;
    damageSize: string;
    photoUrls: string[];
  }>;
  
  // Delivery Photos
  deliveryPhotos: {
    front: string[];
    rear: string[];
    driverSide: string[];
    passengerSide: string[];
    interior: string[];
    other: string[];
  };
  
  // Customer Confirmation
  customerName: string;
  customerSignature?: string;
  customerComments?: string;
  
  // Driver Confirmation
  driverSignature?: string;
}

export class FreshPODGenerationService {
  static async generatePOD(deliveryData: FreshDeliveryData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // HEADER - Exactly matching invoice template with logo
        doc.fontSize(20).font('Helvetica-Bold');
        doc.text('PROOF OF DELIVERY', 50, 50, { align: 'right', width: 500 });
        
        // Company logo area (top left) - embed the OVM logo
        const logoPath = path.join(process.cwd(), 'attached_assets/invoiceheaderlogo_1754920861250.png');
        
        if (fs.existsSync(logoPath)) {
          try {
            // Embed the OVM logo with correct proportions - maintain aspect ratio
            doc.image(logoPath, 50, 45, { fit: [120, 30] });
            console.log('✅ OVM logo embedded in POD successfully');
          } catch (logoError) {
            console.error('POD Logo embedding failed:', logoError);
            // Fallback to text
            doc.fontSize(18).font('Helvetica-Bold');
            doc.text('OVM Ltd', 50, 50);
          }
        } else {
          console.log('POD Logo file not found at:', logoPath);
          // Fallback to text
          doc.fontSize(18).font('Helvetica-Bold');
          doc.text('OVM Ltd', 50, 50);
        }
        
        // Company details in top right (matching invoice exactly)
        doc.fontSize(10).font('Helvetica');
        let headerY = 80;
        doc.text('272 Bath Street', 400, headerY, { align: 'right' });
        doc.text('Glasgow', 400, headerY + 12, { align: 'right' });
        doc.text('G2 4JR', 400, headerY + 24, { align: 'right' });
        doc.text('Tel: 07783 490007', 400, headerY + 40, { align: 'right' });
        doc.text('movements@ovmtransport.com', 400, headerY + 52, { align: 'right' });
        doc.text('Company No: SC834621', 400, headerY + 64, { align: 'right' });

        // Professional line separator
        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, 160).lineTo(550, 160).stroke();
        
        let currentY = 180;

        // Two-column layout matching invoice exactly
        // Left column - VEHICLE DELIVERED TO
        doc.fontSize(11).font('Helvetica-Bold');
        doc.fillColor('#000000');
        doc.text('VEHICLE DELIVERED TO:', 50, currentY);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(deliveryData.vehicleRegistration, 50, currentY + 20);
        doc.text(`${deliveryData.make} ${deliveryData.model || ''}`, 50, currentY + 35);
        doc.text(deliveryData.deliveryAddress, 50, currentY + 50, { width: 200 });

        // Right column - DELIVERY DETAILS
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('DELIVERY DETAILS:', 350, currentY);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Job Reference: ${deliveryData.jobReference}`, 350, currentY + 20);
        doc.text(`Delivery Date: ${deliveryData.deliveryDate}`, 350, currentY + 35);
        doc.text(`Driver: ${deliveryData.driverName}`, 350, currentY + 50);
        doc.text(`Final Mileage: ${deliveryData.finalMileage}`, 350, currentY + 65);
        doc.text(`Final Fuel: ${deliveryData.finalFuelLevel}`, 350, currentY + 80);
        
        currentY += 120;

        // DELIVERY CONDITION TABLE (professional format)
        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('DELIVERY CONDITION ASSESSMENT', 50, currentY);
        currentY += 20;

        // Table header
        doc.rect(50, currentY, 500, 20).fillAndStroke('#28a745', '#28a745');
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('Component', 60, currentY + 6);
        doc.text('Condition', 200, currentY + 6);
        doc.text('Notes', 350, currentY + 6);
        currentY += 25;

        // Table rows
        const conditionRows = [
          { component: 'Exterior', condition: deliveryData.exteriorCondition, notes: deliveryData.exteriorNotes },
          { component: 'Interior', condition: deliveryData.interiorCondition, notes: deliveryData.interiorNotes }
        ];

        conditionRows.forEach((row, index) => {
          const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
          doc.rect(50, currentY, 500, 18).fillAndStroke(bgColor, '#e9ecef');
          doc.fontSize(9).font('Helvetica').fillColor('#000000');
          doc.text(row.component, 60, currentY + 6);
          doc.text(row.condition, 200, currentY + 6);
          doc.text(row.notes.slice(0, 30), 350, currentY + 6);
          currentY += 20;
        });
        
        currentY += 15;

        // NEW DAMAGE ASSESSMENT (if any damage found during transport)
        if (deliveryData.newDamageMarkers.length > 0) {
          doc.strokeColor('#cccccc').lineWidth(0.5);
          doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
          currentY += 10;
          
          doc.fontSize(11).font('Helvetica-Bold');
          doc.text('NEW DAMAGE IDENTIFIED DURING TRANSPORT', 50, currentY);
          currentY += 20;
          
          doc.fontSize(9).font('Helvetica');
          doc.text(`${deliveryData.newDamageMarkers.length} new damage item(s) found with photographic evidence:`, 50, currentY);
          currentY += 15;

          // Professional damage table header
          doc.rect(50, currentY, 500, 20).fillAndStroke('#dc3545', '#dc3545');
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
          doc.text('#', 60, currentY + 6);
          doc.text('Location', 80, currentY + 6);
          doc.text('Type', 200, currentY + 6);
          doc.text('Severity', 300, currentY + 6);
          doc.text('Evidence', 450, currentY + 6);
          currentY += 25;

          // List each damage item professionally
          deliveryData.newDamageMarkers.forEach((marker, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(50, currentY, 500, 18).fillAndStroke(bgColor, '#e9ecef');
            doc.fontSize(8).font('Helvetica').fillColor('#000000');
            doc.text(`${index + 1}`, 60, currentY + 5);
            doc.text(marker.view.replace(/_/g, ' ').toUpperCase(), 80, currentY + 5);
            doc.text(marker.damageType.replace(/_/g, ' ').toUpperCase(), 200, currentY + 5);
            doc.text(marker.damageSize.replace(/_/g, ' ').toUpperCase(), 300, currentY + 5);
            doc.text(`${marker.photoUrls.length} photo(s)`, 450, currentY + 5);
            currentY += 20;
          });
          currentY += 15;
        } else {
          // Show no new damage section
          doc.rect(50, currentY, 500, 25).fillAndStroke('#d4edda', '#28a745');
          doc.fontSize(10).font('Helvetica-Bold').fillColor('#155724');
          doc.text('✓ NO NEW DAMAGE DURING TRANSPORT', 60, currentY + 8);
          doc.fontSize(9).font('Helvetica');
          doc.text('Vehicle delivered in same condition as collected', 250, currentY + 8);
          currentY += 35;
        }

        // CUSTOMER CONFIRMATION section
        doc.strokeColor('#cccccc').lineWidth(0.5);
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('CUSTOMER CONFIRMATION', 50, currentY);
        currentY += 20;

        doc.fontSize(10).font('Helvetica');
        doc.text(`Customer Name: ${deliveryData.customerName}`, 50, currentY);
        currentY += 20;

        if (deliveryData.customerComments) {
          doc.text('Customer Comments:', 50, currentY);
          doc.fontSize(9).font('Helvetica');
          doc.text(deliveryData.customerComments, 50, currentY + 15, { width: 500 });
          currentY += 40;
        }

        // Signature area
        if (deliveryData.customerSignature) {
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Customer Signature:', 50, currentY);
          // Include customer signature if available
          currentY += 30;
        } else {
          doc.rect(50, currentY, 200, 40).stroke();
          doc.fontSize(9).font('Helvetica');
          doc.text('Customer Signature', 60, currentY + 15);
          currentY += 50;
        }

        if (deliveryData.driverSignature) {
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text('Driver Signature:', 350, currentY - 50);
          // Include driver signature if available
        } else {
          doc.rect(350, currentY - 50, 200, 40).stroke();
          doc.fontSize(9).font('Helvetica');
          doc.text('Driver Signature', 360, currentY - 35);
        }

        currentY += 20;

        // PHOTOGRAPHIC EVIDENCE section (if photos exist)
        const allPhotos = [
          ...deliveryData.deliveryPhotos.front,
          ...deliveryData.deliveryPhotos.rear,
          ...deliveryData.deliveryPhotos.driverSide,
          ...deliveryData.deliveryPhotos.passengerSide,
          ...deliveryData.deliveryPhotos.interior,
          ...deliveryData.deliveryPhotos.other
        ].filter(photo => photo && photo.trim() !== '');

        if (allPhotos.length > 0) {
          // Start new page for photos if needed
          if (currentY > 600) {
            doc.addPage();
            currentY = 50;
          }

          doc.strokeColor('#cccccc').lineWidth(0.5);
          doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
          currentY += 10;

          doc.fontSize(11).font('Helvetica-Bold');
          doc.text('DELIVERY PHOTOGRAPHIC EVIDENCE', 50, currentY);
          currentY += 20;

          doc.fontSize(9).font('Helvetica');
          doc.text(`${allPhotos.length} delivery photographs embedded below:`, 50, currentY);
          currentY += 20;
          
          // Professional photo embedding with compression
          let photoIndex = 0;
          const photosPerRow = 2;
          const photoWidth = 180;
          const photoHeight = 135;
          const photoSpacing = 40;
          
          while (photoIndex < allPhotos.length && currentY < 650) {
            for (let col = 0; col < photosPerRow && photoIndex < allPhotos.length; col++) {
              const xPos = 50 + col * (photoWidth + photoSpacing);
              
              try {
                // For base64 images from camera with compression
                if (allPhotos[photoIndex].startsWith('data:image')) {
                  const base64Data = allPhotos[photoIndex].split(',')[1];
                  const buffer = Buffer.from(base64Data, 'base64');
                  
                  // Embed with proper fit to maintain aspect ratio and quality
                  doc.image(buffer, xPos, currentY, { 
                    fit: [photoWidth, photoHeight],
                    align: 'center',
                    valign: 'center'
                  });
                  
                  // Professional photo border
                  doc.rect(xPos, currentY, photoWidth, photoHeight).stroke('#cccccc');
                } else if (allPhotos[photoIndex].startsWith('http') || allPhotos[photoIndex].startsWith('/')) {
                  // For URL-based images, show professional placeholder
                  doc.rect(xPos, currentY, photoWidth, photoHeight).fillAndStroke('#f8f9fa', '#e9ecef');
                  doc.fontSize(9).fillColor('#6c757d');
                  doc.text(`Image ${photoIndex + 1}`, xPos + 70, currentY + 60);
                  doc.text('(External URL)', xPos + 65, currentY + 75);
                } else {
                  // Professional placeholder for missing photos
                  doc.rect(xPos, currentY, photoWidth, photoHeight).fillAndStroke('#f8f9fa', '#e9ecef');
                  doc.fontSize(9).fillColor('#6c757d');
                  doc.text(`Photo ${photoIndex + 1}`, xPos + 70, currentY + 65);
                }
                
                // Professional photo label
                doc.fontSize(8).font('Helvetica').fillColor('#000000');
                doc.text(`Photo ${photoIndex + 1}`, xPos, currentY + photoHeight + 3);
              } catch (error) {
                // Professional error handling
                doc.rect(xPos, currentY, photoWidth, photoHeight).fillAndStroke('#fff3cd', '#ffc107');
                doc.fontSize(8).fillColor('#856404');
                doc.text(`Photo ${photoIndex + 1}`, xPos + 70, currentY + 60);
                doc.text('(Loading Error)', xPos + 60, currentY + 75);
              }
              
              photoIndex++;
            }
            currentY += photoHeight + 30;
            
            // Start new page if needed for additional photos
            if (currentY > 650 && photoIndex < allPhotos.length) {
              doc.addPage();
              currentY = 50;
              
              // Add page header for continued photos
              doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000');
              doc.text('DELIVERY PHOTOGRAPHIC EVIDENCE (CONTINUED)', 50, currentY);
              currentY += 25;
            }
          }
        }

        // Footer with completion timestamp
        doc.fontSize(8).font('Helvetica').fillColor('#666666');
        doc.text(`POD generated on ${new Date().toLocaleString('en-GB')}`, 50, 750);
        doc.text('OVM Management System', 350, 750);

        doc.end();
      } catch (error) {
        console.error('POD Generation error:', error);
        reject(error);
      }
    });
  }
}