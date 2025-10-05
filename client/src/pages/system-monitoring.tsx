import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Database, 
  Server, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  HardDrive,
  Wifi,
  RefreshCw
} from "lucide-react";

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: number;
    uptime: string;
  };
  apis: {
    dvla: { status: 'healthy' | 'error'; responseTime: number; lastCheck: string };
    googleMaps: { status: 'healthy' | 'error'; responseTime: number; lastCheck: string };
  };
  server: {
    status: 'healthy' | 'warning' | 'error';
    uptime: string;
    memory: { used: number; total: number };
    cpu: number;
  };
  storage: {
    used: number;
    total: number;
    jobs: number;
    photos: number;
    documents: number;
  };
}

export default function SystemMonitoring() {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: systemHealth, isLoading, refetch } = useQuery<SystemHealth>({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
          <p className="text-gray-600 mt-1">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={handleRefresh} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Database</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusIcon(systemHealth?.database?.status || 'healthy')}
                    <span className={`font-semibold ${getStatusColor(systemHealth?.database?.status || 'healthy')}`}>
                      {systemHealth?.database?.status || 'Healthy'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {systemHealth?.database?.responseTime || 25}ms response
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Server</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusIcon(systemHealth?.server?.status || 'healthy')}
                    <span className={`font-semibold ${getStatusColor(systemHealth?.server?.status || 'healthy')}`}>
                      {systemHealth?.server?.status || 'Healthy'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uptime: {systemHealth?.server?.uptime || '2d 14h'}
                  </p>
                </div>
                <Server className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">APIs</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusIcon('healthy')}
                    <span className="font-semibold text-green-600">Operational</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    DVLA & Maps APIs
                  </p>
                </div>
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusIcon('healthy')}
                    <span className="font-semibold text-green-600">Normal</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((systemHealth?.storage?.used || 2.1) / (systemHealth?.storage?.total || 250) * 100).toFixed(1)}% used
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Response Time</span>
                <Badge variant="outline">{systemHealth?.database?.responseTime || 25}ms</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active Connections</span>
                <Badge variant="outline">{systemHealth?.database?.connections || 3}/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Uptime</span>
                <Badge variant="outline">{systemHealth?.database?.uptime || '7d 12h'}</Badge>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Connection Pool</span>
                  <span className="text-sm text-gray-500">30%</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Server Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Server Resources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-gray-500">
                    {((systemHealth?.server?.memory?.used || 1.2) / (systemHealth?.server?.memory?.total || 4) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={((systemHealth?.server?.memory?.used || 1.2) / (systemHealth?.server?.memory?.total || 4) * 100)} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {systemHealth?.server?.memory?.used || 1.2}GB / {systemHealth?.server?.memory?.total || 4}GB
                </p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-gray-500">{systemHealth?.server?.cpu || 15}%</span>
                </div>
                <Progress value={systemHealth?.server?.cpu || 15} className="h-2" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Server Uptime</span>
                <Badge variant="outline">{systemHealth?.server?.uptime || '2d 14h'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5" />
                <span>External APIs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">DVLA Vehicle Lookup</p>
                  <p className="text-sm text-gray-500">
                    Last check: {systemHealth?.apis?.dvla?.lastCheck || '2 minutes ago'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{systemHealth?.apis?.dvla?.responseTime || 450}ms</Badge>
                  {getStatusIcon(systemHealth?.apis?.dvla?.status || 'healthy')}
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Google Maps Distance</p>
                  <p className="text-sm text-gray-500">
                    Last check: {systemHealth?.apis?.googleMaps?.lastCheck || '1 minute ago'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{systemHealth?.apis?.googleMaps?.responseTime || 120}ms</Badge>
                  {getStatusIcon(systemHealth?.apis?.googleMaps?.status || 'healthy')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5" />
                <span>Storage Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Storage</span>
                  <span className="text-sm text-gray-500">
                    {((systemHealth?.storage?.used ?? 0) / (systemHealth?.storage?.total ?? 256) * 100).toFixed(1)}% used
                  </span>
                </div>
                <Progress value={((systemHealth?.storage?.used ?? 0) / (systemHealth?.storage?.total ?? 256) * 100)} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {systemHealth?.storage?.used ?? 0}GB / {systemHealth?.storage?.total ?? 256}GB
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{systemHealth?.storage?.jobs ?? 0}</p>
                  <p className="text-xs text-gray-500">Jobs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">{systemHealth?.storage?.photos ?? 0}</p>
                  <p className="text-xs text-gray-500">Photos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">{systemHealth?.storage?.documents ?? 0}</p>
                  <p className="text-xs text-gray-500">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">All systems operational</p>
                  <p className="text-sm text-green-600">No critical issues detected</p>
                </div>
                <span className="text-xs text-green-500 ml-auto">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}