import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileImage, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhotoUploadGrid } from './PhotoUploadGrid';

interface GoldStandardPhotoManagerProps {
  jobId: string;
  stage: 'collection' | 'delivery';
  className?: string;
}

export function GoldStandardPhotoManager({ jobId, stage, className }: GoldStandardPhotoManagerProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photos, setPhotos] = useState<any[]>([]);

  const handleUploadAll = useCallback(async () => {
    const photosToUpload = photos.filter(p => p.image && !p.uploaded);
    
    if (photosToUpload.length === 0) {
      toast({
        title: "No Photos to Upload",
        description: "Please add some photos first",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let completed = 0;
      
      for (const photo of photosToUpload) {
        const formData = new FormData();
        formData.append('photo', photo.image);
        formData.append('category', photo.category);
        formData.append('stage', stage);
        
        const response = await fetch(`/api/jobs/${jobId}/photos`, {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          // Mark as uploaded
          photo.uploaded = true;
          completed++;
          setUploadProgress((completed / photosToUpload.length) * 100);
        } else {
          throw new Error(`Failed to upload ${photo.label}`);
        }
      }

      toast({
        title: "Upload Complete",
        description: `${completed} photos uploaded successfully`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Some photos failed to upload. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [photos, jobId, stage, toast]);

  const handleGenerateDocument = useCallback(async () => {
    try {
      const endpoint = stage === 'collection' ? 'generate-poc' : 'generate-pod';
      
      const response = await fetch(`/api/jobs/${jobId}/${endpoint}`, {
        method: 'POST'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${stage.toUpperCase()}-${jobId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "Document Generated",
          description: `Professional ${stage.toUpperCase()} with embedded photos ready`,
        });
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate document. Please try again.",
        variant: "destructive"
      });
    }
  }, [jobId, stage, toast]);

  const completedPhotos = photos.filter(p => p.uploaded).length;
  const totalPhotos = photos.filter(p => p.image).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Photo Upload Grid */}
      <PhotoUploadGrid 
        stage={stage}
        onPhotosChange={setPhotos}
      />

      {/* Upload Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Upload Status
            </span>
            <div className="flex items-center gap-2 text-sm">
              {completedPhotos > 0 && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {completedPhotos}/{totalPhotos} uploaded
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading photos...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleUploadAll}
              disabled={isUploading || totalPhotos === 0}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload All Photos
            </Button>

            <Button 
              onClick={handleGenerateDocument}
              variant="outline"
              disabled={completedPhotos === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generate {stage.toUpperCase()} PDF
            </Button>
          </div>

          {totalPhotos > 0 && completedPhotos === 0 && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Photos added but not yet uploaded
            </div>
          )}

          {completedPhotos > 0 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ Photos uploaded successfully. PDF will include high-quality embedded images.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}