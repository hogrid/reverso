import {
  useAddFormField,
  useDeleteFormField,
  useForm,
  usePublishForm,
  useReorderFormFields,
  useUnpublishForm,
  useUpdateForm,
  useUpdateFormField,
  type CreateFormFieldInput,
  type FormField,
} from '@/api/hooks/useForms';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Eye,
  EyeOff,
  File,
  Hash,
  Inbox,
  List,
  Mail,
  Plus,
  Settings,
  Text,
  Trash2,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'textarea', label: 'Textarea', icon: Text },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'select', label: 'Select', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio', icon: CircleDot },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'file', label: 'File Upload', icon: File },
];

export function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: form, isLoading, error, refetch } = useForm(id || '');
  const updateForm = useUpdateForm(id || '');
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();
  const addField = useAddFormField(id || '');
  const updateField = useUpdateFormField(id || '');
  const deleteField = useDeleteFormField(id || '');
  const reorderFields = useReorderFormFields(id || '');

  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [newFieldData, setNewFieldData] = useState<CreateFormFieldInput>({
    name: '',
    type: 'text',
    label: '',
    placeholder: '',
    help: '',
    required: false,
    width: 12,
  });
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [formSettings, setFormSettings] = useState({
    name: '',
    slug: '',
    description: '',
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
    redirectUrl: '',
    honeypotEnabled: true,
    rateLimitPerMinute: 10,
    notifyEmails: '',
    webhookUrl: '',
    webhookEnabled: false,
  });

  // Initialize form settings when form data loads
  useState(() => {
    if (form) {
      setFormSettings({
        name: form.name,
        slug: form.slug,
        description: form.description || '',
        submitButtonText: form.settings?.submitButtonText || 'Submit',
        successMessage: form.settings?.successMessage || 'Thank you for your submission!',
        redirectUrl: form.settings?.redirectUrl || '',
        honeypotEnabled: form.honeypotEnabled ?? true,
        rateLimitPerMinute: form.rateLimitPerMinute ?? 10,
        notifyEmails: form.notifyEmails?.join(', ') || '',
        webhookUrl: form.webhookUrl || '',
        webhookEnabled: form.webhookEnabled ?? false,
      });
    }
  });

  const handleAddField = async () => {
    try {
      await addField.mutateAsync(newFieldData);
      setIsFieldDialogOpen(false);
      setNewFieldData({
        name: '',
        type: 'text',
        label: '',
        placeholder: '',
        help: '',
        required: false,
        width: 12,
      });
    } catch (err) {
      console.error('Failed to add field:', err);
    }
  };

  const handleUpdateField = async () => {
    if (!editingField) return;
    try {
      await updateField.mutateAsync({
        fieldId: editingField.id,
        data: newFieldData,
      });
      setIsFieldDialogOpen(false);
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update field:', err);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (confirm('Are you sure you want to delete this field?')) {
      try {
        await deleteField.mutateAsync(fieldId);
      } catch (err) {
        console.error('Failed to delete field:', err);
      }
    }
  };

  const handleMoveField = async (fieldId: string, direction: 'up' | 'down') => {
    if (!form) return;
    const currentIndex = form.fields.findIndex((f) => f.id === fieldId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= form.fields.length) return;

    const newOrder = [...form.fields.map((f) => f.id)];
    const temp = newOrder[currentIndex]!;
    newOrder[currentIndex] = newOrder[newIndex]!;
    newOrder[newIndex] = temp;

    try {
      await reorderFields.mutateAsync(newOrder);
    } catch (err) {
      console.error('Failed to reorder fields:', err);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateForm.mutateAsync({
        name: formSettings.name,
        slug: formSettings.slug,
        description: formSettings.description,
        settings: {
          submitButtonText: formSettings.submitButtonText,
          successMessage: formSettings.successMessage,
          redirectUrl: formSettings.redirectUrl || undefined,
        },
        honeypotEnabled: formSettings.honeypotEnabled,
        rateLimitPerMinute: formSettings.rateLimitPerMinute,
        notifyEmails: formSettings.notifyEmails
          ? formSettings.notifyEmails.split(',').map((e) => e.trim())
          : [],
        webhookUrl: formSettings.webhookUrl || undefined,
        webhookEnabled: formSettings.webhookEnabled,
      });
      setIsSettingsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleTogglePublish = async () => {
    if (!form) return;
    try {
      if (form.status === 'published') {
        await unpublishForm.mutateAsync(form.id);
      } else {
        await publishForm.mutateAsync(form.id);
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const openEditField = (field: FormField) => {
    setEditingField(field);
    setNewFieldData({
      name: field.name,
      type: field.type,
      label: field.label || '',
      placeholder: field.placeholder || '',
      help: field.help || '',
      required: field.required || false,
      width: field.width || 12,
      config: field.config,
    });
    setIsFieldDialogOpen(true);
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find((f) => f.value === type);
    return fieldType?.icon || Type;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading form..." />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load form"
          message="Could not fetch the form details."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/forms">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{form.name}</h1>
              <Badge
                variant={form.status === 'published' ? 'success' : 'secondary'}
              >
                {form.status}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-xs">/{form.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSettingsDialogOpen(true)}>
            <Settings className="mr-1.5 h-3.5 w-3.5" />
            Settings
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/forms/${form.id}/submissions`}>
              <Inbox className="mr-1.5 h-3.5 w-3.5" />
              Submissions ({form.submissionStats?.total || 0})
            </Link>
          </Button>
          <Button size="sm" onClick={handleTogglePublish}>
            {form.status === 'published' ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Form Builder */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fields List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Form Fields</CardTitle>
                  <CardDescription>
                    Add and arrange fields for your form
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingField(null);
                    setNewFieldData({
                      name: '',
                      type: 'text',
                      label: '',
                      placeholder: '',
                      help: '',
                      required: false,
                      width: 12,
                    });
                    setIsFieldDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.fields && form.fields.length > 0 ? (
                <div className="space-y-2">
                  {form.fields.map((field, index) => {
                    const FieldIcon = getFieldIcon(field.type);
                    return (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === 0}
                            onClick={() => handleMoveField(field.id, 'up')}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={index === form.fields.length - 1}
                            onClick={() => handleMoveField(field.id, 'down')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="rounded-md bg-accent p-2">
                          <FieldIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {field.label || field.name}
                            </span>
                            {field.required && (
                              <span className="text-destructive">*</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-mono">{field.name}</span>
                            <span>•</span>
                            <span>{field.type}</span>
                            {field.width && field.width < 12 && (
                              <>
                                <span>•</span>
                                <span>{field.width}/12</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditField(field)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No fields yet. Add your first field to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{form.submissionStats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {form.submissionStats?.new || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">New</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Honeypot Protection</Label>
                <Badge variant={form.honeypotEnabled ? 'default' : 'secondary'}>
                  {form.honeypotEnabled ? 'On' : 'Off'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label>Rate Limit</Label>
                <span className="text-sm">{form.rateLimitPerMinute}/min</span>
              </div>
              {form.webhookEnabled && (
                <div className="flex items-center justify-between">
                  <Label>Webhook</Label>
                  <Badge variant="default">Enabled</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Types Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Field Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {FIELD_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.value}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setEditingField(null);
                        setNewFieldData({
                          ...newFieldData,
                          type: type.value,
                          name: '',
                          label: '',
                        });
                        setIsFieldDialogOpen(true);
                      }}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{type.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Field'}</DialogTitle>
            <DialogDescription>
              Configure the field properties below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newFieldData.type}
                  onValueChange={(value) => setNewFieldData({ ...newFieldData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Width</Label>
                <Select
                  value={String(newFieldData.width || 12)}
                  onValueChange={(value) =>
                    setNewFieldData({ ...newFieldData, width: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">Full (12/12)</SelectItem>
                    <SelectItem value="6">Half (6/12)</SelectItem>
                    <SelectItem value="4">Third (4/12)</SelectItem>
                    <SelectItem value="3">Quarter (3/12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input
                placeholder="email"
                value={newFieldData.name}
                onChange={(e) =>
                  setNewFieldData({
                    ...newFieldData,
                    name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Used in the submission data (e.g., email, phone_number)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="Email Address"
                value={newFieldData.label}
                onChange={(e) => setNewFieldData({ ...newFieldData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                placeholder="Enter your email..."
                value={newFieldData.placeholder}
                onChange={(e) => setNewFieldData({ ...newFieldData, placeholder: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Help Text</Label>
              <Input
                placeholder="We'll never share your email."
                value={newFieldData.help}
                onChange={(e) => setNewFieldData({ ...newFieldData, help: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={newFieldData.required}
                onCheckedChange={(checked) =>
                  setNewFieldData({ ...newFieldData, required: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={editingField ? handleUpdateField : handleAddField}
              disabled={!newFieldData.name || !newFieldData.type || addField.isPending}
            >
              {editingField
                ? updateField.isPending
                  ? 'Saving...'
                  : 'Save Changes'
                : addField.isPending
                  ? 'Adding...'
                  : 'Add Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form Settings</DialogTitle>
            <DialogDescription>Configure your form settings and behavior.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Form Name</Label>
                <Input
                  value={formSettings.name}
                  onChange={(e) => setFormSettings({ ...formSettings, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formSettings.slug}
                  onChange={(e) => setFormSettings({ ...formSettings, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formSettings.description}
                  onChange={(e) => setFormSettings({ ...formSettings, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Submit Button Text</Label>
                <Input
                  value={formSettings.submitButtonText}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, submitButtonText: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Success Message</Label>
                <Textarea
                  value={formSettings.successMessage}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, successMessage: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Redirect URL (optional)</Label>
                <Input
                  placeholder="https://example.com/thank-you"
                  value={formSettings.redirectUrl}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, redirectUrl: e.target.value })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Notification Emails</Label>
                <Textarea
                  placeholder="email@example.com, another@example.com"
                  value={formSettings.notifyEmails}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, notifyEmails: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of email addresses to notify on submission.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://example.com/webhook"
                  value={formSettings.webhookUrl}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, webhookUrl: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Webhook</Label>
                <Switch
                  checked={formSettings.webhookEnabled}
                  onCheckedChange={(checked) =>
                    setFormSettings({ ...formSettings, webhookEnabled: checked })
                  }
                />
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Honeypot Protection</Label>
                  <p className="text-sm text-muted-foreground">
                    Helps prevent spam submissions from bots.
                  </p>
                </div>
                <Switch
                  checked={formSettings.honeypotEnabled}
                  onCheckedChange={(checked) =>
                    setFormSettings({ ...formSettings, honeypotEnabled: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rate Limit (per minute)</Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={formSettings.rateLimitPerMinute}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, rateLimitPerMinute: Number(e.target.value) })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Maximum submissions allowed per minute per IP address.
                </p>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={updateForm.isPending}>
              {updateForm.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
