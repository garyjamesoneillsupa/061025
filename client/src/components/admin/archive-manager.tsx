import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Archive, 
  Download, 
  Trash2, 
  FolderArchive, 
  Calendar,
  HardDrive,
  FileArchive,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StorageStats {
  totalJobs: number;
  totalSizeMB: number;
  averageJobSizeMB: number;
  oldestJob: string | null;
  newestJob: string | null;
}

interface ArchiveInfo {
  filename: string;
  size: number;
  created: string;
  downloadUrl: string;
}

export default function ArchiveManager() {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [customArchiveName, setCustomArchiveName] = useState('');
  const [cutoffDate, setCutoffDate] = useState('');
  const [jobsToCleanup, setJobsToCleanup] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get storage statistics
  const { data: storageStats, isLoading: statsLoading } = useQuery<StorageStats>({
    queryKey: ["/api/archive/storage-stats"],
  });

  // Get available archives
  const { data: archives, isLoading: archivesLoading } = useQuery<ArchiveInfo[]>({
    queryKey: ["/api/archive/list"],
  });

  // Get all job folders
  const { data: jobFolders } = useQuery({
    queryKey: ["/api/jobs/folders"],
  });

  // Create archive mutation
  const createArchiveMutation = useMutation({
    mutationFn: async (data: { jobIds: string[]; archiveName?: string }) => {
      const response = await fetch("/api/archive/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onSuccess: (result: any) => {
      setSelectedJobs([]);
      setCustomArchiveName('');
      queryClient.invalidateQueries({ queryKey: ["/api/archive/list"] });
    },
    onError: () => {
      toast({
        title: "Archive Failed",
        description: "Failed to create archive. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Archive by date mutation
  const archiveByDateMutation = useMutation({
    mutationFn: async (data: { cutoffDate: string; archiveName?: string }) => {
      const response = await fetch("/api/archive/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await response.json();
    },
    onSuccess: (result: any) => {
      setCutoffDate('');
      queryClient.invalidateQueries({ queryKey: ["/api/archive/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/archive/storage-stats"] });
    },
    onError: () => {
      toast({
        title: "Archive Failed",
        description: "Failed to archive jobs by date. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: async (jobIds: string[]) => {
      const response = await fetch("/api/archive/cleanup", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds }),
      });
      return await response.json();
    },
    onSuccess: (result: any) => {
      toast({
        title: "Cleanup Completed",
        description: `Freed ${result.spaceFreedMB}MB by deleting ${result.cleanup.deleted.length} job folders`,
      });
      setJobsToCleanup([]);
      queryClient.invalidateQueries({ queryKey: ["/api/archive/storage-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs/folders"] });
    },
    onError: () => {
      toast({
        title: "Cleanup Failed",
        description: "Failed to cleanup job folders. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateArchive = () => {
    if (selectedJobs.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select at least one job to archive.",
        variant: "destructive",
      });
      return;
    }

    createArchiveMutation.mutate({
      jobIds: selectedJobs,
      archiveName: customArchiveName || undefined,
    });
  };

  const handleArchiveByDate = () => {
    if (!cutoffDate) {
      toast({
        title: "Date Required",
        description: "Please select a cutoff date.",
        variant: "destructive",
      });
      return;
    }

    archiveByDateMutation.mutate({
      cutoffDate,
      archiveName: `Jobs-Before-${cutoffDate}.zip`,
    });
  };

  const handleCleanup = () => {
    if (jobsToCleanup.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select archived jobs to cleanup.",
        variant: "destructive",
      });
      return;
    }

    cleanupMutation.mutate(jobsToCleanup);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Archive</h1>
        <p className="text-gray-600">Archive jobs by month and manage storage efficiently</p>
      </div>

      {/* Storage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Storage Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : storageStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{storageStats.totalJobs}</div>
                <div className="text-sm text-blue-700">Total Jobs</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{storageStats.totalSizeMB}MB</div>
                <div className="text-sm text-green-700">Storage Used</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{storageStats.averageJobSizeMB}MB</div>
                <div className="text-sm text-purple-700">Avg Job Size</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{250 - storageStats.totalSizeMB}GB</div>
                <div className="text-sm text-orange-700">Space Remaining</div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Archive Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Archive className="h-5 w-5" />
              <span>Create Archive</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Selection */}
            <div>
              <Label>Custom Archive Name (Optional)</Label>
              <Input
                value={customArchiveName}
                onChange={(e) => setCustomArchiveName(e.target.value)}
                placeholder="e.g., Q4-2024-Jobs.zip"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Selected Jobs: {selectedJobs.length}</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {(jobFolders as any[])?.slice(0, 20).map((folder: any) => (
                  <label key={folder.jobId} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(folder.jobId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJobs([...selectedJobs, folder.jobId]);
                        } else {
                          setSelectedJobs(selectedJobs.filter(id => id !== folder.jobId));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Job #{folder.jobId.slice(-8)}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateArchive}
              disabled={createArchiveMutation.isPending || selectedJobs.length === 0}
              className="w-full"
            >
              {createArchiveMutation.isPending ? (
                "Creating Archive..."
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Create Archive ({selectedJobs.length} jobs)
                </>
              )}
            </Button>

            <Separator />

            {/* Archive by Date */}
            <div>
              <Label>Archive Jobs Older Than</Label>
              <Input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleArchiveByDate}
              disabled={archiveByDateMutation.isPending || !cutoffDate}
              className="w-full"
              variant="outline"
            >
              {archiveByDateMutation.isPending ? (
                "Archiving..."
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Archive by Date
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Space Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5" />
              <span>Free Up Space</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Important</span>
              </div>
              <p className="text-sm text-yellow-700">
                Only delete job folders after you've created and downloaded archives. 
                This action permanently removes files from the system.
              </p>
            </div>

            <div>
              <Label>Select Archived Jobs to Delete</Label>
              <div className="mt-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                {(jobFolders as any[])?.slice(0, 15).map((folder: any) => (
                  <label key={folder.jobId} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={jobsToCleanup.includes(folder.jobId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setJobsToCleanup([...jobsToCleanup, folder.jobId]);
                        } else {
                          setJobsToCleanup(jobsToCleanup.filter(id => id !== folder.jobId));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">Job #{folder.jobId.slice(-8)}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCleanup}
              disabled={cleanupMutation.isPending || jobsToCleanup.length === 0}
              className="w-full"
              variant="destructive"
            >
              {cleanupMutation.isPending ? (
                "Cleaning up..."
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({jobsToCleanup.length} jobs)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Available Archives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileArchive className="h-5 w-5" />
            <span>Available Archives</span>
            {archives && <Badge variant="secondary">{archives.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : archives && archives.length > 0 ? (
            <div className="space-y-3">
              {archives.map((archive, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{archive.filename}</div>
                    <div className="text-xs text-gray-600">
                      {formatFileSize(archive.size)} • Created {new Date(archive.created).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => window.open(archive.downloadUrl, '_blank')}
                    className="ml-4"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileArchive className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No archives created yet</p>
              <p className="text-sm">Create your first archive above</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}