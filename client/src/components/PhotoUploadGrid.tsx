import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Camera, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoSlot {
  id: string;
  label: string;
  category: string;
  image?: File;
  preview?: string;
  uploaded?: boolean;
}

interface PhotoUploadGridProps {
  stage: 'collection' | 'delivery';
  onPhotosChange: (photos: PhotoSlot[]) => void;
  className?: string;
}

export function PhotoUploadGrid({ stage, onPhotosChange, className }: PhotoUploadGridProps) {
  const { toast } = useToast();
  
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>([
    { id: 'front', label: 'Front View', category: 'vehicle_front' },
    { id: 'rear', label: 'Rear View', category: 'vehicle_rear' },
    { id: 'driver', label: 'Driver Side', category: 'driver_side' },
    { id: 'passenger', label: 'Passenger Side', category: 'passenger_side' },
    { id: 'dashboard', label: 'Dashboard', category: 'dashboard' },
    { id: 'odometer', label: 'Odometer', category: 'odometer' },
    { id: 'fuel', label: 'Fuel Gauge', category: 'fuel_gauge' },
    { id: 'keys', label: 'Keys', category: 'keys' }
  ]);

  const handleFileSelect = useCallback((slotId: string, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview URL
    const preview = URL.createObjectURL(file);
    
    const updatedSlots = photoSlots.map(slot => 
      slot.id === slotId 
        ? { ...slot, image: file, preview, uploaded: false }
        : slot
    );
    
    setPhotoSlots(updatedSlots);
    onPhotosChange(updatedSlots);

    toast({
      title: "Photo Added",
      description: `${slot?.label} photo ready for upload`,
    });
  }, [photoSlots, onPhotosChange, toast]);

  const handleRemovePhoto = useCallback((slotId: string) => {
    const updatedSlots = photoSlots.map(slot => {
      if (slot.id === slotId) {
        // Clean up preview URL
        if (slot.preview) {
          URL.revokeObjectURL(slot.preview);
        }
        return { ...slot, image: undefined, preview: undefined, uploaded: false };
      }
      return slot;
    });
    
    setPhotoSlots(updatedSlots);
    onPhotosChange(updatedSlots);
  }, [photoSlots, onPhotosChange]);

  const handleDrop = useCallback((e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(slotId, files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const slot = photoSlots.find(s => s.id === slotId);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {stage === 'collection' ? 'Collection' : 'Delivery'} Vehicle Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photoSlots.map((slot) => (
            <div key={slot.id} className="space-y-2">
              <div
                className={`
                  relative border-2 border-dashed rounded-lg p-4 h-32 
                  transition-colors duration-200 cursor-pointer
                  ${slot.image 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
                onDrop={(e) => handleDrop(e, slot.id)}
                onDragOver={handleDragOver}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(slot.id, file);
                  };
                  input.click();
                }}
              >
                {slot.preview ? (
                  <>
                    <img
                      src={slot.preview}
                      alt={slot.label}
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      {slot.uploaded && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(slot.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Upload className="h-6 w-6 mb-1" />
                    <span className="text-xs text-center">
                      Click or drag photo
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-center">{slot.label}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Take clear, well-lit photos from multiple angles</li>
            <li>• Ensure vehicle registration is visible in front photo</li>
            <li>• Capture any existing damage clearly</li>
            <li>• Include dashboard showing mileage and fuel level</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}