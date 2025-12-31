import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCurrentOrganization } from '@/features/organization/hooks/useOrganizations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/shared/hooks/use-toast';
import { Mail, Settings, FileText, BarChart3, Upload, Plus, Edit3, Trash2, Eye } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { z } from 'zod';

// Validation schemas
const emailSettingsSchema = z.object({
  fromEmail: z.string().email('Please enter a valid email address'),
  fromName: z.string().min(1, 'From name is required'),
  replyToEmail: z.string().email('Please enter a valid reply-to email').optional().or(z.literal('')),
  companyLogoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color').optional(),
  brandSecondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color').optional(),
  companyWebsite: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  companyAddress: z.string().optional(),
  emailSignature: z.string().optional(),
  enabledEvents: z.array(z.string()),
});

const templateSchema = z.object({
  templateName: z.string().min(1, 'Template name is required'),
  templateType: z.enum(['application_confirmation', 'new_application_notification', 'interview_scheduled', 'status_update', 'offer_letter', 'rejection_notice']),
  sendgridTemplateId: z.string().optional(),
  fallbackSubject: z.string().min(1, 'Subject is required'),
  fallbackHtml: z.string().min(1, 'HTML content is required'),
  fallbackText: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
type TemplateFormData = z.infer<typeof templateSchema>;

const emailEventTypes = [
  { value: 'application_confirmation', label: 'Application Confirmation' },
  { value: 'new_application_notification', label: 'New Application Notification' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'status_update', label: 'Status Update' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'rejection_notice', label: 'Rejection Notice' },
];

export default function EmailSettingsAdmin() {
  const { toast } = useToast();
  const { data: currentOrg } = useCurrentOrganization();
  const orgId = (currentOrg as any)?.id;
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  // Fetch email settings
  const { data: emailSettings, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ['/api/organizations', orgId, 'email-settings'],
    enabled: !!orgId,
  });

  // Fetch email templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<any[]>({
    queryKey: ['/api/organizations', orgId, 'email-templates'],
    enabled: !!orgId,
  });

  // Fetch email events for analytics
  const { data: emailEvents = [], isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ['/api/organizations', orgId, 'email-events'],
    enabled: !!orgId,
  });

  // Email settings form
  const settingsForm = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      fromEmail: emailSettings?.fromEmail || '',
      fromName: emailSettings?.fromName || '',
      replyToEmail: emailSettings?.replyToEmail || '',
      companyLogoUrl: emailSettings?.companyLogoUrl || '',
      brandColor: emailSettings?.brandColor || '#1e40af',
      brandSecondaryColor: emailSettings?.brandSecondaryColor || '#3b82f6',
      companyWebsite: emailSettings?.companyWebsite || '',
      companyAddress: emailSettings?.companyAddress || '',
      emailSignature: emailSettings?.emailSignature || '',
      enabledEvents: emailSettings?.enabledEvents || [],
    },
  });

  // Template form
  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      templateName: '',
      templateType: 'application_confirmation',
      sendgridTemplateId: '',
      fallbackSubject: '',
      fallbackHtml: '',
      fallbackText: '',
      isActive: true,
      isDefault: false,
    },
  });

  // Update email settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: EmailSettingsFormData) =>
      apiRequest(`/api/organizations/${orgId}/email-settings`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: 'Email settings updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'email-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update email settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData) =>
      apiRequest(`/api/organizations/${orgId}/email-templates`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: 'Email template created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'email-templates'] });
      setIsCreatingTemplate(false);
      templateForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create email template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<TemplateFormData> }) =>
      apiRequest(`/api/organizations/${orgId}/email-templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({ title: 'Email template updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'email-templates'] });
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update email template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) =>
      apiRequest(`/api/organizations/${orgId}/email-templates/${templateId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast({ title: 'Email template deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', orgId, 'email-templates'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete email template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSettingsSubmit = (data: EmailSettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const onTemplateSubmit = (data: TemplateFormData) => {
    if (selectedTemplate) {
      updateTemplateMutation.mutate({ templateId: selectedTemplate.id, data });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  // Update form values when settings load
  useEffect(() => {
    if (emailSettings && !settingsForm.formState.isDirty) {
      settingsForm.reset({
        fromEmail: emailSettings.fromEmail || '',
        fromName: emailSettings.fromName || '',
        replyToEmail: emailSettings.replyToEmail || '',
        companyLogoUrl: emailSettings.companyLogoUrl || '',
        brandColor: emailSettings.brandColor || '#1e40af',
        brandSecondaryColor: emailSettings.brandSecondaryColor || '#3b82f6',
        companyWebsite: emailSettings.companyWebsite || '',
        companyAddress: emailSettings.companyAddress || '',
        emailSignature: emailSettings.emailSignature || '',
        enabledEvents: emailSettings.enabledEvents || [],
      });
    }
  }, [emailSettings, settingsForm]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your organization's email settings, templates, and automation.
          </p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Email Configuration</CardTitle>
              <CardDescription>
                Configure the default email settings for your organization's automated emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email Address *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="noreply@company.com" data-testid="input-from-email" />
                          </FormControl>
                          <FormDescription>
                            The email address that will appear as the sender.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Company Name" data-testid="input-from-name" />
                          </FormControl>
                          <FormDescription>
                            The name that will appear as the sender.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="replyToEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reply-To Email</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="hr@company.com" data-testid="input-reply-to-email" />
                          </FormControl>
                          <FormDescription>
                            Where replies should be sent (optional).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="companyLogoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Logo URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://company.com/logo.png" data-testid="input-logo-url" />
                          </FormControl>
                          <FormDescription>
                            URL to your company logo for emails.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="brandColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brand Color</FormLabel>
                          <FormControl>
                            <Input {...field} type="color" data-testid="input-brand-color" />
                          </FormControl>
                          <FormDescription>
                            Primary brand color for email styling.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="brandSecondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Brand Color</FormLabel>
                          <FormControl>
                            <Input {...field} type="color" data-testid="input-secondary-color" />
                          </FormControl>
                          <FormDescription>
                            Secondary brand color for email styling.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://company.com" data-testid="input-company-website" />
                          </FormControl>
                          <FormDescription>
                            Your company website URL.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="123 Business St, City, State 12345" data-testid="textarea-company-address" />
                          </FormControl>
                          <FormDescription>
                            Physical address for email footers.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="emailSignature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Signature</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Best regards,\nThe HR Team" data-testid="textarea-email-signature" />
                          </FormControl>
                          <FormDescription>
                            Default signature for all emails.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Enabled Email Events</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {emailEventTypes.map((eventType) => (
                        <FormField
                          key={eventType.value}
                          control={settingsForm.control}
                          name="enabledEvents"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  {eventType.label}
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value?.includes(eventType.value)}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValues, eventType.value]);
                                    } else {
                                      field.onChange(currentValues.filter(v => v !== eventType.value));
                                    }
                                  }}
                                  data-testid={`switch-${eventType.value}`}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Email Templates</h2>
              <p className="text-muted-foreground">
                Manage your organization's email templates for different events.
              </p>
            </div>
            <Button 
              onClick={() => {
                setIsCreatingTemplate(true);
                setSelectedTemplate(null);
                templateForm.reset();
              }}
              data-testid="button-create-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Template List */}
            <Card>
              <CardHeader>
                <CardTitle>Template List</CardTitle>
                <CardDescription>
                  Click on a template to edit it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {templatesLoading ? (
                  <div className="text-center py-6">Loading templates...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No templates created yet.
                  </div>
                ) : (
                  templates.map((template: any) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsCreatingTemplate(false);
                        templateForm.reset({
                          templateName: template.templateName,
                          templateType: template.templateType,
                          sendgridTemplateId: template.sendgridTemplateId || '',
                          fallbackSubject: template.fallbackSubject,
                          fallbackHtml: template.fallbackHtml,
                          fallbackText: template.fallbackText || '',
                          isActive: template.isActive,
                          isDefault: template.isDefault,
                        });
                      }}
                      data-testid={`template-item-${template.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{template.templateName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {emailEventTypes.find(e => e.value === template.templateType)?.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {template.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          <Badge variant={template.isActive ? "default" : "secondary"}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Template Editor */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreatingTemplate ? 'Create New Template' : selectedTemplate ? 'Edit Template' : 'Select a Template'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(isCreatingTemplate || selectedTemplate) ? (
                  <Form {...templateForm}>
                    <form onSubmit={templateForm.handleSubmit(onTemplateSubmit)} className="space-y-4">
                      <FormField
                        control={templateForm.control}
                        name="templateName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Template Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Welcome Email" data-testid="input-template-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="templateType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-template-type">
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {emailEventTypes.map((eventType) => (
                                  <SelectItem key={eventType.value} value={eventType.value}>
                                    {eventType.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="sendgridTemplateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SendGrid Template ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="d-1234567890abcdef" data-testid="input-sendgrid-id" />
                            </FormControl>
                            <FormDescription>
                              Optional: Use a SendGrid dynamic template.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="fallbackSubject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Welcome to {{company_name}}!" data-testid="input-subject" />
                            </FormControl>
                            <FormDescription>
                              Use {'{{variable}}'} for dynamic content.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="fallbackHtml"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>HTML Content *</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="<h1>Welcome {{candidate_name}}!</h1>" 
                                rows={6}
                                data-testid="textarea-html-content"
                              />
                            </FormControl>
                            <FormDescription>
                              HTML version of the email template.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={templateForm.control}
                        name="fallbackText"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Welcome {{candidate_name}}!" 
                                rows={4}
                                data-testid="textarea-text-content"
                              />
                            </FormControl>
                            <FormDescription>
                              Plain text version (optional but recommended).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center justify-between">
                        <FormField
                          control={templateForm.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-is-active"
                                />
                              </FormControl>
                              <FormLabel>Active</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={templateForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-is-default"
                                />
                              </FormControl>
                              <FormLabel>Set as Default</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="submit" 
                          disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
                          data-testid="button-save-template"
                        >
                          {isCreatingTemplate ? 'Create Template' : 'Update Template'}
                        </Button>
                        
                        {selectedTemplate && !isCreatingTemplate && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                deleteTemplateMutation.mutate(selectedTemplate.id);
                              }
                            }}
                            disabled={deleteTemplateMutation.isPending}
                            data-testid="button-delete-template"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(null);
                            setIsCreatingTemplate(false);
                            templateForm.reset();
                          }}
                          data-testid="button-cancel-edit"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a template from the list to edit, or create a new template.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Analytics</CardTitle>
              <CardDescription>
                View email delivery statistics and event history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-6">Loading analytics...</div>
              ) : emailEvents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No email events recorded yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">Total Sent</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {emailEvents.filter((e: any) => e.status === 'sent').length}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">Delivered</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {emailEvents.filter((e: any) => e.status === 'delivered').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-900">Pending</h3>
                      <p className="text-2xl font-bold text-yellow-600">
                        {emailEvents.filter((e: any) => e.status === 'pending').length}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-medium text-red-900">Failed</h3>
                      <p className="text-2xl font-bold text-red-600">
                        {emailEvents.filter((e: any) => e.status === 'failed').length}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Recent Email Events</h3>
                    <div className="border rounded-lg">
                      {emailEvents.slice(0, 10).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                          <div>
                            <p className="font-medium">{event.recipientEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              {emailEventTypes.find(e => e.value === event.eventType)?.label}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              event.status === 'delivered' ? 'default' :
                              event.status === 'sent' ? 'secondary' :
                              event.status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {event.status}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(event.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}