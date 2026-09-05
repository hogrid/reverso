import type { MediaItem } from '@/api/hooks/useMedia';
import { MediaLibraryModal } from '@/components/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FolderOpen, GripVertical, Image as ImageIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useFileDropZone } from './useFileDropZone';
import type { FieldRendererProps } from './FieldRenderer';

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  filename?: string;
}

function SortableImage({
  image,
  onRemove,
  disabled,
}: {
  image: GalleryImage;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border bg-muted group',
        isDragging && 'opacity-50'
      )}
    >
      <img src={image.url} alt={image.alt || ''} className="object-cover w-full h-full" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 cursor-grab"
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function GalleryField({ field, value, onChange, disabled }: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const images: GalleryImage[] = Array.isArray(value) ? (value as GalleryImage[]) : [];
  const accept = field.accept || 'image/*';
  const maxItems = field.max || 20;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const remainingSlots = Math.max(0, maxItems - images.length);

  const mediaToImages = useCallback(
    (media: MediaItem[]): GalleryImage[] =>
      media.map((m) => ({ id: m.id, url: m.url, alt: m.alt ?? '', filename: m.originalName || m.filename })),
    []
  );

  const handleUploaded = useCallback(
    (media: MediaItem[]) => {
      onChange([...images, ...mediaToImages(media)]);
    },
    [onChange, images, mediaToImages]
  );

  const { isDragOver, isUploading, selectFiles, dropHandlers } = useFileDropZone({
    onUploaded: handleUploaded,
    disabled,
    maxFiles: remainingSlots,
  });

  const handleFileSelect = (files: FileList | null) => {
    void selectFiles(files);
  };

  const handleLibrarySelect = (items: MediaItem[]) => {
    onChange([...images, ...mediaToImages(items.slice(0, remainingSlots))]);
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const handleClick = () => {
    if (!disabled && images.length < maxItems) {
      inputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Gallery grid */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onRemove={() => handleRemove(image.id)}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Upload area */}
      {images.length < maxItems && (
        <div
          onDrop={dropHandlers.onDrop}
          onDragOver={dropHandlers.onDragOver}
          onDragLeave={dropHandlers.onDragLeave}
          onClick={handleClick}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-6 w-6 mx-auto text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading images...</p>
            </div>
          ) : (
            <>
              <Plus className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Add images ({images.length}/{maxItems})
              </p>
              <p className="text-xs text-muted-foreground">Drag and drop or click to browse</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Add from library button */}
      {images.length < maxItems && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLibraryOpen(true)}
            disabled={disabled}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Add from Library
          </Button>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isUploading && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No images in gallery</p>
          </CardContent>
        </Card>
      )}

      {/* Media library modal */}
      <MediaLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        multiple
        maxSelect={maxItems - images.length}
        mimeTypeFilter="image/*"
        title="Select Images"
        description="Choose images from your media library or upload new ones."
      />
    </div>
  );
}
