import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Check, RotateCcw, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernCameraCaptureProps {
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
  title: string;
}

export default function ModernCameraCapture({ onCapture, onCancel, title }: ModernCameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isMobile, setIsMobile] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    
    // Auto-start camera on mobile, show file picker on desktop
    if (checkMobile && navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices) {
      startCamera();
    } else {
      // Desktop - immediately show file picker
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 100);
    }

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    if (isMobile) {
      startCamera();
    } else {
      fileInputRef.current?.click();
    }
  }, [startCamera, isMobile]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(capturedImage, file);
        }
      }, 'image/jpeg', 0.85);
    }
  }, [capturedImage, onCapture]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [isCameraActive, stopCamera, startCamera]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900/95 border-slate-700 backdrop-blur-lg">
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white hover:text-gray-300 hover:bg-slate-800"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Camera/Preview Area */}
          <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-600">
            {!capturedImage ? (
              <>
                {/* Live Camera Feed */}
                <video
                  ref={videoRef}
                  className={cn(
                    "w-full h-full object-cover",
                    !isCameraActive && "hidden"
                  )}
                  playsInline
                  muted
                  autoPlay
                />
                
                {/* Camera Not Active State */}
                {!isCameraActive && isMobile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="text-center space-y-4">
                      <Camera className="h-16 w-16 text-slate-400 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-white font-medium">Starting Camera...</p>
                        <p className="text-slate-400 text-sm">Please allow camera access</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop File Upload State */}
                {!isCameraActive && !isMobile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <div className="text-center space-y-4">
                      <Upload className="h-16 w-16 text-slate-400 mx-auto" />
                      <div className="space-y-2">
                        <p className="text-white font-medium">Choose Photo</p>
                        <p className="text-slate-400 text-sm">Select image from your device</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Capture Controls Overlay */}
                {isCameraActive && (
                  <div className="absolute inset-x-0 bottom-4 flex items-center justify-center space-x-4">
                    <Button
                      onClick={switchCamera}
                      size="lg"
                      className="bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-600 backdrop-blur-sm"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white w-16 h-16 rounded-full border-4 border-white/20"
                    >
                      <Camera className="h-7 w-7" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Captured Photo Preview */}
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
                
                {/* Preview Controls Overlay */}
                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center space-x-4">
                  <Button
                    onClick={retakePhoto}
                    size="lg"
                    className="bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-600 backdrop-blur-sm px-6"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Retake
                  </Button>
                  
                  <Button
                    onClick={confirmPhoto}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Use Photo
                  </Button>
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />

          {/* Alternative Actions */}
          <div className="flex justify-center space-x-4">
            {isMobile && !isCameraActive && (
              <Button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                <Camera className="h-5 w-5 mr-2" />
                Start Camera
              </Button>
            )}
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 px-6 py-3"
            >
              <Upload className="h-5 w-5 mr-2" />
              Choose File
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}