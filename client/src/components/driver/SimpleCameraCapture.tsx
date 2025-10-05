import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload, ImageIcon } from "lucide-react";

interface SimpleCameraCaptureProps {
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
  title: string;
}

export default function SimpleCameraCapture({ onCapture, onCancel, title }: SimpleCameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-trigger camera on component mount for instant capture
  useEffect(() => {
    const timer = setTimeout(() => {
      if (fileInputRef.current && !previewImage) {
        fileInputRef.current.click();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    if (previewImage && selectedFile) {
      onCapture(previewImage, selectedFile);
    }
  };

  const handleRetake = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-sm">
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" />
        </Button>
        <h2 className="text-white font-semibold text-lg truncate px-4">{title}</h2>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {previewImage ? (
          /* Preview Mode */
          <>
            <div className="flex-1 bg-black flex items-center justify-center p-4">
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            
            {/* Preview Controls */}
            <div className="p-6 bg-slate-900/90 backdrop-blur-sm">
              <div className="flex gap-4">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  size="lg"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 py-4"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={handleCapture}
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4"
                >
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Use Photo
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Camera Launch Mode */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white p-8">
            <div className="text-center space-y-6">
              <Camera className="h-20 w-20 text-blue-400 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Take Photo</h3>
                <p className="text-gray-400 text-lg">Tap the button below to open your camera</p>
              </div>
              <Button
                onClick={openCamera}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-xl"
              >
                <Camera className="h-6 w-6 mr-3" />
                Open Camera
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                This will open your device's native camera app
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input with camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}