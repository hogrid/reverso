import { useContent, useUpdateContent } from '@/api/hooks/useContent';
import { usePage } from '@/api/hooks/usePages';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { FieldRenderer } from '@/components/fields/FieldRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor';
import type { ContentValue, FieldSchema, SectionSchema } from '@reverso/core';
import { Check, ChevronLeft, Clock, Redo, Save, Undo } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const {
    data: page,
    isLoading: pageLoading,
    error: pageError,
    refetch: refetchPage,
  } = usePage(slug || '');
  const {
    data: content,
    isLoading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useContent(slug || '');
  const updateContent = useUpdateContent();

  const {
    dirtyFields,
    setFieldValue,
    hasDirtyFields,
    getDirtyFieldsData,
    clearDirtyFields,
    canUndo,
    canRedo,
    undo,
    redo,
    isSaving,
    setIsSaving,
    lastSaved,
  } = useEditorStore();

  const handleSave = async () => {
    if (!slug || !hasDirtyFields()) return;

    setIsSaving(true);
    try {
      await updateContent.mutateAsync({
        pageSlug: slug,
        data: getDirtyFieldsData(),
      });
      clearDirtyFields();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (path: string, value: ContentValue, oldValue?: ContentValue) => {
    setFieldValue(path, value, oldValue);
  };

  const getFieldValue = (fieldPath: string): ContentValue | undefined => {
    // Check dirty fields first
    if (dirtyFields.has(fieldPath)) {
      return dirtyFields.get(fieldPath);
    }
    // Then check content data
    if (content?.data) {
      const parts = fieldPath.split('.');
      if (parts.length >= 2) {
        const section = parts[1];
        const field = parts.slice(2).join('.');
        if (section) {
          return content.data[section]?.[field];
        }
      }
    }
    return undefined;
  };

  if (pageLoading || contentLoading) {
    return (
      <div className="p-6">
        <LoadingState message="Loading page..." />
      </div>
    );
  }

  if (pageError || contentError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load page"
          message="Could not load the page content."
          onRetry={() => {
            refetchPage();
            refetchContent();
          }}
        />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-6">
        <ErrorState title="Page not found" message={`The page "${slug}" does not exist.`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link to="/pages">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold">{page.name}</h1>
              <p className="text-sm text-muted-foreground font-mono">/{page.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : hasDirtyFields() ? (
                <Badge variant="secondary">Unsaved changes</Badge>
              ) : null}
            </div>

            {/* Undo/Redo */}
            <Button variant="outline" size="icon" onClick={() => undo()} disabled={!canUndo()}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => redo()} disabled={!canRedo()}>
              <Redo className="h-4 w-4" />
            </Button>

            {/* Save */}
            <Button onClick={handleSave} disabled={!hasDirtyFields() || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {page.sections.length > 1 ? (
          <Tabs defaultValue={page.sections[0]?.slug} className="space-y-6">
            <TabsList>
              {page.sections.map((section) => (
                <TabsTrigger key={section.slug} value={section.slug}>
                  {section.name}
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {section.fields.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {page.sections.map((section) => (
              <TabsContent key={section.slug} value={section.slug}>
                <SectionEditor
                  pageSlug={page.slug}
                  section={section}
                  getFieldValue={getFieldValue}
                  onFieldChange={handleFieldChange}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          page.sections.map((section) => (
            <SectionEditor
              key={section.slug}
              pageSlug={page.slug}
              section={section}
              getFieldValue={getFieldValue}
              onFieldChange={handleFieldChange}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SectionEditorProps {
  pageSlug: string;
  section: SectionSchema;
  getFieldValue: (path: string) => ContentValue | undefined;
  onFieldChange: (path: string, value: ContentValue, oldValue?: ContentValue) => void;
}

function SectionEditor({ pageSlug, section, getFieldValue, onFieldChange }: SectionEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.name}</CardTitle>
        <CardDescription>
          {section.fields.length} field{section.fields.length !== 1 ? 's' : ''} in this section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {section.fields.map((field) => {
            const fieldPath = `${pageSlug}.${section.slug}.${field.path.split('.').pop()}`;
            const value = getFieldValue(fieldPath);

            return (
              <FieldRenderer
                key={field.path}
                field={field}
                value={value}
                onChange={(newValue) => onFieldChange(fieldPath, newValue, value)}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
