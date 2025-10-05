import { db } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createDatabaseBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ovm-db-backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    try {
      const tables = [
        'customers',
        'customer_addresses', 
        'drivers',
        'vehicles',
        'jobs',
        'invoices',
        'expenses',
        'job_process_records',
        'damage_reports',
        'photos',
        'user_credentials',
        'settings'
      ];

      let backupContent = `-- OVM System Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Environment: ${process.env.NODE_ENV || 'development'}\n\n`;

      for (const table of tables) {
        try {
          // Security: Validate table name to prevent SQL injection
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
            console.warn(`Skipping invalid table name: ${table}`);
            continue;
          }
          
          const data = await db.execute(sql.raw(`SELECT * FROM ${table}`));
          
          if (data.length > 0) {
            backupContent += `-- Table: ${table}\n`;
            
            // Get column names
            const columns = Object.keys(data[0]);
            const columnList = columns.join(', ');
            
            backupContent += `INSERT INTO ${table} (${columnList}) VALUES\n`;
            
            const values = data.map(row => {
              const vals = columns.map(col => {
                const val = (row as any)[col];
                if (val === null) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                return val;
              });
              return `(${vals.join(', ')})`;
            });
            
            backupContent += values.join(',\n') + ';\n\n';
          }
        } catch (error) {
          console.warn(`Skipping table ${table}:`, error);
        }
      }

      await fs.writeFile(filepath, backupContent);
      console.log(`Database backup created: ${filename}`);
      
      return filepath;
    } catch (error) {
      console.error('Database backup failed:', error);
      throw error;
    }
  }

  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ovm-full-backup-${timestamp}.zip`;
    const filepath = path.join(this.backupDir, filename);

    return new Promise(async (resolve, reject) => {
      try {
        const output = createWriteStream(filepath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(`Full backup created: ${filename} (${archive.pointer()} bytes)`);
          resolve(filepath);
        });

        archive.on('error', reject);
        archive.pipe(output);

        // Add database backup
        const dbBackupPath = await this.createDatabaseBackup();
        archive.file(dbBackupPath, { name: 'database-backup.sql' });

        // Add essential directories
        const dirsToBackup = ['Jobs', 'archives', 'uploads'];
        
        for (const dir of dirsToBackup) {
          try {
            await fs.access(dir);
            archive.directory(dir, dir);
          } catch {
            console.warn(`Directory ${dir} not found, skipping`);
          }
        }

        // Add configuration files
        const configFiles = [
          'package.json',
          'drizzle.config.ts',
          'vite.config.ts',
          'tailwind.config.ts',
          'tsconfig.json',
          'replit.md'
        ];

        for (const file of configFiles) {
          try {
            await fs.access(file);
            archive.file(file, { name: file });
          } catch {
            console.warn(`Config file ${file} not found, skipping`);
          }
        }

        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }

  async scheduleAutomaticBackups() {
    // Run backup every 24 hours
    const backupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    const runBackup = async () => {
      try {
        await this.createDatabaseBackup();
        console.log('Automatic backup completed');
        
        // Clean old backups (keep last 7)
        await this.cleanOldBackups();
      } catch (error) {
        console.error('Automatic backup failed:', error);
      }
    };

    // Run initial backup
    setTimeout(runBackup, 5000); // 5 seconds after startup

    // Schedule recurring backups
    setInterval(runBackup, backupInterval);
    
    console.log('Automatic daily backups scheduled');
  }

  private async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(f => f.includes('backup'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          stat: null as any
        }));

      // Get file stats
      for (const file of backupFiles) {
        file.stat = await fs.stat(file.path);
      }

      // Sort by creation time (newest first)
      backupFiles.sort((a, b) => b.stat.ctime.getTime() - a.stat.ctime.getTime());

      // Keep only the 7 most recent backups
      const filesToDelete = backupFiles.slice(7);
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  async getBackupStats() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = [];
      
      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stat = await fs.stat(filepath);
        backupFiles.push({
          name: file,
          size: stat.size,
          created: stat.ctime,
          type: file.includes('full') ? 'Full Backup' : 'Database Only'
        });
      }
      
      return backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return [];
    }
  }
}

export const backupService = new BackupService();