import fs from 'fs';
import path from 'path';
import { ImageCompressionService } from './imageCompression';

export class FileStorageService {
  private static rootPath = 'Jobs';
  
  // Security: Validate and sanitize file paths to prevent path traversal
  private static sanitizePath(input: string): string {
    return input
      .replace(/\.\./g, '') // Remove directory traversal
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/\//g, '') // Remove path separators
      .replace(/\\/g, '') // Remove backslashes
      .trim();
  }
  
  // Validate file types for security
  private static isValidFileType(filename: string): boolean {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.txt'];
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  // Extract month from job number (DDMMYYXXX format)
  static getMonthFromJobNumber(jobNumber: string): string {
    // Sanitize job number first
    const sanitizedJobNumber = this.sanitizePath(jobNumber);
    if (sanitizedJobNumber.length < 6) {
      throw new Error('Invalid job number format');
    }
    
    // Extract DDMMYY from job number
    const dateStr = sanitizedJobNumber.substring(0, 6); // DDMMYY
    const dd = dateStr.substring(0, 2);
    const mm = dateStr.substring(2, 4);
    const yy = dateStr.substring(4, 6);
    
    // Convert to full year (assume 20XX)
    const year = `20${yy}`;
    
    // Create month name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndex = parseInt(mm) - 1;
    const monthName = monthNames[monthIndex] || 'Unknown';
    
    return `${monthName} ${year}`;
  }

  // Create the job folder structure
  static createJobFolderStructure(jobNumber: string): void {
    const month = this.getMonthFromJobNumber(jobNumber);
    const jobPath = path.join(this.rootPath, month, jobNumber);
    const documentsPath = path.join(jobPath, 'Documents');
    const photosPath = path.join(documentsPath, 'Photos');
    const collectionPhotosPath = path.join(photosPath, 'Collection');
    const deliveryPhotosPath = path.join(photosPath, 'Delivery');
    const expensesPath = path.join(jobPath, 'Expenses');
    const expensesCollectionPath = path.join(expensesPath, 'Collection');
    const expensesDeliveryPath = path.join(expensesPath, 'Delivery');

    // Create main job folder
    if (!fs.existsSync(jobPath)) {
      fs.mkdirSync(jobPath, { recursive: true });
    }

    // Create Documents folder
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }

    // Create Documents/Photos folder
    if (!fs.existsSync(photosPath)) {
      fs.mkdirSync(photosPath, { recursive: true });
    }

    // Create Documents/Photos/Collection folder
    if (!fs.existsSync(collectionPhotosPath)) {
      fs.mkdirSync(collectionPhotosPath, { recursive: true });
    }

    // Create Documents/Photos/Delivery folder
    if (!fs.existsSync(deliveryPhotosPath)) {
      fs.mkdirSync(deliveryPhotosPath, { recursive: true });
    }

    // Create Expenses folder
    if (!fs.existsSync(expensesPath)) {
      fs.mkdirSync(expensesPath, { recursive: true });
    }

    // Create Expenses/Collection folder
    if (!fs.existsSync(expensesCollectionPath)) {
      fs.mkdirSync(expensesCollectionPath, { recursive: true });
    }

    // Create Expenses/Delivery folder
    if (!fs.existsSync(expensesDeliveryPath)) {
      fs.mkdirSync(expensesDeliveryPath, { recursive: true });
    }
  }

  // Get file paths for job documents
  static getJobPaths(jobNumber: string) {
    const month = this.getMonthFromJobNumber(jobNumber);
    const jobPath = path.join(this.rootPath, month, jobNumber);
    return {
      jobFolder: jobPath,
      documents: path.join(jobPath, 'Documents'),
      photos: path.join(jobPath, 'Documents', 'Photos'),
      collectionPhotos: path.join(jobPath, 'Documents', 'Photos', 'Collection'),
      deliveryPhotos: path.join(jobPath, 'Documents', 'Photos', 'Delivery'),
      expenses: path.join(jobPath, 'Expenses'),
      expensesCollection: path.join(jobPath, 'Expenses', 'Collection'),
      expensesDelivery: path.join(jobPath, 'Expenses', 'Delivery'),
      pocPdf: path.join(jobPath, 'Documents', 'POC.pdf'),
      podPdf: path.join(jobPath, 'Documents', 'POD.pdf'),
      invoicePdf: path.join(jobPath, 'Documents', 'Invoice.pdf')
    };
  }

