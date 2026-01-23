import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn, formatFileSize } from '@/lib/utils';
import { File, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

interface FileValue {
  id?: string;
  url: string;
  filename: string;
  size?: number;
  mimeType?: string;
}

export function FileField({ field, value, onChange, disabled }: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentFile = value as FileValue | null | undefined;
  const accept = field.accept || '*/*';

  // Cleanup intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      const file = files[0];
      if (!file) return;

      // Clear any existing timers
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // In a real implementation, this would upload to the server
      // For now, we'll create an object URL for preview
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      intervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Simulate upload completion
      timeoutRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setUploadProgress(100);

        const fileValue: FileValue = {
          url: URL.createObjectURL(file),
          filename: file.name,
          size: file.size,
          mimeType: file.type,
        };

        onChange(fileValue);
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    },
    [onChange, disabled]
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
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {uploading ? (
        <div className="space-y-4">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
          <Progress value={uploadProgress} className="w-[60%] mx-auto" />
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
  );
}
