import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { FileStorageService } from './fileStorage';

export class MonthlyArchiveService {
  private static rootPath = 'Jobs';

  /**
   * Get all available months with job counts
   */
  static getAvailableMonths(): Array<{
    monthYear: string;
    jobCount: number;
    totalSizeMB: number;
    oldestJob: string | null;
    newestJob: string | null;
  }> {
    if (!fs.existsSync(this.rootPath)) {
      return [];
    }

    const months: Array<{
      monthYear: string;
      jobCount: number;
      totalSizeMB: number;
      oldestJob: string | null;
      newestJob: string | null;
    }> = [];

    try {
      const items = fs.readdirSync(this.rootPath);
      
      for (const item of items) {
        const itemPath = path.join(this.rootPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // This could be either a month folder or a legacy job folder
          if (this.isMonthFolder(item)) {
            const monthStats = this.getMonthStatistics(item);
            months.push({
              monthYear: item,
              jobCount: monthStats.jobCount,
              totalSizeMB: Math.round(monthStats.totalSize / (1024 * 1024)),
              oldestJob: monthStats.oldestJob,
              newestJob: monthStats.newestJob
            });
          } else {
            // Legacy job folders - group them into "Legacy Jobs"
            const legacyIndex = months.findIndex(m => m.monthYear === 'Legacy Jobs');
            if (legacyIndex === -1) {
              months.push({
                monthYear: 'Legacy Jobs',
                jobCount: 1,
                totalSizeMB: Math.round(this.getFolderSize(itemPath) / (1024 * 1024)),
                oldestJob: item,
                newestJob: item
              });
            } else {
              months[legacyIndex].jobCount++;
              months[legacyIndex].totalSizeMB += Math.round(this.getFolderSize(itemPath) / (1024 * 1024));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading jobs directory:', error);
    }

    // Sort months chronologically (newest first)
    return months.sort((a, b) => {
      if (a.monthYear === 'Legacy Jobs') return 1;
      if (b.monthYear === 'Legacy Jobs') return -1;
      return this.parseMonthYear(b.monthYear).getTime() - this.parseMonthYear(a.monthYear).getTime();
    });
  }

  /**
   * Get jobs within a specific month
   */
  static getJobsInMonth(monthYear: string): Array<{
    jobId: string;
    folderPath: string;
    sizeMB: number;
    hasDocuments: {
      poc: boolean;
      pod: boolean;
      invoice: boolean;
    };
    photoCount: number;
  }> {
    const monthPath = path.join(this.rootPath, monthYear);
    
    if (!fs.existsSync(monthPath)) {
      return [];
    }

    const jobs: Array<{
      jobId: string;
      folderPath: string;
      sizeMB: number;
      hasDocuments: {
        poc: boolean;
        pod: boolean;
        invoice: boolean;
      };
      photoCount: number;
    }> = [];

    try {
      const items = fs.readdirSync(monthPath);
      
      for (const item of items) {
        const jobPath = path.join(monthPath, item);
        const stats = fs.statSync(jobPath);
        
        if (stats.isDirectory()) {
          const documentsPath = path.join(jobPath, 'Documents');
          const photosPath = path.join(jobPath, 'Photos Captured');
          
          jobs.push({
            jobId: item,
            folderPath: jobPath,
            sizeMB: Math.round(this.getFolderSize(jobPath) / (1024 * 1024)),
            hasDocuments: {
              poc: fs.existsSync(path.join(documentsPath, 'POC.pdf')),
              pod: fs.existsSync(path.join(documentsPath, 'POD.pdf')),
              invoice: fs.existsSync(path.join(documentsPath, 'Invoice.pdf'))
            },
            photoCount: fs.existsSync(photosPath) ? fs.readdirSync(photosPath).filter(f => f.endsWith('.jpg')).length : 0
          });
        }
      }
    } catch (error) {
      console.error(`Error reading month folder ${monthYear}:`, error);
    }

    return jobs.sort((a, b) => b.jobId.localeCompare(a.jobId));
  }

  /**
   * Archive entire months
   */
  static async archiveMonth(
    monthYear: string,
    archiveName?: string
  ): Promise<{
    archivePath: string;
    totalJobs: number;
    totalSize: number;
    archivedJobs: string[];
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultName = `${monthYear.replace(' ', '-')}-Archive-${timestamp}.zip`;
    const fileName = archiveName || defaultName;
    const archivePath = path.join('archives', fileName);

    // Ensure archives directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const monthPath = path.join(this.rootPath, monthYear);
    const jobs = this.getJobsInMonth(monthYear);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          archivePath,
          totalJobs: jobs.length,
          totalSize: archive.pointer(),
          archivedJobs: jobs.map(j => j.jobId)
        });
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      // Add the entire month folder to the archive
      archive.directory(monthPath, monthYear);
      archive.finalize();
    });
  }

  /**
   * Delete month folder after archiving
   */
  static async cleanupMonth(monthYear: string): Promise<{
    deleted: boolean;
    spaceFreedMB: number;
    jobsDeleted: number;
  }> {
    const monthPath = path.join(this.rootPath, monthYear);
    
    if (!fs.existsSync(monthPath)) {
      return { deleted: false, spaceFreedMB: 0, jobsDeleted: 0 };
    }

    const jobs = this.getJobsInMonth(monthYear);
    const totalSize = this.getFolderSize(monthPath);

    try {
      fs.rmSync(monthPath, { recursive: true, force: true });
      return {
        deleted: true,
        spaceFreedMB: Math.round(totalSize / (1024 * 1024)),
        jobsDeleted: jobs.length
      };
    } catch (error) {
      console.error(`Error deleting month folder ${monthYear}:`, error);
      return { deleted: false, spaceFreedMB: 0, jobsDeleted: 0 };
    }
  }

  // Helper methods
  private static isMonthFolder(folderName: string): boolean {
    // Check if folder name matches "Month Year" pattern
    const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/;
    return monthPattern.test(folderName);
  }

  private static parseMonthYear(monthYear: string): Date {
    const [month, year] = monthYear.split(' ');
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(month);
    
    return new Date(parseInt(year), monthIndex, 1);
  }

  private static getMonthStatistics(monthYear: string): {
    jobCount: number;
    totalSize: number;
    oldestJob: string | null;
    newestJob: string | null;
  } {
    const jobs = this.getJobsInMonth(monthYear);
    const totalSize = this.getFolderSize(path.join(this.rootPath, monthYear));
    
    return {
      jobCount: jobs.length,
      totalSize,
      oldestJob: jobs.length > 0 ? jobs[jobs.length - 1].jobId : null,
      newestJob: jobs.length > 0 ? jobs[0].jobId : null
    };
  }

  private static getFolderSize(folderPath: string): number {
    let totalSize = 0;

    try {
      const items = fs.readdirSync(folderPath);
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          totalSize += this.getFolderSize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Could not calculate size for ${folderPath}:`, error);
    }

    return totalSize;
  }
}