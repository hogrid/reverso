import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FieldSchema } from '@reverso/core';
import { ChevronDown, GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FieldRendererProps } from './FieldRenderer';
import { FieldRenderer } from './FieldRenderer';

interface FlexibleLayout {
  name: string;
  label: string;
  fields: FieldSchema[];
}

interface FlexibleItem {
  _id: string;
  _layout: string;
  [key: string]: unknown;
}

interface SortableBlockProps {
  item: FlexibleItem;
  layout: FlexibleLayout | undefined;
  index: number;
  onRemove: () => void;
  onFieldChange: (fieldPath: string, value: unknown) => void;
  disabled?: boolean;
}

function SortableBlock({
  item,
  layout,
  index,
  onRemove,
  onFieldChange,
  disabled,
}: SortableBlockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!layout) {
    return (
      <Card ref={setNodeRef} style={style} className="border-destructive">
        <CardContent className="py-4 text-center text-destructive">
          Unknown layout type: {item._layout}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn('transition-shadow', isDragging && 'shadow-lg opacity-50')}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-grab"
              {...attributes}
              {...listeners}
              disabled={disabled}
            >
              <GripVertical className="h-4 w-4" />
            </Button>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex-1 justify-start h-8 px-2">
                <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium">{layout.label}</span>
                <span className="text-xs text-muted-foreground ml-2">#{index + 1}</span>
                <ChevronDown
                  className={cn('ml-auto h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onRemove}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-2 space-y-4">
            {layout.fields.map((fieldSchema) => {
              const fieldValue = item[fieldSchema.path.split('.').pop() || ''];
              return (
                <FieldRenderer
                  key={fieldSchema.path}
                  field={fieldSchema}
                  value={fieldValue as any}
                  onChange={(val) => onFieldChange(fieldSchema.path.split('.').pop() || '', val)}
                  disabled={disabled}
                />
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function FlexibleField({ field, value, onChange, disabled }: FieldRendererProps) {
  // Parse layouts from field config or use defaults
  const layouts: FlexibleLayout[] = (field as any).layouts || [
    {
      name: 'text',
      label: 'Text Block',
      fields: [{ path: 'content', type: 'textarea', label: 'Content' } as FieldSchema],
    },
    {
      name: 'image',
      label: 'Image Block',
      fields: [
        { path: 'image', type: 'image', label: 'Image' } as FieldSchema,
        { path: 'caption', type: 'text', label: 'Caption' } as FieldSchema,
      ],
    },
    {
      name: 'cta',
      label: 'Call to Action',
      fields: [
        { path: 'title', type: 'text', label: 'Title' } as FieldSchema,
        { path: 'description', type: 'textarea', label: 'Description' } as FieldSchema,
        { path: 'buttonText', type: 'text', label: 'Button Text' } as FieldSchema,
        { path: 'buttonUrl', type: 'url', label: 'Button URL' } as FieldSchema,
      ],
    },
  ];

  const items: FlexibleItem[] = Array.isArray(value) ? (value as FlexibleItem[]) : [];
  const minItems = field.min || 0;
  const maxItems = field.max || 20;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleAddBlock = (layoutName: string) => {
    const layout = layouts.find((l) => l.name === layoutName);
    if (!layout || items.length >= maxItems) return;

    const newItem: FlexibleItem = {
      _id: `flex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      _layout: layoutName,
    };

    // Initialize fields with undefined
    layout.fields.forEach((f) => {
      const fieldName = f.path.split('.').pop() || '';
      newItem[fieldName] = undefined;
    });

    onChange([...items, newItem]);
  };

  const handleRemoveBlock = (index: number) => {
    if (items.length <= minItems) return;
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleFieldChange = (index: number, fieldPath: string, fieldValue: unknown) => {
    const newItems = [...items];
    const item = newItems[index];
    if (item) {
      newItems[index] = { ...item, [fieldPath]: fieldValue };
      onChange(newItems);
    }
  };

  return (
    <div className="space-y-4">
      {/* Blocks list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((item) => item._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.map((item, index) => {
              const layout = layouts.find((l) => l.name === item._layout);
              return (
                <SortableBlock
                  key={item._id}
                  item={item}
                  layout={layout}
                  index={index}
                  onRemove={() => handleRemoveBlock(index)}
                  onFieldChange={(path, val) => handleFieldChange(index, path, val)}
                  disabled={disabled}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add block button */}
      {items.length < maxItems && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full" disabled={disabled}>
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            {layouts.map((layout) => (
              <DropdownMenuItem key={layout.name} onClick={() => handleAddBlock(layout.name)}>
                <Layers className="h-4 w-4 mr-2" />
                {layout.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No content blocks added yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add Block" to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Count indicator */}
      <div className="text-xs text-muted-foreground text-center">
        {items.length} / {maxItems} blocks
        {minItems > 0 && ` (minimum ${minItems})`}
      </div>
    </div>
  );
}
