import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Camera, ZoomIn, RotateCcw, CheckCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface InteriorPhotosData {
  dashboard: string[];
  frontSeats: string[];
  backSeats: string[];
  boot: string[];
}

interface InteriorPhotosModuleProps {
  data: InteriorPhotosData;
  onChange: (data: InteriorPhotosData) => void;
  onAutoSave: () => void;
}

interface PhotoSectionProps {
  title: string;
  photos: string[];
  onCapture: () => void;
  onRetake: (index: number) => void;
  onEnlarge: (url: string, title: string) => void;
  isUploading: boolean;
  maxPhotos?: number;
  required?: boolean;
}

function PhotoSection({ 
  title, 
  photos, 
  onCapture, 
  onRetake, 
  onEnlarge, 
  isUploading, 
  maxPhotos = 3,
  required = true 
}: PhotoSectionProps) {
  return (
    <div className="space-y-3">
      <Label className="text-gray-700 font-medium block">
        {title}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {/* Capture Button */}
      <Button
        onClick={onCapture}
        className="w-full bg-[#00ABE7] hover:bg-[#0095d1] text-white"
        disabled={isUploading || photos.length >= maxPhotos}
        data-testid={`button-capture-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Camera className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading...' : `Take ${title}`}
      </Button>
      
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div
                onClick={() => onEnlarge(photo, `${title} ${index + 1}`)}
                className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-[#00ABE7] hover:border-[#0095d1] transition-colors"
                data-testid={`img-${title.toLowerCase().replace(/\s+/g, '-')}-${index}`}
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
                  onRetake(index);
                }}
                className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Retake photo"
                data-testid={`button-retake-${title.toLowerCase().replace(/\s+/g, '-')}-${index}`}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Status messages */}
      {photos.length === 0 && required && (
        <p className="text-red-400 text-sm">Photo required</p>
      )}
      {photos.length >= maxPhotos && (
        <p className="text-green-400 text-sm">Maximum photos reached</p>
      )}
    </div>
  );
}

export default function InteriorPhotosModule({ data, onChange, onAutoSave }: InteriorPhotosModuleProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<keyof InteriorPhotosData | null>(null);

  const sections = [
    { key: 'dashboard' as keyof InteriorPhotosData, title: 'Dashboard', required: true },
    { key: 'frontSeats' as keyof InteriorPhotosData, title: 'Front Seats', required: true },
    { key: 'backSeats' as keyof InteriorPhotosData, title: 'Back Seats', required: true },
    { key: 'boot' as keyof InteriorPhotosData, title: 'Boot', required: true },
  ];

  const handleCapture = (section: keyof InteriorPhotosData) => {
    setActiveSection(section);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeSection) return;

    try {
      setIsUploading(true);
      
      // Convert photo to base64 for permanent storage (same as working damage photos)
      const photoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Update data
      const updatedData = {
        ...data,
        [activeSection]: [...data[activeSection], photoUrl]
      };
      
      onChange(updatedData);
      onAutoSave(); // Trigger server-side auto-save
      
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsUploading(false);
      setActiveSection(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRetake = (section: keyof InteriorPhotosData, index: number) => {
    const updatedPhotos = [...data[section]];
    updatedPhotos.splice(index, 1);
    
    const updatedData = {
      ...data,
      [section]: updatedPhotos
    };
    
    onChange(updatedData);
    onAutoSave(); // Trigger server-side auto-save
  };

  const isStepComplete = () => {
    return sections.every(section => 
      section.required ? data[section.key].length > 0 : true
    );
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
            <span>Interior Photos</span>
            {isStepComplete() && (
              <CheckCircle className="h-5 w-5 text-green-500" data-testid="icon-step-complete" />
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Interior Photo Sections */}
      {sections.map((section) => (
        <Card key={section.key} className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-900 text-lg flex items-center">
              <span>{section.title}</span>
              {data[section.key].length > 0 && (
                <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
              )}
              {section.required && data[section.key].length === 0 && (
                <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoSection
              title={section.title}
              photos={data[section.key]}
              onCapture={() => handleCapture(section.key)}
              onRetake={(index) => handleRetake(section.key, index)}
              onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
              isUploading={isUploading}
              required={section.required}
            />
          </CardContent>
        </Card>
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
                <p>Interior photos complete</p>
              </div>
            ) : (
              <div className="text-yellow-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Please complete all required interior photos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}