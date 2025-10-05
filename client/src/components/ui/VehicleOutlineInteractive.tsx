import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, Undo, Redo, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import LightCameraCapture from "@/components/driver/LightCameraCapture";

interface DamageMarker {
  id: string;
  view: 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'driverSide' | 'passengerSide' | 'roof';
  position: { x: number; y: number };
  damageType: string;
  damageSize: string;
  photoUrls: string[];
  notes: string;
  label: number;
}

interface VehicleOutlineInteractiveProps {
  damageMarkers: DamageMarker[];
  onMarkersChange: (markers: DamageMarker[]) => void;
  vehicle: { make: string; model: string };
}

const damageTypes = [
  { value: 'scratch', label: 'Scratch', color: 'bg-orange-500' },
  { value: 'dent', label: 'Dent', color: 'bg-red-500' },
  { value: 'chip', label: 'Chip', color: 'bg-yellow-500' },
  { value: 'crack', label: 'Crack', color: 'bg-purple-500' },
  { value: 'rust', label: 'Rust', color: 'bg-amber-600' },
  { value: 'broken_missing', label: 'Broken/Missing', color: 'bg-red-700' },
  { value: 'bad_repair', label: 'Bad Repair', color: 'bg-pink-500' },
  { value: 'paintwork', label: 'Paintwork', color: 'bg-blue-500' },
];

const damageSizes = [
  { value: 'small', label: 'Small (< 2cm)' },
  { value: 'medium', label: 'Medium (2-10cm)' },
  { value: 'large', label: 'Large (> 10cm)' },
];

const views = [
  { id: 'front', name: 'Front View' },
  { id: 'rear', name: 'Rear View' },
  { id: 'driver_side', name: 'Driver Side' },
  { id: 'passenger_side', name: 'Passenger Side' },
  { id: 'driverSide', name: 'Driver Side' },
  { id: 'passengerSide', name: 'Passenger Side' },
  { id: 'roof', name: 'Roof View' },
];

