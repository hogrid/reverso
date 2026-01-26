import {
  useBulkDeleteMedia,
  useDeleteMedia,
  useMedia,
} from '@/api/hooks/useMedia';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { MediaGridItem, MediaListItem, MediaUploader } from '@/components/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Film,
  Filter,
  Grid,
  Image as ImageIcon,
  List,
  Music,
  Search,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

type ViewMode = 'grid' | 'list';
type MediaType = 'all' | 'image' | 'video' | 'audio' | 'document';

const mediaTypeFilters: { value: MediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'all', label: 'All Files', icon: FileText },
  { value: 'image', label: 'Images', icon: ImageIcon },
  { value: 'video', label: 'Videos', icon: Film },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'document', label: 'Documents', icon: FileText },
];

export function MediaPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const mimeTypeFilter =
    mediaType === 'all'
      ? undefined
      : mediaType === 'image'
        ? 'image/*'
        : mediaType === 'video'
          ? 'video/*'
          : mediaType === 'audio'
            ? 'audio/*'
            : 'application/*';

  const {
    data: media,
    isLoading,
    error,
    refetch,
  } = useMedia({
    search: search || undefined,
    mimeType: mimeTypeFilter,
    pageSize: 50,
  });

  const deleteMedia = useDeleteMedia();
  const bulkDeleteMedia = useBulkDeleteMedia();

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    if (!media?.items) return;
    if (selectedItems.size === media.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(media.items.map((item) => item.id)));
    }
  };

  const handleDelete = async () => {
    const ids = Array.from(selectedItems);
    if (ids.length === 1 && ids[0]) {
      await deleteMedia.mutateAsync(ids[0]);
    } else if (ids.length > 1) {
      await bulkDeleteMedia.mutateAsync(ids);
    }
    setSelectedItems(new Set());
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading media library..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load media"
          message="Could not fetch the media library."
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
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">{media?.total ?? 0} files in your library</p>
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">{selectedItems.size} selected</span>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {mediaTypeFilters.find((f) => f.value === mediaType)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {mediaTypeFilters.map((filter) => (
                <DropdownMenuItem key={filter.value} onClick={() => setMediaType(filter.value)}>
                  <filter.icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload area */}
      <MediaUploader onUploadComplete={() => refetch()} />

      {/* Media grid/list */}
      {media?.items && media.items.length > 0 ? (
        <>
          {/* Select all */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={media.items.length > 0 && selectedItems.size === media.items.length}
              onCheckedChange={selectAll}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {media.items.map((item) => (
                <MediaGridItem
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                  onDelete={() => {
                    setSelectedItems(new Set([item.id]));
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {media.items.map((item) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onSelect={() => toggleSelection(item.id)}
                  onDelete={() => {
                    setSelectedItems(new Set([item.id]));
                    setDeleteDialogOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={ImageIcon}
              title="No media files"
              description="Upload some files to get started with your media library."
            />
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItems.size} file
              {selectedItems.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMedia.isPending || bulkDeleteMedia.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
