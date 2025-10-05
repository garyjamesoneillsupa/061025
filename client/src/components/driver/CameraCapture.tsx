import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, X, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
  title?: string;
}

export default function CameraCapture({ onCapture, onCancel, title = "Capture Photo" }: CameraCaptureProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      // Fallback to file input if camera fails
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
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && canvasRef.current) {
      // Convert data URL to File object
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(capturedImage, file);
        }
      }, 'image/jpeg', 0.8);
    }
  }, [capturedImage, onCapture]);

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        onCapture(imageData, file);
      };
      reader.readAsDataURL(file);
    }
  }, [onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isCameraActive) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  }, [isCameraActive, stopCamera, startCamera]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-700">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className={cn(
                    "w-full h-full object-cover",
                    !isCameraActive && "hidden"
                  )}
                  playsInline
                  muted
                />
                
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
                    >
                      <Camera className="h-6 w-6 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                {isCameraActive && (
                  <>
                    <Button
                      onClick={capturePhoto}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capture
                    </Button>
                    <Button
                      onClick={switchCamera}
                      variant="outline"
                      className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  Choose File
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={confirmPhoto}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Use Photo
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}