import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';

interface RepeaterItem {
  _id: string;
  [key: string]: unknown;
}

// Generate a unique ID for new repeater items
function generateItemId(): string {
  return `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Ensure items have unique IDs (for backward compatibility with existing data)
function ensureItemIds(items: unknown[]): RepeaterItem[] {
  return items.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (obj._id && typeof obj._id === 'string') {
        return obj as RepeaterItem;
      }
      return { ...obj, _id: generateItemId() } as RepeaterItem;
    }
    return { _id: generateItemId(), value: item } as RepeaterItem;
  });
}

export function RepeaterField({ field, value, onChange, disabled }: FieldRendererProps) {
  const items = ensureItemIds(Array.isArray(value) ? value : []);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(items.map((item) => item._id))
  );

  const addItem = () => {
    const newItem: RepeaterItem = { _id: generateItemId() };
    onChange([...items, newItem]);
    setExpandedItems((prev) => new Set([...prev, newItem._id]));
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((item) => item._id !== id);
    onChange(newItems);
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex((item) => item._id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const removed = newItems.splice(currentIndex, 1)[0];
    if (removed) {
      newItems.splice(newIndex, 0, removed);
      onChange(newItems);
    }
  };

  const itemLabel = 'Item';
  const minItems = field.min ?? 0;
  const maxItems = field.max ?? Number.POSITIVE_INFINITY;

  const canAdd = !disabled && items.length < maxItems;
  const canRemove = !disabled && items.length > minItems;

  return (
    <div className="space-y-3">
      {/* Items list */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Card key={item._id} className="overflow-hidden">
              <Collapsible
                open={expandedItems.has(item._id)}
                onOpenChange={() => toggleExpand(item._id)}
              >
                <CardHeader className="p-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    {/* Drag handle */}
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

                    {/* Item title */}
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <span className="font-medium">
                          {itemLabel} {index + 1}
                        </span>
                        {expandedItems.has(item._id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </CollapsibleTrigger>

                    {/* Move buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveItem(item._id, 'up')}
                        disabled={disabled || index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveItem(item._id, 'down')}
                        disabled={disabled || index === items.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item._id)}
                      disabled={!canRemove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="p-4">
                    {/* Placeholder for child fields */}
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(item).filter((k) => k !== '_id').length === 0 ? (
                        <p>No fields defined for this repeater item.</p>
                      ) : (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(item, null, 2)}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">No items yet</p>
          <p className="text-xs text-muted-foreground">
            Click the button below to add your first {itemLabel.toLowerCase()}
          </p>
        </div>
      )}

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        onClick={addItem}
        disabled={!canAdd}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add {itemLabel}
      </Button>

      {/* Min/max info */}
      {(minItems > 0 || maxItems < Number.POSITIVE_INFINITY) && (
        <p className="text-xs text-muted-foreground">
          {minItems > 0 && `Minimum: ${minItems}`}
          {minItems > 0 && maxItems < Number.POSITIVE_INFINITY && ' | '}
          {maxItems < Number.POSITIVE_INFINITY && `Maximum: ${maxItems}`}
        </p>
      )}
    </div>
  );
}
