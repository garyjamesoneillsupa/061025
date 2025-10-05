import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface NativeCameraCaptureProps {
  title: string;
  onCapture: (imageData: string, file: File) => void;
  onCancel: () => void;
}

export default function NativeCameraCapture({
  title,
  onCapture,
  onCancel
}: NativeCameraCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        onCapture(imageData, file);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  // Auto-open camera immediately when component mounts
  React.useEffect(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </h2>
        
        <div className="space-y-4">
          <div className="text-center text-gray-600">
            <Camera className="w-8 h-8 mx-auto mb-2 text-[#00ABE7]" />
            <p className="text-sm">Camera opening...</p>
            <p className="text-xs text-gray-500">Take a photo when ready</p>
          </div>
          
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
        
        {/* Native file input with camera capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}