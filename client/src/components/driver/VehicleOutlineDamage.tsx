import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Camera, Plus, X } from "lucide-react";
import outlineFront from "@assets/car-front.png";
import outlineRear from "@assets/car-rear.png"; 
import outlineDriverSide from "@assets/car-driver-side.png";
import outlinePassengerSide from "@assets/car-passenger-side.png";
import outlineRoof from "@assets/car-roof.png";

interface DamagePoint {
  id: string;
  view: 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'roof';
  position: { x: number; y: number };
  damageType: string;
  damageSize: string;
  notes: string;
  photos: File[];
  label: number;
}

interface VehicleOutlineDamageProps {
  onDamageChange: (damage: DamagePoint[]) => void;
  existingDamage: DamagePoint[];
}

const outlineImages = {
  front: outlineFront,
  rear: outlineRear,
  driver_side: outlineDriverSide,
  passenger_side: outlinePassengerSide,
  roof: outlineRoof,
};

const viewLabels = {
  front: 'Front View',
  rear: 'Rear View',
  driver_side: 'Driver Side',
  passenger_side: 'Passenger Side',
  roof: 'Roof View',
};

const damageTypes = [
  'Scratch',
  'Dent',
  'Paint Chip',
  'Rust',
  'Crack',
  'Missing Part',
  'Broken Glass',
  'Scuff Mark',
  'Stone Chip',
  'Panel Gap',
  'Other'
];

const damageSizes = [
  'Small',
  'Medium',
  'Large'
];

