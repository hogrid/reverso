import { useCreateForm, useDeleteForm, useDuplicateForm, useForms, usePublishForm, useUnpublishForm } from '@/api/hooks/useForms';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-[hsl(var(--brand))] text-white">
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-[hsl(var(--secondary))] text-foreground">
            Draft
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-12">
        <LoadingState message="Loading forms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12">
        <ErrorState
          title="Failed to load forms"
          message="Could not fetch the list of forms."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="px-12 py-8 space-y-6">
      {/* Title + Actions */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-5xl font-medium" style={{ letterSpacing: '-1px' }}>
            Forms
          </h2>
          <p className="text-[15px] text-[hsl(var(--subtle-foreground))]" style={{ letterSpacing: '0.2px' }}>
            Create and manage your forms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search forms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-[240px] pl-9 pr-3 text-[13px] bg-[hsl(var(--secondary))] border-0"
            />
          </div>
          <Button
            className="h-10 px-5 text-[13px] font-medium bg-foreground text-white hover:bg-foreground/90"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Form
          </Button>
        </div>
      </div>

      {/* Forms table */}
      {filteredForms && filteredForms.length > 0 ? (
        <div className="border border-[hsl(var(--border))] rounded-md overflow-hidden">
          {/* Table header */}
          <div className="flex items-center bg-[hsl(var(--subtle))] px-6 py-3 border-b border-[hsl(var(--border))]">
            <div className="flex-1 text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Form
            </div>
            <div className="w-[120px] text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Status
            </div>
            <div className="w-[120px] text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Submissions
            </div>
            <div className="w-[80px] text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-center">
              Actions
            </div>
          </div>

          {/* Table rows */}
          {filteredForms.map((form, i) => (
            <div
              key={form.id}
              className={`flex items-center px-6 py-3.5 hover:bg-[hsl(var(--subtle))] transition-colors ${
                i < filteredForms.length - 1 ? 'border-b border-[hsl(var(--border))]' : ''
              }`}
            >
              <Link to={`/forms/${form.id}`} className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{form.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">
                  /{form.slug}
                </p>
              </Link>
              <div className="w-[120px]">
                {getStatusBadge(form.status)}
              </div>
              <div className="w-[120px]">
                <Link
                  to={`/forms/${form.id}/submissions`}
                  className="text-[13px] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Inbox className="h-3.5 w-3.5" />
                  View
                </Link>
              </div>
              <div className="w-[80px] flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[hsl(var(--accent))] transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                    </button>
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
                      className="text-[hsl(var(--destructive))]"
                      onClick={() => handleDelete(form.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : forms && forms.length > 0 ? (
        <div className="border border-[hsl(var(--border))] rounded-md py-12">
          <EmptyState
            icon={Search}
            title="No forms found"
            description={`No forms match "${search}". Try a different search term.`}
            action={{
              label: 'Clear search',
              onClick: () => setSearch(''),
            }}
          />
        </div>
      ) : (
        <div className="border border-[hsl(var(--border))] rounded-md py-12">
          <EmptyState
            icon={FileText}
            title="No forms yet"
            description="Create your first form to start collecting submissions."
            action={{
              label: 'Create Form',
              onClick: () => setIsCreateDialogOpen(true),
            }}
          />
        </div>
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
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
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
