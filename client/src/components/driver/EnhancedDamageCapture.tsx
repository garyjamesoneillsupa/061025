import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, AlertTriangle, Trash2, Plus } from 'lucide-react';

interface DamagePoint {
  id: string;
  x: number;
  y: number;
  type: 'scratch' | 'dent' | 'chip' | 'crack' | 'missing' | 'other';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  photos: File[];
}

interface DamageCaptureProps {
  onDamageChange: (damage: DamagePoint[]) => void;
  existingDamage?: DamagePoint[];
}

export default function EnhancedDamageCapture({ onDamageChange, existingDamage = [] }: DamageCaptureProps) {
  const [damagePoints, setDamagePoints] = useState<DamagePoint[]>(existingDamage);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [isAddingDamage, setIsAddingDamage] = useState(false);
  const vehicleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const damageTypes = [
    { value: 'scratch', label: 'Scratch', color: 'bg-yellow-500' },
    { value: 'dent', label: 'Dent', color: 'bg-orange-500' },
    { value: 'chip', label: 'Paint Chip', color: 'bg-red-500' },
    { value: 'crack', label: 'Crack', color: 'bg-purple-500' },
    { value: 'missing', label: 'Missing Part', color: 'bg-gray-500' },
    { value: 'other', label: 'Other', color: 'bg-blue-500' }
  ];

  const severityLevels = [
    { value: 'minor', label: 'Minor', color: 'bg-green-500' },
    { value: 'moderate', label: 'Moderate', color: 'bg-yellow-500' },
    { value: 'major', label: 'Major', color: 'bg-red-500' }
  ];

  const handleVehicleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingDamage) return;
    
    const rect = vehicleRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const newDamage: DamagePoint = {
      id: Date.now().toString(),
      x,
      y,
      type: 'scratch',
      severity: 'minor',
      description: '',
      photos: []
    };

    const updated = [...damagePoints, newDamage];
    setDamagePoints(updated);
    setSelectedPoint(newDamage.id);
    setIsAddingDamage(false);
    onDamageChange(updated);
  };

  const updateDamagePoint = (id: string, updates: Partial<DamagePoint>) => {
    const updated = damagePoints.map(point => 
      point.id === id ? { ...point, ...updates } : point
    );
    setDamagePoints(updated);
    onDamageChange(updated);
  };

  const deleteDamagePoint = (id: string) => {
    const updated = damagePoints.filter(point => point.id !== id);
    setDamagePoints(updated);
    setSelectedPoint(null);
    onDamageChange(updated);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedPoint) return;

    const selectedDamage = damagePoints.find(p => p.id === selectedPoint);
    if (!selectedDamage) return;

    const newPhotos = [...selectedDamage.photos, ...Array.from(files)];
    updateDamagePoint(selectedPoint, { photos: newPhotos });
  };

  const removePhoto = (pointId: string, photoIndex: number) => {
    const point = damagePoints.find(p => p.id === pointId);
    if (!point) return;

    const newPhotos = point.photos.filter((_, index) => index !== photoIndex);
    updateDamagePoint(pointId, { photos: newPhotos });
  };

  const selectedDamage = selectedPoint ? damagePoints.find(p => p.id === selectedPoint) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Vehicle Damage Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Vehicle Outline - Interactive */}
          <div className="relative mb-6">
            <div 
              ref={vehicleRef}
              className={`relative w-full h-96 bg-gray-100 rounded-lg border-2 ${
                isAddingDamage ? 'border-dashed border-blue-500 cursor-crosshair' : 'border-gray-300'
              }`}
              onClick={handleVehicleClick}
            >
              {/* Vehicle SVG Outline */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Car body outline */}
                <path
                  d="M50 80 L80 60 L320 60 L350 80 L350 140 L320 160 L80 160 L50 140 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                />
                {/* Wheels */}
                <circle cx="100" cy="160" r="15" fill="none" stroke="white" strokeWidth="3" />
                <circle cx="300" cy="160" r="15" fill="none" stroke="white" strokeWidth="3" />
                {/* Windows */}
                <path
                  d="M90 80 L110 65 L290 65 L310 80 L310 120 L90 120 Z"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                />
                {/* Door lines */}
                <line x1="150" y1="80" x2="150" y2="140" stroke="white" strokeWidth="2" />
                <line x1="200" y1="65" x2="200" y2="140" stroke="white" strokeWidth="2" />
                <line x1="250" y1="80" x2="250" y2="140" stroke="white" strokeWidth="2" />
              </svg>

              {/* Damage Points */}
              {damagePoints.map((point) => {
                const typeInfo = damageTypes.find(t => t.value === point.type);
                const severityInfo = severityLevels.find(s => s.value === point.severity);
                
                return (
                  <div
                    key={point.id}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white cursor-pointer transform -translate-x-2 -translate-y-2 ${
                      typeInfo?.color || 'bg-red-500'
                    } ${selectedPoint === point.id ? 'ring-4 ring-blue-400 scale-125' : ''}`}
                    style={{
                      left: `${point.x}%`,
                      top: `${point.y}%`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPoint(selectedPoint === point.id ? null : point.id);
                    }}
                  >
                    <div className="w-full h-full rounded-full animate-pulse" />
                  </div>
                );
              })}

              {/* Instructions overlay */}
              {damagePoints.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4 bg-white/90 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click "Add Damage" then tap on the vehicle to mark damage locations</p>
                  </div>
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => setIsAddingDamage(!isAddingDamage)}
                variant={isAddingDamage ? "destructive" : "default"}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{isAddingDamage ? 'Cancel' : 'Add Damage'}</span>
              </Button>
              
              <div className="text-sm text-gray-600">
                {damagePoints.length} damage point{damagePoints.length !== 1 ? 's' : ''} marked
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-semibold mb-2">Damage Types</h4>
              <div className="grid grid-cols-2 gap-1">
                {damageTypes.map(type => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Severity Levels</h4>
              <div className="space-y-1">
                {severityLevels.map(level => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    <span className="text-sm">{level.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Details Panel */}
      {selectedDamage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Damage Details</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteDamagePoint(selectedDamage.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Damage Type Selection */}
            <div>
              <Label>Damage Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {damageTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateDamagePoint(selectedDamage.id, { type: type.value as any })}
                    className={`p-2 rounded-lg border text-sm ${
                      selectedDamage.type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${type.color} mx-auto mb-1`} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Selection */}
            <div>
              <Label>Severity</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {severityLevels.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => updateDamagePoint(selectedDamage.id, { severity: level.value as any })}
                    className={`p-2 rounded-lg border text-sm ${
                      selectedDamage.severity === level.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${level.color} mx-auto mb-1`} />
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                value={selectedDamage.description}
                onChange={(e) => updateDamagePoint(selectedDamage.id, { description: e.target.value })}
                placeholder="Describe the damage in detail..."
                className="mt-2"
              />
            </div>

            {/* Photo Capture */}
            <div>
              <Label className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span>Damage Photos ({selectedDamage.photos.length})</span>
              </Label>
              
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />

                {/* Photo Preview */}
                {selectedDamage.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDamage.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Damage photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removePhoto(selectedDamage.id, index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {damagePoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Damage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {damagePoints.map((point, index) => {
                const typeInfo = damageTypes.find(t => t.value === point.type);
                const severityInfo = severityLevels.find(s => s.value === point.severity);
                
                return (
                  <div
                    key={point.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => setSelectedPoint(point.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${typeInfo?.color}`} />
                      <div>
                        <div className="font-medium">
                          {typeInfo?.label} - <Badge variant="outline">{severityInfo?.label}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-md">
                          {point.description || 'No description'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {point.photos.length} photo{point.photos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}