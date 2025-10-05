import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings as SettingsIcon, Save, DollarSign, Mail, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Setting } from "@shared/schema";

const settingFormSchema = z.object({
  value: z.string().min(1, "Value is required"),
});

type SettingFormData = z.infer<typeof settingFormSchema>;

interface SettingCardProps {
  setting: {
    key: string;
    value: string;
    description?: string;
    title: string;
    icon: any;
    type: 'text' | 'number' | 'email' | 'textarea';
  };
  onUpdate: (key: string, value: string) => void;
  isUpdating: boolean;
}

function SettingCard({ setting, onUpdate, isUpdating }: SettingCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const form = useForm<SettingFormData>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      value: setting.value || '',
    },
  });

  const onSubmit = (data: SettingFormData) => {
    let value = data.value;
    
    // Format currency values to 2 decimal places
    if (setting.key === 'default_rate_per_mile') {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        value = numValue.toFixed(2);
      }
    }
    
    onUpdate(setting.key, value);
    setIsEditing(false);
  };

  const Icon = setting.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Icon className="mr-2 h-5 w-5" />
          {setting.title}
        </CardTitle>
        {setting.description && (
          <p className="text-sm text-gray-600">{setting.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      {setting.type === 'textarea' ? (
                        <Textarea {...field} rows={3} />
                      ) : (
                        <Input 
                          type={setting.type} 
                          {...field} 
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={isUpdating}
                >
                  <Save className="mr-1 h-3 w-3" />
                  {isUpdating ? "Saving..." : "Save"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-3">
            <div className="min-h-[60px] flex items-center">
              <p className="text-lg font-medium">
                {setting.key === 'default_rate_per_mile' && setting.value 
                  ? `£${parseFloat(setting.value).toFixed(2)}` 
                  : setting.value || 'Not set'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                form.reset({ value: setting.value || '' });
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: string }) => {
      const response = await apiRequest(`/api/settings/${data.key}`, "PATCH", { value: data.value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update setting",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const settingsConfig = [
    {
      key: 'default_rate_per_mile',
      title: 'Default Cost Per Mile',
      description: 'Default rate charged per mile for vehicle movements (£)',
      icon: DollarSign,
      type: 'number' as const,
    },
    {
      key: 'company_name',
      title: 'Company Name',
      description: 'Company name displayed as sender in automated emails (POC, POD, Invoice notifications)',
      icon: SettingsIcon,
      type: 'text' as const,
    },
    {
      key: 'smtp_host',
      title: 'SMTP Host',
      description: 'Email server hostname for sending notifications',
      icon: Mail,
      type: 'text' as const,
    },
    {
      key: 'smtp_user',
      title: 'SMTP Username',
      description: 'Email account username',
      icon: Mail,
      type: 'email' as const,
    },
    {
      key: 'smtp_password',
      title: 'SMTP Password',
      description: 'Email account password',
      icon: Mail,
      type: 'text' as const,
    },
    {
      key: 'from_email',
      title: 'From Email Address',
      description: 'Email address used for sending notifications',
      icon: Mail,
      type: 'email' as const,
    },
    {
      key: 'smtp_port',
      title: 'SMTP Port',
      description: 'SMTP server port (usually 465 for SSL or 587 for TLS)',
      icon: Mail,
      type: 'number' as const,
    },
    {
      key: 'smtp_secure',
      title: 'SMTP Secure (SSL)',
      description: 'Use SSL encryption (true/false)',
      icon: Mail,
      type: 'text' as const,
    },
    {
      key: 'imap_host',
      title: 'IMAP Host',
      description: 'IMAP server hostname for saving sent emails (usually same as SMTP host)',
      icon: Mail,
      type: 'text' as const,
    },
    {
      key: 'imap_user',
      title: 'IMAP Username',
      description: 'IMAP account username (usually same as SMTP username)',
      icon: Mail,
      type: 'email' as const,
    },
    {
      key: 'imap_password',
      title: 'IMAP Password',
      description: 'IMAP account password (usually same as SMTP password)',
      icon: Mail,
      type: 'text' as const,
    },
    {
      key: 'imap_port',
      title: 'IMAP Port',
      description: 'IMAP server port (usually 993 for SSL or 143 for TLS)',
      icon: Mail,
      type: 'number' as const,
    },
    {
      key: 'imap_secure',
      title: 'IMAP Secure (SSL)',
      description: 'Use SSL encryption for IMAP (true/false)',
      icon: Mail,
      type: 'text' as const,
    },
  ];

  const getSettingValue = (key: string) => {
    return settings?.find(s => s.key === key)?.value || '';
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Configure system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsConfig.map((config) => (
          <SettingCard
            key={config.key}
            setting={{
              ...config,
              value: getSettingValue(config.key),
            }}
            onUpdate={(key, value) => updateSettingMutation.mutate({ key, value })}
            isUpdating={updateSettingMutation.isPending}
          />
        ))}
      </div>
    </main>
  );
}