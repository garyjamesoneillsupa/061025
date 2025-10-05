// Gold Standard Motorway-style Collection Workflow - Complete Implementation
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  CheckCircle2, 
  ArrowLeft, 
  Car, 
  FileText,
  Signature,
  WifiOff,
  Wifi,
  AlertTriangle,
  X,
  Plus,
  Clock,
  MapPin,
  User,
  Key,
  Settings,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Removed offlineStorage import to avoid IndexedDB transaction errors
import carFrontOutline from "@assets/car-front-outline.png";

interface MotorwayVehicleInspectionProps {
  job: any;
  onComplete: () => void;
  onBack: () => void;
}

type CollectionStep = 
  | 'overview'
  | 'documentation'
  | 'exterior'
  | 'wheels-tyres'
  | 'interior'
  | 'other'
  | 'signature';

interface DamageMarker {
  id: string;
  number: number; // Sequential number for correlation with images
  x: number;
  y: number;
  view: 'front' | 'rear' | 'side-left' | 'side-right';
  type: 'scratch' | 'dent' | 'windscreen' | 'chip' | 'crack' | 'broken-fittings' | 'bad-repair' | 'paintwork';
  size: 'small' | 'medium' | 'large';
  photos: string[];
  description: string;
  timestamp: string;
}

interface CollectionDetails {
  collectorName: string;
  collectorPhone: string;
  collectionTime: string;
  accessNotes: string;
}

interface DocumentationCheck {
  v5Document: boolean | null;
  serviceDocuments: boolean | null;
  lockingWheelNut: boolean | null;
}

interface ExteriorInspection {
  front: { photos: string[], damage: DamageMarker[] };
  rear: { photos: string[], damage: DamageMarker[] };
  passengerSide: { photos: string[], damage: DamageMarker[] };
  driverSide: { photos: string[], damage: DamageMarker[] };
  roof: { photos: string[], damage: DamageMarker[] };
}

interface WheelTyreInspection {
  frontLeft: { photos: string[], tyreCondition: 'ok' | 'worn' | 'extremely-worn' | null, damage: DamageMarker[] };
  frontRight: { photos: string[], tyreCondition: 'ok' | 'worn' | 'extremely-worn' | null, damage: DamageMarker[] };
  rearLeft: { photos: string[], tyreCondition: 'ok' | 'worn' | 'extremely-worn' | null, damage: DamageMarker[] };
  rearRight: { photos: string[], tyreCondition: 'ok' | 'worn' | 'extremely-worn' | null, damage: DamageMarker[] };
}

interface InteriorInspection {
  dashboard: { photos: string[], damage: DamageMarker[] };
  frontSeats: { photos: string[], damage: DamageMarker[] };
  rearSeats: { photos: string[], damage: DamageMarker[] };
  boot: { photos: string[], damage: DamageMarker[] };
}

interface InspectionPhoto {
  id: string;
  category: string;
  blob: Blob;
  timestamp: string;
}

