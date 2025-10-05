import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus, X } from "lucide-react";

interface DamageMarker {
  id: string;
  view: 'front' | 'rear' | 'driver_side' | 'passenger_side';
  position: { x: number; y: number };
  damageType: 'scratch' | 'dent' | 'chip' | 'crack' | 'rust' | 'broken_missing' | 'bad_repair' | 'paintwork';
  damageSize: 'small' | 'medium' | 'large';
  photoUrls: string[];
  label: number;
}

interface VehicleOutlineViewProps {
  view: 'front' | 'rear' | 'driver_side' | 'passenger_side';
  markers: DamageMarker[];
  onAddMarker: (marker: Omit<DamageMarker, 'id' | 'label'>) => void;
  onRemoveMarker: (markerId: string) => void;
  onAddPhoto: (markerId: string, photoUrl: string) => void;
}

const VehicleOutline = ({ view, markers, onAddMarker, onRemoveMarker, onAddPhoto }: VehicleOutlineViewProps) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [showDamageSelector, setShowDamageSelector] = useState<{x: number, y: number} | null>(null);
  const [selectedDamageType, setSelectedDamageType] = useState<string>('');
  const [selectedDamageSize, setSelectedDamageSize] = useState<string>('');

  const handleSvgClick = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    setShowDamageSelector({ x, y });
    setSelectedDamageType('');
    setSelectedDamageSize('');
  };

  const handleAddDamage = () => {
    if (!showDamageSelector || !selectedDamageType || !selectedDamageSize) return;

    const newMarker = {
      view,
      position: showDamageSelector,
      damageType: selectedDamageType as DamageMarker['damageType'],
      damageSize: selectedDamageSize as DamageMarker['damageSize'],
      photoUrls: []
    };

    onAddMarker(newMarker);
    setShowDamageSelector(null);
    setSelectedDamageType('');
    setSelectedDamageSize('');
  };

  const getViewTitle = () => {
    switch(view) {
      case 'front': return 'Front View';
      case 'rear': return 'Rear View';
      case 'driver_side': return 'Driver Side';
      case 'passenger_side': return 'Passenger Side';
    }
  };

  const getSvgContent = () => {
    const strokeColor = '#00ABE7';
    const fillColor = 'none';
    
    switch(view) {
      case 'front':
        return (
          <svg viewBox="0 0 300 200" className="w-full h-48 border-2 border-[#00ABE7] rounded-lg bg-slate-50">
            {/* Front view outline */}
            <rect x="50" y="30" width="200" height="120" rx="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <rect x="70" y="20" width="160" height="15" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="80" y="160" width="140" height="15" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="90" cy="40" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="210" cy="40" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="120" y="60" width="60" height="40" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
          </svg>
        );
      case 'rear':
        return (
          <svg viewBox="0 0 300 200" className="w-full h-48 border-2 border-[#00ABE7] rounded-lg bg-slate-50">
            {/* Rear view outline */}
            <rect x="50" y="30" width="200" height="120" rx="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <rect x="70" y="20" width="160" height="15" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="80" y="160" width="140" height="15" rx="5" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="90" cy="135" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="210" cy="135" r="8" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="120" y="100" width="60" height="25" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
          </svg>
        );
      case 'driver_side':
        return (
          <svg viewBox="0 0 400 150" className="w-full h-48 border-2 border-[#00ABE7] rounded-lg bg-slate-50">
            {/* Driver side outline */}
            <path d="M30 75 L50 50 L350 50 L370 75 L350 100 L50 100 Z" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <rect x="60" y="40" width="50" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="140" y="40" width="60" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="230" y="40" width="60" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="310" y="40" width="50" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="80" cy="120" r="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <circle cx="320" cy="120" r="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
          </svg>
        );
      case 'passenger_side':
        return (
          <svg viewBox="0 0 400 150" className="w-full h-48 border-2 border-[#00ABE7] rounded-lg bg-slate-50">
            {/* Passenger side outline */}
            <path d="M30 75 L50 50 L350 50 L370 75 L350 100 L50 100 Z" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <rect x="60" y="40" width="50" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="140" y="40" width="60" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="230" y="40" width="60" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <rect x="310" y="40" width="50" height="20" rx="3" fill={fillColor} stroke={strokeColor} strokeWidth="2"/>
            <circle cx="80" cy="120" r="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
            <circle cx="320" cy="120" r="15" fill={fillColor} stroke={strokeColor} strokeWidth="3"/>
          </svg>
        );
    }
  };

  return (
    <Card className="border-[#00ABE7] border-2">
      <CardHeader className="bg-[#00ABE7]/10 pb-3">
        <CardTitle className="text-[#00ABE7] font-bold">{getViewTitle()}</CardTitle>
        <p className="text-sm text-slate-600">Tap on the vehicle outline to mark damage</p>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative" onClick={handleSvgClick}>
          {getSvgContent()}
          
          {/* Render damage markers */}
          {markers.filter(m => m.view === view).map((marker) => (
            <div
              key={marker.id}
              className="absolute w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-red-600 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${marker.position.x}%`,
                top: `${marker.position.y}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMarker(marker.id);
              }}
            >
              {marker.label}
            </div>
          ))}
        </div>

        {/* Show damage selector */}
        {showDamageSelector && (
          <div className="mt-4 p-4 border-2 border-[#00ABE7] rounded-lg bg-[#00ABE7]/5">
            <h4 className="font-semibold text-[#00ABE7] mb-3">Add Damage Details</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Damage Type:</label>
                <Select value={selectedDamageType} onValueChange={setSelectedDamageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scratch">Scratch</SelectItem>
                    <SelectItem value="dent">Dent</SelectItem>
                    <SelectItem value="chip">Chip</SelectItem>
                    <SelectItem value="crack">Crack</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                    <SelectItem value="broken_missing">Broken/Missing</SelectItem>
                    <SelectItem value="bad_repair">Bad Repair</SelectItem>
                    <SelectItem value="paintwork">Paintwork</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Damage Size:</label>
                <Select value={selectedDamageSize} onValueChange={setSelectedDamageSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select damage size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (0-2 inches)</SelectItem>
                    <SelectItem value="medium">Medium (2-6 inches)</SelectItem>
                    <SelectItem value="large">Large (6+ inches)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddDamage} 
                  disabled={!selectedDamageType || !selectedDamageSize}
                  className="bg-[#00ABE7] hover:bg-[#0087c7] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Damage
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDamageSelector(null)}
                  className="border-[#00ABE7] text-[#00ABE7] hover:bg-[#00ABE7]/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Selected marker details */}
        {selectedMarker && (() => {
          const marker = markers.find(m => m.id === selectedMarker);
          if (!marker) return null;
          
          return (
            <div className="mt-4 p-4 border-2 border-orange-300 rounded-lg bg-orange-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-orange-700">Damage #{marker.label}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveMarker(marker.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="outline">{marker.damageType.replace('_', ' ')}</Badge>
                  <Badge variant="outline">{marker.damageSize}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-[#00ABE7] hover:bg-[#0087c7] text-white"
                    onClick={() => {
                      // Trigger photo capture for this marker
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.capture = 'camera';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onAddPhoto(marker.id, reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Add Photo ({marker.photoUrls.length})
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default VehicleOutline;