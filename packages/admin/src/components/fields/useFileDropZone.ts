import { type MediaItem, useUploadMedia } from '@/api/hooks/useMedia';
import { useCallback, useState } from 'react';

/**
 * Shared drag-and-drop + upload behaviour for media fields
 * (FileField, GalleryField, …). Centralises the drop/dragover/dragleave
 * handlers, the drag-over visual state, and the upload call so the field
 * components don't each re-implement (and drift on) the same logic.
 */
export interface UseFileDropZoneOptions {
  /** Called with the uploaded media items after a successful upload. */
  onUploaded: (items: MediaItem[]) => void;
  /** When true, drops and uploads are ignored. */
  disabled?: boolean;
  /** Upload at most this many files per drop/selection (undefined = no cap). */
  maxFiles?: number;
}

export interface UseFileDropZoneResult {
  isDragOver: boolean;
  isUploading: boolean;
  /** Upload an explicit FileList (e.g. from an <input type="file">). */
  selectFiles: (files: FileList | null) => Promise<void>;
  /** Props to spread on the drop target element. */
  dropHandlers: {
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
  };
}

export function useFileDropZone(options: UseFileDropZoneOptions): UseFileDropZoneResult {
  const { onUploaded, disabled, maxFiles } = options;
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadMedia = useUploadMedia();

  const selectFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || disabled) return;

      let list = Array.from(files);
      if (maxFiles !== undefined) {
        list = list.slice(0, maxFiles);
      }
      if (list.length === 0) return;

      try {
        const uploaded = await uploadMedia.mutateAsync(list);
        if (uploaded.length > 0) {
          onUploaded(uploaded);
        }
      } catch (error) {
        console.error('Failed to upload file(s):', error);
      }
    },
    [onUploaded, disabled, maxFiles, uploadMedia]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      void selectFiles(e.dataTransfer.files);
    },
    [selectFiles]
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  return {
    isDragOver,
    isUploading: uploadMedia.isPending,
    selectFiles,
    dropHandlers: { onDrop, onDragOver, onDragLeave },
  };
}
