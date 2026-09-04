import { useUploadMedia } from '@/api/hooks/useMedia';
import { LoadingState } from '@/components/common/LoadingState';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { type RefObject, useCallback, useRef, useState } from 'react';

export interface MediaUploaderProps {
  accept?: string;
  multiple?: boolean;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
  /** Lets a parent (e.g. a toolbar "Upload" button) open the file picker. */
  inputRef?: RefObject<HTMLInputElement | null>;
  compact?: boolean;
  disabled?: boolean;
}

export function MediaUploader({
  accept,
  multiple = true,
  onUploadComplete,
  onUploadError,
  inputRef,
  compact = false,
  disabled = false,
}: MediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadMedia = useUploadMedia();

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      try {
        await uploadMedia.mutateAsync(Array.from(files));
        onUploadComplete?.();
      } catch (error) {
        onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      }
    },
    [uploadMedia, onUploadComplete, onUploadError, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const localInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = inputRef ?? localInputRef;

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={cn(
        'border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
        compact ? 'p-4' : 'p-8',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        uploadMedia.isPending && 'pointer-events-none',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Real file input (visually hidden) so the picker is accessible and testable. */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        className="sr-only"
        aria-label="Upload files"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = '';
        }}
      />
      {uploadMedia.isPending ? (
        <LoadingState size="sm" message="Uploading files..." />
      ) : (
        <>
          <Upload
            className={cn(
              'mx-auto text-muted-foreground',
              compact ? 'h-6 w-6 mb-1' : 'h-8 w-8 mb-2'
            )}
          />
          <p className={cn('text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            {compact ? 'Drop files or click to upload' : 'Drag and drop files here, or click to browse'}
          </p>
          {accept && !compact && (
            <p className="text-xs text-muted-foreground mt-1">Accepted: {accept}</p>
          )}
        </>
      )}
    </div>
  );
}
