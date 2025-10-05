import path from 'path';
import crypto from 'crypto';
import type { Job } from '@shared/schema';

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256?: string;
}

export interface CanonicalJobPath {
  year: string;
  month: string;
  folderName: string; // "1993 (ABC123X)"
  canonicalPath: string; // "2025/01 January/1993 (ABC123X)"
}

/**
 * FileStorageService implements HMRC-compliant hierarchical job file organization
 * Structure: YYYY/MM Month/JobNumber (REG)/{Invoice.pdf, POD.pdf, POC.pdf, Receipts/, Notes.txt, Photos/}
 */
export class FileStorageService {
  private readonly baseStoragePath: string;

  constructor(baseStoragePath: string = 'storage') {
    this.baseStoragePath = baseStoragePath;
  }

  /**
   * Builds the canonical folder structure for a job based on HMRC requirements
   * @param job Job data containing creation date, job number
   * @param vehicleRegistration Vehicle registration (passed separately)
   * @returns Canonical path components for hierarchical organization
   */
  buildCanonicalJobPath(job: Job, vehicleRegistration?: string): CanonicalJobPath {
    // Extract year and month from job creation date
    const createdDate = job.createdAt ? new Date(job.createdAt) : new Date();
    const year = createdDate.getFullYear().toString();
    const monthNumber = (createdDate.getMonth() + 1).toString().padStart(2, '0');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[createdDate.getMonth()];
    const month = `${monthNumber} ${monthName}`;

    // Build folder name: JobNumber (Registration)
    const vehicleReg = vehicleRegistration || 'NOREG';
    const folderName = `${job.jobNumber} (${vehicleReg})`;

    // Build full canonical path
    const canonicalPath = path.join(year, month, folderName);

    return {
      year,
      month,
      folderName,
      canonicalPath
    };
  }

  /**
   * Generates the canonical file path for a specific artifact within a job
   * @param job Job data
   * @param fileName Target filename
   * @param subFolder Optional subfolder (e.g., 'Receipts', 'Photos', 'Damage')
   * @param vehicleRegistration Vehicle registration (passed separately)
   * @returns Full canonical path to the file
   */
  buildCanonicalFilePath(job: Job, fileName: string, subFolder?: string, vehicleRegistration?: string): string {
    const jobPath = this.buildCanonicalJobPath(job, vehicleRegistration);
    const components = [this.baseStoragePath, jobPath.canonicalPath];
    
    if (subFolder) {
      components.push(subFolder);
    }
    
    components.push(fileName);
    return path.join(...components);
  }

  /**
   * Determines the appropriate subfolder based on artifact type and category
   * @param type Artifact type (invoice, pod, poc, receipt, etc.)
   * @param category Photo category for photo artifacts
   * @param stage Collection or delivery stage
   * @returns Subfolder name or null for root job folder
   */
  getSubfolderForArtifact(type: string, category?: string, stage?: string): string | null {
    switch (type) {
      case 'invoice':
      case 'pod':
      case 'poc':
      case 'customer_po':
        return null; // Root job folder
      
      case 'receipt':
        return 'Receipts';
        
      case 'note':
        return null; // Notes.txt in root
        
      case 'vehicle_photo':
      case 'damage_photo':
        if (stage) {
          return `Photos/${stage === 'collection' ? 'Collection' : 'Delivery'}`;
        }
        return 'Photos';
        
      default:
        if (category === 'damage') {
          return 'Photos/Damage';
        }
        return 'Photos';
    }
  }

  /**
   * Generates the canonical filename based on artifact type and metadata
   * @param type Artifact type
   * @param originalName Original uploaded filename
   * @param metadata Additional metadata
   * @returns Standardized filename
   */
  generateCanonicalFileName(
    type: string, 
    originalName: string, 
    metadata?: { stage?: string; category?: string; timestamp?: Date }
  ): string {
    const timestamp = metadata?.timestamp || new Date();
    const stage = metadata?.stage;
    const category = metadata?.category;

    switch (type) {
      case 'invoice':
        return 'Invoice.pdf';
      case 'pod':
        return 'POD.pdf';
      case 'poc':
        return 'POC.pdf';
      case 'customer_po':
        return 'Customer PO.pdf';
      case 'note':
        return 'Notes.txt';
      case 'receipt':
        // Keep original name for receipts with timestamp prefix
        const receiptExt = path.extname(originalName);
        const receiptBase = path.basename(originalName, receiptExt);
        const timePrefix = timestamp.toISOString().slice(0, 19).replace(/:/g, '-');
        return `${timePrefix}_${receiptBase}${receiptExt}`;
      case 'vehicle_photo':
      case 'damage_photo':
        // Structured photo naming with category and timestamp
        const photoExt = path.extname(originalName);
        const photoTimePrefix = timestamp.toISOString().slice(0, 19).replace(/:/g, '-');
        const categoryPrefix = category ? `${category}_` : '';
        const stagePrefix = stage ? `${stage}_` : '';
        return `${photoTimePrefix}_${stagePrefix}${categoryPrefix}photo${photoExt}`;
      default:
        return originalName;
    }
  }

  /**
   * Calculates SHA256 hash of file contents for integrity verification
   * @param fileBuffer File contents as Buffer
   * @returns SHA256 hash string
   */
  calculateSHA256(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Builds the complete canonical path structure for year-end HMRC exports
   * @param year Target year for export
   * @returns All month folders and job paths for the year
   */
  buildYearExportStructure(year: string): {
    yearPath: string;
    months: Array<{
      monthPath: string;
      monthName: string;
    }>;
  } {
    const yearPath = path.join(this.baseStoragePath, year);
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const monthNumber = (i + 1).toString().padStart(2, '0');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[i];
      const monthPath = path.join(yearPath, `${monthNumber} ${monthName}`);
      
      months.push({
        monthPath,
        monthName: `${monthNumber} ${monthName}`
      });
    }

    return {
      yearPath,
      months
    };
  }

  /**
   * Validates that a given path follows the canonical HMRC structure
   * @param filePath Path to validate
   * @returns True if path follows canonical structure
   */
  validateCanonicalPath(filePath: string): boolean {
    const pathParts = filePath.split(path.sep);
    
    // Should have at least: storage/YYYY/MM Month/JobNumber (REG)/filename
    if (pathParts.length < 5) return false;
    
    // Check year format (4 digits)
    const yearPart = pathParts[1];
    if (!/^\d{4}$/.test(yearPart)) return false;
    
    // Check month format (MM MonthName)
    const monthPart = pathParts[2];
    if (!/^\d{2} [A-Z][a-z]+$/.test(monthPart)) return false;
    
    // Check job folder format (JobNumber (REG))
    const jobFolderPart = pathParts[3];
    if (!/^.+ \(.+\)$/.test(jobFolderPart)) return false;
    
    return true;
  }
}

export default FileStorageService;