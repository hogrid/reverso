import { type MediaItem, useMedia } from '@/api/hooks/useMedia';
import { EmptyState } from '@/components/common/EmptyState';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Filter, Grid, Image as ImageIcon, List, Search } from 'lucide-react';
import { useState } from 'react';
import { MediaGridSelector, type ViewMode } from './MediaGridSelector';
import { MediaUploader } from './MediaUploader';

type MediaType = 'all' | 'image' | 'video' | 'audio' | 'document';

const mediaTypeFilters: { value: MediaType; label: string }[] = [
  { value: 'all', label: 'All Files' },
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Documents' },
];

export interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  mimeTypeFilter?: string;
  maxSelect?: number;
  title?: string;
  description?: string;
}

export function MediaLibraryModal({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  mimeTypeFilter,
  maxSelect,
  title = 'Media Library',
  description = 'Select files from your media library or upload new ones.',
}: MediaLibraryModalProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Determine mime type for query
  const queryMimeType =
    mimeTypeFilter ||
    (mediaType === 'all'
      ? undefined
      : mediaType === 'image'
        ? 'image/*'
        : mediaType === 'video'
          ? 'video/*'
          : mediaType === 'audio'
            ? 'audio/*'
            : 'application/*');

  const { data: media, isLoading, refetch } = useMedia({
    search: search || undefined,
    mimeType: queryMimeType,
    pageSize: 50,
  });

  const handleSelect = () => {
    if (!media?.items) return;
    const selectedItems = media.items.filter((item) => selectedIds.has(item.id));
    onSelect(selectedItems);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch('');
    setActiveTab('browse');
    onOpenChange(false);
  };

  const handleUploadComplete = () => {
    refetch();
    setActiveTab('browse');
  };

  const handleSelectionChange = (ids: Set<string>) => {
    if (maxSelect && ids.size > maxSelect) {
      // Limit selection to maxSelect
      const arr = Array.from(ids);
      setSelectedIds(new Set(arr.slice(-maxSelect)));
    } else {
      setSelectedIds(ids);
    }
  };

  const effectiveMultiple = multiple && (!maxSelect || maxSelect > 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'browse' | 'upload')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search files..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-full sm:w-[200px]"
                  />
                </div>

                {!mimeTypeFilter && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        {mediaTypeFilters.find((f) => f.value === mediaType)?.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {mediaTypeFilters.map((filter) => (
                        <DropdownMenuItem
                          key={filter.value}
                          onClick={() => setMediaType(filter.value)}
                        >
                          {filter.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center gap-1">
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

            {/* Media grid */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {media?.items && media.items.length > 0 ? (
                <MediaGridSelector
                  items={media.items}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  multiple={effectiveMultiple}
                  viewMode={viewMode}
                  isLoading={isLoading}
                />
              ) : isLoading ? (
                <MediaGridSelector
                  items={[]}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                  isLoading
                />
              ) : (
                <EmptyState
                  icon={mimeTypeFilter?.startsWith('image') ? ImageIcon : FileText}
                  title="No files found"
                  description={
                    search
                      ? 'Try adjusting your search or filters.'
                      : 'Upload some files to get started.'
                  }
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 mt-4">
            <MediaUploader
              accept={mimeTypeFilter}
              multiple={effectiveMultiple}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0
                ? `${selectedIds.size} file${selectedIds.size !== 1 ? 's' : ''} selected`
                : 'No files selected'}
              {maxSelect && ` (max ${maxSelect})`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.size === 0}>
                Select{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
