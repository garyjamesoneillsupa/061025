import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Download,
  RotateCcw,
  ZoomIn,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PhotoSlot {
  id: string;
  label: string;
  category: string;
  image?: File;
  preview?: string;
  uploaded?: boolean;
  uploading?: boolean;
  error?: string;
}

interface EnhancedPhotoUploadGridProps {
  stage: 'collection' | 'delivery';
  onPhotosChange: (photos: PhotoSlot[]) => void;
  className?: string;
}

export function EnhancedPhotoUploadGrid({ stage, onPhotosChange, className }: EnhancedPhotoUploadGridProps) {
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
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

  const [previewModal, setPreviewModal] = useState<{
    visible: boolean;
    photo?: PhotoSlot;
  }>({ visible: false });

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file (JPG, PNG, HEIC, etc.)';
    }
    if (file.size > 15 * 1024 * 1024) {
      return 'Please select an image smaller than 15MB';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((slotId: string, file: File) => {
    const validation = validateFile(file);
    if (validation) {
      toast({
        title: "Invalid File",
        description: validation,
        variant: "destructive"
      });
      return;
    }

    const preview = URL.createObjectURL(file);
    const slot = photoSlots.find(s => s.id === slotId);
    
    const updatedSlots = photoSlots.map(s => 
      s.id === slotId 
        ? { ...s, image: file, preview, uploaded: false, error: undefined }
        : s
    );
    
    setPhotoSlots(updatedSlots);
    onPhotosChange(updatedSlots);

    toast({
      title: "Photo Added",
      description: `${slot?.label} photo ready for upload`,
    });
  }, [photoSlots, onPhotosChange, toast, validateFile]);

  const handleRemovePhoto = useCallback((slotId: string) => {
    const updatedSlots = photoSlots.map(slot => {
      if (slot.id === slotId) {
        if (slot.preview) {
          URL.revokeObjectURL(slot.preview);
        }
        return { 
          ...slot, 
          image: undefined, 
          preview: undefined, 
          uploaded: false, 
          error: undefined 
        };
      }
      return slot;
    });
    
    setPhotoSlots(updatedSlots);
    onPhotosChange(updatedSlots);
  }, [photoSlots, onPhotosChange]);

  const handleRetakePhoto = useCallback((slotId: string) => {
    const input = fileInputRefs.current[slotId];
    if (input) {
      input.click();
    }
  }, []);

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

  const openPreview = useCallback((photo: PhotoSlot) => {
    setPreviewModal({ visible: true, photo });
  }, []);

  const closePreview = useCallback(() => {
    setPreviewModal({ visible: false });
  }, []);

  const completedPhotos = photoSlots.filter(p => p.uploaded).length;
  const totalPhotos = photoSlots.filter(p => p.image).length;
  const errorPhotos = photoSlots.filter(p => p.error).length;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {stage === 'collection' ? 'Collection' : 'Delivery'} Vehicle Photos
            </div>
            <div className="flex items-center gap-2">
              {completedPhotos > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {completedPhotos}/{totalPhotos} uploaded
                </Badge>
              )}
              {errorPhotos > 0 && (
                <Badge variant="destructive">
                  {errorPhotos} errors
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {photoSlots.map((slot) => (
              <div key={slot.id} className="space-y-2">
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg h-32 
                    transition-all duration-200 cursor-pointer group
                    ${slot.image 
                      ? slot.uploaded 
                        ? 'border-green-300 bg-green-50' 
                        : slot.error
                          ? 'border-red-300 bg-red-50'
                          : 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                  `}
                  onDrop={(e) => handleDrop(e, slot.id)}
                  onDragOver={handleDragOver}
                  onClick={() => {
                    if (!slot.image) {
                      const input = fileInputRefs.current[slot.id];
                      if (input) input.click();
                    }
                  }}
                >
                  <input
                    ref={(el) => fileInputRefs.current[slot.id] = el}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(slot.id, file);
                    }}
                  />

                  {slot.preview ? (
                    <>
                      <img
                        src={slot.preview}
                        alt={slot.label}
                        className="w-full h-full object-cover rounded"
                      />
                      
                      {/* Photo Controls Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreview(slot);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetakePhoto(slot.id);
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(slot.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {slot.uploaded && (
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                        {slot.error && (
                          <div className="bg-red-500 text-white rounded-full p-1">
                            <AlertCircle className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-2">
                      <Upload className="h-6 w-6 mb-1" />
                      <span className="text-xs text-center">
                        Click or drag photo
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium">{slot.label}</p>
                  {slot.error && (
                    <p className="text-xs text-red-600 mt-1">{slot.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Photo Guidelines */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📸 Professional Photo Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure good lighting - avoid shadows on vehicle</li>
              <li>• Capture vehicle registration clearly in front photo</li>
              <li>• Take wide shots showing full vehicle sides</li>
              <li>• Dashboard photos should show mileage and fuel level</li>
              <li>• Document any existing damage with close-up shots</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Photo Preview Modal */}
      {previewModal.visible && previewModal.photo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewModal.photo.preview}
              alt={previewModal.photo.label}
              className="max-w-full max-h-full object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded">
              {previewModal.photo.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}