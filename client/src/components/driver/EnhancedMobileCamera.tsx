import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check, Upload, Zap, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedMobileCameraProps {
  title: string;
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
}

export default function EnhancedMobileCamera({
  title,
  onCapture,
  onCancel
}: EnhancedMobileCameraProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
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
  }, [showCamera, cameraFacing]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1920, max: 4032 },
          height: { ideal: 1080, max: 3024 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      if (isFlashOn) {
        // Add flash constraint if supported
        (constraints.video as any).torch = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas with image enhancement
    ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to high quality blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        
        // Create file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `photo-${timestamp}.jpg`, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        setCapturedFile(file);
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setShowCamera(false);
      }
    }, 'image/jpeg', 0.92); // High quality JPEG
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCapturedFile(null);
    setShowCamera(true);
  };

  const confirmPhoto = () => {
    if (capturedImage && capturedFile) {
      onCapture(capturedImage, capturedFile);
    }
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };

  const switchCamera = () => {
    setCameraFacing(current => current === 'environment' ? 'user' : 'environment');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        setCapturedFile(file);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-sm text-white p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold text-center flex-1">{title}</h2>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Camera/Image View */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showCamera ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Camera Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/40"></div>
                  ))}
                </div>
              </div>

              {/* Camera Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFlash}
                  className="bg-black/50 text-white hover:bg-black/70 w-12 h-12 p-0"
                >
                  {isFlashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={switchCamera}
                  className="bg-black/50 text-white hover:bg-black/70 w-12 h-12 p-0"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ) : capturedImage ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white p-8"
            >
              <Upload className="w-16 h-16 mx-auto mb-4 opacity-60" />
              <p className="text-lg mb-4">Camera not available</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00ABE7] hover:bg-[#0088CC] text-white"
              >
                Choose from Gallery
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/90 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-6">
          {showCamera ? (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="text-white hover:bg-white/20 w-14 h-14 p-0 rounded-full"
              >
                <Upload className="w-6 h-6" />
              </Button>
              
              <Button
                onClick={capturePhoto}
                className="bg-white hover:bg-gray-200 text-black w-20 h-20 p-0 rounded-full shadow-lg border-4 border-white/30"
              >
                <Camera className="w-8 h-8" />
              </Button>
              
              <div className="w-14 h-14" /> {/* Spacer */}
            </>
          ) : capturedImage ? (
            <>
              <Button
                variant="ghost"
                onClick={retakePhoto}
                className="text-white hover:bg-white/20 px-6 py-3"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Retake
              </Button>
              
              <Button
                onClick={confirmPhoto}
                className="bg-[#00ABE7] hover:bg-[#0088CC] text-white px-8 py-3 rounded-full"
              >
                <Check className="w-5 h-5 mr-2" />
                Use Photo
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}