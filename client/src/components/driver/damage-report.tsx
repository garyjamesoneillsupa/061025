import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Check, AlertTriangle, Plus, Trash2, X } from "lucide-react";
import type { Job } from "@shared/schema";

const vehiclePanels = [
  { value: 'front_bumper', label: 'Front Bumper' },
  { value: 'bonnet', label: 'Bonnet' },
  { value: 'windscreen', label: 'Windscreen' },
  { value: 'front_grille', label: 'Front Grille' },
  { value: 'ns_front_headlight', label: 'N/S Front Headlight' },
  { value: 'os_front_headlight', label: 'O/S Front Headlight' },
  { value: 'os_front_wing', label: 'O/S Front Wing' },
  { value: 'os_front_door', label: 'O/S Front Door' },
  { value: 'os_rear_door', label: 'O/S Rear Door' },
  { value: 'os_rear_panel', label: 'O/S Rear Panel' },
  { value: 'os_side_mirror', label: 'O/S Side Mirror' },
  { value: 'ns_front_wing', label: 'N/S Front Wing' },
  { value: 'ns_front_door', label: 'N/S Front Door' },
  { value: 'ns_rear_door', label: 'N/S Rear Door' },
  { value: 'ns_rear_panel', label: 'N/S Rear Panel' },
  { value: 'ns_side_mirror', label: 'N/S Side Mirror' },
  { value: 'rear_bumper', label: 'Rear Bumper' },
  { value: 'tailgate_boot', label: 'Tailgate / Boot' },
  { value: 'rear_windscreen', label: 'Rear Windscreen' },
  { value: 'ns_rear_light', label: 'N/S Rear Light' },
  { value: 'os_rear_light', label: 'O/S Rear Light' },
  { value: 'roof_panel', label: 'Roof Panel' },
  { value: 'roof_rails', label: 'Roof Rails' },
  { value: 'nsf_wheel', label: 'N/S/F Wheel' },
  { value: 'nsr_wheel', label: 'N/S/R Wheel' },
  { value: 'osf_wheel', label: 'O/S/F Wheel' },
  { value: 'osr_wheel', label: 'O/S/R Wheel' },
];

const damageTypes = [
  { value: 'light_scratch', label: 'Light Scratch' },
  { value: 'deep_scratch', label: 'Deep Scratch' },
  { value: 'small_dent', label: 'Small Dent' },
  { value: 'large_dent', label: 'Large Dent' },
  { value: 'paintwork_damage', label: 'Paintwork Damage' },
  { value: 'rust', label: 'Rust' },
  { value: 'crack', label: 'Crack' },
  { value: 'chip', label: 'Chip' },
  { value: 'generic_damage', label: 'Generic Damage' },
];

const damageFormSchema = z.object({
  panel: z.string().min(1, "Panel is required"),
  damageType: z.string().min(1, "Damage type is required"),
  notes: z.string().optional(),
  photos: z.any().optional(),
});

type DamageFormData = z.infer<typeof damageFormSchema>;

interface DamageReportProps {
  job: Job;
  onClose: () => void;
}

interface PanelStatus {
  panel: string;
  status: 'ok' | 'damaged' | 'not_checked';
  damageCount: number;
}

export default function DamageReport({ job, onClose }: DamageReportProps) {
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [stage] = useState<'collection' | 'delivery'>('collection'); // In real app, determine from job status
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: damageReports } = useQuery({
    queryKey: ["/api/jobs", job.id, "damage-reports"],
  });

  const form = useForm<DamageFormData>({
    resolver: zodResolver(damageFormSchema),
    defaultValues: {
      panel: "",
      damageType: "",
      notes: "",
    },
  });

  const createDamageReportMutation = useMutation({
    mutationFn: async (data: DamageFormData) => {
      const formData = new FormData();
      formData.append('jobId', job.id);
      formData.append('panel', data.panel);
      formData.append('damageType', data.damageType);
      formData.append('stage', stage);
      if (data.notes) formData.append('notes', data.notes);
      
      if (data.photos && data.photos.length > 0) {
        Array.from(data.photos).forEach((photo: any) => {
          formData.append('photos', photo);
        });
      }

      const response = await fetch("/api/damage-reports", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create damage report");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", job.id, "damage-reports"] });
      toast({
        title: "Damage reported",
        description: "Damage has been recorded successfully",
      });
      setShowDamageForm(false);
      setSelectedPanel(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to report damage",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate panel statuses
  const panelStatuses: PanelStatus[] = vehiclePanels.map(panel => {
    const panelDamage = damageReports?.filter((report: any) => 
      report.panel === panel.value && report.stage === stage
    ) || [];
    
    return {
      panel: panel.value,
      status: panelDamage.length > 0 ? 'damaged' : 'ok',
      damageCount: panelDamage.length,
    };
  });

  const onSubmit = (data: DamageFormData) => {
    createDamageReportMutation.mutate(data);
  };

  const handlePanelSelect = (panelValue: string) => {
    setSelectedPanel(panelValue);
    form.setValue('panel', panelValue);
    setShowDamageForm(true);
  };

  if (showDamageForm) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">
            {vehiclePanels.find(p => p.value === selectedPanel)?.label} - Add Damage
          </h4>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setShowDamageForm(false);
              setSelectedPanel(null);
              form.reset();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="damageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Damage Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select damage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {damageTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={3} 
                      placeholder="Describe the damage location and details..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photos"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Photos (At least 1 required)</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onChange(e.target.files)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowDamageForm(false);
                  setSelectedPanel(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createDamageReportMutation.isPending}
              >
                {createDamageReportMutation.isPending ? "Saving..." : "Save Damage"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Vehicle Panels</h4>
        <Badge variant="secondary">
          {stage === 'collection' ? 'Collection' : 'Delivery'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {vehiclePanels.map((panel) => {
          const panelStatus = panelStatuses.find(p => p.panel === panel.value);
          const isDamaged = panelStatus?.status === 'damaged';
          
          return (
            <button
              key={panel.value}
              className={`p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors ${
                isDamaged 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300'
              }`}
              onClick={() => handlePanelSelect(panel.value)}
            >
              <div className="font-medium">{panel.label}</div>
              <div className={`text-xs flex items-center ${
                isDamaged ? 'text-red-600' : 'text-green-600'
              }`}>
                {isDamaged ? (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {panelStatus.damageCount} Issue{panelStatus.damageCount > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    OK
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Existing Damage Summary */}
      {damageReports && damageReports.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Damage Summary</h4>
          <div className="space-y-2">
            {damageReports.map((report: any) => {
              const panelLabel = vehiclePanels.find(p => p.value === report.panel)?.label;
              const damageLabel = damageTypes.find(d => d.value === report.damageType)?.label;
              
              return (
                <div key={report.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{panelLabel}</span>
                      <span className="text-sm text-gray-600 ml-2">- {damageLabel}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {report.stage}
                    </Badge>
                  </div>
                  {report.notes && (
                    <p className="text-sm text-gray-600 mt-1">{report.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <Button onClick={onClose} className="w-full">
          Complete Inspection
        </Button>
      </div>
    </div>
  );
}
