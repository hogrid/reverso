import { type MediaItem, mediaToImageValue } from '@/api/hooks/useMedia';
import { MediaLibraryModal } from '@/components/media';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import type { ImageValue } from '@reverso/core';
import { Edit2, FolderOpen, Image, X } from 'lucide-react';
import { useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

export function ImageField({ field, value, onChange, disabled }: FieldRendererProps) {
  const imageValue = value as ImageValue | null;
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [tempAlt, setTempAlt] = useState(imageValue?.alt || '');

  const handleRemove = () => {
    onChange(null);
  };

  const handleSaveAlt = () => {
    if (imageValue) {
      onChange({ ...imageValue, alt: tempAlt });
    }
    setEditDialogOpen(false);
  };

  const handleUrlChange = (url: string) => {
    if (url) {
      onChange({
        url,
        alt: imageValue?.alt || '',
      } as ImageValue);
    } else {
      onChange(null);
    }
  };

  const handleLibrarySelect = (items: MediaItem[]) => {
    if (items.length > 0 && items[0]) {
      onChange(mediaToImageValue(items[0]));
    }
  };

  return (
    <div className="space-y-3">
      {/* Image preview */}
      {imageValue?.url ? (
        <div className="relative group">
          <div className="relative aspect-video rounded-lg border overflow-hidden bg-muted">
            <img
              src={imageValue.url}
              alt={imageValue.alt || ''}
              className="object-contain w-full h-full"
            />

            {/* Overlay actions */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTempAlt(imageValue.alt || '');
                    setEditDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleRemove}>
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Image info */}
          {imageValue.alt && (
            <p className="text-xs text-muted-foreground mt-1">Alt: {imageValue.alt}</p>
          )}
          {(imageValue.width || imageValue.height) && (
            <p className="text-xs text-muted-foreground">
              {imageValue.width} x {imageValue.height}
            </p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed transition-colors',
            disabled ? 'bg-muted cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'
          )}
        >
          <Image className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No image selected</p>
          {!disabled && (
            <p className="text-xs text-muted-foreground">Enter URL below or use media library</p>
          )}
        </div>
      )}

      {/* URL input */}
      <div className="flex gap-2">
        <Input
          id={field.path}
          type="url"
          value={imageValue?.url || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          disabled={disabled}
          className="flex-1"
        />
        <Button variant="outline" onClick={() => setLibraryOpen(true)} disabled={disabled}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>Update the alt text for this image.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {imageValue?.url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={imageValue.url} alt={tempAlt} className="object-contain w-full h-full" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={tempAlt}
                onChange={(e) => setTempAlt(e.target.value)}
                placeholder="Describe the image for accessibility"
              />
              <p className="text-xs text-muted-foreground">
                Alt text helps screen readers and improves SEO.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAlt}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media library modal */}
      <MediaLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        mimeTypeFilter="image/*"
        title="Select Image"
        description="Choose an image from your media library or upload a new one."
      />
    </div>
  );
}
