import {
  useBulkImportRedirects,
  useCreateRedirect,
  useDeleteRedirect,
  useDisableRedirect,
  useEnableRedirect,
  useRedirects,
  useUpdateRedirect,
  type Redirect,
} from '@/api/hooks/useRedirects';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { endpoints } from '@/api/endpoints';

export function RedirectsPage() {
  const { data: redirectsResponse, isLoading, error, refetch } = useRedirects();
  const createRedirect = useCreateRedirect();
  const updateRedirect = useUpdateRedirect();
  const deleteRedirect = useDeleteRedirect();
  const enableRedirect = useEnableRedirect();
  const disableRedirect = useDisableRedirect();
  const bulkImport = useBulkImportRedirects();

  const [search, setSearch] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const [newRedirectData, setNewRedirectData] = useState({
    fromPath: '',
    toPath: '',
    statusCode: 301 as 301 | 302 | 307 | 308,
  });
  const [importText, setImportText] = useState('');

  const redirects = redirectsResponse?.data || [];
  const stats = (redirectsResponse as any)?.meta || { total: 0, enabled: 0, disabled: 0, totalHits: 0 };

  const filteredRedirects = redirects.filter(
    (r) =>
      r.fromPath.toLowerCase().includes(search.toLowerCase()) ||
      r.toPath.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    try {
      await createRedirect.mutateAsync(newRedirectData);
      setIsCreateDialogOpen(false);
      setNewRedirectData({ fromPath: '', toPath: '', statusCode: 301 });
    } catch (err) {
      console.error('Failed to create redirect:', err);
    }
  };

  const handleUpdate = async () => {
    if (!editingRedirect) return;
    try {
      await updateRedirect.mutateAsync({
        id: editingRedirect.id,
        data: newRedirectData,
      });
      setEditingRedirect(null);
    } catch (err) {
      console.error('Failed to update redirect:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this redirect?')) {
      try {
        await deleteRedirect.mutateAsync(id);
      } catch (err) {
        console.error('Failed to delete redirect:', err);
      }
    }
  };

  const handleToggleEnable = async (id: string, isEnabled: boolean) => {
    try {
      if (isEnabled) {
        await disableRedirect.mutateAsync(id);
      } else {
        await enableRedirect.mutateAsync(id);
      }
    } catch (err) {
      console.error('Failed to toggle redirect:', err);
    }
  };

  const handleImport = async () => {
    const lines = importText.trim().split('\n').filter(Boolean);
    const redirects: Array<{ fromPath: string; toPath: string; statusCode?: number }> = [];

    for (const line of lines) {
      const parts = line.split(',').map((s) => s.trim());
      const fromPath = parts[0];
      const toPath = parts[1];
      const statusCode = parts[2];
      if (fromPath && toPath) {
        redirects.push({
          fromPath,
          toPath,
          statusCode: statusCode ? Number(statusCode) : undefined,
        });
      }
    }

    try {
      const result = await bulkImport.mutateAsync(redirects);
      alert(`Imported ${result.created} redirects. Skipped ${result.skipped} duplicates.`);
      setIsImportDialogOpen(false);
      setImportText('');
    } catch (err) {
      console.error('Failed to import redirects:', err);
    }
  };

  const handleExport = () => {
    window.open(endpoints.redirects.export(), '_blank');
  };

  const openEditDialog = (redirect: Redirect) => {
    setEditingRedirect(redirect);
    setNewRedirectData({
      fromPath: redirect.fromPath,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading redirects..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load redirects"
          message="Could not fetch the list of redirects."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Redirects</h1>
          <p className="text-muted-foreground">Manage URL redirects for SEO</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Redirect
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redirects</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Enabled
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">{stats.enabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <X className="h-4 w-4 text-muted-foreground" />
              Disabled
            </CardDescription>
            <CardTitle className="text-3xl">{stats.disabled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Hits</CardDescription>
            <CardTitle className="text-3xl">{stats.totalHits}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search redirects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Redirects Table */}
      {filteredRedirects.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="w-[50px]" />
                <TableHead>To</TableHead>
                <TableHead className="w-[80px]">Code</TableHead>
                <TableHead className="w-[100px]">Hits</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRedirects.map((redirect) => (
                <TableRow key={redirect.id}>
                  <TableCell>
                    <Badge
                      variant={redirect.isEnabled ? 'default' : 'secondary'}
                      className={cn(
                        redirect.isEnabled ? 'bg-green-500' : ''
                      )}
                    >
                      {redirect.isEnabled ? 'On' : 'Off'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{redirect.fromPath}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{redirect.toPath}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{redirect.statusCode}</Badge>
                  </TableCell>
                  <TableCell>{redirect.hitCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(redirect)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleEnable(redirect.id, redirect.isEnabled)}
                        >
                          {redirect.isEnabled ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Enable
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(redirect.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : redirects.length > 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={Search}
              title="No redirects found"
              description={`No redirects match "${search}". Try a different search term.`}
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
              icon={ExternalLink}
              title="No redirects yet"
              description="Create redirects to manage URL changes for SEO."
              action={{
                label: 'Create Redirect',
                onClick: () => setIsCreateDialogOpen(true),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || !!editingRedirect}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingRedirect(null);
            setNewRedirectData({ fromPath: '', toPath: '', statusCode: 301 });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRedirect ? 'Edit Redirect' : 'Create Redirect'}</DialogTitle>
            <DialogDescription>
              {editingRedirect
                ? 'Update the redirect settings below.'
                : 'Create a new URL redirect.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>From Path</Label>
              <Input
                placeholder="/old-page"
                value={newRedirectData.fromPath}
                onChange={(e) =>
                  setNewRedirectData({ ...newRedirectData, fromPath: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                The old URL path that should redirect (must start with /)
              </p>
            </div>
            <div className="space-y-2">
              <Label>To Path</Label>
              <Input
                placeholder="/new-page or https://example.com/page"
                value={newRedirectData.toPath}
                onChange={(e) =>
                  setNewRedirectData({ ...newRedirectData, toPath: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                The destination URL (relative path or full URL)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status Code</Label>
              <Select
                value={String(newRedirectData.statusCode)}
                onValueChange={(value) =>
                  setNewRedirectData({
                    ...newRedirectData,
                    statusCode: Number(value) as 301 | 302 | 307 | 308,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 - Permanent Redirect</SelectItem>
                  <SelectItem value="302">302 - Temporary Redirect</SelectItem>
                  <SelectItem value="307">307 - Temporary Redirect (Preserve Method)</SelectItem>
                  <SelectItem value="308">308 - Permanent Redirect (Preserve Method)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingRedirect(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingRedirect ? handleUpdate : handleCreate}
              disabled={
                !newRedirectData.fromPath ||
                !newRedirectData.toPath ||
                createRedirect.isPending ||
                updateRedirect.isPending
              }
            >
              {editingRedirect
                ? updateRedirect.isPending
                  ? 'Saving...'
                  : 'Save Changes'
                : createRedirect.isPending
                  ? 'Creating...'
                  : 'Create Redirect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Redirects</DialogTitle>
            <DialogDescription>
              Import multiple redirects at once. One redirect per line in CSV format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Redirects (CSV Format)</Label>
              <Textarea
                placeholder="/old-page,/new-page,301
/another-old,/another-new,302"
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: fromPath,toPath,statusCode (status code is optional, defaults to 301)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importText.trim() || bulkImport.isPending}
            >
              {bulkImport.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
