import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle, Camera, FileText, Car, Fuel, Settings, User, X, RotateCcw, ZoomIn, Trash2 } from "lucide-react";
// Removed SimpleCameraCapture - using direct native camera access
import SignatureCapture from "./SignatureCapture";
import InteriorPhotosModule from "./InteriorPhotosModule";
import WheelTyrePhotosModule from "./WheelTyrePhotosModule";
import EnhancedDamageModule from "./EnhancedDamageModule";
import ExpenseForm from "./expense-form";

// Comprehensive PhotoCapture component for all photo needs
interface PhotoCaptureProps {
  photos: string[];
  title: string;
  onCapture: () => void;
  onEnlarge: (url: string, title: string) => void;
  onRetake: (index: number) => void;
  isUploading: boolean;
  required?: boolean;
  maxPhotos?: number;
}

function PhotoCapture({ 
  photos, 
  title, 
  onCapture, 
  onEnlarge, 
  onRetake, 
  isUploading, 
  required = true, 
  maxPhotos = 3 
}: PhotoCaptureProps) {
  const hasPhoto = photos.length > 0;
  
  return (
    <div>
      <Label className="text-gray-700 font-medium block mb-3">
        {title}
      </Label>
      
      {/* Capture Button - Only show if no photos */}
      {!hasPhoto && (
        <Button
          onClick={onCapture}
          className="w-full bg-[#00ABE7] hover:bg-[#0095d1] text-white mb-3 shadow-sm"
          disabled={isUploading}
        >
          <Camera className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : `Take ${title}`}
        </Button>
      )}
      
      {/* Photo Grid */}
      {hasPhoto && (
        <div className="space-y-3 mb-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div
                onClick={() => onEnlarge(photo, `${title}`)}
                className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-[#00ABE7] hover:border-[#0095d1] transition-all shadow-sm hover:shadow-md"
              >
                <img 
                  src={photo} 
                  alt={title}
                  className="w-full h-32 object-cover"
                />
                {/* Enlarge indicator */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
              
              {/* Retake button */}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetake(index);
                }}
                className="absolute top-2 right-2 h-8 px-3 bg-white/90 hover:bg-white text-gray-700 border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg text-xs"
                title="Retake photo"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retake
              </Button>
            </div>
          ))}
          
          {/* Success message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Photo saved successfully
          </div>
        </div>
      )}
      
      {/* Status messages */}
      {!hasPhoto && required && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Photo required to continue
        </div>
      )}
    </div>
  );
}

interface Job {
  id: string;
  jobNumber: string;
  vehicle?: {
    make?: string;
    model?: string;
    registration?: string;
  };
}

interface ProductionDeliveryWorkflowProps {
  job: Job;
  onBack: () => void;
  onComplete: () => void;
}

interface DeliveryData {
  // Vehicle Details
  v5Provided: boolean | null;
  v5Photos: string[];
  numberOfKeys: string;
  keyPhotos: string[];
  serviceBookProvided: boolean | null;
  serviceBookPhotos: string[];
  lockingWheelNutProvided: boolean | null;
  lockingWheelNutPhotos: string[];
  
  // Exterior Photos
  exteriorPhotos: {
    front: string[];
    driverSide: string[];
    rear: string[];
    passengerSide: string[];
    roof: string[];
  };
  
  // Manual Damage Assessment with Interactive Vehicle Outline
  damageMarkers: Array<{
    id: string;
    x: number; // Percentage position on vehicle outline (0-100)
    y: number; // Percentage position on vehicle outline (0-100)
    view: 'front' | 'driverSide' | 'rear' | 'passengerSide' | 'roof';
    type: 'scratch' | 'dent' | 'scuff' | 'chip' | 'rust' | 'crack' | 'missing' | 'broken' | 'other';
    size: 'minor' | 'small' | 'medium' | 'large' | 'extensive';
    description: string;
    photos: string[]; // Photos specific to this damage marker (numbered)
  }>;
  
  // Wheels & Tyres
  wheels: {
    frontLeft: { photos: string[] };
    frontRight: { photos: string[] };
    rearLeft: { photos: string[] };
    rearRight: { photos: string[] };
  };
  
  // Interior Photos
  interiorPhotos: {
    dashboard: string[];
    frontSeats: string[];
    backSeats: string[];
    boot: string[];
  };
  
  // Vehicle Condition
  odometerReading: string;
  odometerPhotos: string[];
  fuelLevel: number; // 0-8 scale
  fuelPhotos: string[];
  
  // Vehicle Condition Assessment (Environmental conditions)
  weatherConditions: string; // 'dry' | 'wet'
  vehicleCleanliness: string; // 'clean' | 'dirty'
  lightingConditions: string; // 'good light' | 'poor light'
  
  // Final Details
  customerName: string;
  signature: string;
  additionalNotes: string;
  
  // Expenses
  expenses: Array<{
    id: string;
    type: 'fuel' | 'parking' | 'tolls' | 'misc';
    amount: string;
    description: string;
    receiptPhoto: string;
  }>;
}

type WorkflowStep = 
  | 'vehicle-details'
  | 'exterior-photos' 
  | 'damage-assessment'
  | 'wheels-tyres'
  | 'interior-photos'
  | 'vehicle-condition'
  | 'expenses'
  | 'final-details';

