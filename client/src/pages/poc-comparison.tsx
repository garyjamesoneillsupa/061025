import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Zap } from 'lucide-react';

export default function POCComparisonPage() {
  const [jobId, setJobId] = useState('4bf8ce9b-c01a-47dc-b346-2970ab85c1d0'); // Default to 190825001
  const [isGenerating, setIsGenerating] = useState({ original: false, compact: false });

  const generatePOC = async (type: 'original' | 'compact') => {
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    
    try {
      const endpoint = type === 'original' 
        ? `/api/flawless/generate-poc/${jobId}`
        : `/api/compact/generate-compact-poc/${jobId}`;
      
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${type} POC`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'original' ? 'Original' : 'Compact'}-POC-190825001.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error generating ${type} POC:`, error);
      alert(`Failed to generate ${type} POC`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">POC Layout Comparison</h1>
        <p className="text-muted-foreground">
          Compare the original POC layout with the new compact professional version
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Selection</CardTitle>
          <CardDescription>Enter a job ID to generate POCs for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="e.g., 4bf8ce9b-c01a-47dc-b346-2970ab85c1d0"
              />
            </div>
            <Badge variant="secondary">190825001 - P7DGO Hyundai Tucson</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Original POC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Original POC
            </CardTitle>
            <CardDescription>
              Current POC layout with standard spacing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Layout Characteristics:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standard 50px margins</li>
                <li>• Large spacing between sections</li>
                <li>• Generous whitespace</li>
                <li>• Traditional document feel</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Typical Output:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 3+ pages for standard jobs</li>
                <li>• ~45-50KB file size</li>
                <li>• Large photo placeholders</li>
              </ul>
            </div>

            <Button 
              onClick={() => generatePOC('original')} 
              disabled={isGenerating.original}
              className="w-full"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating.original ? 'Generating...' : 'Generate Original POC'}
            </Button>
          </CardContent>
        </Card>

        {/* Compact POC */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Compact POC
              <Badge className="ml-2">NEW</Badge>
            </CardTitle>
            <CardDescription>
              Professional dense layout with minimal whitespace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Layout Improvements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Reduced 25px margins</li>
                <li>• Tight 14px line spacing</li>
                <li>• Efficient two-column summary</li>
                <li>• Professional density</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Better Output:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 2-3 pages maximum</li>
                <li>• Same ~45KB file size</li>
                <li>• Optimized photo grids</li>
              </ul>
            </div>

            <Button 
              onClick={() => generatePOC('compact')} 
              disabled={isGenerating.compact}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating.compact ? 'Generating...' : 'Generate Compact POC'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Spacing</h4>
              <p className="text-muted-foreground">Original: 30-50px gaps</p>
              <p className="text-primary font-medium">Compact: 14px tight spacing</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Margins</h4>
              <p className="text-muted-foreground">Original: 50px all around</p>
              <p className="text-primary font-medium">Compact: 25px efficient</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Content Density</h4>
              <p className="text-muted-foreground">Original: Sparse layout</p>
              <p className="text-primary font-medium">Compact: Professional dense</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}