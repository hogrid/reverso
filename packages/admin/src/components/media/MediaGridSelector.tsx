import type { MediaItem } from '@/api/hooks/useMedia';
import { Skeleton } from '@/components/ui/skeleton';
import { MediaGridItem } from './MediaGridItem';
import { MediaListItem } from './MediaListItem';

export type ViewMode = 'grid' | 'list';

export interface MediaGridSelectorProps {
  items: MediaItem[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  multiple?: boolean;
  viewMode?: ViewMode;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function MediaGridSelector({
  items,
  selectedIds,
  onSelectionChange,
  multiple = false,
  viewMode = 'grid',
  isLoading = false,
  onDelete,
}: MediaGridSelectorProps) {
  const handleSelect = (id: string) => {
    if (multiple) {
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      onSelectionChange(newSelection);
    } else {
      // Single selection mode - toggle or replace
      if (selectedIds.has(id)) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set([id]));
      }
    }
  };

  if (isLoading) {
    return (
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-4 gap-3'
            : 'space-y-2'
        }
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`skeleton-${i}`}
            className={viewMode === 'grid' ? 'aspect-square rounded-lg' : 'h-16 rounded-lg'}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <MediaGridItem
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onSelect={() => handleSelect(item.id)}
            onDelete={onDelete ? () => onDelete(item.id) : undefined}
            selectMode="click"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <MediaListItem
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={() => handleSelect(item.id)}
          onDelete={onDelete ? () => onDelete(item.id) : undefined}
          selectMode="click"
        />
      ))}
    </div>
  );
}