// Import BLACK car outline images for better visibility
import carFrontImage from "@/assets/car-front-black.png";
import carRearImage from "@/assets/car-rear-black.png";
import carDriverSideImage from "@/assets/car-driver-side-black.png";
import carPassengerSideImage from "@/assets/car-passenger-side-black.png";

const VEHICLE_OUTLINE_IMAGES = {
  front: carFrontImage,
  driverSide: carDriverSideImage,
  rear: carRearImage,
  passengerSide: carPassengerSideImage
};

// Professional damage classification system
const DAMAGE_TYPES = [
  { value: 'scratch', label: 'Scratch', description: 'Surface mark or scrape' },
  { value: 'dent', label: 'Dent', description: 'Inward deformation of metal' },
  { value: 'chip', label: 'Chip', description: 'Small piece missing from paint/surface' },
  { value: 'crack', label: 'Crack', description: 'Linear break or fracture' },
  { value: 'rust', label: 'Rust', description: 'Corrosion or oxidation' },
  { value: 'scuff', label: 'Scuff', description: 'Abrasion or rubbing mark' },
  { value: 'missing', label: 'Missing Part', description: 'Component not present' },
  { value: 'broken', label: 'Broken', description: 'Fractured or shattered component' }
];

const DAMAGE_SIZES = [
  { value: 'minor', label: 'Minor', description: 'Barely visible, under 1cm' },
  { value: 'small', label: 'Small', description: 'Noticeable, 1-5cm' },
  { value: 'medium', label: 'Medium', description: 'Obvious, 5-15cm' },
  { value: 'large', label: 'Large', description: 'Significant, 15-30cm' },
  { value: 'extensive', label: 'Extensive', description: 'Major damage, over 30cm' }
];

