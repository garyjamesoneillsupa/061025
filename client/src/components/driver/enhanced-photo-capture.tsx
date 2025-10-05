import { useState, useRef } from "react";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PhotoData {
  file: File;
  url: string;
  name: string;
  timestamp: number;
}

interface EnhancedPhotoCaptureProps {
  label: string;
  photos: PhotoData[];
  onPhotoCapture: (photos: PhotoData[]) => void;
  maxPhotos?: number;
  showPreview?: boolean;
  className?: string;
}

export default function EnhancedPhotoCapture({
  label,
  photos,
  onPhotoCapture,
  maxPhotos = 5,
  showPreview = true,
  className = ""
}: EnhancedPhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoAdd = (file: File) => {
    const timestamp = Date.now();
    const url = URL.createObjectURL(file);
    const photoData: PhotoData = {
      file,
      url,
      name: `${label}-${timestamp}`,
      timestamp
    };

    const updatedPhotos = [...photos, photoData];
    onPhotoCapture(updatedPhotos);
  };

  const handlePhotoRemove = (indexToRemove: number) => {
    const photoToRemove = photos[indexToRemove];
    if (photoToRemove.url) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    const updatedPhotos = photos.filter((_, index) => index !== indexToRemove);
    onPhotoCapture(updatedPhotos);
  };

  const handleRetakePhoto = (indexToRetake: number) => {
    const photoToRetake = photos[indexToRetake];
    if (photoToRetake.url) {
      URL.revokeObjectURL(photoToRetake.url);
    }
    
    // Remove the photo and trigger new capture
    const updatedPhotos = photos.filter((_, index) => index !== indexToRetake);
    onPhotoCapture(updatedPhotos);
    
    // Trigger file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm sm:text-base font-medium text-gray-700">{label}</Label>
      
      {/* Camera trigger button */}
      {photos.length < maxPhotos && (
        <Button
          type="button"
          variant="outline"
          onClick={triggerCamera}
          className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-[#00ABE7] hover:bg-blue-50 transition-colors"
        >
          <Camera className="mr-2 h-4 w-4" />
          {photos.length === 0 ? `Take ${label}` : `Add Another Photo`}
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handlePhotoAdd(file);
          }
          // Reset input value to allow same file selection
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Photo thumbnails grid */}
      {showPreview && photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {photos.map((photo, index) => (
            <div key={photo.timestamp} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={photo.url}
                  alt={`${label} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Photo controls overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRetakePhoto(index)}
                  className="h-8 w-8 p-0 bg-white hover:bg-gray-100"
                >
                  <RotateCcw className="h-3 w-3 text-gray-700" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handlePhotoRemove(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Photo indicator */}
              <div className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm">
                <Check className="h-3 w-3 text-green-600" />
              </div>
              
              {/* Photo number */}
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo counter */}
      {photos.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
          <span>{photos.length} photo{photos.length !== 1 ? 's' : ''} captured</span>
          {maxPhotos > 1 && (
            <span>Max: {maxPhotos}</span>
          )}
        </div>
      )}
    </div>
  );
}