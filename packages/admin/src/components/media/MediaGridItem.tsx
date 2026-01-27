import type { MediaItem } from '@/api/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatFileSize, isImageFile } from '@/lib/utils';
import { Check, Download, FileText, MoreVertical, Trash2 } from 'lucide-react';
import { memo } from 'react';

export interface MediaGridItemProps {
  item: MediaItem;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  selectMode?: 'checkbox' | 'click';
}

export const MediaGridItem = memo(function MediaGridItem({
  item,
  selected = false,
  onSelect,
  onDelete,
  selectable = true,
  selectMode = 'checkbox',
}: MediaGridItemProps) {
  const isImage = isImageFile(item.filename);

  const handleClick = () => {
    if (selectMode === 'click' && onSelect) {
      onSelect();
    }
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all',
        selected && 'ring-2 ring-primary',
        selectMode === 'click' && 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      <div className="aspect-square relative">
        {isImage ? (
          <img
            src={item.url}
            alt={item.alt || item.filename}
            loading="lazy"
            decoding="async"
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Selection indicator for click mode */}
        {selectMode === 'click' && selected && (
          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-4 w-4" />
            </div>
          </div>
        )}

        {/* Selection checkbox for checkbox mode */}
        {selectable && selectMode === 'checkbox' && onSelect && (
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="bg-background"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Actions dropdown */}
        {onDelete && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href={item.url} download={item.filename} onClick={(e) => e.stopPropagation()}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <CardContent className="p-2">
        <p className="text-xs font-medium truncate">{item.filename}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
      </CardContent>
    </Card>
  );
});