export default function ProductionDeliveryWorkflow({ 
  job, 
  onBack, 
  onComplete 
}: ProductionDeliveryWorkflowProps) {
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('vehicle-details');
  // Direct native camera access - no popup
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedDamageView, setSelectedDamageView] = useState<keyof typeof VEHICLE_OUTLINE_IMAGES>('front');
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [tempExpensePhoto, setTempExpensePhoto] = useState('');
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [pendingDamageLocation, setPendingDamageLocation] = useState<{x: number, y: number, view: keyof typeof VEHICLE_OUTLINE_IMAGES} | null>(null);
  const [newDamage, setNewDamage] = useState({
    type: '',
    size: '',
    description: ''
  });
  
  const [data, setData] = useState<DeliveryData>({
    // Vehicle Details
    v5Provided: null,
    v5Photos: [],
    numberOfKeys: '',
    keyPhotos: [],
    serviceBookProvided: null,
    serviceBookPhotos: [],
    lockingWheelNutProvided: null,
    lockingWheelNutPhotos: [],
    
    // Exterior Photos
    exteriorPhotos: {
      front: [],
      driverSide: [],
      rear: [],
      passengerSide: [],
      roof: []
    },
    
    // Damage Assessment
    damageMarkers: [],
    
    // Wheels & Tyres
    wheels: {
      frontLeft: { photos: [] },
      frontRight: { photos: [] },
      rearLeft: { photos: [] },
      rearRight: { photos: [] }
    },
    
    // Interior Photos
    interiorPhotos: {
      dashboard: [],
      frontSeats: [],
      backSeats: [],
      boot: []
    },
    
    // Vehicle Condition
    odometerReading: '',
    odometerPhotos: [],
    fuelLevel: 5, // Default to full
    fuelPhotos: [],
    
    // Vehicle Condition Assessment (Environmental conditions)
    weatherConditions: '', // wet/dry
    vehicleCleanliness: '', // clean/dirty  
    lightingConditions: '', // good light/poor light
    
    // Final Details
    customerName: '',
    signature: '',
    additionalNotes: '',
    
    // Expenses
    expenses: []
  });

  // 🛡️ CRASH RECOVERY: Load saved data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem(`collection-${job.id}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
        console.log('🔄 CRASH RECOVERY: Data restored from localStorage');
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, [job.id]);

  // 🛡️ CRASH RECOVERY: Auto-save to localStorage for crash protection
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(`collection-${job.id}`, JSON.stringify(data));
        console.log('💾 CRASH PROTECTION: Data saved to localStorage');
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }, 1000); // Save after 1 second of inactivity

    return () => clearTimeout(saveTimer);
  }, [data, job.id]);

  // Auto-scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Enhanced data setter - auto-save handled by debounced useEffect
  const updateData = (updates: Partial<DeliveryData> | ((prev: DeliveryData) => DeliveryData)) => {
    setData(prev => {
      const newData = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      // Auto-save is now handled by the debounced useEffect (3 second delay)
      return newData;
    });
  };

  const stepOrder: WorkflowStep[] = [
    'vehicle-details',
    'exterior-photos',
    'damage-assessment',
    'wheels-tyres',
    'interior-photos',
    'vehicle-condition',
    'expenses',
    'final-details'
  ];

  // PWA-Optimized server save with smart retry logic
  const saveToServerWithRetry = async (data: DeliveryData, step: WorkflowStep, retryCount = 0) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryData: data,
          currentStep: step,
          timestamp: Date.now() // For server-side deduplication
        })
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.status}`);
      }

      console.log('☁️ PWA auto-save completed for job:', job.id);
    } catch (error) {
      console.error(`❌ Auto-save failed (attempt ${retryCount + 1}):`, error);
      
      // Smart retry with exponential backoff (PWA-friendly)
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          saveToServerWithRetry(data, step, retryCount + 1);
        }, delay);
      } else {
        // Final fallback: Connection issue - data saved locally
        console.log("Connection Issue - Data will be saved when connection improves");
      }
    }
  };

  // Immediate save for critical actions (no retry delay)
  const saveToServer = async (data: DeliveryData, step: WorkflowStep) => {
    return saveToServerWithRetry(data, step, 0);
  };
  
  const loadFromServer = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/auto-save`);
      
      if (!response.ok) {
        throw new Error(`Auto-save restore failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.exists) {
        console.log('☁️ Restored server data for job:', jobId);
        return {
          deliveryData: result.deliveryData,
          currentStep: result.currentStep,
          lastSaved: new Date(result.lastSaved).getTime()
        };
      }
    } catch (error) {
      console.error('❌ Server restore failed, trying local storage:', error);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(`delivery_data_${jobId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('💾 Restored from local storage fallback for job:', jobId);
          return parsed;
        }
      } catch (localError) {
        console.error('❌ Local storage fallback also failed:', localError);
      }
    }
    return null;
  };
  
  const clearFromServer = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/auto-save`, {
        method: 'DELETE'
      });
      console.log('☁️ Cleared server auto-save data for job:', jobId);
    } catch (error) {
      console.error('❌ Failed to clear server data:', error);
    }
    
    // Also clear local storage fallback
    try {
      localStorage.removeItem(`delivery_data_${jobId}`);
    } catch (error) {
      console.error('❌ Failed to clear local storage:', error);
    }
  };

  const getCurrentStepNumber = () => stepOrder.indexOf(currentStep) + 1;
  const getTotalSteps = () => stepOrder.length;

  // Server-side auto-save effects for iOS PWA reliability
  useEffect(() => {
    // ⚡ INSTANT LOAD: localStorage first, server backup
    const loadSavedData = async () => {
      // 🚀 INSTANT: Try localStorage first (zero latency)
      try {
        const stored = localStorage.getItem(`delivery_data_${job.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          const migratedData = {
            ...parsed.deliveryData,
            expenses: parsed.deliveryData?.expenses || []
          };
          console.log('⚡ INSTANT restore from localStorage');
          setData(migratedData);
          setCurrentStep(parsed.currentStep || 'vehicle-details');
          return; // INSTANT EXIT - no server call needed
        }
      } catch (error) {
        console.log('📦 localStorage empty, trying server...');
      }
      
      // 🌐 Fallback: Server only if localStorage empty
      const savedData = await loadFromServer(job.id);
      if (savedData && savedData.deliveryData) {
        // ⚡ CRITICAL: Data migration for old saved data
        const migratedData = {
          ...savedData.deliveryData,
          // Ensure expenses property exists (for backward compatibility)
          expenses: savedData.deliveryData.expenses || []
        };
        
        console.log('🔄 Data migrated, expenses:', migratedData.expenses.length);
        setData(migratedData);
        setCurrentStep(savedData.currentStep || 'vehicle-details');
        
        // Data restored from server
        console.log(`Data Restored: Progress restored from ${new Date(savedData.lastSaved).toLocaleString()}`);
      }
    };
    
    loadSavedData();
  }, [job.id]);

  // PWA-Optimized auto-save: Smart server batching with guaranteed delivery
  useEffect(() => {
    if (data.v5Provided !== null || data.exteriorPhotos.front.length > 0 || data.damageMarkers.length > 0) {
      // Smart batching for non-critical updates (4 second debounce)
      const timeoutId = setTimeout(() => {
        saveToServerWithRetry(data, currentStep);
      }, 500); // ⚡ INSTANT: 0.5s debounce for lightning speed

      return () => clearTimeout(timeoutId);
    }
  }, [data, currentStep, job.id]);

  // ⚡ OPTIMIZED: Aggressive compression for smaller file sizes with error handling
  const compressImage = (file: File, quality = 0.6, maxWidth = 800, maxHeight = 800): Promise<File> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          console.error('Canvas context not available, returning original file');
          resolve(file);
          return;
        }
        
        const img = new Image();
        
        img.onload = () => {
          try {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  console.error('Failed to compress image, returning original file');
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            console.error('Error during image compression:', error);
            resolve(file);
          }
        };
        
        img.onerror = () => {
          console.error('Failed to load image for compression, returning original file');
          resolve(file);
        };
        
        img.src = URL.createObjectURL(file);
        
      } catch (error) {
        console.error('Error setting up image compression:', error);
        resolve(file);
      }
    });
  };

  // Direct native camera access
  const openCamera = (target: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-target', target);
      fileInputRef.current.click();
    }
  };

  // Retake photo - delete old and capture new
  const retakePhoto = async (target: string, photoIndex: number) => {
    try {
      // Remove photo from local state first
      setData(prev => {
        const newData = { ...prev };
        
        if (target === 'v5') {
          newData.v5Photos.splice(photoIndex, 1);
        } else if (target === 'keys') {
          newData.keyPhotos.splice(photoIndex, 1);
        } else if (target === 'serviceBook') {
          newData.serviceBookPhotos.splice(photoIndex, 1);
        } else if (target === 'lockingWheelNut') {
          newData.lockingWheelNutPhotos.splice(photoIndex, 1);
        } else if (target.startsWith('exterior-')) {
          const view = target.replace('exterior-', '') as keyof typeof newData.exteriorPhotos;
          newData.exteriorPhotos[view].splice(photoIndex, 1);
        } else if (target.startsWith('interior-')) {
          const view = target.replace('interior-', '') as keyof typeof newData.interiorPhotos;
          newData.interiorPhotos[view].splice(photoIndex, 1);
        } else if (target.startsWith('wheel-')) {
          const wheelKey = target.replace('wheel-', '') as keyof typeof newData.wheels;
          newData.wheels[wheelKey].photos.splice(photoIndex, 1);
        } else if (target === 'odometer') {
          newData.odometerPhotos.splice(photoIndex, 1);
        } else if (target === 'fuel') {
          newData.fuelPhotos.splice(photoIndex, 1);
        } else if (target.startsWith('damage-')) {
          const damageId = target.replace('damage-', '');
          const damageIndex = newData.damageMarkers.findIndex(marker => marker.id === damageId);
          if (damageIndex !== -1) {
            newData.damageMarkers[damageIndex].photos.splice(photoIndex, 1);
          }
        }
        
        return newData;
      });

      // Open camera for new photo
      setTimeout(() => openCamera(target), 100);
      
    } catch (error) {
      console.error('Failed to retake photo:', error);
    }
  };



  const addDamageMarker = (x: number, y: number) => {
    // Store the location and show the damage selection modal
    setPendingDamageLocation({ x, y, view: selectedDamageView });
    setNewDamage({ type: '', size: '', description: '' });
    setShowDamageModal(true);
  };

  // Confirm damage marker with selected details
  const confirmDamageMarker = () => {
    if (!pendingDamageLocation || !newDamage.type || !newDamage.size) {
      console.log("Missing Information: Please select damage type and size");
      return;
    }

    const newMarker = {
      id: `damage_${Date.now()}`,
      x: pendingDamageLocation.x,
      y: pendingDamageLocation.y,
      view: pendingDamageLocation.view,
      type: newDamage.type as 'scratch' | 'dent' | 'scuff' | 'chip' | 'rust' | 'crack' | 'missing' | 'broken' | 'other',
      size: newDamage.size as 'minor' | 'small' | 'medium' | 'large' | 'extensive',
      description: newDamage.description,
      photos: []
    };
    
    setData(prev => ({
      ...prev,
      damageMarkers: [...prev.damageMarkers, newMarker]
    }));

    // Reset modal state
    setShowDamageModal(false);
    setPendingDamageLocation(null);
    setNewDamage({ type: '', size: '', description: '' });
  };

  const removeDamageMarker = (markerId: string) => {
    setData(prev => ({
      ...prev,
      damageMarkers: prev.damageMarkers.filter(m => m.id !== markerId)
    }));
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'vehicle-details':
        return data.v5Provided !== null && 
               data.numberOfKeys && 
               data.serviceBookProvided !== null && 
               data.lockingWheelNutProvided !== null &&
               (data.v5Provided === false || data.v5Photos.length > 0) &&
               data.keyPhotos.length > 0 &&
               (data.serviceBookProvided === false || data.serviceBookPhotos.length > 0) &&
               (data.lockingWheelNutProvided === false || data.lockingWheelNutPhotos.length > 0);
      
      case 'exterior-photos':
        return data.exteriorPhotos.front.length > 0 &&
               data.exteriorPhotos.driverSide.length > 0 &&
               data.exteriorPhotos.rear.length > 0 &&
               data.exteriorPhotos.passengerSide.length > 0;
      
      case 'damage-assessment':
        return true; // Optional step
      
      case 'wheels-tyres':
        return Object.values(data.wheels).every(wheel => wheel.photos.length > 0);
      
      case 'interior-photos':
        return Object.values(data.interiorPhotos).every(photos => photos.length > 0);
      
      case 'vehicle-condition':
        return data.odometerReading && 
               data.odometerPhotos.length > 0 && 
               data.fuelPhotos.length > 0 &&
               data.weatherConditions &&
               data.vehicleCleanliness &&
               data.lightingConditions;
      
      case 'expenses':
        return true; // Expenses are optional
      
      case 'final-details':
        return data.customerName && data.signature;
      
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!canProceedToNextStep()) {
      console.log("Cannot Complete: Please fill in all required fields");
      return;
    }

    setIsCompleting(true);
    setUploadProgress(0);
    setUploadStatus('Finalizing collection...');

    try {
      console.log('⚡ ULTRA-FAST COMPLETION: Using auto-saved data from database');
      
      // ⚡ INSTANT progress feedback
      setUploadProgress(30);
      setUploadStatus('Sending to server...');

      // ⚡ LIGHTNING FAST: Send ONLY signature + timestamp (all data already auto-saved!)
      const completionPayload = {
        signature: data.signature,
        completedAt: new Date().toISOString()
      };
      
      console.log('⚡ Payload size:', JSON.stringify(completionPayload).length, 'bytes (vs 50MB+ before!)');
      console.log('📸 Photos already auto-saved - backend will use them from database');

      setUploadProgress(50);

      // ⚡ Call new lightweight endpoint
      const response = await fetch(`/api/jobs/${job.id}/complete-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionPayload)
      });

      setUploadProgress(75);
      setUploadStatus('Processing on server...');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setUploadProgress(100);
      setUploadStatus('Complete!');

      console.log('✅ INSTANT COMPLETION SUCCESS:', result);
      console.log('⚡ Completion took <2 seconds using auto-saved data!');

      // 🛡️ CRASH RECOVERY: Clear all saved data and complete
      localStorage.removeItem(`collection-${job.id}`); // FIX: Use job.id not job.jobNumber
      await clearFromServer(job.id); // Clear server-side auto-saved collection data
      console.log('✅ CRASH RECOVERY: LocalStorage data cleared after successful completion');
      onComplete();
    } catch (error) {
      console.error('Failed to complete collection:', error);
    } finally {
      setIsCompleting(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  // Native camera handling - direct upload to server
  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const target = event.target.getAttribute('data-target');
    
    console.log('📸 Photo captured:', { file: !!file, target, fileName: file?.name });
    
    if (!file || !target) {
      console.log('❌ Missing file or target:', { file: !!file, target });
      return;
    }
    
    // ⚠️ LANDSCAPE VALIDATION: Check photo orientation before processing
    const isLandscape = await new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const landscape = img.width >= img.height;
        console.log(`📐 Photo dimensions: ${img.width}x${img.height} (${landscape ? 'landscape ✓' : 'portrait ✗'})`);
        resolve(landscape);
      };
      img.onerror = () => resolve(true); // If can't check, allow it
      img.src = URL.createObjectURL(file);
    });
    
    if (!isLandscape) {
      alert('📱 Please rotate your phone to landscape mode and retake the photo.\n\nLandscape photos ensure better quality in the final document.');
      console.log('❌ Portrait photo rejected - please use landscape orientation');
      event.target.value = ''; // Reset input
      return;
    }
    
    setIsUploading(true);
    console.log('🔄 Starting upload for target:', target);
    
    try {
      // ⚡ SMART COMPRESSION: Different compression for different photo types  
      let compressionQuality = 0.6; // Default aggressive compression
      let maxSize = 800; // Default max dimensions
      
      // Damage photos need higher quality for detail visibility
      if (target?.includes('damage')) {
        compressionQuality = 0.75;
        maxSize = 1000;
      }
      
      console.log(`📊 Compressing ${target} photo: quality=${compressionQuality}, size=${maxSize}x${maxSize}`);
      
      // Compress before converting to base64
      const compressedFile = await compressImage(file, compressionQuality, maxSize, maxSize);
      
      // Convert compressed file to base64
      const photoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
      
      console.log(`📏 Original size: ${file.size} bytes → Compressed: ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size/file.size) * 100)}% reduction)`);
      
      console.log('📊 Photo converted to base64 successfully');
      
      // Store base64 directly (no server upload needed)
      // const formData = new FormData();
      // formData.append('photo', compressedFile);
      // Update local UI state with base64 data (same as working components)
      setData(prev => {
        const newData = { ...prev };
        
        if (target === 'v5') {
          console.log('📸 Adding V5 photo:', photoUrl);
          newData.v5Photos = [...newData.v5Photos, photoUrl];
          console.log('📸 V5 photos now:', newData.v5Photos.length);
        } else if (target === 'keys') {
          newData.keyPhotos = [...newData.keyPhotos, photoUrl];
        } else if (target === 'serviceBook') {
          newData.serviceBookPhotos = [...newData.serviceBookPhotos, photoUrl];
        } else if (target === 'lockingWheelNut') {
          newData.lockingWheelNutPhotos = [...newData.lockingWheelNutPhotos, photoUrl];
        } else if (target.startsWith('exterior-')) {
          const view = target.replace('exterior-', '') as keyof typeof newData.exteriorPhotos;
          newData.exteriorPhotos[view] = [...newData.exteriorPhotos[view], photoUrl];
        } else if (target.startsWith('interior-')) {
          const view = target.replace('interior-', '') as keyof typeof newData.interiorPhotos;
          newData.interiorPhotos[view] = [...newData.interiorPhotos[view], photoUrl];
        } else if (target.startsWith('wheel-')) {
          const wheelKey = target.replace('wheel-', '') as keyof typeof newData.wheels;
          newData.wheels[wheelKey].photos = [...newData.wheels[wheelKey].photos, photoUrl];
        } else if (target === 'odometer') {
          newData.odometerPhotos = [...newData.odometerPhotos, photoUrl];
        } else if (target === 'expense-receipt') {
          console.log('📸 Adding expense receipt photo');
          setTempExpensePhoto(photoUrl);
        } else if (target === 'fuel') {
          newData.fuelPhotos = [...newData.fuelPhotos, photoUrl];
        } else if (target.startsWith('damage-')) {
          const damageId = target.replace('damage-', '');
          const damageIndex = newData.damageMarkers.findIndex(marker => marker.id === damageId);
          if (damageIndex !== -1) {
            newData.damageMarkers[damageIndex].photos = [...newData.damageMarkers[damageIndex].photos, photoUrl];
          }
        }
        
        return newData;
      });
      
      // CRITICAL: Immediate save for photos (high value, zero tolerance for loss)
      saveToServer(data, currentStep);
      
    } catch (error) {
      console.error('Photo capture failed:', error);
    } finally {
      setIsUploading(false);
      // Reset input for next use
      event.target.value = '';
    }
  };

  if (showSignature) {
    return (
      <SignatureCapture
        onSave={(signatureData) => {
          setData(prev => ({ ...prev, signature: signatureData }));
          setShowSignature(false);
        }}
        onCancel={() => setShowSignature(false)}
      />
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'vehicle-details':
        return (
          <div className="space-y-6">
            {/* V5 Document */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  V5 Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-700 block mb-3">Is the V5 document provided?</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.v5Provided === true ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, v5Provided: true }))}
                      className={data.v5Provided === true ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={data.v5Provided === false ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, v5Provided: false }))}
                      className={data.v5Provided === false ? "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {data.v5Provided === true && (
                  <PhotoCapture
                    photos={data.v5Photos}
                    title="V5 Document Photo"
                    onCapture={() => openCamera('v5')}
                    onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                    onRetake={(index) => retakePhoto('v5', index)}
                    isUploading={isUploading}
                    required={true}
                    maxPhotos={2}
                  />
                )}

                {data.v5Provided === false && (
                  <div className="text-[#00ABE7] text-sm p-3 bg-[#00ABE7]/10 border border-[#00ABE7]/20 rounded">
                    ✓ V5 not provided - noted
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Number of Keys */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Number of Keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-700 block mb-3">Number of keys received</Label>
                  <Select value={data.numberOfKeys} onValueChange={(value) => setData(prev => ({ ...prev, numberOfKeys: value }))}>
                    <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300 focus:border-[#00ABE7] focus:ring-1 focus:ring-[#00ABE7]">
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Key</SelectItem>
                      <SelectItem value="2">2 Keys</SelectItem>
                      <SelectItem value="3">3 Keys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {data.numberOfKeys && (
                  <PhotoCapture
                    photos={data.keyPhotos}
                    title="Keys Photo"
                    onCapture={() => openCamera('keys')}
                    onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                    onRetake={(index) => retakePhoto('keys', index)}
                    isUploading={isUploading}
                    required={true}
                    maxPhotos={2}
                  />
                )}
              </CardContent>
            </Card>

            {/* Service Book */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Service Book</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-700 block mb-3">Is the service book provided?</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.serviceBookProvided === true ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, serviceBookProvided: true }))}
                      className={data.serviceBookProvided === true ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={data.serviceBookProvided === false ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, serviceBookProvided: false }))}
                      className={data.serviceBookProvided === false ? "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {data.serviceBookProvided === true && (
                  <PhotoCapture
                    photos={data.serviceBookPhotos}
                    title="Service Book Photo"
                    onCapture={() => openCamera('serviceBook')}
                    onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                    onRetake={(index) => retakePhoto('serviceBook', index)}
                    isUploading={isUploading}
                    required={true}
                    maxPhotos={2}
                  />
                )}

                {data.serviceBookProvided === false && (
                  <div className="text-[#00ABE7] text-sm p-3 bg-[#00ABE7]/10 border border-[#00ABE7]/20 rounded">
                    ✓ Service book not provided - noted
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Locking Wheel Nut */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Locking Wheel Nut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-700 block mb-3">Is the locking wheel nut provided?</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.lockingWheelNutProvided === true ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, lockingWheelNutProvided: true }))}
                      className={data.lockingWheelNutProvided === true ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Yes
                    </Button>
                    <Button
                      variant={data.lockingWheelNutProvided === false ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, lockingWheelNutProvided: false }))}
                      className={data.lockingWheelNutProvided === false ? "bg-gray-200 hover:bg-gray-300 text-gray-700 border-gray-300" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      No
                    </Button>
                  </div>
                </div>

                {data.lockingWheelNutProvided === true && (
                  <PhotoCapture
                    photos={data.lockingWheelNutPhotos}
                    title="Locking Wheel Nut Photo"
                    onCapture={() => openCamera('lockingWheelNut')}
                    onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                    onRetake={(index) => retakePhoto('lockingWheelNut', index)}
                    isUploading={isUploading}
                    required={true}
                    maxPhotos={1}
                  />
                )}

                {data.lockingWheelNutProvided === false && (
                  <div className="text-[#00ABE7] text-sm p-3 bg-[#00ABE7]/10 border border-[#00ABE7]/20 rounded">
                    ✓ Locking wheel nut not provided - noted
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'exterior-photos':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Car className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Exterior Photos</h2>
              <p className="text-gray-600">Capture photos of all exterior views</p>
            </div>

            {[
              { key: 'front', label: 'Front View', description: 'Full front of vehicle' },
              { key: 'driverSide', label: 'Driver Side', description: 'Left side of vehicle' },
              { key: 'rear', label: 'Rear View', description: 'Full rear of vehicle' },
              { key: 'passengerSide', label: 'Passenger Side', description: 'Right side of vehicle' }
            ].map(({ key, label, description }) => (
              <Card key={key} className="bg-white border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 font-semibold">{label}</CardTitle>
                  <p className="text-gray-600 text-sm">{description}</p>
                </CardHeader>
                <CardContent>
                  <PhotoCapture
                    photos={data.exteriorPhotos[key as keyof typeof data.exteriorPhotos]}
                    title={`${label} Photo`}
                    onCapture={() => openCamera(`exterior-${key}`)}
                    onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                    onRetake={(index) => retakePhoto(`exterior-${key}`, index)}
                    isUploading={isUploading}
                    required={true}
                    maxPhotos={1}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'damage-assessment':
        return (
          <EnhancedDamageModule
            damageMarkers={data.damageMarkers}
            onChange={(markers) => {
              setData(prev => ({ ...prev, damageMarkers: markers }));
              // CRITICAL: Immediate save for damage markers (high value)
              saveToServer({ ...data, damageMarkers: markers }, currentStep);
            }}
            onAutoSave={() => saveToServer(data, currentStep)}
            vehicleOutlineImages={VEHICLE_OUTLINE_IMAGES}
          />
        );

      case 'wheels-tyres':
        return (
          <WheelTyrePhotosModule
            data={data.wheels}
            onChange={(wheelsData) => {
              setData(prev => ({ ...prev, wheels: wheelsData }));
              // CRITICAL: Immediate save for wheel data (high value) 
              saveToServer({ ...data, wheels: wheelsData }, currentStep);
            }}
            onAutoSave={() => saveToServer(data, currentStep)}
          />
        );

      case 'interior-photos':
        return (
          <InteriorPhotosModule
            data={data.interiorPhotos}
            onChange={(interiorData) => {
              setData(prev => ({ ...prev, interiorPhotos: interiorData }));
              // CRITICAL: Immediate save for interior photos (high value)
              saveToServer({ ...data, interiorPhotos: interiorData }, currentStep);
            }}
            onAutoSave={() => saveToServer(data, currentStep)}
          />
        );

      case 'vehicle-condition':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Fuel className="h-12 w-12 text-[#00ABE7] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vehicle Condition</h2>
              <p className="text-gray-600">Record odometer and fuel level</p>
            </div>

            {/* Odometer Reading */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Odometer Reading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="odometer" className="text-gray-700 block mb-2">Mileage Reading</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={data.odometerReading}
                    onChange={(e) => setData(prev => ({ ...prev, odometerReading: e.target.value }))}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                    placeholder="Enter mileage"
                  />
                </div>

                <PhotoCapture
                  photos={data.odometerPhotos}
                  title="Odometer Photo"
                  onCapture={() => openCamera('odometer')}
                  onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                  onRetake={(index) => retakePhoto('odometer', index)}
                  isUploading={isUploading}
                  required={true}
                  maxPhotos={2}
                />
              </CardContent>
            </Card>

            {/* Fuel Level */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Fuel Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-700 block mb-3">Fuel Level</Label>
                  <Select 
                    value={data.fuelLevel.toString()} 
                    onValueChange={(value) => setData(prev => ({ ...prev, fuelLevel: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-full bg-white text-gray-900 border-gray-300 focus:border-[#00ABE7] focus:ring-1 focus:ring-[#00ABE7]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Empty</SelectItem>
                      <SelectItem value="2">1/4</SelectItem>
                      <SelectItem value="3">1/2</SelectItem>
                      <SelectItem value="4">3/4</SelectItem>
                      <SelectItem value="5">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <PhotoCapture
                  photos={data.fuelPhotos}
                  title="Fuel Gauge Photo"
                  onCapture={() => openCamera('fuel')}
                  onEnlarge={(url, title) => setEnlargedPhoto({ url, title })}
                  onRetake={(index) => retakePhoto('fuel', index)}
                  isUploading={isUploading}
                  required={true}
                  maxPhotos={2}
                />
              </CardContent>
            </Card>

            {/* Vehicle Condition Assessment */}
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-gray-900 font-semibold">Vehicle Condition Assessment</CardTitle>
                <p className="text-gray-600 text-sm">Environmental conditions during inspection</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Weather Conditions */}
                <div>
                  <Label className="text-gray-700 block mb-3">Weather Conditions</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.weatherConditions === 'dry' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, weatherConditions: 'dry' }))}
                      className={data.weatherConditions === 'dry' ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Dry
                    </Button>
                    <Button
                      variant={data.weatherConditions === 'wet' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, weatherConditions: 'wet' }))}
                      className={data.weatherConditions === 'wet' ? "bg-blue-600 text-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Wet
                    </Button>
                  </div>
                  {!data.weatherConditions && (
                    <p className="text-red-400 text-sm mt-2">Weather condition required</p>
                  )}
                </div>

                {/* Vehicle Cleanliness */}
                <div>
                  <Label className="text-gray-700 block mb-3">Vehicle Cleanliness</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.vehicleCleanliness === 'clean' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, vehicleCleanliness: 'clean' }))}
                      className={data.vehicleCleanliness === 'clean' ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Clean
                    </Button>
                    <Button
                      variant={data.vehicleCleanliness === 'dirty' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, vehicleCleanliness: 'dirty' }))}
                      className={data.vehicleCleanliness === 'dirty' ? "bg-orange-600 text-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Dirty
                    </Button>
                  </div>
                  {!data.vehicleCleanliness && (
                    <p className="text-red-400 text-sm mt-2">Cleanliness assessment required</p>
                  )}
                </div>

                {/* Lighting Conditions */}
                <div>
                  <Label className="text-gray-700 block mb-3">Lighting Conditions</Label>
                  <div className="flex space-x-3">
                    <Button
                      variant={data.lightingConditions === 'good light' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, lightingConditions: 'good light' }))}
                      className={data.lightingConditions === 'good light' ? "bg-[#00ABE7] hover:bg-[#0095d1] text-white border-[#00ABE7]" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Good Light
                    </Button>
                    <Button
                      variant={data.lightingConditions === 'poor light' ? "default" : "outline"}
                      onClick={() => setData(prev => ({ ...prev, lightingConditions: 'poor light' }))}
                      className={data.lightingConditions === 'poor light' ? "bg-yellow-600 text-gray-900" : "border-gray-300 text-gray-600 hover:bg-gray-50"}
                    >
                      Poor Light
                    </Button>
                  </div>
                  {!data.lightingConditions && (
                    <p className="text-red-400 text-sm mt-2">Lighting condition required</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Expenses</h2>
              <p className="text-gray-600">Record any job-related expenses (optional)</p>
            </div>

            <ExpenseForm 
              jobId={job.id} 
              driverId={(job as any)?.driverId || 'temp-driver'}
              jobNumber={job.jobNumber}
              vehicleRegistration={(job as any)?.vehicleReg || ''}
              onSuccess={() => {
                console.log("Expense Submitted: Your expense has been submitted for approval");
              }}
            />
          </div>
        );

      case 'final-details':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Final Details</h2>
              <p className="text-gray-600">Customer information and signature</p>
            </div>

            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="customerName" className="text-gray-700 block mb-2">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={data.customerName}
                    onChange={(e) => setData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                    placeholder="Enter customer name"
                  />
                  {!data.customerName && (
                    <p className="text-red-400 text-sm mt-1">Customer name required</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-700 block mb-3">Customer Signature</Label>
                  <Button
                    onClick={() => setShowSignature(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    variant={data.signature ? "outline" : "default"}
                  >
                    {data.signature ? 'Update Signature' : 'Capture Signature'}
                  </Button>
                  {!data.signature && (
                    <p className="text-red-400 text-sm mt-2">Signature required</p>
                  )}
                  {data.signature && (
                    <div className="text-[#00ABE7] text-sm mt-2">✓ Signature captured</div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes" className="text-gray-700 block mb-2">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={data.additionalNotes}
                    onChange={(e) => setData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    className="bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7]"
                    placeholder="Any additional observations or notes"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Vehicle Delivery</h1>
            <p className="text-sm text-gray-500">{job.jobNumber}</p>
          </div>
          <Badge variant="secondary" className="bg-[#00ABE7]/10 text-[#00ABE7] border-[#00ABE7]/20">
            {getCurrentStepNumber()}/{getTotalSteps()}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border-b border-gray-200 px-4 pb-3 flex-shrink-0">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#00ABE7] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCurrentStepNumber() / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content - Scrollable */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            minHeight: '0',
            maxHeight: '100%'
          }}
        >
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center flex-shrink-0">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 'vehicle-details'}
            className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:bg-gray-100"
          >
            Previous
          </Button>

          {currentStep === 'final-details' ? (
            <div className="space-y-2 flex-1 ml-4">
              <Button
                onClick={handleComplete}
                disabled={!canProceedToNextStep() || isCompleting}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isCompleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete Delivery
                  </>
                )}
              </Button>
              
              {isCompleting && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{uploadStatus}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#00ABE7] h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!canProceedToNextStep()}
              className="bg-[#00ABE7] hover:bg-[#0095d1] text-gray-900"
            >
              Next
            </Button>
          )}
        </div>

        {/* Photo Enlarge Modal */}
        <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
          <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-gray-900">
                {enlargedPhoto?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="relative overflow-auto max-h-[70vh] px-6 pb-6">
              {enlargedPhoto && (
                <img
                  src={enlargedPhoto.url}
                  alt={enlargedPhoto.title}
                  className="w-full h-auto rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Professional Damage Selection Modal */}
        <Dialog open={showDamageModal} onOpenChange={() => setShowDamageModal(false)}>
          <DialogContent className="max-w-lg w-full bg-white border-gray-200">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-gray-900 text-xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-red-500" />
                Record Vehicle Damage
              </DialogTitle>
              <p className="text-gray-600 text-sm">
                Please specify the type and severity of the damage found on the {pendingDamageLocation?.view} view
              </p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Damage Type Selection */}
              <div>
                <Label className="text-gray-700 font-semibold mb-3 block">Damage Type</Label>
                <Select 
                  value={newDamage.type} 
                  onValueChange={(value) => setNewDamage(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7]">
                    <SelectValue placeholder="Select damage type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {DAMAGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-gray-900 hover:bg-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold">{type.label}</span>
                          <span className="text-xs text-gray-600">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Damage Size Selection */}
              <div>
                <Label className="text-gray-700 font-semibold mb-3 block">Damage Size</Label>
                <Select 
                  value={newDamage.size} 
                  onValueChange={(value) => setNewDamage(prev => ({ ...prev, size: value }))}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7]">
                    <SelectValue placeholder="Select damage size..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg">
                    {DAMAGE_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-gray-900 hover:bg-slate-600">
                        <div className="flex flex-col">
                          <span className="font-semibold">{size.label}</span>
                          <span className="text-xs text-gray-600">{size.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Description */}
              <div>
                <Label className="text-gray-700 font-semibold mb-3 block">Additional Notes (Optional)</Label>
                <Textarea
                  value={newDamage.description}
                  onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add specific details about the damage location, cause, or severity..."
                  className="bg-white border-gray-300 text-gray-900 focus:border-[#00ABE7] focus:ring-[#00ABE7] placeholder:text-gray-600 resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setShowDamageModal(false);
                    setPendingDamageLocation(null);
                    setNewDamage({ type: '', size: '', description: '' });
                  }}
                  variant="outline"
                  className="flex-1 border-slate-600 text-gray-700 hover:bg-slate-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={confirmDamageMarker}
                  disabled={!newDamage.type || !newDamage.size}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-gray-900"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Record Damage
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden native camera input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </div>
  );
}