export default function VehicleOutlineInteractive({ damageMarkers, onMarkersChange, vehicle }: VehicleOutlineInteractiveProps) {
  const [activeView, setActiveView] = useState<'front' | 'rear' | 'driver_side' | 'passenger_side' | 'driverSide' | 'passengerSide' | 'roof'>('front');
  const [selectedDamageType, setSelectedDamageType] = useState('scratch');
  const [selectedDamageSize, setSelectedDamageSize] = useState('small');
  const [showMarkerModal, setShowMarkerModal] = useState(false);
  const [editingMarker, setEditingMarker] = useState<DamageMarker | null>(null);
  const [undoStack, setUndoStack] = useState<DamageMarker[][]>([]);
  const [redoStack, setRedoStack] = useState<DamageMarker[][]>([]);

  const saveToHistory = () => {
    setUndoStack(prev => [...prev.slice(-9), damageMarkers]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [damageMarkers, ...prev.slice(0, 9)]);
      setUndoStack(prev => prev.slice(0, -1));
      onMarkersChange(previousState);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setUndoStack(prev => [...prev, damageMarkers]);
      setRedoStack(prev => prev.slice(1));
      onMarkersChange(nextState);
    }
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Don't add marker if clicking on existing marker
    if ((e.target as Element).closest('.damage-marker')) {
      return;
    }

    saveToHistory();

    const newMarker: DamageMarker = {
      id: Date.now().toString(),
      view: activeView,
      position: { x, y },
      damageType: selectedDamageType,
      damageSize: selectedDamageSize,
      photoUrls: [],
      notes: '',
      label: damageMarkers.length + 1,
    };

    onMarkersChange([...damageMarkers, newMarker]);
    setEditingMarker(newMarker);
    setShowMarkerModal(true);
  };

  const handleMarkerClick = (marker: DamageMarker, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMarker(marker);
    setShowMarkerModal(true);
  };

  const updateMarker = (updates: Partial<DamageMarker>) => {
    if (!editingMarker) return;
    
    const updated = { ...editingMarker, ...updates };
    setEditingMarker(updated);
    onMarkersChange(damageMarkers.map(m => m.id === updated.id ? updated : m));
  };

  const deleteMarker = () => {
    if (!editingMarker) return;
    
    saveToHistory();
    onMarkersChange(damageMarkers.filter(m => m.id !== editingMarker.id));
    setShowMarkerModal(false);
    setEditingMarker(null);
  };

  const getCurrentViewMarkers = () => {
    return damageMarkers.filter(marker => marker.view === activeView);
  };

  const getDamageTypeColor = (damageType: string) => {
    return damageTypes.find(t => t.value === damageType)?.color || 'bg-gray-500';
  };

  const VehicleSVG = ({ view }: { view: string }) => {
    const markers = getCurrentViewMarkers();
    
    return (
      <svg
        viewBox="0 0 400 300"
        className="w-full h-80 cursor-crosshair bg-white rounded-lg border-2 border-gray-200 shadow-sm"
        onClick={handleSVGClick}
      >
        {/* Vehicle Outline - BLACK car shape to match POC PDF */}
        <g fill="none" stroke="#000000" strokeWidth="2">
          {view === 'front' && (
            <g>
              {/* Front view car outline */}
              <rect x="50" y="50" width="300" height="200" rx="20" />
              <rect x="100" y="30" width="200" height="40" rx="10" />
              <circle cx="120" cy="260" r="20" />
              <circle cx="280" cy="260" r="20" />
              <rect x="150" y="70" width="100" height="80" rx="5" />
              {/* Headlights */}
              <ellipse cx="80" cy="100" rx="15" ry="25" />
              <ellipse cx="320" cy="100" rx="15" ry="25" />
            </g>
          )}
          {view === 'rear' && (
            <g>
              {/* Rear view car outline */}
              <rect x="50" y="50" width="300" height="200" rx="20" />
              <rect x="100" y="30" width="200" height="40" rx="10" />
              <circle cx="120" cy="260" r="20" />
              <circle cx="280" cy="260" r="20" />
              <rect x="150" y="70" width="100" height="60" rx="5" />
              {/* Taillights */}
              <ellipse cx="80" cy="90" rx="12" ry="20" />
              <ellipse cx="320" cy="90" rx="12" ry="20" />
            </g>
          )}
          {view === 'driver_side' && (
            <g>
              {/* Side view car outline */}
              <path d="M50 150 Q60 100 120 90 L280 90 Q340 100 350 150 L350 200 Q340 220 320 220 L80 220 Q60 220 50 200 Z" />
              <circle cx="100" cy="220" r="20" />
              <circle cx="300" cy="220" r="20" />
              {/* Windows */}
              <path d="M80 150 L120 110 L280 110 L320 150 Z" />
              {/* Doors */}
              <line x1="180" y1="110" x2="180" y2="200" />
              <line x1="240" y1="110" x2="240" y2="200" />
            </g>
          )}
          {view === 'passenger_side' && (
            <g>
              {/* Side view car outline (mirrored) */}
              <path d="M350 150 Q340 100 280 90 L120 90 Q60 100 50 150 L50 200 Q60 220 80 220 L320 220 Q340 220 350 200 Z" />
              <circle cx="300" cy="220" r="20" />
              <circle cx="100" cy="220" r="20" />
              {/* Windows */}
              <path d="M320 150 L280 110 L120 110 L80 150 Z" />
              {/* Doors */}
              <line x1="220" y1="110" x2="220" y2="200" />
              <line x1="160" y1="110" x2="160" y2="200" />
            </g>
          )}
        </g>

        {/* Damage Markers */}
        {markers.map((marker) => {
          const damageColor = getDamageTypeColor(marker.damageType);
          return (
            <g
              key={marker.id}
              className="damage-marker cursor-pointer transform transition-all hover:scale-110"
              onClick={(e) => handleMarkerClick(marker, e as any)}
            >
              <circle
                cx={(marker.position.x / 100) * 400}
                cy={(marker.position.y / 100) * 300}
                r="12"
                className={cn("stroke-white stroke-2", damageColor.replace('bg-', 'fill-'))}
              />
              <text
                x={(marker.position.x / 100) * 400}
                y={(marker.position.y / 100) * 300 + 5}
                textAnchor="middle"
                className="fill-white text-xs font-bold pointer-events-none"
              >
                {marker.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* View Selector */}
        <div className="flex bg-white rounded-lg border border-gray-200 p-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                activeView === view.id
                  ? "bg-[#00ABE7] text-white shadow-sm"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {view.name}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={undoStack.length === 0}
            className="border-gray-200"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={redoStack.length === 0}
            className="border-gray-200"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Damage Type Selector */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-700">Select Damage Type</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {damageTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedDamageType(type.value)}
                className={cn(
                  "flex items-center space-x-2 p-3 rounded-lg border-2 transition-all text-left",
                  selectedDamageType === type.value
                    ? "border-[#00ABE7] bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full", type.color)} />
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Display */}
      <Card className="shadow-sm border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{views.find(v => v.id === activeView)?.name}</span>
              <Badge variant="outline" className="text-gray-600">
                {vehicle.make} {vehicle.model}
              </Badge>
            </CardTitle>
            <div className="text-sm text-gray-600">
              {getCurrentViewMarkers().length} damage markers
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <VehicleSVG view={activeView} />
            
            {/* Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <Plus className="inline h-4 w-4 mr-1" />
                Tap anywhere on the vehicle outline to add a damage marker. Click existing markers to edit details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Damage Summary */}
      {damageMarkers.length > 0 && (
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Damage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {damageMarkers.map((marker) => {
                const damageType = damageTypes.find(t => t.value === marker.damageType);
                return (
                  <div
                    key={marker.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      setEditingMarker(marker);
                      setShowMarkerModal(true);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-white rounded-full text-xs font-bold">
                        {marker.label}
                      </div>
                      <div className={cn("w-3 h-3 rounded-full", damageType?.color)} />
                      <div>
                        <p className="text-sm font-medium">{damageType?.label}</p>
                        <p className="text-xs text-gray-600">
                          {views.find(v => v.id === marker.view)?.name} • {marker.damageSize}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {marker.photoUrls.length} photos
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marker Details Modal */}
      <Dialog open={showMarkerModal} onOpenChange={setShowMarkerModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Damage Marker #{editingMarker?.label}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMarkerModal(false)}
                className="float-right"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {editingMarker && (
            <div className="space-y-6 pt-4">
              {/* Damage Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Damage Type
                  </label>
                  <select
                    value={editingMarker.damageType}
                    onChange={(e) => updateMarker({ damageType: e.target.value })}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                  >
                    {damageTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    value={editingMarker.damageSize}
                    onChange={(e) => updateMarker({ damageSize: e.target.value })}
                    className="w-full h-10 rounded-md border border-gray-200 px-3 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                  >
                    {damageSizes.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <Textarea
                  placeholder="Describe the damage in detail..."
                  value={editingMarker.notes}
                  onChange={(e) => updateMarker({ notes: e.target.value })}
                  className="rounded-lg border-gray-200 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                  rows={3}
                />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Damage Photos
                </label>
                <LightCameraCapture
                  photos={editingMarker.photoUrls}
                  onPhotosChange={(photos) => updateMarker({ photoUrls: photos })}
                  maxPhotos={4}
                  category="Damage"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="destructive"
                  onClick={deleteMarker}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Marker
                </Button>
                <Button
                  onClick={() => setShowMarkerModal(false)}
                  className="bg-[#00ABE7] hover:bg-[#0096d1] text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}