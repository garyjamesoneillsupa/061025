import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, User, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Collection {
  id: string;
  jobId: string;
  jobNumber: string;
  completedAt: string;
  inspectionData: any;
}

export default function AdminCollections() {
  const { toast } = useToast();

  const { data: collections = [], isLoading, error } = useQuery<Collection[]>({
    queryKey: ['/api/collections/completed'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleDownloadPOC = async (collection: Collection) => {
    try {
      // Use the flawless POC generation endpoint
      const response = await fetch(`/api/flawless/generate-poc/${collection.jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate POC: ${response.status}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.jobNumber} (POC).pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download POC:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download POC",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPOD = async (collection: Collection) => {
    try {
      // Use the new fresh POD generation endpoint
      const response = await fetch(`/api/fresh/generate-fresh-pod/${collection.jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to generate POD: ${response.status}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `POD-${collection.jobNumber}-Professional.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download POD:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download POD",
        variant: "destructive"
      });
    }
  };

  const handleDownloadEnhancedPOC = async (collection: Collection) => {
    try {
      const response = await fetch(`/api/poc/enhanced/${collection.jobId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate enhanced POC' }));
        throw new Error(errorData.error || 'Failed to generate enhanced POC');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.jobNumber} (POC).pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download enhanced POC:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to generate enhanced POC",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collections...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-xl mb-4">Error Loading Collections</div>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Collections</h1>
          <p className="text-gray-600">Manage completed vehicle collections and generate POC documents</p>
        </div>

        {/* Collections Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Collections</h3>
                  <p className="text-2xl font-bold text-gray-900">{collections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Car className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">This Week</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {collections.filter((c: Collection) => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(c.completedAt) > weekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Today</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {collections.filter((c: Collection) => {
                      const today = new Date().toDateString();
                      return new Date(c.completedAt).toDateString() === today;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collections List */}
        {collections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Collections Yet</h3>
              <p className="text-gray-600">Completed vehicle collections will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {collections.map((collection: Collection) => (
              <Card key={collection.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Job {collection.jobNumber}
                        </h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Collected
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Completed: {new Date(collection.completedAt).toLocaleString()}
                        </div>
                        
                        {collection.inspectionData?.customerName && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Customer: {collection.inspectionData.customerName}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-2" />
                          {collection.inspectionData?.odometerReading ? 
                            `${collection.inspectionData.odometerReading} miles` : 
                            'Mileage not recorded'
                          }
                        </div>
                      </div>

                      {/* Collection Summary */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Collection Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">V5 Document:</span>
                            <span className={`ml-1 font-medium ${
                              collection.inspectionData?.v5Document?.provided ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {collection.inspectionData?.v5Document?.provided ? 'Provided' : 'Not Provided'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Keys:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {collection.inspectionData?.numberOfKeys?.count || 'Not recorded'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Service Book:</span>
                            <span className={`ml-1 font-medium ${
                              collection.inspectionData?.serviceBook?.provided ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {collection.inspectionData?.serviceBook?.provided ? 'Provided' : 'Not Provided'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Damage:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {collection.inspectionData?.damageMarkers?.length || 0} marker(s)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <Button
                        onClick={() => handleDownloadPOC(collection)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        POC
                      </Button>
                      <Button
                        onClick={() => handleDownloadPOD(collection)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        POD
                      </Button>
                      <Button
                        onClick={() => handleDownloadEnhancedPOC(collection)}
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-600 hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Enhanced
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}