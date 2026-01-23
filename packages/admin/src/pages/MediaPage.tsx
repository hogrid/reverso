import {
  type MediaItem,
  useBulkDeleteMedia,
  useDeleteMedia,
  useMedia,
  useUploadMedia,
} from '@/api/hooks/useMedia';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatFileSize, isImageFile } from '@/lib/utils';
import {
  Download,
  FileText,
  Film,
  Filter,
  Grid,
  Image as ImageIcon,
  List,
  MoreVertical,
  Music,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useState } from 'react';

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

  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const bulkDeleteMedia = useBulkDeleteMedia();

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      await uploadMedia.mutateAsync(Array.from(files));
    },
    [uploadMedia]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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
          <Button asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>
          </Button>
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

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          uploadMedia.isPending
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        {uploadMedia.isPending ? (
          <LoadingState size="sm" message="Uploading files..." />
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click the upload button
            </p>
          </>
        )}
      </div>

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

interface MediaItemProps {
  item: MediaItem;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function MediaGridItem({ item, selected, onSelect, onDelete }: MediaItemProps) {
  const isImage = isImageFile(item.filename);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all',
        selected && 'ring-2 ring-primary'
      )}
    >
      <div className="aspect-square relative">
        {isImage ? (
          <img
            src={item.url}
            alt={item.alt || item.filename}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Selection checkbox */}
        <div className="absolute top-2 left-2">
          <Checkbox checked={selected} onCheckedChange={onSelect} className="bg-background" />
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={item.url} download={item.filename}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-2">
        <p className="text-xs font-medium truncate">{item.filename}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
      </CardContent>
    </Card>
  );
}

function MediaListItem({ item, selected, onSelect, onDelete }: MediaItemProps) {
  const isImage = isImageFile(item.filename);

  return (
    <Card className={cn('transition-all', selected && 'ring-2 ring-primary')}>
      <CardContent className="flex items-center gap-4 p-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} />

        <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0">
          {isImage ? (
            <img
              src={item.url}
              alt={item.alt || item.filename}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.filename}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(item.size)} &middot; {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Badge variant="secondary">{item.mimeType.split('/')[0]}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={item.url} download={item.filename}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
