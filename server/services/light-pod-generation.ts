import PDFKit from 'pdfkit';

interface DeliveryData {
  conditionPhotos: string[];
  newDamagePhotos: string[];
  deliveryNotes: string;
  customerSignature?: string;
  deliveryConfirmed: boolean;
  gpsCoordinates?: { lat: number; lng: number };
}

interface Job {
  id: string;
  jobNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  vehicleReg: string;
  vehicleMake: string;
  vehicleModel: string;
  vin?: string;
  color?: string;
  collectionAddress: string;
  deliveryAddress: string;
  deliveryDate?: string;
  driverId: string;
  specialInstructions?: string;
}

interface Driver {
  name: string;
  email?: string;
  phone?: string;
}

const PRIMARY_COLOR = '#00ABE7';

export class LightPODGenerator {
  private doc: PDFKit.PDFDocument;

  constructor() {
    this.doc = new PDFKit.PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: 'Proof of Delivery',
        Author: 'OVM',
        Subject: 'Vehicle Delivery Documentation',
      }
    });
  }

  async generatePOD(job: Job, driver: Driver, deliveryData: DeliveryData, collectionData?: any): Promise<Buffer> {
    // Generate PDF content
    await this.createHeader(job);
    await this.createJobDetails(job, driver, deliveryData);
    await this.createVehicleDetails(job);
    await this.createConditionComparison(deliveryData, collectionData);
    await this.createPhotosSection(deliveryData);
    await this.createDeliveryConfirmation(deliveryData);
    await this.createSignatureSection(deliveryData, driver);
    await this.createFooter();

    // Finalize document
    this.doc.end();

    // Convert to buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
    });
  }

  private async createHeader(job: Job) {
    // Header background
    this.doc.rect(0, 0, this.doc.page.width, 120)
      .fill('#f8fafc');

    // OVM Logo placeholder and title
    this.doc.fontSize(28)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('OVM TRANSPORT', 60, 30);

    this.doc.fontSize(16)
      .fillColor('#64748b')
      .font('Helvetica')
      .text('Professional Vehicle Transport Services', 60, 65);

    // Document title
    this.doc.fontSize(24)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text('PROOF OF DELIVERY', 300, 40);

    // Job number
    this.doc.fontSize(14)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text(`Job Number: ${job.jobNumber}`, 300, 75);

    // Delivery date
    this.doc.fontSize(12)
      .fillColor('#64748b')
      .font('Helvetica')
      .text(`Delivery Date: ${new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 300, 95);

    this.doc.moveDown(3);
  }

  private async createJobDetails(job: Job, driver: Driver, deliveryData: DeliveryData) {
    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('DELIVERY DETAILS', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(220, startY + 20)
      .stroke();

    this.doc.moveDown(1);

    // Delivery details in two columns
    const leftColumn = 60;
    const rightColumn = 300;
    let currentY = this.doc.y;

    // Left column - Customer info
    this.doc.fontSize(12)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text('Customer Information:', leftColumn, currentY);

    currentY += 20;
    this.doc.fontSize(11)
      .fillColor('#475569')
      .font('Helvetica')
      .text(`Name: ${job.customerName}`, leftColumn, currentY);

    if (job.customerPhone) {
      currentY += 15;
      this.doc.text(`Phone: ${job.customerPhone}`, leftColumn, currentY);
    }

    currentY += 20;
    this.doc.font('Helvetica-Bold')
      .text('Delivery Address:', leftColumn, currentY);

    currentY += 15;
    this.doc.font('Helvetica')
      .text(job.deliveryAddress, leftColumn, currentY, { width: 200 });

    // Right column - Driver info
    this.doc.fontSize(12)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text('Driver Information:', rightColumn, this.doc.y - 100);

    let rightY = this.doc.y - 80;
    this.doc.fontSize(11)
      .fillColor('#475569')
      .font('Helvetica')
      .text(`Driver: ${driver.name}`, rightColumn, rightY);

    if (driver.phone) {
      rightY += 15;
      this.doc.text(`Phone: ${driver.phone}`, rightColumn, rightY);
    }

    if (deliveryData.gpsCoordinates) {
      rightY += 20;
      this.doc.font('Helvetica-Bold')
        .text('Delivery GPS Coordinates:', rightColumn, rightY);

      rightY += 15;
      this.doc.font('Helvetica')
        .text(`${deliveryData.gpsCoordinates.lat.toFixed(6)}, ${deliveryData.gpsCoordinates.lng.toFixed(6)}`, rightColumn, rightY);
    }

    this.doc.moveDown(4);
  }

  private async createVehicleDetails(job: Job) {
    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('VEHICLE DETAILS', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(220, startY + 20)
      .stroke();

    this.doc.moveDown(1);

    // Vehicle details table
    const details = [
      ['Registration:', job.vehicleReg],
      ['Make & Model:', `${job.vehicleMake} ${job.vehicleModel}`],
      ['Color:', job.color || 'Not specified'],
      ['VIN:', job.vin || 'Not provided'],
    ];

    const tableStartY = this.doc.y;
    const rowHeight = 25;

    details.forEach((row, index) => {
      const y = tableStartY + (index * rowHeight);
      
      // Alternating row background
      if (index % 2 === 0) {
        this.doc.rect(60, y - 5, 480, rowHeight)
          .fill('#f8fafc');
      }

      this.doc.fontSize(11)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(row[0], 80, y);

      this.doc.font('Helvetica')
        .fillColor('#475569')
        .text(row[1], 200, y);
    });

    this.doc.moveDown(3);
  }

  private async createConditionComparison(deliveryData: DeliveryData, collectionData?: any) {
    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('CONDITION ASSESSMENT', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(280, startY + 20)
      .stroke();

    this.doc.moveDown(1);

    // Collection vs Delivery comparison
    if (collectionData) {
      this.doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('Collection vs Delivery Comparison:', 60, this.doc.y);

      this.doc.moveDown(1);

      const collectionDamage = collectionData.damageMarkers?.length || 0;
      const newDamage = deliveryData.newDamagePhotos.length;

      if (newDamage === 0) {
        // No new damage
        this.doc.rect(60, this.doc.y, 480, 60)
          .fill('#f0fdf4')
          .stroke('#22c55e');

        this.doc.fontSize(14)
          .fillColor('#16a34a')
          .font('Helvetica-Bold')
          .text('✓ NO NEW DAMAGE DURING TRANSPORT', 80, this.doc.y - 35);

        this.doc.fontSize(11)
          .fillColor('#15803d')
          .font('Helvetica')
          .text('Vehicle delivered in same condition as collected.', 80, this.doc.y - 15);
      } else {
        // New damage found
        this.doc.rect(60, this.doc.y, 480, 60)
          .fill('#fef2f2')
          .stroke('#ef4444');

        this.doc.fontSize(14)
          .fillColor('#dc2626')
          .font('Helvetica-Bold')
          .text(`⚠ NEW DAMAGE IDENTIFIED DURING TRANSPORT`, 80, this.doc.y - 35);

        this.doc.fontSize(11)
          .fillColor('#b91c1c')
          .font('Helvetica')
          .text(`${newDamage} new damage item(s) documented with photos.`, 80, this.doc.y - 15);
      }

      this.doc.moveDown(2);
    }

    // Delivery notes
    if (deliveryData.deliveryNotes) {
      this.doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('Delivery Notes:', 60, this.doc.y);

      this.doc.moveDown(0.5);

      this.doc.fontSize(11)
        .fillColor('#475569')
        .font('Helvetica')
        .text(deliveryData.deliveryNotes, 80, this.doc.y, { width: 460 });

      this.doc.moveDown(2);
    }
  }

  private async createPhotosSection(deliveryData: DeliveryData) {
    // Check if we have any photos
    const allPhotos = [
      ...deliveryData.conditionPhotos,
      ...deliveryData.newDamagePhotos
    ];

    if (allPhotos.length === 0) return;

    // Start new page for photos if needed
    if (this.doc.y > 600) {
      this.doc.addPage();
    }

    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('DELIVERY DOCUMENTATION', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(320, startY + 20)
      .stroke();

    this.doc.moveDown(1);

    // Condition photos
    if (deliveryData.conditionPhotos.length > 0) {
      await this.addPhotoCategory('Vehicle Condition at Delivery', deliveryData.conditionPhotos);
    }

    // New damage photos
    if (deliveryData.newDamagePhotos.length > 0) {
      await this.addPhotoCategory('New Damage During Transport', deliveryData.newDamagePhotos);
    }
  }

  private async addPhotoCategory(title: string, photos: string[]) {
    if (photos.length === 0) return;

    this.doc.fontSize(12)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text(title, 60, this.doc.y);

    this.doc.moveDown(0.5);

    // Add photos in grid (2 per row)
    const photoWidth = 220;
    const photoHeight = 165;
    const spacing = 20;
    
    for (let i = 0; i < photos.length; i += 2) {
      // Check if we need a new page
      if (this.doc.y + photoHeight > 750) {
        this.doc.addPage();
      }

      const currentY = this.doc.y;
      
      // First photo
      try {
        await this.addPhotoToDoc(photos[i], 60, currentY, photoWidth, photoHeight, `Photo ${i + 1}`);
      } catch (error) {
        console.error('Failed to add photo:', error);
      }

      // Second photo (if exists)
      if (i + 1 < photos.length) {
        try {
          await this.addPhotoToDoc(photos[i + 1], 60 + photoWidth + spacing, currentY, photoWidth, photoHeight, `Photo ${i + 2}`);
        } catch (error) {
          console.error('Failed to add photo:', error);
        }
      }

      this.doc.y = currentY + photoHeight + 30;
    }

    this.doc.moveDown(1);
  }

  private async addPhotoToDoc(photoUrl: string, x: number, y: number, width: number, height: number, caption: string) {
    try {
      // Convert base64 to buffer
      const base64Data = photoUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const photoBuffer = Buffer.from(base64Data, 'base64');

      // Add photo border
      this.doc.rect(x - 2, y - 2, width + 4, height + 4)
        .stroke('#e2e8f0');

      // Add photo
      this.doc.image(photoBuffer, x, y, {
        width: width,
        height: height,
        fit: [width, height],
        align: 'center'
      });

      // Add caption
      this.doc.fontSize(9)
        .fillColor('#64748b')
        .font('Helvetica')
        .text(caption, x, y + height + 5, { width: width, align: 'center' });

    } catch (error) {
      console.error('Error adding photo to PDF:', error);
      
      // Add placeholder for failed photo
      this.doc.rect(x, y, width, height)
        .fill('#f1f5f9')
        .stroke('#cbd5e1');

      this.doc.fontSize(10)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Photo unavailable', x + 10, y + height/2, { width: width - 20, align: 'center' });
    }
  }

  private async createDeliveryConfirmation(deliveryData: DeliveryData) {
    if (this.doc.y > 650) {
      this.doc.addPage();
    }

    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('DELIVERY CONFIRMATION', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(300, startY + 20)
      .stroke();

    this.doc.moveDown(1);

    // Delivery confirmation details
    if (deliveryData.deliveryConfirmed) {
      this.doc.rect(60, this.doc.y, 480, 40)
        .fill('#f0fdf4')
        .stroke('#22c55e');

      this.doc.fontSize(12)
        .fillColor('#16a34a')
        .font('Helvetica-Bold')
        .text('✓ DELIVERY CONFIRMED', 80, this.doc.y - 25);

      this.doc.fontSize(10)
        .fillColor('#15803d')
        .font('Helvetica')
        .text('Vehicle successfully delivered to the specified address.', 80, this.doc.y - 10);

      this.doc.moveDown(2);
    }

    // Delivery timestamp
    this.doc.fontSize(11)
      .fillColor('#475569')
      .font('Helvetica')
      .text(`Delivery completed: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 60, this.doc.y);

    if (deliveryData.gpsCoordinates) {
      this.doc.text(`GPS Location: ${deliveryData.gpsCoordinates.lat.toFixed(6)}, ${deliveryData.gpsCoordinates.lng.toFixed(6)}`, 60, this.doc.y);
    }

    this.doc.moveDown(2);
  }

  private async createSignatureSection(deliveryData: DeliveryData, driver: Driver) {
    // Ensure we have space for signatures
    if (this.doc.y > 650) {
      this.doc.addPage();
    }

    const startY = this.doc.y;

    // Section header
    this.doc.fontSize(16)
      .fillColor(PRIMARY_COLOR)
      .font('Helvetica-Bold')
      .text('DELIVERY ACCEPTANCE', 60, startY);

    // Draw underline
    this.doc.strokeColor(PRIMARY_COLOR)
      .lineWidth(2)
      .moveTo(60, startY + 20)
      .lineTo(290, startY + 20)
      .stroke();

    this.doc.moveDown(2);

    // Customer signature
    if (deliveryData.customerSignature) {
      this.doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('Customer Acceptance Signature:', 60, this.doc.y);

      try {
        const signatureY = this.doc.y + 20;
        const base64Data = deliveryData.customerSignature.replace(/^data:image\/[a-z]+;base64,/, '');
        const signatureBuffer = Buffer.from(base64Data, 'base64');

        // Add signature border
        this.doc.rect(58, signatureY - 2, 204, 82)
          .stroke('#cbd5e1');

        // Add signature
        this.doc.image(signatureBuffer, 60, signatureY, {
          width: 200,
          height: 80,
          fit: [200, 80]
        });

        this.doc.y = signatureY + 90;
      } catch (error) {
        console.error('Error adding signature:', error);
        this.doc.moveDown(4);
      }

      this.doc.fontSize(10)
        .fillColor('#475569')
        .font('Helvetica')
        .text('Customer confirms receipt and acceptance of vehicle as documented', 60, this.doc.y);
      
      this.doc.text(`Accepted: ${new Date().toLocaleDateString('en-GB')}`, 60, this.doc.y);
    } else {
      this.doc.fontSize(12)
        .fillColor('#dc2626')
        .font('Helvetica-Bold')
        .text('⚠ Customer signature not captured', 60, this.doc.y);
    }

    this.doc.moveDown(3);

    // Driver confirmation
    this.doc.fontSize(12)
      .fillColor('#1e293b')
      .font('Helvetica-Bold')
      .text('Driver Confirmation:', 60, this.doc.y);

    this.doc.moveDown(1);

    this.doc.fontSize(11)
      .fillColor('#475569')
      .font('Helvetica')
      .text(`Driver: ${driver.name}`, 60, this.doc.y);
    
    this.doc.text(`Delivery completed: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 60, this.doc.y);
    
    this.doc.text('Vehicle delivered in documented condition', 60, this.doc.y);
  }

  private async createFooter() {
    // Document footer
    const footerY = this.doc.page.height - 60;
    
    this.doc.fontSize(8)
      .fillColor('#9ca3af')
      .font('Helvetica')
      .text('This document serves as proof of vehicle delivery and condition assessment.', 60, footerY);
    
    this.doc.text(`Generated: ${new Date().toISOString()}`, 60, footerY + 12);
    
    this.doc.text('OVM - Professional Vehicle Movement Services', 60, footerY + 24);
  }
}

export async function generateLightPOD(job: Job, driver: Driver, deliveryData: DeliveryData, collectionData?: any): Promise<Buffer> {
  const generator = new LightPODGenerator();
  return await generator.generatePOD(job, driver, deliveryData, collectionData);
}