import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Edit, 
  Trash2, 
  Plus, 
  Send, 
  FileText,
  Settings,
  Clock,
  CheckCircle,
  Eye,
  Copy
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  htmlContent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastUsed?: string;
}

const templateTypes = [
  { value: 'poc_ready', label: 'POC Ready', icon: FileText, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'pod_ready', label: 'POD Ready', icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'invoice_ready', label: 'Invoice Ready', icon: Mail, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'job_assignment', label: 'Job Assignment', icon: Clock, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
];

const getTemplateTypeInfo = (type: string) => {
  return templateTypes.find(t => t.value === type) || templateTypes[0];
};

const TemplatePreview = ({ template }: { template: EmailTemplate }) => {
  const [showRaw, setShowRaw] = useState(false);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Preview</h4>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowRaw(!showRaw)}
          data-testid="toggle-preview-mode"
        >
          {showRaw ? <Eye className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {showRaw ? 'Visual' : 'Raw HTML'}
        </Button>
      </div>
      
      {showRaw ? (
        <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-auto max-h-96">
          <code>{template.htmlContent}</code>
        </pre>
      ) : (
        <div className="border rounded-lg p-4 bg-white dark:bg-slate-900">
          <div className="mb-2">
            <strong>Subject:</strong> {template.subject}
          </div>
          <Separator className="my-2" />
          <div 
            className="email-preview"
            dangerouslySetInnerHTML={{ __html: template.htmlContent }}
            style={{ maxHeight: '400px', overflow: 'auto' }}
          />
        </div>
      )}
    </div>
  );
};

const TemplateForm = ({ 
  template, 
  onSubmit, 
  isSubmitting 
}: { 
  template?: EmailTemplate;
  onSubmit: (data: Partial<EmailTemplate>) => void;
  isSubmitting: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    type: template?.type || '',
    htmlContent: template?.htmlContent || '',
    isActive: template?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter template name"
            required
            data-testid="input-template-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Template Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger data-testid="select-template-type">
              <SelectValue placeholder="Select template type" />
            </SelectTrigger>
            <SelectContent>
              {templateTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="Use {jobNumber}, {customerName}, etc. for dynamic content"
          required
          data-testid="input-template-subject"
        />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Available variables: {'{jobNumber}, {customerName}, {collectionAddress}, {deliveryAddress}, {invoiceNumber}'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="htmlContent">HTML Content</Label>
        <Textarea
          id="htmlContent"
          value={formData.htmlContent}
          onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
          placeholder="Enter HTML email content with variables..."
          rows={12}
          required
          className="font-mono text-sm"
          data-testid="textarea-template-content"
        />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Use the same variables as in subject line. HTML formatting supported.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded"
          data-testid="checkbox-template-active"
        />
        <Label htmlFor="isActive">Template is active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isSubmitting} data-testid="button-save-template">
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
};

export default function EmailTemplatesPage() {
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showTestDialog, setShowTestDialog] = useState<EmailTemplate | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
    queryFn: () => fetch('/api/email-templates').then(res => res.json()),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (templateData: Partial<EmailTemplate>) =>
      apiRequest('/api/email-templates', 'POST', templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setShowCreateTemplate(false);
      toast({ title: "Template created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating template", description: error.message, variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, ...templateData }: Partial<EmailTemplate> & { id: string }) =>
      apiRequest(`/api/email-templates/${id}`, 'PUT', templateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating template", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/email-templates/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-templates'] });
      toast({ title: "Template deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting template", description: error.message, variant: "destructive" });
    },
  });

  const testTemplateMutation = useMutation({
    mutationFn: ({ id, testEmail }: { id: string; testEmail: string }) => {
      console.log('🧪 Testing template:', id, 'with email:', testEmail);
      return apiRequest(`/api/email-templates/${id}/test`, 'POST', { testEmail });
    },
    onSuccess: (data) => {
      console.log('✅ Test email successful:', data);
      setShowTestDialog(null);
      setTestEmail('');
      toast({ title: "Test email sent successfully" });
    },
    onError: (error: any) => {
      console.error('❌ Test email failed:', error);
      toast({ title: "Error sending test email", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
          <p className="text-gray-600 mt-1">
            Manage automated email notifications for customers
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateTemplate(true)} 
          className="bg-primary hover:bg-primary/90"
          data-testid="button-create-template"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template: EmailTemplate) => {
          const typeInfo = getTemplateTypeInfo(template.type);
          const TypeIcon = typeInfo.icon;
          
          return (
            <Card key={template.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-5 w-5 text-primary" />
                    <Badge className={typeInfo.color}>
                      {typeInfo.label}
                    </Badge>
                  </div>
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  Subject: {template.subject}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    data-testid={`button-preview-${template.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                    data-testid={`button-edit-${template.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowTestDialog(template)}
                    data-testid={`button-test-${template.id}`}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteTemplateMutation.mutate(template.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`button-delete-${template.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {template.lastUsed && (
                  <p className="text-xs text-slate-500 mt-3">
                    Last used: {new Date(template.lastUsed).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No email templates found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Create your first email template to start sending automated notifications
            </p>
            <Button onClick={() => setShowCreateTemplate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Template Dialog */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for automated notifications
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            onSubmit={(data) => createTemplateMutation.mutate(data)}
            isSubmitting={createTemplateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Update the email template settings and content
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSubmit={(data) => updateTemplateMutation.mutate({ ...data, id: editingTemplate.id })}
              isSubmitting={updateTemplateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview how this email template will appear to recipients
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && <TemplatePreview template={previewTemplate} />}
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={!!showTestDialog} onOpenChange={() => setShowTestDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email to verify the template works correctly
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address"
                data-testid="input-test-email"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTestDialog(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => showTestDialog && testTemplateMutation.mutate({ id: showTestDialog.id, testEmail })}
                disabled={!testEmail || testTemplateMutation.isPending}
                data-testid="button-send-test"
              >
                {testTemplateMutation.isPending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}