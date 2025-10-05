import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Archive, 
  Download, 
  Trash2, 
  Calendar, 
  HardDrive, 
  FileText,
  Camera,
  AlertCircle,
  CheckCircle,
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MonthData {
  monthYear: string;
  jobCount: number;
  totalSizeMB: number;
  oldestJob: string | null;
  newestJob: string | null;
}

interface JobData {
  jobId: string;
  folderPath: string;
  sizeMB: number;
  hasDocuments: {
    poc: boolean;
    pod: boolean;
    invoice: boolean;
  };
  photoCount: number;
}

interface StorageStats {
  totalJobs: number;
  totalSize: number;
  averageJobSize: number;
  totalSizeMB: number;
  averageJobSizeMB: number;
}

export default function MonthlyArchiveManager() {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [customArchiveName, setCustomArchiveName] = useState("");
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available months
  const { data: months = [], isLoading: monthsLoading } = useQuery<MonthData[]>({
    queryKey: ["/api/archive/months"],
  });

  // Get storage statistics
  const { data: storageStats, isLoading: statsLoading } = useQuery<StorageStats>({
    queryKey: ["/api/archive/storage-stats"],
  });

  // Archive month mutation
  const archiveMonthMutation = useMutation({
    mutationFn: async (data: { monthYear: string; archiveName?: string }) => {
      const response = await fetch(`/api/archive/months/${encodeURIComponent(data.monthYear)}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archiveName: data.archiveName }),
      });
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Archive Created Successfully",
        description: `${result.archive.totalJobs} jobs archived. Click to download.`,
      });
      setArchiveDialogOpen(false);
      setCustomArchiveName("");
      queryClient.invalidateQueries({ queryKey: ["/api/archive/months"] });
      queryClient.invalidateQueries({ queryKey: ["/api/archive/storage-stats"] });
      
      // Auto-download the archive
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
    },
    onError: () => {
      toast({
        title: "Archive Failed",
        description: "Failed to create archive. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup month mutation  
  const cleanupMonthMutation = useMutation({
    mutationFn: async (monthYear: string) => {
      const response = await fetch(`/api/archive/months/${encodeURIComponent(monthYear)}/cleanup`, {
        method: "DELETE",
      });
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Cleanup Completed",
        description: `Freed ${result.spaceFreedMB}MB by deleting ${result.cleanup.jobsDeleted} jobs`,
      });
      setCleanupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/archive/months"] });
      queryClient.invalidateQueries({ queryKey: ["/api/archive/storage-stats"] });
    },
    onError: () => {
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup month folder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleMonthExpansion = (monthYear: string) => {
    setExpandedMonths(prev =>
      prev.includes(monthYear)
        ? prev.filter(m => m !== monthYear)
        : [...prev, monthYear]
    );
  };

  const handleArchiveMonth = () => {
    if (!selectedMonth) return;
    
    archiveMonthMutation.mutate({
      monthYear: selectedMonth,
      archiveName: customArchiveName || undefined,
    });
  };

  const handleCleanupMonth = () => {
    if (!selectedMonth) return;
    cleanupMonthMutation.mutate(selectedMonth);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (monthsLoading || statsLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">System Archive</h2>
          <p className="text-gray-600 mt-1">Archive jobs by month and manage storage efficiently</p>
        </div>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading archive data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">System Archive</h2>
        <p className="text-gray-600 mt-1">Archive jobs by month and manage storage efficiently</p>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Folder className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-2xl font-bold">{storageStats?.totalJobs || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <HardDrive className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-2xl font-bold">{storageStats?.totalSizeMB || 0}MB</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Available Months</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-2xl font-bold">{months.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Job Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Archive className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-2xl font-bold">{storageStats?.averageJobSizeMB || 0}MB</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Monthly Job Organization
          </CardTitle>
          <CardDescription>
            Jobs are automatically organized by month for efficient archiving and storage management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {months.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
              <p className="text-gray-600">No job folders are currently available for archiving.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {months.map((month) => (
                <MonthCard
                  key={month.monthYear}
                  month={month}
                  isExpanded={expandedMonths.includes(month.monthYear)}
                  onToggle={() => toggleMonthExpansion(month.monthYear)}
                  onArchive={() => {
                    setSelectedMonth(month.monthYear);
                    setArchiveDialogOpen(true);
                  }}
                  onCleanup={() => {
                    setSelectedMonth(month.monthYear);
                    setCleanupDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive {selectedMonth}</DialogTitle>
            <DialogDescription>
              Create a ZIP archive of all jobs from {selectedMonth}. The archive will be automatically downloaded.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="archive-name">Archive Name (Optional)</Label>
            <Input
              id="archive-name"
              placeholder={`${selectedMonth.replace(' ', '-')}-Archive.zip`}
              value={customArchiveName}
              onChange={(e) => setCustomArchiveName(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleArchiveMonth}
              disabled={archiveMonthMutation.isPending}
            >
              {archiveMonthMutation.isPending ? "Creating Archive..." : "Create Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedMonth} Folder</DialogTitle>
            <DialogDescription>
              This will permanently delete all job folders from {selectedMonth}. Make sure you have created an archive first!
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All files will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCleanupDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCleanupMonth}
              disabled={cleanupMonthMutation.isPending}
            >
              {cleanupMonthMutation.isPending ? "Deleting..." : "Delete Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

// Month Card Component
function MonthCard({ 
  month, 
  isExpanded, 
  onToggle, 
  onArchive, 
  onCleanup 
}: {
  month: MonthData;
  isExpanded: boolean;
  onToggle: () => void;
  onArchive: () => void;
  onCleanup: () => void;
}) {
  const { data: jobs = [] } = useQuery<JobData[]>({
    queryKey: ["/api/archive/months", month.monthYear, "jobs"],
    enabled: isExpanded,
  });

  return (
    <Card className="border-l-4 border-l-blue-500">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <CardTitle className="text-lg">{month.monthYear}</CardTitle>
                  <CardDescription>
                    {month.jobCount} jobs • {month.totalSizeMB}MB
                    {month.oldestJob && month.newestJob && (
                      <span className="ml-2">
                        ({month.oldestJob} - {month.newestJob})
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {month.jobCount} jobs
                </Badge>
                <Badge variant="outline">
                  {month.totalSizeMB}MB
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Ready to archive {month.jobCount} jobs from {month.monthYear}
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={onArchive} className="bg-green-600 hover:bg-green-700">
                  <Archive className="h-4 w-4 mr-1" />
                  Archive Month
                </Button>
                <Button size="sm" variant="destructive" onClick={onCleanup}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Folder
                </Button>
              </div>
            </div>

            {/* Job Details */}
            {jobs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-2">Jobs in this month:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {jobs.map((job) => (
                    <div key={job.jobId} className="p-3 bg-white border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{job.jobId}</span>
                        <span className="text-xs text-gray-500">{job.sizeMB}MB</span>
                      </div>
                      
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className={job.hasDocuments.poc && job.hasDocuments.pod && job.hasDocuments.invoice ? "text-green-600" : "text-gray-500"}>
                            {[
                              job.hasDocuments.poc && "POC",
                              job.hasDocuments.pod && "POD", 
                              job.hasDocuments.invoice && "INV"
                            ].filter(Boolean).join(", ") || "No Docs"}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Camera className="h-3 w-3 mr-1" />
                          <span className="text-gray-600">{job.photoCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}