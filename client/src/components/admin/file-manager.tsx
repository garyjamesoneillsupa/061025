import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, FileText, Image, Download, Eye } from "lucide-react";

interface JobFiles {
  jobId: string;
  documents: {
    poc: string | null;
    pod: string | null;
    invoice: string | null;
  };
  photos: Array<{
    name: string;
    url: string;
    path: string;
  }>;
  folders: {
    job: string;
    documents: string;
    photos: string;
  };
}

interface JobFolder {
  jobId: string;
  hasDocuments: {
    poc: boolean;
    pod: boolean;
    invoice: boolean;
  };
  photoCount: number;
  folderPath: string;
}

export default function FileManager() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Get all job folders
  const { data: jobFolders, isLoading: foldersLoading } = useQuery<JobFolder[]>({
    queryKey: ["/api/jobs/folders"],
  });

  // Get files for selected job
  const { data: jobFiles, isLoading: filesLoading } = useQuery<JobFiles>({
    queryKey: ["/api/jobs", selectedJobId, "files"],
    enabled: !!selectedJobId,
  });

  const handleViewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleDownloadFile = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
          <p className="text-gray-600 mt-1">Manage job documents and photos in organized folders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Folders List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5" />
                <span>Job Folders</span>
                {jobFolders && <Badge variant="secondary">{jobFolders.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {foldersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {jobFolders?.map((folder) => (
                    <div
                      key={folder.jobId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedJobId === folder.jobId
                          ? 'bg-[#00ABE7]/10 border-[#00ABE7]'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedJobId(folder.jobId)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Job #{folder.jobId.slice(-8)}</p>
                          <p className="text-xs text-gray-500">{folder.photoCount} photos</p>
                        </div>
                        <div className="flex space-x-1">
                          {folder.hasDocuments.poc && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">POC</Badge>
                          )}
                          {folder.hasDocuments.pod && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">POD</Badge>
                          )}
                          {folder.hasDocuments.invoice && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">INV</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* File Details */}
        <div className="lg:col-span-2">
          {selectedJobId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Job #{selectedJobId.slice(-8)} Files</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="space-y-4">
                    <div className="h-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-32 bg-gray-100 rounded animate-pulse" />
                  </div>
                ) : jobFiles ? (
                  <div className="space-y-6">
                    {/* Documents Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Documents</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['poc', 'pod', 'invoice'].map((docType) => {
                          const url = jobFiles.documents[docType as keyof typeof jobFiles.documents];
                          const hasDoc = !!url;
                          return (
                            <div
                              key={docType}
                              className={`p-4 rounded-lg border ${
                                hasDoc ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm uppercase">{docType}</span>
                                {hasDoc ? (
                                  <Badge className="bg-green-500 text-white text-xs">Available</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Not Generated</Badge>
                                )}
                              </div>
                              {hasDoc && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewFile(url)}
                                    className="flex-1"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownloadFile(url, `${docType.toUpperCase()}.pdf`)}
                                    className="flex-1"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    {/* Photos Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                        <Image className="h-4 w-4" />
                        <span>Photos Captured</span>
                        <Badge variant="secondary">{jobFiles.photos.length}</Badge>
                      </h3>
                      {jobFiles.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {jobFiles.photos.map((photo, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                <img
                                  src={photo.url}
                                  alt={photo.name}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => handleViewFile(photo.url)}
                                />
                              </div>
                              <div className="p-2">
                                <p className="text-xs text-gray-600 truncate" title={photo.name}>
                                  {photo.name}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadFile(photo.url, photo.name)}
                                  className="w-full mt-1 text-xs"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No photos captured yet</p>
                        </div>
                      )}
                    </div>

                    {/* Folder Structure Info */}
                    <Separator />
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Folder Structure</h4>
                      <div className="text-xs text-blue-800 space-y-1 font-mono">
                        <div>📁 Jobs/{selectedJobId.slice(-8)}/</div>
                        <div className="ml-4">📁 Documents/</div>
                        <div className="ml-8">📄 POC.pdf</div>
                        <div className="ml-8">📄 POD.pdf</div>
                        <div className="ml-8">📄 Invoice.pdf</div>
                        <div className="ml-4">📁 Photos Captured/</div>
                        <div className="ml-8">📸 [captured photos]</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No files found for this job</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Job Folder</h3>
                <p className="text-gray-500">Choose a job from the left to view its documents and photos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}