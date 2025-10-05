import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Eye, Plus, Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LightCameraCaptureProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos: number;
  category: string;
}

export default function LightCameraCapture({ photos, onPhotosChange, maxPhotos, category }: LightCameraCaptureProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1200px on longest side)
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      toast({
        title: "Too Many Photos",
        description: `Maximum ${maxPhotos} photos allowed for ${category}`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const newPhotos = [];
      
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid File",
            description: "Please select image files only",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (10MB max before compression)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: "Please select files smaller than 10MB",
            variant: "destructive",
          });
          continue;
        }

        try {
          const compressedPhoto = await compressImage(file);
          
          // Check compressed size (should be under 1.5MB as base64)
          const sizeInBytes = (compressedPhoto.length * 3) / 4;
          if (sizeInBytes > 1.5 * 1024 * 1024) {
            toast({
              title: "Compression Failed", 
              description: "Photo still too large after compression",
              variant: "destructive",
            });
            continue;
          }

          newPhotos.push(compressedPhoto);
        } catch (error) {
          console.error('Image compression failed:', error);
          toast({
            title: "Processing Failed",
            description: "Could not process image",
            variant: "destructive",
          });
        }
      }

      if (newPhotos.length > 0) {
        onPhotosChange([...photos, ...newPhotos]);
        toast({
          title: "Photos Added",
          description: `${newPhotos.length} photo(s) added to ${category}`,
        });
      }
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    toast({
      title: "Photo Removed",
      description: "Photo removed from collection",
    });
  };

  const openPreview = (photo: string) => {
    setPreviewPhoto(photo);
    setShowPreview(true);
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={index} className="relative group shadow-sm border-0 bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <img
                  src={photo}
                  alt={`${category} photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openPreview(photo)}
                      className="bg-white/90 text-gray-900 hover:bg-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(index)}
                      className="bg-red-600/90 hover:bg-red-700/90"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Photo Number Badge */}
                <Badge className="absolute top-2 left-2 bg-[#00ABE7] text-white">
                  {index + 1}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <Card className="shadow-sm border-0 bg-white border-2 border-dashed border-gray-200 hover:border-[#00ABE7] transition-colors">
            <CardContent className="p-0">
              <div className="aspect-square flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 bg-[#00ABE7]/10 rounded-lg flex items-center justify-center mb-3">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-[#00ABE7] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-6 w-6 text-[#00ABE7]" />
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Add Photo</p>
                <p className="text-xs text-gray-500 mb-3">
                  {photos.length}/{maxPhotos}
                </p>
                <div className="flex flex-col space-y-2 w-full">
                  <Button
                    onClick={openCamera}
                    disabled={isUploading}
                    className="bg-[#00ABE7] hover:bg-[#0096d1] text-white text-xs py-2 px-3 h-auto"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Camera
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="border-gray-200 text-xs py-2 px-3 h-auto"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Count and Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <ImageIcon className="h-4 w-4" />
          <span>{photos.length} of {maxPhotos} photos</span>
        </div>
        <div className="text-xs text-gray-500">
          Photos compressed to ≤1.5MB
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{category} Photo Preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            <img
              src={previewPhoto}
              alt="Photo preview"
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions */}
      {photos.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-600 text-sm mb-2">No {category.toLowerCase()} photos yet</p>
          <p className="text-gray-500 text-xs">
            Capture up to {maxPhotos} photos using your device camera or upload from gallery
          </p>
        </div>
      )}
    </div>
  );
}