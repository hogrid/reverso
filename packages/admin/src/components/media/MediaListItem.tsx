import type { MediaItem } from '@/api/hooks/useMedia';
import { Badge } from '@/components/ui/badge';
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

export interface MediaListItemProps {
  item: MediaItem;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  selectable?: boolean;
  selectMode?: 'checkbox' | 'click';
}

export function MediaListItem({
  item,
  selected = false,
  onSelect,
  onDelete,
  selectable = true,
  selectMode = 'checkbox',
}: MediaListItemProps) {
  const isImage = isImageFile(item.filename);

  const handleClick = () => {
    if (selectMode === 'click' && onSelect) {
      onSelect();
    }
  };

  return (
    <Card
      className={cn(
        'transition-all',
        selected && 'ring-2 ring-primary',
        selectMode === 'click' && 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-4 p-3">
        {selectable && selectMode === 'checkbox' && onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="h-12 w-12 rounded overflow-hidden flex-shrink-0 relative">
          {isImage ? (
            <img
              src={item.url}
              alt={item.alt || item.filename}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {selectMode === 'click' && selected && (
            <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.filename}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(item.size)} &middot; {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Badge variant="secondary">{item.mimeType.split('/')[0]}</Badge>

        {onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
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
        )}
      </CardContent>
    </Card>
  );
}
