import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye, Camera } from "lucide-react";

export default function CompressionDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Damage Photo Quality Assurance</h2>
        <p className="text-gray-600">Our compression system is optimized specifically for vehicle damage documentation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Damage Photo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5 text-[#00ABE7]" />
              <span>Damage Documentation Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">Optimized for Legal Documentation</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Quality Level:</span>
                  <Badge className="bg-green-500 text-white">85% (High)</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Resolution:</span>
                  <span className="font-medium">1920x1080 (Full HD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium">Progressive JPEG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Encoder:</span>
                  <span className="font-medium">MozJPEG (Superior)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">What This Means:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Scratches and paint damage clearly visible</li>
                <li>• Dent contours and depth preserved</li>
                <li>• Metal damage and rust details retained</li>
                <li>• Professional quality for insurance claims</li>
                <li>• Legal documentation standards met</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quality Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-[#00ABE7]" />
              <span>Quality vs Storage Comparison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Original iPhone Photo */}
            <div className="border rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Original iPhone Photo</span>
                <Badge variant="secondary">4-6 MB</Badge>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 3000x4000 pixels (12MP)</div>
                <div>• HEIC/JPEG format</div>
                <div>• Excellent for close inspection</div>
              </div>
            </div>

            {/* After Compression */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-green-800">After Damage Compression</span>
                <Badge className="bg-green-500 text-white">800KB - 1.2MB</Badge>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <div>• 1920x1080 pixels (Full HD)</div>
                <div>• 85% quality JPEG</div>
                <div>• 70-80% smaller, same damage visibility</div>
                <div>• Perfect for legal documentation</div>
              </div>
            </div>

            {/* Storage Efficiency */}
            <div className="bg-[#00ABE7]/10 border border-[#00ABE7]/20 rounded-lg p-3">
              <h4 className="font-semibold text-[#00ABE7] mb-2">Storage Efficiency:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>50 Original Photos:</span>
                  <span className="font-medium">200-300 MB</span>
                </div>
                <div className="flex justify-between">
                  <span>50 Compressed Photos:</span>
                  <span className="font-medium text-green-600">40-60 MB</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span>Storage Saved:</span>
                  <span className="font-bold text-green-600">75-80%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Why Damage Photos Remain Crystal Clear</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-gray-800">Advanced Compression Technology:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>MozJPEG Encoder:</strong> Superior quality at same file size</li>
                <li>• <strong>Progressive JPEG:</strong> Better compression for detailed images</li>
                <li>• <strong>Smart Resizing:</strong> Maintains aspect ratio and important details</li>
                <li>• <strong>85% Quality:</strong> Optimal balance for legal documentation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-gray-800">Damage Visibility Preserved:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Light Scratches:</strong> Clear visibility in compressed images</li>
                <li>• <strong>Deep Scratches:</strong> Full detail retention</li>
                <li>• <strong>Dents & Dings:</strong> Shadow and contour definition maintained</li>
                <li>• <strong>Paint Damage:</strong> Color variations and chips visible</li>
                <li>• <strong>Rust & Corrosion:</strong> Texture and extent clearly documented</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Insurance & Legal Compliance:</h4>
            <p className="text-sm text-yellow-700">
              The 85% quality setting with Full HD resolution ensures that all compressed damage photos 
              meet professional standards for insurance claims, legal documentation, and customer disputes. 
              Even the smallest scratches and paint imperfections remain clearly visible and documentable.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}