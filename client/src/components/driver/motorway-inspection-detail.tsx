import { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface InspectionDetailProps {
  title: string;
  status: 'completed' | 'continue' | 'not-started';
  onBack?: () => void;
}

export function MotorwayInspectionDetail({ title, status, onBack }: InspectionDetailProps) {
  const [, navigate] = useLocation();
  const [selectedDamage, setSelectedDamage] = useState<number[]>([1, 2, 3]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-blue-400';
      case 'continue': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const damageItems = [
    { id: 1, title: 'Scratch or scuff', status: 'Completed', image: '/api/placeholder/60/60' },
    { id: 2, title: 'Dent', status: 'Completed', image: '/api/placeholder/60/60' },
    { id: 3, title: 'Windscreen chip', status: 'Completed', image: '/api/placeholder/60/60' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={onBack || (() => navigate(-1))}
          className="p-2"
        >
          <ArrowLeft className="h-6 w-6 text-white" />
        </button>
        <h1 className="text-lg font-medium">{title}</h1>
        <div className="w-10"></div>
      </div>

      {/* Car Outline - Front View */}
      <div className="px-4 py-8">
        <div className="relative mx-auto max-w-sm">
          {/* Car SVG Outline */}
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-500">
            <svg
              viewBox="0 0 300 200"
              className="w-full h-auto"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            >
              {/* Car Front Outline - Using light gray stroke for visibility */}
              <path
                d="M50 170 C50 170 50 160 60 150 L80 140 C90 135 95 130 100 125 L110 120 C120 115 130 110 140 108 L160 108 L180 108 C190 110 200 115 210 120 L220 125 C225 130 230 135 240 140 L260 150 C270 160 270 170 270 170 L270 180 L50 180 Z"
                stroke="#e2e8f0"
                fill="none"
              />
              
              {/* Headlights */}
              <ellipse cx="85" cy="155" rx="8" ry="12" stroke="#e2e8f0" fill="none" />
              <ellipse cx="235" cy="155" rx="8" ry="12" stroke="#e2e8f0" fill="none" />
              
              {/* Windscreen */}
              <path
                d="M110 120 C120 115 130 112 140 110 L160 110 L180 110 C190 112 200 115 210 120"
                stroke="#e2e8f0"
                fill="none"
              />
              
              {/* Hood line */}
              <path
                d="M100 125 C110 122 130 120 160 120 C190 120 210 122 220 125"
                stroke="#e2e8f0"
                fill="none"
              />
            </svg>
          </div>

          {/* Damage Markers */}
          {selectedDamage.map((id) => {
            const positions = {
              1: { left: '20%', top: '60%' }, // Left side
              2: { left: '50%', top: '45%' }, // Center
              3: { left: '80%', top: '30%' }  // Right side
            };
            
            return (
              <div
                key={id}
                className="absolute w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:bg-blue-500"
                style={positions[id as keyof typeof positions]}
                onClick={() => {
                  // Handle marker click
                }}
              >
                {id}
              </div>
            );
          })}
        </div>
      </div>

      {/* Damage Items List */}
      <div className="px-4 space-y-3">
        {damageItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {item.id}
            </div>
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
            </div>
            <div className="flex-1">
              <div className="text-white font-medium">{item.title}</div>
              <div className="text-blue-400 text-sm">{item.status}</div>
            </div>
            <ArrowLeft className="h-5 w-5 text-gray-400 transform rotate-180" />
          </div>
        ))}
      </div>
    </div>
  );
}