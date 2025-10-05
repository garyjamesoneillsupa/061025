import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { FileStorageService } from './fileStorage';

export class ArchiveService {
  private static rootPath = 'Jobs';

  /**
   * Create a ZIP archive of specific job folders
   */
  static async createJobArchive(
    jobIds: string[],
    archiveName?: string
  ): Promise<{
    archivePath: string;
    totalJobs: number;
    totalSize: number;
    includedJobs: string[];
    failedJobs: string[];
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultName = `OVM-Archive-${timestamp}.zip`;
    const fileName = archiveName || defaultName;
    const archivePath = path.join('archives', fileName);

    // Ensure archives directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const output = fs.createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } }); // Maximum compression

    let totalSize = 0;
    const includedJobs: string[] = [];
    const failedJobs: string[] = [];

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({
          archivePath,
          totalJobs: includedJobs.length,
          totalSize: archive.pointer(),
          includedJobs,
          failedJobs
        });
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      // Add each job folder to the archive
      for (const jobId of jobIds) {
        try {
          const jobPath = path.join(this.rootPath, jobId);
          
          if (fs.existsSync(jobPath)) {
            // Get folder size before archiving
            const folderSize = this.getFolderSize(jobPath);
            totalSize += folderSize;

            // Add entire job folder with its structure
            archive.directory(jobPath, jobId);
            includedJobs.push(jobId);
          } else {
            failedJobs.push(jobId);
          }
        } catch (error) {
          console.error(`Failed to archive job ${jobId}:`, error);
          failedJobs.push(jobId);
        }
      }

      archive.finalize();
    });
  }

  /**
   * Create archive of jobs older than specified date
   */
  static async archiveJobsByDate(
    cutoffDate: Date,
    archiveName?: string
  ): Promise<{
    archivePath: string;
    totalJobs: number;
    totalSize: number;
    jobsArchived: string[];
  }> {
    const allJobFolders = FileStorageService.getAllJobFolders();
    const oldJobs: string[] = [];

    for (const jobId of allJobFolders) {
      try {
        const jobPath = path.join(this.rootPath, jobId);
        const stats = fs.statSync(jobPath);
        
        if (stats.mtime < cutoffDate) {
          oldJobs.push(jobId);
        }
      } catch (error) {
        console.warn(`Could not check date for job ${jobId}:`, error);
      }
    }

    const result = await this.createJobArchive(oldJobs, archiveName);
    return {
      archivePath: result.archivePath,
      totalJobs: result.totalJobs,
      totalSize: result.totalSize,
      jobsArchived: result.includedJobs
    };
  }

  /**
   * Delete job folders after successful archiving
   */
  static async cleanupArchivedJobs(jobIds: string[]): Promise<{
    deleted: string[];
    failed: string[];
    spaceFreed: number;
  }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    let spaceFreed = 0;

    for (const jobId of jobIds) {
      try {
        const jobPath = path.join(this.rootPath, jobId);
        
        if (fs.existsSync(jobPath)) {
          // Calculate space before deletion
          const folderSize = this.getFolderSize(jobPath);
          
          // Remove the entire job folder
          fs.rmSync(jobPath, { recursive: true, force: true });
          
          deleted.push(jobId);
          spaceFreed += folderSize;
        } else {
          failed.push(jobId);
        }
      } catch (error) {
        console.error(`Failed to delete job folder ${jobId}:`, error);
        failed.push(jobId);
      }
    }

    return { deleted, failed, spaceFreed };
  }

  /**
   * Get list of available archives
   */
  static getAvailableArchives(): Array<{
    filename: string;
    size: number;
    created: Date;
    downloadUrl: string;
  }> {
    const archiveDir = 'archives';
    
    if (!fs.existsSync(archiveDir)) {
      return [];
    }

    const files = fs.readdirSync(archiveDir);
    return files
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(archiveDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          downloadUrl: `/archives/${file}`
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());
  }

  /**
   * Calculate folder size recursively
   */
  private static getFolderSize(folderPath: string): number {
    let totalSize = 0;

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

    return totalSize;
  }

  /**
   * Get storage statistics
   */
  static getStorageStats(): {
    totalJobs: number;
    totalSize: number;
    averageJobSize: number;
    oldestJob: string | null;
    newestJob: string | null;
  } {
    const allJobFolders = FileStorageService.getAllJobFolders();
    let totalSize = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    let oldestJob: string | null = null;
    let newestJob: string | null = null;

    for (const jobId of allJobFolders) {
      try {
        const jobPath = path.join(this.rootPath, jobId);
        const folderSize = this.getFolderSize(jobPath);
        const stats = fs.statSync(jobPath);

        totalSize += folderSize;

        if (stats.mtime < oldestDate) {
          oldestDate = stats.mtime;
          oldestJob = jobId;
        }

        if (stats.mtime > newestDate) {
          newestDate = stats.mtime;
          newestJob = jobId;
        }
      } catch (error) {
        console.warn(`Could not get stats for job ${jobId}:`, error);
      }
    }

    return {
      totalJobs: allJobFolders.length,
      totalSize,
      averageJobSize: allJobFolders.length > 0 ? Math.round(totalSize / allJobFolders.length) : 0,
      oldestJob,
      newestJob
    };
  }
}