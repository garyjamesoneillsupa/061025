import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Camera, 
  ZoomIn, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Car
} from "lucide-react";
import { PhotoOptimizer } from "@/utils/photoOptimization";


interface DamageMarker {
  id: string;
  x: number; // Percentage position on vehicle outline (0-100)
  y: number; // Percentage position on vehicle outline (0-100)
  view: 'front' | 'driverSide' | 'rear' | 'passengerSide' | 'roof';
  type: 'scratch' | 'dent' | 'scuff' | 'chip' | 'rust' | 'crack' | 'missing' | 'broken' | 'other';
  size: 'minor' | 'small' | 'medium' | 'large' | 'extensive';
  description: string;
  photos: string[]; // Photos specific to this damage marker
}

interface EnhancedDamageModuleProps {
  damageMarkers: DamageMarker[];
  onChange: (markers: DamageMarker[]) => void;
  onAutoSave: () => void;
  vehicleOutlineImages: {
    front: string;
    driverSide: string;
    rear: string;
    passengerSide: string;
    roof?: string;
  };
}

const damageTypes = [
  { value: 'scratch', label: 'Scratch', color: 'bg-yellow-500' },
  { value: 'dent', label: 'Dent', color: 'bg-orange-500' },
  { value: 'scuff', label: 'Scuff', color: 'bg-red-500' },
  { value: 'chip', label: 'Chip', color: 'bg-purple-500' },
  { value: 'rust', label: 'Rust', color: 'bg-amber-600' },
  { value: 'crack', label: 'Crack', color: 'bg-[#00ABE7]' },
  { value: 'missing', label: 'Missing Part', color: 'bg-red-700' },
  { value: 'broken', label: 'Broken', color: 'bg-red-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-500' }
];

const damageSizes = [
  { value: 'minor', label: 'Minor (< 1cm)' },
  { value: 'small', label: 'Small (1-2cm)' },
  { value: 'medium', label: 'Medium (2-10cm)' },
  { value: 'large', label: 'Large (10-20cm)' },
  { value: 'extensive', label: 'Extensive (> 20cm)' }
];

const vehicleViews = [
  { key: 'front', label: 'Front View' },
  { key: 'driverSide', label: 'Driver Side' },
  { key: 'rear', label: 'Rear View' },
  { key: 'passengerSide', label: 'Passenger Side' },
  { key: 'roof', label: 'Roof View' }
] as const;

// Export DamageMarker type for use in other components
export type { DamageMarker };

