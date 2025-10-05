import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-slate-50/80 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium bg-gradient-to-r from-gray-600 to-gray-500 bg-clip-text text-transparent">
            Powered by <span className="text-[#00ABE7] font-semibold">OVM Pro</span> | Vehicle Movement Software v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}