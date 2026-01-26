import { useUploadMedia } from '@/api/hooks/useMedia';
import { LoadingState } from '@/components/common/LoadingState';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';

export interface MediaUploaderProps {
  accept?: string;
  multiple?: boolean;
  onUploadComplete?: () => void;
  onUploadError?: (error: Error) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function MediaUploader({
  accept,
  multiple = true,
  onUploadComplete,
  onUploadError,
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

  const handleClick = () => {
    if (disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
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