export default function EnhancedDamageModule({ 
  damageMarkers, 
  onChange, 
  onAutoSave, 
  vehicleOutlineImages 
}: EnhancedDamageModuleProps) {
  const [activeView, setActiveView] = useState<'front' | 'driverSide' | 'rear' | 'passengerSide' | 'roof'>('front');
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMarkerForPhoto, setActiveMarkerForPhoto] = useState<string | null>(null);
  
  const vehicleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVehicleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingDamage || !vehicleRef.current) return;
    
    const rect = vehicleRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newMarker: DamageMarker = {
      id: Date.now().toString(),
      x,
      y,
      view: activeView,
      type: 'scratch',
      size: 'small',
      description: '',
      photos: []
    };

    const updatedMarkers = [...damageMarkers, newMarker];
    onChange(updatedMarkers);
    onAutoSave(); // Trigger server-side auto-save
    
    setSelectedMarker(newMarker.id);
    setIsAddingDamage(false);
  };

  const updateMarker = (markerId: string, updates: Partial<DamageMarker>) => {
    const updatedMarkers = damageMarkers.map(marker =>
      marker.id === markerId ? { ...marker, ...updates } : marker
    );
    onChange(updatedMarkers);
  };

  const deleteMarker = (markerId: string) => {
    const updatedMarkers = damageMarkers.filter(marker => marker.id !== markerId);
    onChange(updatedMarkers);
    onAutoSave(); // Trigger server-side auto-save
    setSelectedMarker(null);
  };

  const handlePhotoCapture = (markerId: string) => {
    setActiveMarkerForPhoto(markerId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeMarkerForPhoto) return;

    try {
      setIsUploading(true);
      
      // Convert photo to base64 for storage
      const photoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Add photo to damage marker
      const marker = damageMarkers.find(m => m.id === activeMarkerForPhoto);
      if (marker) {
        const updatedPhotos = [...marker.photos, photoUrl];
        updateMarker(activeMarkerForPhoto, { photos: updatedPhotos });
        onAutoSave();
      }
      
    } catch (error) {
      console.error('Error capturing damage photo:', error);
    } finally {
      setIsUploading(false);
      setActiveMarkerForPhoto(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (markerId: string, photoIndex: number) => {
    const marker = damageMarkers.find(m => m.id === markerId);
    if (marker) {
      const updatedPhotos = [...marker.photos];
      updatedPhotos.splice(photoIndex, 1);
      updateMarker(markerId, { photos: updatedPhotos });
    }
  };

  const retakePhoto = (markerId: string, photoIndex: number) => {
    // Remove the photo first
    removePhoto(markerId, photoIndex);
    // Then trigger photo capture for replacement
    setTimeout(() => handlePhotoCapture(markerId), 100);
  };

  const getMarkersForCurrentView = () => {
    return damageMarkers.filter(marker => marker.view === activeView);
  };

  const selectedMarkerData = selectedMarker ? 
    damageMarkers.find(m => m.id === selectedMarker) : null;

  const getDamageTypeColor = (type: string) => {
    return damageTypes.find(t => t.value === type)?.color || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
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
              <Car className="h-5 w-5 mr-2" />
              Damage Inspection
            </span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-slate-700">
                {damageMarkers.length} damage{damageMarkers.length !== 1 ? 's' : ''} recorded
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm mb-4">
            Select a vehicle view, then tap on the vehicle outline to mark damage locations. 
            Each damage marker can have photos and detailed descriptions.
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={() => setIsAddingDamage(!isAddingDamage)}
              className={`flex items-center ${
                isAddingDamage 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              data-testid="button-toggle-damage-mode"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAddingDamage ? 'Cancel Adding' : 'Add Damage'}
            </Button>
            
          </div>
        </CardContent>
      </Card>

      {/* Vehicle View Selector */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {vehicleViews.map((view) => (
              <Button
                key={view.key}
                onClick={() => setActiveView(view.key)}
                variant={activeView === view.key ? "default" : "outline"}
                className={`${
                  activeView === view.key 
                    ? 'bg-[#00ABE7] hover:bg-[#0095d1] text-white' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 bg-white'
                }`}
                data-testid={`button-view-${view.key}`}
              >
                {view.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Outline with Damage Markers */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900">
            {vehicleViews.find(v => v.key === activeView)?.label}
            {isAddingDamage && (
              <Badge className="ml-2 bg-red-600">
                Tap to mark damage
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={vehicleRef}
            className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer min-h-[300px] flex items-center justify-center hover:bg-gray-100 transition-colors"
            onClick={handleVehicleClick}
            data-testid={`vehicle-outline-${activeView}`}
          >
            <img
              src={vehicleOutlineImages[activeView] || vehicleOutlineImages.front}
              alt={`Vehicle ${activeView} view`}
              className="max-w-full max-h-[400px] object-contain"
              draggable={false}
            />
            
            {/* Damage Markers Overlay */}
            {getMarkersForCurrentView().map((marker) => (
              <div
                key={marker.id}
                className={`absolute w-6 h-6 rounded-full border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs font-bold ${getDamageTypeColor(marker.type)} ${
                  selectedMarker === marker.id ? 'ring-4 ring-[#00ABE7]' : ''
                } hover:scale-110 transition-transform`}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarker(marker.id);
                  setIsAddingDamage(false);
                }}
                data-testid={`damage-marker-${marker.id}`}
              >
                {damageMarkers.indexOf(marker) + 1}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Damage Marker Details */}
      {selectedMarkerData && (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center justify-between">
              <span>Damage #{damageMarkers.indexOf(selectedMarkerData) + 1} Details</span>
              <Button
                onClick={() => deleteMarker(selectedMarkerData.id)}
                variant="destructive"
                size="sm"
                data-testid="button-delete-damage"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Damage Type */}
              <div>
                <Label className="text-gray-300">Damage Type</Label>
                <Select
                  value={selectedMarkerData.type}
                  onValueChange={(value) => updateMarker(selectedMarkerData.id, { type: value as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600" side="bottom" align="start">
                    {damageTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-white">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Damage Size */}
              <div>
                <Label className="text-gray-300">Damage Size</Label>
                <Select
                  value={selectedMarkerData.size}
                  onValueChange={(value) => updateMarker(selectedMarkerData.id, { size: value as any })}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600" side="bottom" align="start">
                    {damageSizes.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-white">
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={selectedMarkerData.description}
                onChange={(e) => updateMarker(selectedMarkerData.id, { description: e.target.value })}
                placeholder="Describe the damage location and severity..."
                className="bg-slate-700 border-slate-600 text-white"
                data-testid="textarea-damage-description"
              />
            </div>

            {/* Photos - Same as passenger side display */}
            <div>
              <Label className="text-gray-300 block mb-3">
                Damage #{damageMarkers.indexOf(selectedMarkerData) + 1} Photos ({selectedMarkerData.photos.length}/5)
              </Label>
              
              {/* Capture Button */}
              <Button
                onClick={() => handlePhotoCapture(selectedMarkerData.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
                disabled={isUploading || selectedMarkerData.photos.length >= 5}
              >
                <Camera className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : `Take Damage #${damageMarkers.indexOf(selectedMarkerData) + 1} Photo`}
              </Button>
              
              {/* Photo Grid - Exact same as passenger side */}
              {selectedMarkerData.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {selectedMarkerData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div
                        onClick={() => setEnlargedPhoto({ url: photo, title: `Damage #${damageMarkers.indexOf(selectedMarkerData) + 1} Photo ${index + 1}` })}
                        className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-green-500 hover:border-green-400 transition-colors"
                      >
                        <img 
                          src={photo} 
                          alt={`Damage photo ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        {/* Photo number */}
                        <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
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
                          retakePhoto(selectedMarkerData.id, index);
                        }}
                        className="absolute -top-2 -left-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Retake photo"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Status messages */}
              {selectedMarkerData.photos.length === 0 && (
                <p className="text-gray-400 text-sm">No photos added yet</p>
              )}
              {selectedMarkerData.photos.length >= 5 && (
                <p className="text-green-400 text-sm">Maximum photos reached</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Summary */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center">
            {damageMarkers.length === 0 ? (
              <div className="text-green-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No damage recorded</p>
                <p className="text-sm text-gray-400 mt-1">Vehicle appears to be in good condition</p>
              </div>
            ) : (
              <div className="text-yellow-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>{damageMarkers.length} damage{damageMarkers.length !== 1 ? 's' : ''} recorded</p>
                <p className="text-sm text-gray-400 mt-1">
                  {damageMarkers.reduce((total, marker) => total + marker.photos.length, 0)} photos captured
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}