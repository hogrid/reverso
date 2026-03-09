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
  Grid,
  Image as ImageIcon,
  List,
  Music,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';

type ViewMode = 'grid' | 'list';
type MediaType = 'all' | 'image' | 'video' | 'audio' | 'document';

const mediaTypeFilters: { value: MediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: 'all', label: 'All Types', icon: FileText },
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
      <div className="p-12">
        <LoadingState message="Loading media library..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12">
        <ErrorState
          title="Failed to load media"
          message="Could not fetch the media library."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="px-12 py-8 space-y-6 max-w-[1320px]">
      {/* Title + Actions */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-5xl font-medium" style={{ letterSpacing: '-1px' }}>
            Media Library
          </h2>
          <p className="text-[15px] text-[hsl(var(--subtle-foreground))]" style={{ letterSpacing: '0.2px' }}>
            Upload and manage your media files
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
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-[200px] pl-9 pr-3 text-[13px] bg-[hsl(var(--secondary))] border-0"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-5 text-[13px] font-medium border-[hsl(var(--border))]"
              >
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

          {/* View toggle */}
          <div className="flex">
            <button
              type="button"
              className={`h-9 w-9 flex items-center justify-center ${viewMode === 'grid' ? 'bg-foreground text-white' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`h-9 w-9 flex items-center justify-center ${viewMode === 'list' ? 'bg-foreground text-white' : 'border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button className="h-10 px-5 text-[13px] font-medium bg-foreground text-white hover:bg-foreground/90" onClick={() => {}}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Selected items bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-3 py-2">
          <span className="text-[13px] text-[hsl(var(--muted-foreground))]">{selectedItems.size} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      )}

      {/* Upload area */}
      <MediaUploader onUploadComplete={() => refetch()} />

      {/* Media grid/list */}
      {media?.items && media.items.length > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={media.items.length > 0 && selectedItems.size === media.items.length}
              onCheckedChange={selectAll}
            />
            <span className="text-[13px] text-[hsl(var(--muted-foreground))]">Select all</span>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
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
            <div className="space-y-1">
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
        <div className="border border-[hsl(var(--border))] rounded-md py-12">
          <EmptyState
            icon={ImageIcon}
            title="No media files"
            description="Upload some files to get started with your media library."
          />
        </div>
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