  // Save photo with automatic compression and security validation
  static async saveJobPhoto(
    jobNumber: string, 
    fileName: string, 
    buffer: Buffer,
    stage: 'collection' | 'delivery' = 'collection',
    category: 'damage' | 'process' | 'general' = 'general'
  ): Promise<{
    filePath: string;
    thumbnailPath?: string;
    compressionStats: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    };
  }> {
    // Security validation
    const sanitizedJobNumber = this.sanitizePath(jobNumber);
    const sanitizedFileName = this.sanitizePath(fileName);
    
    if (!this.isValidFileType(sanitizedFileName)) {
      throw new Error('Invalid file type. Only images and PDFs are allowed.');
    }
    
    if (buffer.length > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File size exceeds maximum limit of 50MB');
    }
    
    this.createJobFolderStructure(sanitizedJobNumber);
    const paths = this.getJobPaths(sanitizedJobNumber);
    const photosPath = stage === 'collection' ? paths.collectionPhotos : paths.deliveryPhotos;
    
    // Compress the image
    const compressionResult = await ImageCompressionService.compressImage(buffer, category, true);
    
    // Save compressed image with sanitized filename
    const filePath = path.join(photosPath, sanitizedFileName);
    fs.writeFileSync(filePath, compressionResult.compressed);
    
    // Save thumbnail if generated
    let thumbnailPath: string | undefined;
    if (compressionResult.thumbnail) {
      const thumbFileName = `thumb_${sanitizedFileName}`;
      thumbnailPath = path.join(photosPath, thumbFileName);
      fs.writeFileSync(thumbnailPath, compressionResult.thumbnail);
    }
    
    return {
      filePath,
      thumbnailPath,
      compressionStats: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio
      }
    };
  }

  // Save PDF document
  static saveJobDocument(jobNumber: string, documentType: 'POC' | 'POD' | 'Invoice', buffer: Buffer): string;
  static saveJobDocument(jobNumber: string, fileName: string, buffer: Buffer, subfolder: 'Documents'): string;
  static saveJobDocument(jobNumber: string, documentTypeOrFileName: 'POC' | 'POD' | 'Invoice' | string, buffer: Buffer, subfolder?: 'Documents'): string {
    this.createJobFolderStructure(jobNumber);
    const month = this.getMonthFromJobNumber(jobNumber);
    
    let fileName: string;
    let documentsPath: string;
    
    if (subfolder === 'Documents') {
      // New signature: custom filename in Documents folder
      fileName = documentTypeOrFileName as string;
      documentsPath = path.join(this.rootPath, month, jobNumber, 'Documents');
    } else {
      // Original signature: predefined document type
      const documentType = documentTypeOrFileName as 'POC' | 'POD' | 'Invoice';
      fileName = `${documentType}.pdf`;
      documentsPath = path.join(this.rootPath, month, jobNumber, 'Documents');
    }
    
    const filePath = path.join(documentsPath, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  // Get all photos for a job by stage
  static getJobPhotos(jobNumber: string, stage?: 'collection' | 'delivery'): string[] {
    const paths = this.getJobPaths(jobNumber);
    
    if (stage) {
      // Get photos for specific stage
      const stagePath = stage === 'collection' ? paths.collectionPhotos : paths.deliveryPhotos;
      if (!fs.existsSync(stagePath)) {
        return [];
      }
      return fs.readdirSync(stagePath)
        .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
        .map(file => path.join(stagePath, file));
    } else {
      // Get all photos from both stages
      const allPhotos: string[] = [];
      
      // Collection photos
      if (fs.existsSync(paths.collectionPhotos)) {
        const collectionPhotos = fs.readdirSync(paths.collectionPhotos)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
          .map(file => path.join(paths.collectionPhotos, file));
        allPhotos.push(...collectionPhotos);
      }
      
      // Delivery photos
      if (fs.existsSync(paths.deliveryPhotos)) {
        const deliveryPhotos = fs.readdirSync(paths.deliveryPhotos)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
          .map(file => path.join(paths.deliveryPhotos, file));
        allPhotos.push(...deliveryPhotos);
      }
      
      return allPhotos;
    }
  }

  // Save expense receipt photo with watermark
  static async saveExpenseReceipt(
    jobNumber: string, 
    expenseType: string,
    vehicleReg: string,
    buffer: Buffer,
    stage: 'collection' | 'delivery' = 'collection'
  ): Promise<{
    filePath: string;
    fileName: string;
    compressionStats: {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    };
  }> {
    this.createJobFolderStructure(jobNumber);
    const paths = this.getJobPaths(jobNumber);
    const expensesPath = stage === 'collection' ? paths.expensesCollection : paths.expensesDelivery;
    
    // Add watermark to receipt photo
    const watermarkedBuffer = await ImageCompressionService.addExpenseWatermark(
      buffer,
      jobNumber,
      vehicleReg
    );
    
    // Compress the watermarked receipt image with premium quality for receipts
    const compressionResult = await ImageCompressionService.compressImage(watermarkedBuffer, 'expense', false);
    
    // Generate filename: {type}_receipt_{jobNumber} ({vehicleReg}).jpg
    const fileName = `${expenseType}_receipt_${jobNumber} (${vehicleReg}).jpg`;
    const filePath = path.join(expensesPath, fileName);
    fs.writeFileSync(filePath, compressionResult.compressed);
    
    console.log(`💾 Expense receipt saved: ${fileName} in ${stage} folder`);
    
    return {
      filePath,
      fileName,
      compressionStats: {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio
      }
    };
  }

  // Get all expense receipts for a job
  static getJobExpenseReceipts(jobNumber: string, stage?: 'collection' | 'delivery'): string[] {
    const paths = this.getJobPaths(jobNumber);
    
    if (stage) {
      // Get expense receipts for specific stage
      const stagePath = stage === 'collection' ? paths.expensesCollection : paths.expensesDelivery;
      if (!fs.existsSync(stagePath)) {
        return [];
      }
      return fs.readdirSync(stagePath)
        .filter(file => file.match(/\.(jpg|jpeg|png|gif|pdf)$/i))
        .map(file => path.join(stagePath, file));
    } else {
      // Get all expense receipts from both stages
      const allReceipts: string[] = [];
      
      // Collection expenses
      if (fs.existsSync(paths.expensesCollection)) {
        const collectionReceipts = fs.readdirSync(paths.expensesCollection)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif|pdf)$/i))
          .map(file => path.join(paths.expensesCollection, file));
        allReceipts.push(...collectionReceipts);
      }
      
      // Delivery expenses
      if (fs.existsSync(paths.expensesDelivery)) {
        const deliveryReceipts = fs.readdirSync(paths.expensesDelivery)
          .filter(file => file.match(/\.(jpg|jpeg|png|gif|pdf)$/i))
          .map(file => path.join(paths.expensesDelivery, file));
        allReceipts.push(...deliveryReceipts);
      }
      
      return allReceipts;
    }
  }

  // Check if document exists
  static documentExists(jobNumber: string, documentType: 'POC' | 'POD' | 'Invoice'): boolean {
    const paths = this.getJobPaths(jobNumber);
    const filePath = paths[`${documentType.toLowerCase()}Pdf` as keyof typeof paths] as string;
    return fs.existsSync(filePath);
  }

  // Get document path
  static getDocumentPath(jobNumber: string, documentType: 'POC' | 'POD' | 'Invoice'): string {
    const paths = this.getJobPaths(jobNumber);
    return paths[`${documentType.toLowerCase()}Pdf` as keyof typeof paths] as string;
  }

  // Clean up job folder (optional - for maintenance)
  static cleanupJobFolder(jobNumber: string): void {
    const month = this.getMonthFromJobNumber(jobNumber);
    const jobPath = path.join(this.rootPath, month, jobNumber);
    if (fs.existsSync(jobPath)) {
      fs.rmSync(jobPath, { recursive: true, force: true });
    }
  }

  // List all job folders
  static getAllJobFolders(): string[] {
    if (!fs.existsSync(this.rootPath)) {
      return [];
    }
    
    return fs.readdirSync(this.rootPath)
      .filter(item => {
        const itemPath = path.join(this.rootPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
  }
}