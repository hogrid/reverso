import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { usePages } from '@/api/hooks/usePages';
import { cn } from '@/lib/utils';
import { Check, Link2, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

interface RelationItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

/** Non-standard relation attributes carried on the field marker. */
type RelationFieldConfig = { to?: string };

export function RelationField({ field, value, onChange, disabled }: FieldRendererProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const multiple = field.multiple || false;
  const relationType = (field as RelationFieldConfig).to || 'pages';

  // Relation targets come from real CMS pages (the most common relation in a
  // headless CMS). Other relation sources can be added as more endpoints exist.
  const { data: pages, isLoading: loading } = usePages();
  const relationItems: RelationItem[] = useMemo(
    () => (pages ?? []).map((p) => ({ id: p.slug, title: p.name, subtitle: 'Page' })),
    [pages]
  );

  // Parse current selection
  const selectedIds = useMemo(() => {
    if (multiple) {
      return Array.isArray(value) ? (value as string[]) : [];
    }
    return value ? [value as string] : [];
  }, [value, multiple]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    const searchLower = search.toLowerCase();
    return relationItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle?.toLowerCase().includes(searchLower)
    );
  }, [search, relationItems]);

  // Get selected items details
  const selectedItems = useMemo(() => {
    return selectedIds
      .map((id) => relationItems.find((item) => item.id === id))
      .filter(Boolean) as RelationItem[];
  }, [selectedIds, relationItems]);

  const handleSelect = (id: string) => {
    if (multiple) {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id];
      onChange(newIds);
    } else {
      onChange(id);
      setOpen(false);
    }
  };

  const handleRemove = (id: string) => {
    if (multiple) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange(null);
    }
  };

  const handleClear = () => {
    onChange(multiple ? [] : null);
  };

  return (
    <div className="space-y-2">
      {/* Selected items */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge key={item.id} variant="secondary" className="flex items-center gap-1 pr-1">
              <Link2 className="h-3 w-3 mr-1" />
              {item.title}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={disabled}
                className="ml-1 p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedItems.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleClear}
              disabled={disabled}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Select dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start" disabled={disabled}>
            <Link2 className="h-4 w-4 mr-2" />
            {selectedItems.length === 0
              ? `Select ${relationType}...`
              : multiple
                ? `Add more ${relationType}`
                : `Change ${relationType}`}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select {relationType}</DialogTitle>
            <DialogDescription>
              {multiple ? 'Select one or more items to link' : 'Select an item to link'}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${relationType}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Items list */}
          <ScrollArea className="h-[300px] border rounded-md">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No items found</p>
                {search && <p className="text-xs mt-1">Try a different search term</p>}
              </div>
            ) : (
              <div className="p-2">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/10' : 'hover:bg-accent'
                      )}
                      onClick={() => handleSelect(item.id)}
                    >
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                        )}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {multiple && selectedIds.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
