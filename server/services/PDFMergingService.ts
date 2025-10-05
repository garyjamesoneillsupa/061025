import PDFMerger from 'pdf-merger-js';
import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

export interface MergeOptions {
  outputPath?: string;
  cleanup?: boolean;
}

export interface BatchPDFData {
  customerName: string;
  batchNumber: string;
  weekPeriod: string;
  pdfPaths: string[];
}

export class PDFMergingService {
  /**
   * Merges multiple PDF files into a single document
   * @param pdfPaths - Array of absolute paths to PDF files
   * @param options - Merge options
   * @returns Buffer containing the merged PDF
   */
  static async mergePDFs(pdfPaths: string[], options: MergeOptions = {}): Promise<Buffer> {
    const merger = new PDFMerger();
    
    try {
      // Validate all input files exist
      for (const pdfPath of pdfPaths) {
        if (!fs.existsSync(pdfPath)) {
          throw new Error(`PDF file not found: ${pdfPath}`);
        }
      }

      // Add all PDFs to merger
      for (const pdfPath of pdfPaths) {
        await merger.add(pdfPath);
      }

      // Generate merged PDF buffer
      const mergedPdfBuffer = await merger.saveAsBuffer();
      
      return mergedPdfBuffer;
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a batch invoice by merging individual job invoice PDFs
   * @param batchData - Batch invoice data including PDF paths
   * @param outputDir - Directory to save the merged PDF (optional)
   * @returns Object with merged PDF buffer and optional file path
   */
  static async createBatchInvoice(
    batchData: BatchPDFData, 
    outputDir?: string
  ): Promise<{ buffer: Buffer; filePath?: string }> {
    
    if (batchData.pdfPaths.length === 0) {
      throw new Error('No PDF files provided for batch invoice');
    }

    console.log(`📄 Creating batch invoice for ${batchData.customerName}`);
    console.log(`📄 Merging ${batchData.pdfPaths.length} invoice PDFs`);

    try {
      // Merge all individual invoice PDFs
      const mergedBuffer = await this.mergePDFs(batchData.pdfPaths);

      let filePath: string | undefined;
      
      // Save to file if output directory provided
      if (outputDir) {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate safe filename
        const safeCustomerName = batchData.customerName
          .replace(/[^a-zA-Z0-9\-_]/g, '_')
          .substring(0, 50);
        
        const filename = `${batchData.batchNumber}_${safeCustomerName}_${batchData.weekPeriod}.pdf`;
        filePath = path.join(outputDir, filename);

        // Write merged PDF to file
        fs.writeFileSync(filePath, mergedBuffer);
        console.log(`📄 Batch invoice saved: ${filePath}`);
      }

      return {
        buffer: mergedBuffer,
        filePath
      };

    } catch (error) {
      console.error('Error creating batch invoice:', error);
      throw new Error(`Failed to create batch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates individual job invoice PDFs before merging
   * @param jobs - Array of jobs with invoice data
   * @param tempDir - Temporary directory for individual PDFs
   * @returns Array of PDF file paths
   */
  static async generateIndividualInvoicePDFs(
    jobs: Array<{
      id: string;
      jobNumber: string;
      invoiceData: any;
    }>,
    tempDir: string
  ): Promise<string[]> {
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const pdfPaths: string[] = [];

    try {
      // Import the invoice PDF service
      const { GoldStandardInvoicePDFService } = await import('./gold-standard-invoice-pdf');

      for (const job of jobs) {
        console.log(`📄 Generating invoice PDF for job ${job.jobNumber}`);
        
        // Generate individual invoice PDF
        const pdfBuffer = await GoldStandardInvoicePDFService.generateInvoice(job.invoiceData);
        
        // Save to temp file
        const filename = `invoice_${job.jobNumber}_${nanoid(8)}.pdf`;
        const filePath = path.join(tempDir, filename);
        
        fs.writeFileSync(filePath, pdfBuffer);
        pdfPaths.push(filePath);
      }

      console.log(`📄 Generated ${pdfPaths.length} individual invoice PDFs`);
      return pdfPaths;

    } catch (error) {
      // Clean up any generated files on error
      pdfPaths.forEach(pdfPath => {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      });
      
      console.error('Error generating individual invoice PDFs:', error);
      throw new Error(`Failed to generate individual invoice PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up temporary PDF files
   * @param pdfPaths - Array of PDF file paths to delete
   */
  static cleanupTempFiles(pdfPaths: string[]): void {
    pdfPaths.forEach(pdfPath => {
      try {
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
          console.log(`🗑️ Cleaned up temp file: ${path.basename(pdfPath)}`);
        }
      } catch (error) {
        console.warn(`Warning: Could not clean up temp file ${pdfPath}:`, error);
      }
    });
  }

  /**
   * Creates directory structure for batch invoices
   * @param baseDir - Base directory for batch invoices
   * @param customerId - Customer ID
   * @param year - Year
   * @param week - Week number
   * @returns Directory path
   */
  static createBatchInvoiceDirectory(baseDir: string, customerId: string, year: number, week: number): string {
    const yearDir = path.join(baseDir, 'batch-invoices', year.toString());
    const customerDir = path.join(yearDir, customerId);
    const weekDir = path.join(customerDir, `week-${week.toString().padStart(2, '0')}`);
    
    if (!fs.existsSync(weekDir)) {
      fs.mkdirSync(weekDir, { recursive: true });
    }
    
    return weekDir;
  }
}