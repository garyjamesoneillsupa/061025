import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check, Upload } from 'lucide-react';

interface MobileCameraCaptureProps {
  title: string;
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
}

export default function MobileCameraCapture({
  title,
  onCapture,
  onCancel
}: MobileCameraCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use rear camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input if camera access fails
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        const file = new File([blob], `photo-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        });
        
        setCapturedImage(imageData);
        setCapturedFile(file);
        setShowCamera(false);
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setCapturedFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setShowCamera(true);
    startCamera();
  };

  const confirmCapture = () => {
    if (capturedImage && capturedFile) {
      onCapture(capturedImage, capturedFile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 text-white p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5 mr-2" />
            Cancel
          </Button>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Camera View */}
      {showCamera && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Capture Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6">
            <div className="flex items-center justify-center gap-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-white border-white hover:bg-white/20"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
              
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Camera className="w-8 h-8 text-gray-800" />
              </button>
              
              <div className="w-20"></div> {/* Spacer for centering */}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Fallback */}
      {!showCamera && !capturedImage && (
        <div className="flex items-center justify-center h-full text-white">
          <Card className="bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="text-center text-white">Camera Not Available</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-300">Please upload an image from your device</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00ABE7] hover:bg-[#0095d1]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview */}
      {capturedImage && (
        <div className="relative w-full h-full">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain bg-black"
          />
          
          {/* Preview Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="text-white border-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              
              <Button
                onClick={confirmCapture}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        capture="environment"
      />

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
}