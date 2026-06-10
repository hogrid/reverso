import { type MediaItem, mediaToFileValue } from '@/api/hooks/useMedia';
import { MediaLibraryModal } from '@/components/media';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatFileSize } from '@/lib/utils';
import { File, FolderOpen, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';
import { useFileDropZone } from './useFileDropZone';

interface FileValue {
  id?: string;
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
}

export function FileField({ field, value, onChange, disabled }: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const currentFile = value as FileValue | null | undefined;
  const accept = field.accept || '*/*';

  const handleUploaded = useCallback(
    (items: MediaItem[]) => {
      if (items[0]) onChange(mediaToFileValue(items[0]));
    },
    [onChange]
  );

  const { isDragOver, isUploading, selectFiles, dropHandlers } = useFileDropZone({
    onUploaded: handleUploaded,
    disabled,
    maxFiles: 1,
  });

  const handleFileSelect = (files: FileList | null) => {
    void selectFiles(files);
  };

  const handleLibrarySelect = (items: MediaItem[]) => {
    if (items.length > 0 && items[0]) {
      onChange(mediaToFileValue(items[0]));
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  if (currentFile) {
    return (
      <>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex items-center justify-center h-12 w-12 rounded bg-muted">
              <File className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentFile.filename}</p>
              <p className="text-sm text-muted-foreground">
                {currentFile.size ? formatFileSize(currentFile.size) : 'File'}
                {currentFile.mimeType && ` • ${currentFile.mimeType.split('/')[1]}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLibraryOpen(true)}
                disabled={disabled}
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Browse
              </Button>
              <Button variant="outline" size="sm" onClick={handleClick} disabled={disabled}>
                Replace
              </Button>
              <Button variant="ghost" size="icon" onClick={handleRemove} disabled={disabled}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </Card>

        <MediaLibraryModal
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          onSelect={handleLibrarySelect}
          mimeTypeFilter={accept !== '*/*' ? accept : undefined}
          title="Select File"
          description="Choose a file from your media library or upload a new one."
        />
      </>
    );
  }

  return (
    <>
      <div
        onDrop={dropHandlers.onDrop}
        onDragOver={dropHandlers.onDragOver}
        onDragLeave={dropHandlers.onDragLeave}
        onClick={handleClick}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Drag and drop a file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {field.accept ? `Accepted: ${field.accept}` : 'All file types accepted'}
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Browse from library button */}
      <div className="mt-2 flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLibraryOpen(true)}
          disabled={disabled}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Browse Library
        </Button>
      </div>

      <MediaLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={handleLibrarySelect}
        mimeTypeFilter={accept !== '*/*' ? accept : undefined}
        title="Select File"
        description="Choose a file from your media library or upload a new one."
      />
    </>
  );
}
