import { useState, useEffect } from "react";
import { X, Phone, MapPin } from "lucide-react";
import type { JobWithDetails } from "../../pages/driver-dashboard-simple";

interface ContactModalProps {
  job: JobWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactModal({ job, isOpen, onClose }: ContactModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsAnimating(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-700/50 transform transition-all duration-500 ease-out ${
          isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
          <h2 className="text-white text-xl font-bold">Job details</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Vehicle Info Section - No Photo */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-400 text-sm mb-1">2 Apr 2099</div>
              <div className="text-white text-lg font-bold">{job.vehicle?.make || 'BMW i3'}</div>
              <div className="text-gray-400 text-sm">
                {job.vehicle?.year || '2014'} • Automatic • Electric
              </div>
            </div>
            <div className="bg-blue-600 px-3 py-1 rounded text-white text-xs font-semibold">
              DEMO
            </div>
          </div>

          {/* Location Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Location</h3>
            
            {/* Collection Address */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-3 border border-gray-700/30">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Collection address</div>
                  <div className="text-white text-sm font-medium">
                    {job.collectionAddress?.streetAddress || '13 Wells Mews Motorway 12'}, {job.collectionAddress?.city || 'London'}, {job.collectionAddress?.postcode || 'W1T3HE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wider">Delivery address</div>
                  <div className="text-white text-sm font-medium">
                    Demo Dealer Name<br />
                    {job.deliveryAddress?.streetAddress || '123 Fake Street'}, {job.deliveryAddress?.city || 'London'}, {job.deliveryAddress?.postcode || 'N11AA'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Contact Details</h3>
            
            {/* Collection Contact */}
            <button
              onClick={() => handleCall(job.collectionContact?.phone || '+44123456789')}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-3 border border-gray-700/30 hover:bg-gray-800/70 transition-colors"
            >
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider text-left">Collection details</div>
                <div className="text-white text-sm font-semibold text-left">
                  {job.collectionContact?.name || 'Bloggs Joe'}
                </div>
              </div>
              <Phone className="h-5 w-5 text-blue-400" />
            </button>

            {/* Delivery Contact */}
            <button
              onClick={() => handleCall(job.deliveryContact?.phone || '+44987654321')}
              className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30 hover:bg-gray-800/70 transition-colors"
            >
              <div>
                <div className="text-gray-400 text-xs uppercase tracking-wider text-left">Delivery details</div>
                <div className="text-white text-sm font-semibold text-left">
                  {job.deliveryContact?.name || 'Smith John'}
                </div>
              </div>
              <Phone className="h-5 w-5 text-blue-400" />
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button 
              onClick={() => {
                handleClose();
                // Navigate to collection process after modal closes
                setTimeout(() => {
                  window.location.href = `/drivers/jobs/${job.jobNumber}/collection`;
                }, 300);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl text-sm font-semibold transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}