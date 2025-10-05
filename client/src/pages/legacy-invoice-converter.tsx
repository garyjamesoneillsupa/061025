import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LegacyInvoiceConverter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const downloadInvoice = async (invoiceNumber: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/legacy/generate-invoice-${invoiceNumber}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Invoice-${invoiceNumber}-Converted.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoiceNumber} has been converted and downloaded using your current template.`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate and download the invoice.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Legacy Invoice Converter</h1>
        <p className="text-gray-600">
          Convert your previous invoices to the current OVM Gold Standard template format
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Invoice 001 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825001
            </CardTitle>
            <CardDescription>RX69NGO - BMW X3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Henson Motor Group</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">BMW X3 RX69NGO</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£124.60</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £109.60</li>
                <li>• Diesel: £15.00</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('001')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 002 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825002
            </CardTitle>
            <CardDescription>KL18VMP - Audi A4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Premier Auto Solutions</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Audi A4 KL18VMP</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£107.70</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £89.20</li>
                <li>• Diesel: £18.50</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('002')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 003 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825003
            </CardTitle>
            <CardDescription>SC65WXZ - Mercedes C-Class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Highland Motors Ltd</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Mercedes C-Class SC65WXZ</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£179.20</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £156.80</li>
                <li>• Diesel: £22.40</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('003')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 004 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825004
            </CardTitle>
            <CardDescription>YT20FGH - Volkswagen Golf</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Celtic Car Centre</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Volkswagen Golf YT20FGH</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£88.30</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £76.00</li>
                <li>• Diesel: £12.30</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('004')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 005 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825005
            </CardTitle>
            <CardDescription>BN19KMP - Ford Focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Midlands Motor Trade</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Ford Focus BN19KMP</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£152.20</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £132.40</li>
                <li>• Diesel: £19.80</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('005')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 006 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825006
            </CardTitle>
            <CardDescription>WX68PLM - Nissan Qashqai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Yorkshire Vehicle Solutions</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Nissan Qashqai WX68PLM</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£111.20</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £94.50</li>
                <li>• Diesel: £16.70</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('006')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 007 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825007
            </CardTitle>
            <CardDescription>CY17DMN - Peugeot 308</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Cardiff Auto Services</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Peugeot 308 CY17DMN</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£191.80</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £167.20</li>
                <li>• Diesel: £24.60</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('007')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice 008 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice #290825008
            </CardTitle>
            <CardDescription>DV21XYZ - Toyota RAV4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Customer:</p>
                <p className="text-gray-600">Devon Vehicle Logistics</p>
              </div>
              <div>
                <p className="font-medium">Date:</p>
                <p className="text-gray-600">Aug 31, 2025</p>
              </div>
              <div>
                <p className="font-medium">Vehicle:</p>
                <p className="text-gray-600">Toyota RAV4 DV21XYZ</p>
              </div>
              <div>
                <p className="font-medium">Total:</p>
                <p className="text-gray-600 font-medium">£230.50</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Services:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Vehicle Movement: £201.60</li>
                <li>• Diesel: £28.90</li>
              </ul>
            </div>

            <Button 
              onClick={() => downloadInvoice('008')} 
              disabled={isGenerating}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Download Invoice'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            Conversion Details
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <div className="space-y-2 text-sm">
            <p>✓ <strong>Template:</strong> Current OVM Gold Standard invoice design</p>
            <p>✓ <strong>Branding:</strong> OVM Ltd (272 Bath Street, Glasgow, G2 4JR)</p>
            <p>✓ <strong>Date Preserved:</strong> August 31, 2025 as in original invoices</p>
            <p>✓ <strong>Payment Terms:</strong> Updated to current 30-day standard</p>
            <p>✓ <strong>Data:</strong> All customer and vehicle details extracted from legacy PDFs</p>
            <p>✓ <strong>Formatting:</strong> Professional layout with OVM logo and company details</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}