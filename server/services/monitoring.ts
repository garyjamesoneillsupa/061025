import os from 'os';
import { db } from '../db';
import { sql } from 'drizzle-orm';

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAvg: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  database: {
    connectionCount: number;
    responseTime: number;
    status: 'healthy' | 'degraded' | 'unhealthy';
  };
  application: {
    uptime: number;
    activeJobs: number;
    todayJobs: number;
    errorRate: number;
  };
}

interface PerformanceLog {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

class MonitoringService {
  private metrics: SystemMetrics[] = [];
  private performanceLogs: PerformanceLog[] = [];
  private errorCount = 0;
  private requestCount = 0;
  private startTime = Date.now();

  constructor() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Clean old data every hour
    setInterval(() => {
      this.cleanOldData();
    }, 3600000);
  }

  async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    // CPU metrics
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsage = Math.round((loadAvg[0] / cpuCount) * 100);

    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const usagePercent = Math.round((usedMemory / totalMemory) * 100);

    // Database metrics
    let dbMetrics = {
      connectionCount: 0,
      responseTime: 0,
      status: 'healthy' as const
    };

    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      dbMetrics.responseTime = Date.now() - dbStart;
      
      if (dbMetrics.responseTime > 1000) {
        dbMetrics.status = 'degraded';
      }
      if (dbMetrics.responseTime > 3000) {
        dbMetrics.status = 'unhealthy';
      }
    } catch (error) {
      dbMetrics.status = 'unhealthy';
      dbMetrics.responseTime = -1;
      console.error('Database health check failed:', error);
    }

    // Application metrics
    let appMetrics = {
      uptime: Math.round((Date.now() - this.startTime) / 1000),
      activeJobs: 0,
      todayJobs: 0,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
    };

    try {
      const activeJobsResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM jobs WHERE status IN ('created', 'assigned', 'collected')`
      );
      appMetrics.activeJobs = Number(activeJobsResult.rows[0]?.count || 0);

      const todayJobsResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM jobs WHERE DATE(created_at) = CURRENT_DATE`
      );
      appMetrics.todayJobs = Number(todayJobsResult.rows[0]?.count || 0);
    } catch (error) {
      console.error('Failed to collect application metrics:', error);
    }

    const metrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: cpuUsage,
        loadAvg,
        cores: cpuCount
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usagePercent
      },
      database: dbMetrics,
      application: appMetrics
    };

    // Store metrics (keep last 100 entries)
    this.metrics.push(metrics);
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    return metrics;
  }

  logPerformance(log: Omit<PerformanceLog, 'timestamp'>) {
    const performanceLog: PerformanceLog = {
      ...log,
      timestamp: new Date()
    };

    this.performanceLogs.push(performanceLog);
    this.requestCount++;

    // Track errors
    if (log.statusCode >= 400) {
      this.errorCount++;
    }

    // Alert on slow requests
    if (log.responseTime > 5000) {
      console.warn(`Slow request detected: ${log.method} ${log.endpoint} took ${log.responseTime}ms`);
    }

    // Keep only last 1000 performance logs
    if (this.performanceLogs.length > 1000) {
      this.performanceLogs = this.performanceLogs.slice(-1000);
    }
  }

  getLatestMetrics(): SystemMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(minutes: number = 60): SystemMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getPerformanceStats(minutes: number = 60) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const recentLogs = this.performanceLogs.filter(l => l.timestamp >= cutoff);

    if (recentLogs.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0
      };
    }

    const totalRequests = recentLogs.length;
    const averageResponseTime = recentLogs.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests;
    const errorCount = recentLogs.filter(log => log.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    const slowRequests = recentLogs.filter(log => log.responseTime > 3000).length;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowRequests
    };
  }

  getSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const latest = this.getLatestMetrics();
    if (!latest) return 'warning';

    const issues = [];

    // Check CPU
    if (latest.cpu.usage > 90) issues.push('high-cpu');
    
    // Check memory
    if (latest.memory.usagePercent > 90) issues.push('high-memory');
    
    // Check database
    if (latest.database.status === 'unhealthy') issues.push('database-down');
    if (latest.database.status === 'degraded') issues.push('database-slow');
    
    // Check error rate
    const perfStats = this.getPerformanceStats(15); // Last 15 minutes
    if (perfStats.errorRate > 10) issues.push('high-error-rate');

    if (issues.some(issue => ['high-cpu', 'high-memory', 'database-down'].includes(issue))) {
      return 'critical';
    }
    
    if (issues.length > 0) {
      return 'warning';
    }
    
    return 'healthy';
  }

  private cleanOldData() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    this.performanceLogs = this.performanceLogs.filter(l => l.timestamp >= cutoff);
    
    // Reset counters daily
    this.errorCount = 0;
    this.requestCount = 0;
  }

  // Performance monitoring middleware
  createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        
        this.logPerformance({
          endpoint: req.path,
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    };
  }
}

export const monitoringService = new MonitoringService();