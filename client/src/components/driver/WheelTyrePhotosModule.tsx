import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, ZoomIn, RotateCcw, CheckCircle, AlertTriangle, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WheelData {
  photos: string[];
}

interface WheelsData {
  frontLeft: WheelData;
  frontRight: WheelData;
  rearLeft: WheelData;
  rearRight: WheelData;
}

interface WheelTyrePhotosModuleProps {
  data: WheelsData;
  onChange: (data: WheelsData) => void;
  onAutoSave: () => void;
}

interface WheelSectionProps {
  title: string;
  position: keyof WheelsData;
  wheelData: WheelData;
  onUpdate: (position: keyof WheelsData, updates: Partial<WheelData>) => void;
  onCapture: (position: keyof WheelsData) => void;
  onRetake: (position: keyof WheelsData, index: number) => void;
  onEnlarge: (url: string, title: string) => void;
  isUploading: boolean;
}

function WheelSection({ 
  title, 
  position, 
  wheelData, 
  onUpdate, 
  onCapture, 
  onRetake, 
  onEnlarge, 
  isUploading 
}: WheelSectionProps) {
  const isComplete = wheelData.photos.length > 0;
  
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900 text-lg flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          <span>{title}</span>
          {isComplete && <CheckCircle className="h-5 w-5 text-green-500 ml-2" />}
          {!isComplete && <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo capture */}
        <div className="space-y-3">
          
          {/* Capture Button */}
          <Button
            onClick={() => onCapture(position)}
            className="w-full bg-[#00ABE7] hover:bg-[#0095d1] text-white"
            disabled={isUploading || wheelData.photos.length >= 3}
            data-testid={`button-capture-${position}`}
          >
            <Camera className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : `Take ${title} Photo`}
          </Button>
          
          {/* Photo Grid */}
          {wheelData.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {wheelData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <div
                    onClick={() => onEnlarge(photo, `${title} Photo ${index + 1}`)}
                    className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-[#00ABE7] hover:border-[#0095d1] transition-colors"
                    data-testid={`img-${position}-wheel-${index}`}
                  >
                    <img 
                      src={photo} 
                      alt={`${title} ${index + 1}`}
                      className="w-full h-20 object-cover"
                    />
                    {/* Photo number */}
                    <div className="absolute top-1 right-1 bg-[#00ABE7] text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </div>
                    {/* Enlarge indicator */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  {/* Retake button */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetake(position, index);
                    }}
                    className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Retake photo"
                    data-testid={`button-retake-${position}-${index}`}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Status messages */}
          {wheelData.photos.length === 0 && (
            <p className="text-red-400 text-sm">At least one photo required</p>
          )}
          {wheelData.photos.length >= 3 && (
            <p className="text-green-400 text-sm">Maximum photos reached</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WheelTyrePhotosModule({ data, onChange, onAutoSave }: WheelTyrePhotosModuleProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeWheel, setActiveWheel] = useState<keyof WheelsData | null>(null);

  const wheelPositions = [
    { key: 'frontLeft' as keyof WheelsData, title: 'Front Left' },
    { key: 'rearLeft' as keyof WheelsData, title: 'Rear Left' },
    { key: 'rearRight' as keyof WheelsData, title: 'Rear Right' },
    { key: 'frontRight' as keyof WheelsData, title: 'Front Right' },
  ];

  const handleWheelUpdate = (position: keyof WheelsData, updates: Partial<WheelData>) => {
    const updatedData = {
      ...data,
      [position]: { ...data[position], ...updates }
    };
    onChange(updatedData);
    onAutoSave(); // Trigger server-side auto-save
  };

  const handleCapture = (position: keyof WheelsData) => {
    setActiveWheel(position);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeWheel) return;

    try {
      setIsUploading(true);
      
      // Convert photo to base64 for permanent storage (exact same as working InteriorPhotosModule)
      const photoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Update wheel photos with base64 data URL
      const currentPhotos = data[activeWheel].photos;
      const updatedPhotos = [...currentPhotos, photoUrl];
      
      handleWheelUpdate(activeWheel, { photos: updatedPhotos });
      
    } catch (error) {
      console.error('Error capturing wheel photo:', error);
    } finally {
      setIsUploading(false);
      setActiveWheel(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetake = (position: keyof WheelsData, index: number) => {
    const currentPhotos = [...data[position].photos];
    currentPhotos.splice(index, 1);
    handleWheelUpdate(position, { photos: currentPhotos });
  };

  const isStepComplete = () => {
    return wheelPositions.every(wheel => data[wheel.key].photos.length > 0);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for camera access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileCapture}
        className="hidden"
      />

      {/* Header */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-gray-900 flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Wheel Photos
            </span>
            {isStepComplete() && (
              <CheckCircle className="h-5 w-5 text-green-500" data-testid="icon-wheels-complete" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm">
            Take clear photos of each wheel for documentation and proof of condition.
          </p>
        </CardContent>
      </Card>

      {/* Wheel Sections */}
      {wheelPositions.map((wheel) => (
        <WheelSection
          key={wheel.key}
          title={wheel.title}
          position={wheel.key}
          wheelData={data[wheel.key]}
          onUpdate={handleWheelUpdate}
          onCapture={handleCapture}
          onRetake={handleRetake}
          onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
          isUploading={isUploading && activeWheel === wheel.key}
        />
      ))}

      {/* Photo enlargement dialog */}
      <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
        <DialogContent className="max-w-4xl bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{enlargedPhoto?.title}</DialogTitle>
          </DialogHeader>
          {enlargedPhoto && (
            <div className="flex justify-center">
              <img
                src={enlargedPhoto.url}
                alt={enlargedPhoto.title}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Summary */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center">
            {isStepComplete() ? (
              <div className="text-green-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>All wheels and tyres inspected</p>
                <p className="text-sm text-gray-400 mt-1">
                  {wheelPositions.reduce((total, wheel) => total + data[wheel.key].photos.length, 0)} photos captured
                </p>
              </div>
            ) : (
              <div className="text-yellow-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Please take a photo of all wheels</p>
                <p className="text-sm text-gray-400 mt-1">
                  {wheelPositions.filter(wheel => data[wheel.key].photos.length > 0).length} of {wheelPositions.length} completed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}