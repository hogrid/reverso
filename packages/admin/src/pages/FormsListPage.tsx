import { useCreateForm, useDeleteForm, useDuplicateForm, useForms, usePublishForm, useUnpublishForm } from '@/api/hooks/useForms';
import { EmptyState } from '@/components/common/EmptyState';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Copy,
  Eye,
  EyeOff,
  FileText,
  Inbox,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function FormsListPage() {
  const navigate = useNavigate();
  const { data: forms, isLoading, error, refetch } = useForms();
  const createForm = useCreateForm();
  const deleteForm = useDeleteForm();
  const duplicateForm = useDuplicateForm();
  const publishForm = usePublishForm();
  const unpublishForm = useUnpublishForm();

  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateFormId, setDuplicateFormId] = useState<string | null>(null);
  const [newFormData, setNewFormData] = useState({ name: '', slug: '', description: '' });
  const [duplicateSlug, setDuplicateSlug] = useState('');

  const filteredForms = forms?.filter(
    (form) =>
      form.name.toLowerCase().includes(search.toLowerCase()) ||
      form.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      const form = await createForm.mutateAsync(newFormData);
      setIsCreateDialogOpen(false);
      setNewFormData({ name: '', slug: '', description: '' });
      navigate(`/forms/${form.id}`);
    } catch (err) {
      console.error('Failed to create form:', err);
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateFormId) return;
    try {
      const form = await duplicateForm.mutateAsync({ id: duplicateFormId, slug: duplicateSlug });
      setIsDuplicateDialogOpen(false);
      setDuplicateFormId(null);
      setDuplicateSlug('');
      navigate(`/forms/${form.id}`);
    } catch (err) {
      console.error('Failed to duplicate form:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        await deleteForm.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete form:', err);
      }
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await unpublishForm.mutateAsync(id);
      } else {
        await publishForm.mutateAsync(id);
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading forms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load forms"
          message="Could not fetch the list of forms."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground">Create and manage form submissions</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Form
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
        <Input
          type="search"
          placeholder="Search forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-8 text-[13px]"
        />
      </div>

      {/* Forms grid */}
      {filteredForms && filteredForms.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card
              key={form.id}
              className="hover:shadow-lifted hover:border-border transition-all duration-150 h-full"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Link to={`/forms/${form.id}`} className="flex items-center gap-3 flex-1">
                    <div className="rounded-md bg-accent p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                      <CardDescription className="font-mono text-xs truncate">
                        /{form.slug}
                      </CardDescription>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(form.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/forms/${form.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/forms/${form.id}/submissions`}>View Submissions</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(form.id, form.status === 'published')}
                        >
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
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDuplicateFormId(form.id);
                            setDuplicateSlug(`${form.slug}-copy`);
                            setIsDuplicateDialogOpen(true);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(form.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {form.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {form.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link
                    to={`/forms/${form.id}/submissions`}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Inbox className="h-4 w-4" />
                    <span>Submissions</span>
                  </Link>
                  {form.isMultiStep && <Badge variant="outline">Multi-step</Badge>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {new Date(form.updatedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms && forms.length > 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Search}
              title="No forms found"
              description={`No forms match "${search}". Try a different search term.`}
              action={{
                label: 'Clear search',
                onClick: () => setSearch(''),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={FileText}
              title="No forms yet"
              description="Create your first form to start collecting submissions."
              action={{
                label: 'Create Form',
                onClick: () => setIsCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Create a new form to collect submissions from your users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Contact Form"
                value={newFormData.name}
                onChange={(e) =>
                  setNewFormData({
                    ...newFormData,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="contact-form"
                value={newFormData.slug}
                onChange={(e) => setNewFormData({ ...newFormData, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Used in the form URL: /forms/{newFormData.slug || 'your-slug'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="A short description of your form..."
                value={newFormData.description}
                onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newFormData.name || !newFormData.slug || createForm.isPending}
            >
              {createForm.isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Form Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Form</DialogTitle>
            <DialogDescription>
              Enter a new slug for the duplicated form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duplicateSlug">New Slug</Label>
              <Input
                id="duplicateSlug"
                placeholder="form-slug-copy"
                value={duplicateSlug}
                onChange={(e) => setDuplicateSlug(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicate}
              disabled={!duplicateSlug || duplicateForm.isPending}
            >
              {duplicateForm.isPending ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