export default function VehicleOutlineDamage({ onDamageChange, existingDamage = [] }: VehicleOutlineDamageProps) {
  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>(existingDamage);
  const [activeView, setActiveView] = useState<keyof typeof outlineImages>('front');
  const [selectedDamage, setSelectedDamage] = useState<string | null>(null);
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const getNextLabel = () => {
    const existingLabels = damagePoints.map(p => p.label);
    let label = 1;
    while (existingLabels.includes(label)) {
      label++;
    }
    return label;
  };

  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isAddingDamage) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamagePoint: DamagePoint = {
      id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      view: activeView,
      position: { x, y },
      damageType: '',
      damageSize: '',
      notes: '',
      photos: [],
      label: getNextLabel()
    };

    const updatedDamage = [...damagePoints, newDamagePoint];
    setDamagePoints(updatedDamage);
    setSelectedDamage(newDamagePoint.id);
    setIsAddingDamage(false);
    onDamageChange(updatedDamage);
  };

  const updateDamagePoint = (id: string, updates: Partial<DamagePoint>) => {
    const updatedDamage = damagePoints.map(point => 
      point.id === id ? { ...point, ...updates } : point
    );
    setDamagePoints(updatedDamage);
    onDamageChange(updatedDamage);
  };

  const removeDamagePoint = (id: string) => {
    const updatedDamage = damagePoints.filter(point => point.id !== id);
    setDamagePoints(updatedDamage);
    setSelectedDamage(null);
    onDamageChange(updatedDamage);
  };

  const addPhotoToDamage = (damageId: string, files: FileList) => {
    const newPhotos = Array.from(files);
    updateDamagePoint(damageId, {
      photos: [...damagePoints.find(p => p.id === damageId)?.photos || [], ...newPhotos]
    });
  };

  const removePhotoFromDamage = (damageId: string, photoIndex: number) => {
    const damage = damagePoints.find(p => p.id === damageId);
    if (damage) {
      const updatedPhotos = damage.photos.filter((_, index) => index !== photoIndex);
      updateDamagePoint(damageId, { photos: updatedPhotos });
    }
  };

  const selectedDamagePoint = damagePoints.find(p => p.id === selectedDamage);
  const currentViewDamage = damagePoints.filter(p => p.view === activeView);

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex space-x-2 overflow-x-auto">
        {Object.entries(viewLabels).map(([view, label]) => (
          <Button
            key={view}
            variant={activeView === view ? "default" : "outline"}
            onClick={() => {
              setActiveView(view as keyof typeof outlineImages);
              setSelectedDamage(null);
            }}
            className="whitespace-nowrap bg-[#00ABE7] hover:bg-[#0096d1] text-white"
          >
            {label}
            {damagePoints.filter(p => p.view === view).length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-white text-[#00ABE7]">
                {damagePoints.filter(p => p.view === view).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Vehicle Outline with Damage Points */}
      <div className="bg-slate-100 p-8 rounded-lg border-2" style={{ minHeight: '600px' }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">{viewLabels[activeView]}</h3>
          <div className="space-x-2">
            <Button
              onClick={() => setIsAddingDamage(!isAddingDamage)}
              variant={isAddingDamage ? "destructive" : "default"}
              size="sm"
              className={isAddingDamage ? "" : "bg-[#00ABE7] hover:bg-[#0096d1]"}
            >
              {isAddingDamage ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isAddingDamage ? "Cancel" : "Add Damage"}
            </Button>
          </div>
        </div>

        <div className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
          <img
            ref={imageRef}
            src={outlineImages[activeView]}
            alt={`Vehicle ${viewLabels[activeView]}`}
            className={`max-w-full h-auto ${isAddingDamage ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleImageClick}
            style={{ maxHeight: '500px', width: 'auto' }}
          />
          
          {/* Damage Point Markers */}
          {currentViewDamage.map((damage) => (
            <button
              key={damage.id}
              className={`absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                selectedDamage === damage.id
                  ? 'bg-red-500 border-red-700 text-white shadow-lg scale-110'
                  : 'bg-yellow-400 border-yellow-600 text-black hover:bg-red-400 hover:border-red-600 hover:text-white'
              }`}
              style={{
                left: `${damage.position.x}%`,
                top: `${damage.position.y}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDamage(damage.id);
                setIsAddingDamage(false);
              }}
              title={`Damage ${damage.label}: ${damage.damageType || 'Unspecified'}`}
            >
              {damage.label}
            </button>
          ))}
          
          {isAddingDamage && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg border">
                <p className="text-sm font-medium">Click on the vehicle outline to add damage</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Damage Details Panel */}
      {selectedDamagePoint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Damage Point #{selectedDamagePoint.label}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeDamagePoint(selectedDamagePoint.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Damage Type *</Label>
                <Select
                  value={selectedDamagePoint.damageType}
                  onValueChange={(value) => updateDamagePoint(selectedDamagePoint.id, { damageType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage type" />
                  </SelectTrigger>
                  <SelectContent>
                    {damageTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Damage Size *</Label>
                <Select
                  value={selectedDamagePoint.damageSize}
                  onValueChange={(value) => updateDamagePoint(selectedDamagePoint.id, { damageSize: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage size" />
                  </SelectTrigger>
                  <SelectContent>
                    {damageSizes.map(size => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Describe the damage in detail..."
                value={selectedDamagePoint.notes}
                onChange={(e) => updateDamagePoint(selectedDamagePoint.id, { notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Photo Management */}
            <div>
              <Label>Damage Photos</Label>
              <div className="space-y-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos ({selectedDamagePoint.photos.length})
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={(e) => {
                    if (e.target.files) {
                      addPhotoToDamage(selectedDamagePoint.id, e.target.files);
                    }
                  }}
                  className="hidden"
                />

                {selectedDamagePoint.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDamagePoint.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Damage photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          onClick={() => removePhotoFromDamage(selectedDamagePoint.id, index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Damage Summary */}
      {damagePoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Damage Summary ({damagePoints.length} points)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {damagePoints.map((damage) => (
                <div
                  key={damage.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDamage === damage.id 
                      ? 'border-[#00ABE7] bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedDamage(damage.id);
                    setActiveView(damage.view);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Point #{damage.label}</span>
                    <Badge variant="outline">{viewLabels[damage.view]}</Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>{damage.damageType || 'Type not specified'} - {damage.damageSize || 'Size not specified'}</div>
                    {damage.photos.length > 0 && (
                      <div className="text-[#00ABE7] mt-1">{damage.photos.length} photo(s)</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}