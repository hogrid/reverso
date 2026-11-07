import { useEditorStore } from '@/stores/editor';
import { useEffect } from 'react';

/**
 * Binds the editor store to the page being edited.
 *
 * Dirty fields, undo history and the saving flag are global (the store is a
 * singleton) but they belong to one page. Opening a page, switching slug and
 * leaving the editor all reset that state, so edits from page A can never
 * show up as "unsaved changes" on page B or be PATCHed to B's URL, and a save
 * that was still in flight on unmount cannot leave the next editor with Save
 * disabled.
 */
export function useEditorPage(slug: string | undefined): void {
  const setCurrentPage = useEditorStore((state) => state.setCurrentPage);

  useEffect(() => {
    setCurrentPage(slug ?? null);
    return () => {
      setCurrentPage(null);
    };
  }, [slug, setCurrentPage]);
}