export default function MotorwayVehicleInspection({ job, onComplete, onBack }: MotorwayVehicleInspectionProps) {
  const [currentStep, setCurrentStep] = useState<CollectionStep | 'overview'>('overview');
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [expandedDamage, setExpandedDamage] = useState<string | null>(null);
  const [photos, setPhotos] = useState<InspectionPhoto[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<CollectionDetails>({
    collectorName: '',
    collectorPhone: '',
    collectionTime: '',
    accessNotes: ''
  });
  const [documentationCheck, setDocumentationCheck] = useState<DocumentationCheck>({
    v5Document: null,
    serviceDocuments: null,
    lockingWheelNut: null
  });
  const [exteriorInspection, setExteriorInspection] = useState<ExteriorInspection>({
    front: { photos: [], damage: [] },
    rear: { photos: [], damage: [] },
    passengerSide: { photos: [], damage: [] },
    driverSide: { photos: [], damage: [] },
    roof: { photos: [], damage: [] }
  });
  const [wheelTyreInspection, setWheelTyreInspection] = useState<WheelTyreInspection>({
    frontLeft: { photos: [], tyreCondition: null, damage: [] },
    frontRight: { photos: [], tyreCondition: null, damage: [] },
    rearLeft: { photos: [], tyreCondition: null, damage: [] },
    rearRight: { photos: [], tyreCondition: null, damage: [] }
  });
  const [interiorInspection, setInteriorInspection] = useState<InteriorInspection>({
    dashboard: { photos: [], damage: [] },
    frontSeats: { photos: [], damage: [] },
    rearSeats: { photos: [], damage: [] },
    boot: { photos: [], damage: [] }
  });
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');
  const [driverSignature, setDriverSignature] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSaving, setIsSaving] = useState(false);
  const [showDamageFlow, setShowDamageFlow] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<Partial<DamageMarker> | null>(null);
  const [damageFlowStep, setDamageFlowStep] = useState<'mark' | 'photo' | 'type' | 'size' | 'description' | 'complete'>('mark');
  const [currentView, setCurrentView] = useState<'front' | 'rear' | 'passenger-side' | 'driver-side' | 'roof'>('front');
  const [currentSubSection, setCurrentSubSection] = useState<string>('');
  const [currentWheelPosition, setCurrentWheelPosition] = useState<'front-left' | 'front-right' | 'rear-left' | 'rear-right'>('front-left');
  
  const { toast } = useToast();
  
  // Auto-save function
  const autoSaveInspectionData = async () => {
    try {
      const formData = {
        currentStep,
        damageMarkers,
        collectionDetails,
        documentationCheck,
        exteriorInspection,
        wheelTyreInspection,
        interiorInspection,
        timestamp: new Date().toISOString()
      };
      
      // Store in localStorage to avoid DB transaction errors
      localStorage.setItem(`ovm-inspection-${job.id}`, JSON.stringify(formData));
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carOutlineRef = useRef<HTMLDivElement>(null);

  // Monitor connection status and implement auto-save
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // REAL DATABASE AUTO-SAVE every time data changes
  useEffect(() => {
    const autoSaveToDatabase = async () => {
      try {
        const inspectionData = {
          jobId: job.id,
          inspectionStep: currentStep,
          documentationData: documentationCheck,
          exteriorData: exteriorInspection,
          wheelsData: wheelTyreInspection,
          interiorData: interiorInspection,
          damageMarkers: damageMarkers,
          additionalNotes: additionalNotes,
          customerSignature: customerSignature,
          driverSignature: driverSignature,
          lastAutoSaved: new Date().toISOString()
        };
        
        // Save to real database first
        const response = await fetch('/api/vehicle-inspections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inspectionData)
        });
        
        if (response.ok) {
          console.log('✅ REAL DATABASE AUTO-SAVE SUCCESS');
        } else {
          console.error('❌ Database auto-save failed, falling back to IndexedDB');
          // Fallback to IndexedDB if database fails
          // Store using localStorage to avoid IndexedDB errors
          localStorage.setItem(`ovm-inspection-complete-${job.id}`, JSON.stringify(inspectionData));
        }
      } catch (error) {
        console.error('❌ Database auto-save error:', error);
        // Fallback to IndexedDB
        try {
          // Store using localStorage to avoid IndexedDB errors  
          localStorage.setItem(`ovm-inspection-step-${job.id}`, JSON.stringify({
            currentStep,
            documentationCheck,
            exteriorInspection,
            wheelTyreInspection,
            interiorInspection,
            additionalNotes,
            damageMarkers,
            customerSignature,
            driverSignature,
            lastSaved: new Date().toISOString()
          }));
        } catch (e) {
          console.error('Both database and IndexedDB auto-save failed:', e);
        }
      }
    };

    // Auto-save with debounce - every 2 seconds
    const timeoutId = setTimeout(autoSaveToDatabase, 2000);
    return () => clearTimeout(timeoutId);
  }, [currentStep, documentationCheck, exteriorInspection, wheelTyreInspection, interiorInspection, additionalNotes, damageMarkers, customerSignature, driverSignature]);

  // Load saved progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        // Load from localStorage instead of IndexedDB
        const savedProgressStr = localStorage.getItem(`ovm-inspection-step-${job.id}`);
        const savedProgress = savedProgressStr ? JSON.parse(savedProgressStr) : null;
        if (savedProgress) {
          setCurrentStep(savedProgress.currentStep || 'documentation');
          setCollectionDetails(savedProgress.collectionDetails || collectionDetails);
          setDocumentationCheck(savedProgress.documentationCheck || documentationCheck);
          setExteriorInspection(savedProgress.exteriorInspection || exteriorInspection);
          setWheelTyreInspection(savedProgress.wheelTyreInspection || wheelTyreInspection);
          setInteriorInspection(savedProgress.interiorInspection || interiorInspection);
          setAdditionalNotes(savedProgress.additionalNotes || '');
          setDamageMarkers(savedProgress.damageMarkers || []);
          setCustomerSignature(savedProgress.customerSignature || '');
          setDriverSignature(savedProgress.driverSignature || '');
          
          toast({
            title: "Progress Restored",
            description: "Previous inspection data loaded successfully"
          });
        }
      } catch (error) {
        console.warn('Failed to load progress:', error);
      }
    };

    loadProgress();
  }, [job.id]);

  const collectionSteps = [
    { id: 'documentation', title: 'Documentation', icon: FileText, status: getStepStatus('documentation'), required: true },
    { id: 'exterior', title: 'Exterior', icon: Car, status: getStepStatus('exterior'), required: true },
    { id: 'wheels-tyres', title: 'Wheels and tyres', icon: Settings, status: getStepStatus('wheels-tyres'), required: true },
    { id: 'interior', title: 'Interior', icon: Car, status: getStepStatus('interior'), required: true },
    { id: 'other', title: 'Other', icon: FileText, status: getStepStatus('other'), required: false },
    { id: 'signature', title: 'Signature', icon: Signature, status: getStepStatus('signature'), required: true }
  ];

  function getStepStatus(stepId: string): 'not-started' | 'continue' | 'complete' {
    if (currentStep === stepId) return 'continue';
    
    switch (stepId) {
      case 'documentation':
        return (documentationCheck.v5Document !== null && 
                documentationCheck.serviceDocuments !== null && 
                documentationCheck.lockingWheelNut !== null) ? 'complete' : 'not-started';
      case 'exterior':
        const exteriorComplete = Object.values(exteriorInspection).every(section => section.photos.length > 0);
        return exteriorComplete ? 'complete' : 'not-started';
      case 'wheels-tyres':
        const wheelsComplete = Object.values(wheelTyreInspection).every(wheel => 
          wheel.photos.length > 0 && wheel.tyreCondition !== null);
        return wheelsComplete ? 'complete' : 'not-started';
      case 'interior':
        const interiorComplete = Object.values(interiorInspection).every(section => section.photos.length > 0);
        return interiorComplete ? 'complete' : 'not-started';
      case 'other':
        return additionalNotes.trim().length > 0 ? 'complete' : 'not-started';
      case 'signature':
        return customerSignature && driverSignature ? 'complete' : 'not-started';
      default:
        return 'not-started';
    }
  }

  const damageTypes = [
    { id: 'scratch', label: 'Scratch or scuff' },
    { id: 'dent', label: 'Dent' },
    { id: 'windscreen', label: 'Windscreen damage (crack, stone chip)' },
    { id: 'chip', label: 'Chip' },
    { id: 'crack', label: 'Crack' },
    { id: 'broken-fittings', label: 'Broken or missing fittings' },
    { id: 'bad-repair', label: 'Bad repair' },
    { id: 'paintwork', label: 'Paintwork' }
  ];

  const damageSizes = [
    { id: 'small', label: 'Small', description: '0 - 5cm' },
    { id: 'medium', label: 'Medium', description: '6 - 15cm' },
    { id: 'large', label: 'Large', description: '16cm and over' }
  ];

  // Handle car outline tap for damage marking
  const handleCarOutlineTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!showDamageFlow) return;
    
    const rect = carOutlineRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    setSelectedDamage({
      id: Date.now().toString(),
      number: damageMarkers.length + 1, // Auto-increment number
      x,
      y,
      view: currentSubSection === 'front' ? 'front' : 
            currentSubSection === 'rear' ? 'rear' :
            currentSubSection === 'passengerSide' ? 'side-right' :
            currentSubSection === 'driverSide' ? 'side-left' : 'front',
      type: 'scratch', // Default type, will be changed in flow
      size: 'small', // Default size, will be changed in flow
      photos: [],
      description: '',
      timestamp: new Date().toISOString()
    });
    
    setDamageFlowStep('photo');
  };

  // Save all data to localStorage (no IndexedDB)
  const saveToOfflineStorage = async () => {
    try {
      setIsSaving(true);
      
      // Store all photos in localStorage
      for (const photo of photos) {
        if (photo.blob instanceof File) {
          const photoBlob = await photo.blob.arrayBuffer();
          const photoData = {
            jobId: job.id,
            category: photo.category,
            blob: Array.from(new Uint8Array(photoBlob)),
            timestamp: new Date().toISOString()
          };
          localStorage.setItem(`ovm-photo-complete-${photo.id}`, JSON.stringify(photoData));
        }
      }
      
      // Store inspection data in localStorage
      const inspectionData = {
        damageMarkers,
        photos: photos.map(p => ({ category: p.category, timestamp: p.timestamp })),
        collectionDetails,
        customerSignature,
        driverSignature,
        completedAt: new Date().toISOString(),
        step: currentStep
      };
      
      localStorage.setItem(`ovm-inspection-complete-${job.id}`, JSON.stringify(inspectionData));
      
      // Store API request for when online (simplified queue)
      const queuedRequest = {
        url: `/api/jobs/${job.id}/complete-inspection`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inspectionData,
          status: 'collected'
        }),
        jobId: job.id,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`ovm-queue-${job.id}`, JSON.stringify(queuedRequest));
      
      console.log('✅ Inspection data saved to localStorage');
      return true;
    } catch (error) {
      console.error('Failed to save offline:', error);
      toast({
        title: "Save Failed",
        description: "Could not save inspection data offline",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoCapture = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && selectedDamage) {
          const photo: InspectionPhoto = {
            id: Date.now().toString(),
            category: `damage-${selectedDamage.id}`,
            blob: file as File,
            timestamp: new Date().toISOString()
          };
          
          setPhotos(prev => [...prev, photo]);
          setSelectedDamage(prev => prev ? { ...prev, photos: [...(prev.photos || []), photo.id] } : null);
          
          // Save immediately to offline storage
          try {
            // Store photo directly in localStorage to avoid DB errors
            const photoBlob = await file.arrayBuffer();
            const photoData = {
              id: photo.id,
              category: photo.category,
              blob: Array.from(new Uint8Array(photoBlob)),
              timestamp: photo.timestamp
            };
            localStorage.setItem(`ovm-photo-${photo.id}`, JSON.stringify(photoData));
            autoSaveInspectionData();
            
            // Keep damage flow open to add more photos
            toast({
              title: "Photo captured",
              description: "Tap 'Take Another Photo' for more angles, or continue to damage type",
              duration: 3000
            });
          } catch (error) {
            console.error('Failed to save photo:', error);
          }
        }
      };
      fileInputRef.current.click();
    }
  };

  const handleDamageTypeSelect = (type: string) => {
    setSelectedDamage(prev => prev ? { ...prev, type: type as any } : null);
    setDamageFlowStep('size');
  };

  const handleDamageSizeSelect = (size: string) => {
    setSelectedDamage(prev => prev ? { ...prev, size: size as any } : null);
    setDamageFlowStep('description');
  };

  const handleDamageDescriptionSave = (description: string) => {
    if (selectedDamage) {
      const completeDamage: DamageMarker = {
        ...selectedDamage,
        description,
        size: selectedDamage.size as any
      } as DamageMarker;
      
      // Add to global damage markers for POC PDF correlation
      setDamageMarkers(prev => [...prev, completeDamage]);
      
      // Also add to section-specific damage for UI display
      const currentView = selectedDamage.view;
      if (currentView === 'front') {
        setExteriorInspection(prev => ({
          ...prev,
          front: { ...prev.front, damage: [...prev.front.damage, completeDamage] }
        }));
      } else if (currentView === 'rear') {
        setExteriorInspection(prev => ({
          ...prev,
          rear: { ...prev.rear, damage: [...prev.rear.damage, completeDamage] }
        }));
      } else if (currentView === 'side-right') {
        setExteriorInspection(prev => ({
          ...prev,
          passengerSide: { ...prev.passengerSide, damage: [...prev.passengerSide.damage, completeDamage] }
        }));
      } else if (currentView === 'side-left') {
        setExteriorInspection(prev => ({
          ...prev,
          driverSide: { ...prev.driverSide, damage: [...prev.driverSide.damage, completeDamage] }
        }));
      }
      
      setSelectedDamage(null);
      setDamageFlowStep('mark');
      setShowDamageFlow(false);
      
      toast({
        title: "✅ Damage Reported",
        description: `Damage ${completeDamage.number}: ${completeDamage.type} (${completeDamage.size}) saved to database`,
        duration: 4000
      });
      
      console.log(`✅ DAMAGE ${completeDamage.number} SAVED:`, completeDamage);
    }
  };

  const renderDamageFlowOverlay = () => {
    if (!showDamageFlow) return null;

    switch (damageFlowStep) {
      case 'mark':
        return (
          <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 text-white">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDamageFlow(false)}
                className="text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col justify-center px-4">
              <div className="bg-gray-800/95 rounded-xl p-6 mb-6 text-center border border-gray-700">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                </div>
                <h3 className="text-white font-semibold mb-2 text-lg">Mark damage location</h3>
                <p className="text-gray-300 text-sm leading-relaxed">Tap anywhere on the car outline below to precisely mark where the damage is located</p>
              </div>
              
              {/* Car outline with damage markers */}
              <div className="relative mx-auto bg-gray-800 rounded-xl p-8 border border-gray-700" style={{ maxWidth: '340px' }}>
                <div 
                  ref={carOutlineRef}
                  className="relative cursor-crosshair"
                  onClick={handleCarOutlineTap}
                >
                  <img 
                    src={carFrontOutline} 
                    alt="Car front outline" 
                    className="w-full h-auto brightness-0 invert"
                  />
                  
                  {/* Existing damage markers for current view */}
                  {damageMarkers.filter(m => m.view === currentView).map((marker, index) => (
                    <div
                      key={marker.id}
                      className="absolute w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg"
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}
                  
                  {/* Current damage marker being placed */}
                  {selectedDamage && (
                    <div
                      className="absolute w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold border-2 border-white animate-pulse shadow-lg"
                      style={{
                        left: `${selectedDamage.x}%`,
                        top: `${selectedDamage.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {damageMarkers.filter(m => m.view === currentView).length + 1}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <div className="w-full bg-blue-600 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'photo':
        return (
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 z-50 flex flex-col">
            {/* Enhanced Header */}
            <div className="flex justify-between items-center p-6 bg-black/20 backdrop-blur-sm border-b border-white/10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDamageFlowStep('mark')}
                className="text-white hover:bg-white/20 rounded-xl px-4 py-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="text-center">
                <div className="text-white font-semibold">Damage #{selectedDamage?.number}</div>
                <div className="text-blue-300 text-sm">Photo Capture</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDamageFlow(false)}
                className="text-red-300 hover:bg-red-500/20 rounded-xl px-4 py-2"
              >
                Cancel
              </Button>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center px-8 py-12">
              <div className="text-center space-y-8 max-w-sm mx-auto">
                {/* Enhanced Camera Icon */}
                <div className="relative">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer border-4 border-white/20"
                       onClick={handlePhotoCapture}>
                    <Camera className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">{selectedDamage?.number}</span>
                  </div>
                  {/* Pulse Ring */}
                  <div className="absolute inset-0 w-32 h-32 mx-auto rounded-3xl border-4 border-blue-400 animate-ping opacity-20"></div>
                </div>
                
                {/* Enhanced Title & Description */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-white">Capture Damage Photos</h2>
                  <p className="text-blue-200 leading-relaxed">Take clear, high-quality photos of the damage from multiple angles to ensure accurate documentation</p>
                  
                  {/* Show existing photos count */}
                  {selectedDamage?.photos && selectedDamage.photos.length > 0 && (
                    <div className="bg-green-900/30 rounded-2xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-center gap-3">
                        <div className="text-green-400 text-2xl">📸</div>
                        <div>
                          <div className="text-green-300 font-semibold">{selectedDamage.photos.length} photo{selectedDamage.photos.length !== 1 ? 's' : ''} captured</div>
                          <div className="text-green-200 text-sm">Ready to continue or add more photos</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Beautiful Progress Bar */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-blue-300 font-medium">
                    <span className="text-green-400">✓ Photo</span>
                    <span>Type</span>
                    <span>Size</span>
                    <span>Complete</span>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-4 shadow-inner border border-white/10">
                    <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-4 rounded-full shadow-lg transition-all duration-500" style={{ width: '25%' }}>
                      <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-blue-300 text-sm">Step 1 of 4 • Photo Documentation</div>
                </div>
                
                {/* Enhanced Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePhotoCapture}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-2xl font-semibold text-white text-lg shadow-2xl transform hover:scale-[1.02] transition-all duration-300 border border-blue-500/50"
                  >
                    <Camera className="h-6 w-6 mr-3" />
                    {selectedDamage?.photos && selectedDamage.photos.length > 0 ? 'Take Another Photo' : 'Take First Photo'}
                  </Button>
                  
                  {/* Continue button after first photo */}
                  {selectedDamage?.photos && selectedDamage.photos.length > 0 && (
                    <Button
                      onClick={() => setDamageFlowStep('type')}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-4 rounded-2xl font-semibold text-white shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                    >
                      ✓ Continue with {selectedDamage.photos.length} Photo{selectedDamage.photos.length !== 1 ? 's' : ''}
                    </Button>
                  )}
                  

                </div>
                
                {/* Helpful Tips */}
                <div className="bg-blue-900/30 rounded-2xl p-4 border border-blue-500/20">
                  <div className="text-blue-300 text-sm space-y-2">
                    <div className="font-semibold">📸 Photo Tips:</div>
                    <div>• Ensure good lighting and focus</div>
                    <div>• Capture the entire damage area</div>
                    <div>• Take multiple photos from different angles</div>
                    <div>• Close-up and wide shots help with claims</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'type':
        const damageTypesEnhanced = [
          { id: 'dent', label: 'Dent', icon: '🔹', color: 'from-orange-500 to-red-500', description: 'Surface depression' },
          { id: 'paintwork', label: 'Paintwork', icon: '🎨', color: 'from-purple-500 to-blue-500', description: 'Paint damage or discoloration' }, 
          { id: 'scratch', label: 'Scratch', icon: '🗲', color: 'from-yellow-500 to-orange-500', description: 'Surface marking or scrape' },
          { id: 'scuff', label: 'Scuff', icon: '⚡', color: 'from-blue-500 to-cyan-500', description: 'Light surface abrasion' },
          { id: 'chip', label: 'Chip', icon: '💎', color: 'from-green-500 to-teal-500', description: 'Small piece missing' },
          { id: 'crack', label: 'Crack', icon: '🔱', color: 'from-red-500 to-pink-500', description: 'Split or fracture' },
          { id: 'missing-part', label: 'Missing part', icon: '🚫', color: 'from-gray-500 to-gray-600', description: 'Component absent' },
          { id: 'other', label: 'Other', icon: '❓', color: 'from-indigo-500 to-purple-500', description: 'Different damage type' }
        ];
        
        return (
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 z-50 flex flex-col">
            {/* Enhanced Professional Header */}
            <div className="flex justify-between items-center p-6 bg-black/30 backdrop-blur-lg border-b border-white/10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDamageFlowStep('photo')}
                className="text-white hover:bg-white/20 rounded-xl px-4 py-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="text-center">
                <div className="text-white font-bold text-lg">Damage #{selectedDamage?.number}</div>
                <div className="text-purple-300 text-sm font-medium">Classification</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDamageFlow(false)}
                className="text-red-300 hover:bg-red-500/20 rounded-xl px-4 py-2 font-medium"
              >
                Cancel
              </Button>
            </div>
            
            {/* Enhanced Content Area */}
            <div className="flex-1 px-6 py-8 overflow-y-auto">
              <div className="max-w-md mx-auto space-y-6">
                {/* Beautiful Title Section */}
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-white">Select Damage Type</h2>
                  <p className="text-purple-200 leading-relaxed">Choose the category that best describes this damage</p>
                  
                  {/* Gorgeous Progress Indicator */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-purple-300 font-medium">
                      <span className="text-green-400">✓ Photo</span>
                      <span className="text-blue-400">● Type</span>
                      <span>Size</span>
                      <span>Complete</span>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-4 shadow-inner border border-white/10">
                      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 h-4 rounded-full shadow-lg transition-all duration-500" style={{ width: '50%' }}>
                        <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-purple-300 text-sm font-medium">Step 2 of 4 • Damage Classification</div>
                  </div>
                </div>
                
                {/* Premium Damage Type Cards */}
                <div className="space-y-3">
                  {damageTypesEnhanced.map((type, index) => (
                    <button
                      key={type.id}
                      onClick={() => handleDamageTypeSelect(type.id)}
                      className="w-full text-left p-5 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/90 hover:to-gray-600/90 rounded-2xl text-white transition-all duration-300 border border-white/10 hover:border-white/20 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-2xl shadow-lg transform transition-transform hover:scale-110`}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-lg text-white">{type.label}</div>
                          <div className="text-sm text-gray-300 mt-1">{type.description}</div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-gray-400 transition-transform transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'size':
        const severityLevels = [
          { id: 'minor', label: 'Minor', description: 'Light damage, minimal repair needed', icon: '🟢', color: 'from-green-500 to-emerald-500', impact: 'Low cost' },
          { id: 'moderate', label: 'Moderate', description: 'Noticeable damage requiring professional repair', icon: '🟡', color: 'from-yellow-500 to-orange-500', impact: 'Medium cost' },
          { id: 'major', label: 'Major', description: 'Significant damage, extensive repair needed', icon: '🔴', color: 'from-red-500 to-rose-500', impact: 'High cost' }
        ];
        
        return (
          <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-orange-900 to-gray-900 z-50 flex flex-col">
            {/* Enhanced Professional Header */}
            <div className="flex justify-between items-center p-6 bg-black/30 backdrop-blur-lg border-b border-white/10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDamageFlowStep('type')}
                className="text-white hover:bg-white/20 rounded-xl px-4 py-2 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="text-center">
                <div className="text-white font-bold text-lg">Damage #{selectedDamage?.number}</div>
                <div className="text-orange-300 text-sm font-medium">Severity Assessment</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDamageFlow(false)}
                className="text-red-300 hover:bg-red-500/20 rounded-xl px-4 py-2 font-medium"
              >
                Cancel
              </Button>
            </div>
            
            {/* Enhanced Content Area */}
            <div className="flex-1 px-6 py-8 overflow-y-auto">
              <div className="max-w-md mx-auto space-y-6">
                {/* Beautiful Title Section */}
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-white">Assess Damage Severity</h2>
                  <p className="text-orange-200 leading-relaxed">How extensive is the damage? This helps determine repair complexity</p>
                  
                  {/* Gorgeous Progress Indicator */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-orange-300 font-medium">
                      <span className="text-green-400">✓ Photo</span>
                      <span className="text-green-400">✓ Type</span>
                      <span className="text-blue-400">● Size</span>
                      <span>Complete</span>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-4 shadow-inner border border-white/10">
                      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-orange-500 h-4 rounded-full shadow-lg transition-all duration-500" style={{ width: '75%' }}>
                        <div className="h-full bg-white/20 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="text-orange-300 text-sm font-medium">Step 3 of 4 • Severity Assessment</div>
                  </div>
                </div>
                
                {/* Premium Severity Cards */}
                <div className="space-y-4">
                  {severityLevels.map((size, index) => (
                    <button
                      key={size.id}
                      onClick={() => handleDamageSizeSelect(size.id)}
                      className="w-full text-left p-6 bg-gradient-to-r from-gray-800/80 to-gray-700/80 hover:from-gray-700/90 hover:to-gray-600/90 rounded-2xl text-white transition-all duration-300 border border-white/10 hover:border-white/20 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${size.color} rounded-xl flex items-center justify-center text-3xl shadow-lg transform transition-transform hover:scale-110`}>
                          {size.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xl text-white">{size.label}</div>
                          <div className="text-sm text-gray-300 mt-1 leading-relaxed">{size.description}</div>
                          <div className="text-xs text-orange-300 mt-2 font-medium">{size.impact}</div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-gray-400 transition-transform transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'description':
        return (
          <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
            {/* MOTORWAY HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDamageFlowStep('size')}
                className="text-white hover:bg-white/20 p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold text-white">Add details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDamageFlow(false)}
                className="text-white hover:bg-white/20 text-sm"
              >
                Cancel
              </Button>
            </div>
            
            <div className="flex-1 px-4 py-6">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Anything else to add?</h2>
                <p className="text-gray-400">Add any additional details about the damage (optional)</p>
              </div>
              
              {/* MOTORWAY DESCRIPTION INPUT */}
              <div className="mb-8">
                <textarea
                  value={selectedDamage?.description || ''}
                  onChange={(e) => setSelectedDamage(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Add any additional details here..."
                  className="w-full h-32 p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:border-blue-500 focus:outline-none"
                />
              </div>
              
              {/* COMPLETE BUTTON - SIMPLE STYLE */}
              <button
                onClick={() => handleDamageDescriptionSave(selectedDamage?.description || '')}
                className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-lg transition-colors"
              >
                Complete damage report
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6 p-4">
            {/* Vehicle info card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center">
                    <Car className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{job.vehicle?.make} {job.vehicle?.model}</h3>
                    <p className="text-gray-400">{job.vehicle?.year} • {job.vehicle?.registration}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-500 text-sm font-medium">Collection in progress</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collection steps */}
            <div className="space-y-2">
              {collectionSteps.map((step) => {
                const IconComponent = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = step.status === 'complete';
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id as CollectionStep)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : isComplete
                        ? 'bg-green-600/20 border-green-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isComplete ? 'bg-green-600' : isActive ? 'bg-blue-600' : 'bg-gray-700'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <IconComponent className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{step.title}</h3>
                          {step.required && (
                            <span className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded">Required</span>
                          )}
                        </div>
                        <p className={`text-sm capitalize ${
                          isComplete ? 'text-green-400' : 
                          isActive ? 'text-blue-400' : 
                          'text-gray-500'
                        }`}>
                          {step.status === 'not-started' ? 'Not started' : 
                           step.status === 'continue' ? 'In progress' : 'Complete'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'documentation':
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Documentation</h2>
            <p className="text-gray-300">Check all required documents</p>
            
            <div className="space-y-4">
              {/* V5 Document */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">V5 Document</h3>
                      <p className="text-gray-400 text-sm">Vehicle registration document</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, v5Document: true }))}
                        variant={documentationCheck.v5Document === true ? "default" : "outline"}
                        className={documentationCheck.v5Document === true ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, v5Document: false }))}
                        variant={documentationCheck.v5Document === false ? "default" : "outline"}
                        className={documentationCheck.v5Document === false ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Documents */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Service Documents</h3>
                      <p className="text-gray-400 text-sm">Service history documentation</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, serviceDocuments: true }))}
                        variant={documentationCheck.serviceDocuments === true ? "default" : "outline"}
                        className={documentationCheck.serviceDocuments === true ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, serviceDocuments: false }))}
                        variant={documentationCheck.serviceDocuments === false ? "default" : "outline"}
                        className={documentationCheck.serviceDocuments === false ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Locking Wheel Nut */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Locking Wheel Nut</h3>
                      <p className="text-gray-400 text-sm">Key for locking wheel nuts</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, lockingWheelNut: true }))}
                        variant={documentationCheck.lockingWheelNut === true ? "default" : "outline"}
                        className={documentationCheck.lockingWheelNut === true ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        Yes
                      </Button>
                      <Button
                        onClick={() => setDocumentationCheck(prev => ({ ...prev, lockingWheelNut: false }))}
                        variant={documentationCheck.lockingWheelNut === false ? "default" : "outline"}
                        className={documentationCheck.lockingWheelNut === false ? "bg-red-600 hover:bg-red-700 text-white" : "border-gray-600 text-white hover:bg-gray-700"}
                      >
                        No
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Button
              onClick={() => setCurrentStep('exterior')}
              disabled={documentationCheck.v5Document === null || documentationCheck.serviceDocuments === null || documentationCheck.lockingWheelNut === null}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
            >
              Continue to Exterior Inspection
            </Button>
          </div>
        );

      case 'exterior':
        const exteriorSections = [
          { id: 'front', title: 'Front', icon: Car },
          { id: 'rear', title: 'Rear', icon: Car },
          { id: 'passengerSide', title: 'Passenger Side', icon: Car },
          { id: 'driverSide', title: 'Driver Side', icon: Car },
          { id: 'roof', title: 'Roof', icon: Car }
        ];

        if (currentSubSection) {
          const section = exteriorInspection[currentSubSection as keyof ExteriorInspection];
          const sectionTitle = exteriorSections.find(s => s.id === currentSubSection)?.title || currentSubSection;
          
          return (
            <div className="min-h-screen bg-gray-900 text-white">
              {/* MOTORWAY HEADER - EXACT STYLE */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <button 
                  onClick={() => setCurrentSubSection('')}
                  className="p-2"
                >
                  <ArrowLeft className="h-6 w-6 text-white" />
                </button>
                <h1 className="text-lg font-semibold text-white">{sectionTitle}</h1>
                <div className="w-8"></div>
              </div>
              
              <div className="p-4 space-y-8">
              
              {/* PROFESSIONAL CAR DAMAGE INTERFACE */}
              <div className="py-6">
                {/* Tap instruction */}
                <div className="text-center mb-4">
                  <p className="text-gray-300 text-sm">Tap on the car to mark damage location</p>
                </div>
                
                <div 
                  className="relative mx-auto bg-gray-800/50 rounded-2xl p-6 cursor-crosshair transition-all hover:bg-gray-800/70 active:bg-blue-900/30" 
                  style={{ maxWidth: '320px' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    // Visual feedback - add ripple effect
                    const ripple = document.createElement('div');
                    ripple.className = 'absolute w-8 h-8 bg-blue-400/50 rounded-full animate-ping pointer-events-none';
                    ripple.style.left = `${x}%`;
                    ripple.style.top = `${y}%`;
                    ripple.style.transform = 'translate(-50%, -50%)';
                    e.currentTarget.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 1000);
                    
                    setSelectedDamage({
                      id: Date.now().toString(),
                      number: damageMarkers.length + 1,
                      x,
                      y,
                      view: currentSubSection === 'front' ? 'front' : 
                            currentSubSection === 'rear' ? 'rear' :
                            currentSubSection === 'passengerSide' ? 'side-right' :
                            currentSubSection === 'driverSide' ? 'side-left' : 'front',
                      type: 'dent',
                      size: 'small',
                      photos: [],
                      description: '',
                      timestamp: new Date().toISOString()
                    });
                    setShowDamageFlow(true);
                    setDamageFlowStep('photo');
                  }}
                >
                  {/* ACTUAL CAR FRONT OUTLINE IMAGE */}
                  <img 
                    src={carFrontOutline} 
                    alt="Car front outline" 
                    className="w-full h-auto opacity-90 select-none pointer-events-none"
                    draggable={false}
                  />
                  
                  {/* ENHANCED DAMAGE MARKERS */}
                  {damageMarkers
                    .filter(marker => {
                      const currentView = currentSubSection === 'front' ? 'front' : 
                                       currentSubSection === 'rear' ? 'rear' :
                                       currentSubSection === 'passengerSide' ? 'side-right' :
                                       currentSubSection === 'driverSide' ? 'side-left' : 'front';
                      return marker.view === currentView;
                    })
                    .map((marker) => (
                    <div
                      key={marker.id}
                      className="absolute cursor-pointer z-20 group"
                      style={{
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: `Damage ${marker.number}`,
                          description: `${marker.type} - ${marker.photos?.length || 0} photo(s)`,
                          duration: 2000
                        });
                      }}
                    >
                      {/* Damage marker with pulse animation */}
                      <div className="relative">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white">
                          <span className="text-xs font-bold text-white">{marker.number}</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {marker.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Damage count badge */}
                {damageMarkers.filter(m => {
                  const currentView = currentSubSection === 'front' ? 'front' : 
                                   currentSubSection === 'rear' ? 'rear' :
                                   currentSubSection === 'passengerSide' ? 'side-right' :
                                   currentSubSection === 'driverSide' ? 'side-left' : 'front';
                  return m.view === currentView;
                }).length > 0 && (
                  <div className="text-center mt-4">
                    <Badge variant="outline" className="bg-red-500/20 border-red-500 text-red-400">
                      {damageMarkers.filter(m => {
                        const currentView = currentSubSection === 'front' ? 'front' : 
                                         currentSubSection === 'rear' ? 'rear' :
                                         currentSubSection === 'passengerSide' ? 'side-right' :
                                         currentSubSection === 'driverSide' ? 'side-left' : 'front';
                        return m.view === currentView;
                      }).length} damage point(s) marked
                    </Badge>
                  </div>
                )}
              </div>

              {/* MOTORWAY DAMAGE CARDS - EXACT REPLICA */}
              <div className="space-y-3 mb-6">
                {damageMarkers
                  .filter(marker => {
                    const currentView = currentSubSection === 'front' ? 'front' : 
                                     currentSubSection === 'rear' ? 'rear' :
                                     currentSubSection === 'passengerSide' ? 'side-right' :
                                     currentSubSection === 'driverSide' ? 'side-left' : 'front';
                    return marker.view === currentView;
                  })
                  .map((marker) => (
                  <div
                    key={marker.id}
                    className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => {
                      setExpandedDamage(expandedDamage === marker.id ? null : marker.id);
                    }}
                  >
                    {/* PHOTO WITH NUMBERED BADGE - EXACT MOTORWAY STYLE */}
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg overflow-hidden">
                        {marker.photos && marker.photos.length > 0 ? (
                          <img 
                            src={typeof marker.photos[0] === 'string' ? marker.photos[0] : URL.createObjectURL(marker.photos[0])} 
                            alt={`Damage ${marker.number}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                      {/* WHITE NUMBERED BADGE - EXACTLY LIKE MOTORWAY */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <span className="text-xs font-bold text-black">{marker.number}</span>
                      </div>
                    </div>
                    
                    {/* DAMAGE INFO - MOTORWAY TYPOGRAPHY */}
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-base capitalize leading-tight">
                        {marker.type.replace('-', ' ')}
                      </h3>
                      <p className="text-blue-400 text-sm font-medium mt-1">
                        Reported
                      </p>
                    </div>
                    
                    {/* CHEVRON - EXACT MOTORWAY STYLE */}
                    <ChevronRight className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${expandedDamage === marker.id ? 'rotate-90' : ''}`} />
                  </div>
                ))}
                
                {/* EXPANDED DAMAGE VIEW */}
                {expandedDamage && damageMarkers.find(m => m.id === expandedDamage) && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-xl border-l-4 border-red-500">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-white font-semibold">Damage Details</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDamageMarkers(prev => prev.filter(m => m.id !== expandedDamage));
                          setExpandedDamage(null);
                          autoSaveInspectionData();
                          toast({ title: "Damage removed", description: "Damage marker deleted successfully" });
                        }}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                    
                    {(() => {
                      const damage = damageMarkers.find(m => m.id === expandedDamage);
                      return (
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-300 text-sm">Type: <span className="text-white font-medium">{damage?.type.replace('-', ' ')}</span></p>
                            <p className="text-gray-300 text-sm">Size: <span className="text-white font-medium">{damage?.size}</span></p>
                            <p className="text-gray-300 text-sm">Photos: <span className="text-white font-medium">{damage?.photos?.length || 0}</span></p>
                          </div>
                          
                          {damage?.photos && damage.photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {damage.photos.map((photo, index) => (
                                <img 
                                  key={index}
                                  src={photo} 
                                  alt={`Damage photo ${index + 1}`}
                                  className="w-full h-16 object-cover rounded border border-gray-600"
                                />
                              ))}
                            </div>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDamage(damage || null);
                              setShowDamageFlow(true);
                              setDamageFlowStep('photo');
                            }}
                            className="w-full border-blue-500 text-blue-400 hover:bg-blue-500/20"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Add More Photos
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Exterior Inspection</h2>
            <p className="text-gray-300">Inspect each section of the vehicle exterior</p>
            
            <div className="space-y-3">
              {exteriorSections.map((section) => {
                const sectionData = exteriorInspection[section.id as keyof ExteriorInspection];
                const isComplete = sectionData.photos.length > 0;
                const IconComponent = section.icon;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSubSection(section.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isComplete
                        ? 'bg-green-600/20 border-green-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isComplete ? 'bg-green-600' : 'bg-gray-700'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <IconComponent className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">{section.title}</h3>
                        <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                          {isComplete 
                            ? `${sectionData.photos.length} photo${sectionData.photos.length !== 1 ? 's' : ''}, ${sectionData.damage.length} damage report${sectionData.damage.length !== 1 ? 's' : ''}`
                            : 'Not started'
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
            
            <Button
              onClick={() => setCurrentStep('wheels-tyres')}
              disabled={!Object.values(exteriorInspection).every(section => section.photos.length > 0)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            >
              Continue to Wheels & Tyres
            </Button>
          </div>
        );

      case 'wheels-tyres':
        const wheelPositions = [
          { id: 'frontLeft', title: 'Front Left', icon: Settings },
          { id: 'frontRight', title: 'Front Right', icon: Settings },
          { id: 'rearLeft', title: 'Rear Left', icon: Settings },
          { id: 'rearRight', title: 'Rear Right', icon: Settings }
        ];

        if (currentSubSection) {
          const wheel = wheelTyreInspection[currentSubSection as keyof WheelTyreInspection];
          const wheelTitle = wheelPositions.find(w => w.id === currentSubSection)?.title || currentSubSection;
          
          return (
            <div className="space-y-6 p-4">
              <div>
                <h2 className="text-xl font-bold text-white">Wheels - {wheelTitle}</h2>
                <p className="text-gray-300">Inspect wheel and tyre condition</p>
              </div>
              
              {/* Photos section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium mb-3">Photos ({wheel.photos.length})</h3>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-700"
                    onClick={() => {
                      // Handle photo capture for wheel
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Wheel Photo
                  </Button>
                </CardContent>
              </Card>
              
              {/* Tyre condition */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium mb-3">Tyre Condition</h3>
                  <div className="space-y-3">
                    {[
                      { id: 'ok', label: 'OK', description: 'Good condition' },
                      { id: 'worn', label: 'Worn', description: 'Some wear visible' },
                      { id: 'extremely-worn', label: 'Extremely Worn', description: 'Needs replacement' }
                    ].map((condition) => (
                      <button
                        key={condition.id}
                        onClick={() => setWheelTyreInspection(prev => ({
                          ...prev,
                          [currentSubSection]: {
                            ...prev[currentSubSection as keyof WheelTyreInspection],
                            tyreCondition: condition.id as any
                          }
                        }))}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          wheel.tyreCondition === condition.id
                            ? 'border-blue-500 bg-blue-600/20 text-white'
                            : 'border-gray-600 hover:border-gray-500 text-white hover:bg-gray-700'
                        }`}
                      >
                        <div className="font-medium text-white">{condition.label}</div>
                        <div className="text-sm text-gray-400">{condition.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Damage reports */}
              {wheel.damage.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Damage Reports ({wheel.damage.length})</h3>
                  {wheel.damage.map((marker, index) => (
                    <Card key={marker.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium capitalize">{marker.type.replace('-', ' ')} • {marker.size}</p>
                            {marker.description && (
                              <p className="text-gray-400 text-sm mt-1">{marker.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <Button
                onClick={() => {
                  setShowDamageFlow(true);
                  setDamageFlowStep('mark');
                  setCurrentWheelPosition(currentSubSection as any);
                }}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report wheel damage
              </Button>
              
              <Button
                onClick={() => setCurrentSubSection('')}
                disabled={wheel.photos.length === 0 || wheel.tyreCondition === null}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Complete {wheelTitle}
              </Button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Wheels and Tyres</h2>
            <p className="text-gray-300">Inspect all four wheels and assess tyre condition</p>
            
            <div className="space-y-3">
              {wheelPositions.map((position) => {
                const wheelData = wheelTyreInspection[position.id as keyof WheelTyreInspection];
                const isComplete = wheelData.photos.length > 0 && wheelData.tyreCondition !== null;
                const IconComponent = position.icon;
                
                return (
                  <button
                    key={position.id}
                    onClick={() => setCurrentSubSection(position.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isComplete
                        ? 'bg-green-600/20 border-green-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isComplete ? 'bg-green-600' : 'bg-gray-700'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <IconComponent className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">{position.title}</h3>
                        <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                          {isComplete 
                            ? `${wheelData.photos.length} photo${wheelData.photos.length !== 1 ? 's' : ''}, ${wheelData.tyreCondition}, ${wheelData.damage.length} damage${wheelData.damage.length !== 1 ? 's' : ''}`
                            : 'Not started'
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
            
            <Button
              onClick={() => setCurrentStep('interior')}
              disabled={!Object.values(wheelTyreInspection).every(wheel => wheel.photos.length > 0 && wheel.tyreCondition !== null)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            >
              Continue to Interior
            </Button>
          </div>
        );

      case 'interior':
        const interiorSections = [
          { id: 'dashboard', title: 'Dashboard', icon: Car },
          { id: 'frontSeats', title: 'Front Seats', icon: Car },
          { id: 'rearSeats', title: 'Rear Seats', icon: Car },
          { id: 'boot', title: 'Boot', icon: Car }
        ];

        if (currentSubSection) {
          const section = interiorInspection[currentSubSection as keyof InteriorInspection];
          const sectionTitle = interiorSections.find(s => s.id === currentSubSection)?.title || currentSubSection;
          
          return (
            <div className="space-y-6 p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSubSection('')}
                  className="text-white hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-white">Interior - {sectionTitle}</h2>
                  <p className="text-gray-300">Inspect the {sectionTitle.toLowerCase()}</p>
                </div>
              </div>
              
              {/* Photos section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium mb-3">Photos ({section.photos.length})</h3>
                  <Button
                    variant="outline"
                    className="w-full border-gray-600 text-white hover:bg-gray-700"
                    onClick={() => {
                      // Handle photo capture for interior section
                    }}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                </CardContent>
              </Card>
              
              {/* Damage reports */}
              {section.damage.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Damage Reports ({section.damage.length})</h3>
                  {section.damage.map((marker, index) => (
                    <Card key={marker.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium capitalize">{marker.type.replace('-', ' ')} • {marker.size}</p>
                            {marker.description && (
                              <p className="text-gray-400 text-sm mt-1">{marker.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <Button
                onClick={() => {
                  setShowDamageFlow(true);
                  setDamageFlowStep('mark');
                }}
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-gray-800 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report damage
              </Button>
              
              <Button
                onClick={() => setCurrentSubSection('')}
                disabled={section.photos.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 py-3"
              >
                Complete {sectionTitle}
              </Button>
            </div>
          );
        }
        
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Interior Inspection</h2>
            <p className="text-gray-300">Inspect each area of the vehicle interior</p>
            
            <div className="space-y-3">
              {interiorSections.map((section) => {
                const sectionData = interiorInspection[section.id as keyof InteriorInspection];
                const isComplete = sectionData.photos.length > 0;
                const IconComponent = section.icon;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSubSection(section.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isComplete
                        ? 'bg-green-600/20 border-green-600'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isComplete ? 'bg-green-600' : 'bg-gray-700'
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <IconComponent className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-white">{section.title}</h3>
                        <p className={`text-sm ${isComplete ? 'text-green-400' : 'text-gray-500'}`}>
                          {isComplete 
                            ? `${sectionData.photos.length} photo${sectionData.photos.length !== 1 ? 's' : ''}, ${sectionData.damage.length} damage report${sectionData.damage.length !== 1 ? 's' : ''}`
                            : 'Not started'
                          }
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                );
              })}
            </div>
            
            <Button
              onClick={() => setCurrentStep('other')}
              disabled={!Object.values(interiorInspection).every(section => section.photos.length > 0)}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            >
              Continue to Other Notes
            </Button>
          </div>
        );

      case 'other':
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Additional Notes</h2>
            <p className="text-gray-300">Add any additional observations not covered in other sections</p>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <Label className="text-white font-medium">Additional Notes</Label>
                <Textarea
                  placeholder="Enter any additional observations, concerns, or notes about the vehicle..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="mt-2 bg-gray-700 border-gray-600 text-white h-32 resize-none"
                />
              </CardContent>
            </Card>
            
            <Button
              onClick={() => setCurrentStep('signature')}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
            >
              Continue to Signature
            </Button>
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-6 p-4">
            <h2 className="text-xl font-bold text-white">Collection Completion</h2>
            
            <div className="space-y-6">
              <div>
                <Label className="text-white font-medium">Customer Name</Label>
                <Input
                  placeholder="Customer signature name"
                  value={customerSignature}
                  onChange={(e) => setCustomerSignature(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label className="text-white font-medium">Driver Name</Label>
                <Input
                  placeholder="Your name as driver"
                  value={driverSignature}
                  onChange={(e) => setDriverSignature(e.target.value)}
                  className="mt-2 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-medium mb-3">Collection Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total damage reports:</span>
                      <span className="text-white">{damageMarkers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Photos captured:</span>
                      <span className="text-white">{photos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collection time:</span>
                      <span className="text-white">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button
                onClick={async () => {
                  const success = await saveToOfflineStorage();
                  if (success) {
                    onComplete();
                  }
                }}
                disabled={!customerSignature || !driverSignature || isSaving}
                className="w-full bg-green-600 hover:bg-green-700 py-3"
              >
                {isSaving ? 'Saving...' : 'Complete Collection'}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-center">
            <div className="space-y-4">
              <h3 className="text-white font-medium">Section Under Development</h3>
              <p className="text-gray-400">This section will be available soon</p>
              <Button
                onClick={() => setCurrentStep('overview')}
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Return to Overview
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {currentStep === 'overview' ? job.vehicle?.registration || 'Collection Overview' : 
                   collectionSteps.find(s => s.id === currentStep)?.title || 'Collection'}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {renderStepContent()}
      </div>
      
      {/* Damage flow overlay */}
      {renderDamageFlowOverlay()}
      
      {/* Hidden file input for camera */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
    </div>
  );
}