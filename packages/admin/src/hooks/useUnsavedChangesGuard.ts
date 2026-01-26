import { useEditorStore } from '@/stores/editor';
import { useCallback, useEffect } from 'react';
import type { Location } from 'react-router-dom';
import { useBlocker } from 'react-router-dom';

interface UseUnsavedChangesGuardOptions {
  /** Whether the guard is enabled (default: true) */
  enabled?: boolean;
  /** Custom message for the confirmation dialog */
  message?: string;
}

interface UseUnsavedChangesGuardReturn {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** The blocker from React Router (if blocking) */
  blocker: ReturnType<typeof useBlocker>;
  /** Confirm leaving and proceed with navigation */
  confirmLeave: () => void;
  /** Cancel leaving and stay on page */
  cancelLeave: () => void;
}

const DEFAULT_MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';

/**
 * Hook to guard against losing unsaved changes.
 * Shows confirmation when:
 * 1. User tries to close/refresh the browser (beforeunload)
 * 2. User tries to navigate away using React Router
 */
export function useUnsavedChangesGuard({
  enabled = true,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions = {}): UseUnsavedChangesGuardReturn {
  const { hasDirtyFields } = useEditorStore();
  const isDirty = hasDirtyFields();
  const shouldBlock = enabled && isDirty;

  // React Router blocker for client-side navigation
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: Location; nextLocation: Location }) => {
        return shouldBlock && currentLocation.pathname !== nextLocation.pathname;
      },
      [shouldBlock]
    )
  );

  // Browser beforeunload event for page close/refresh
  useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Modern browsers ignore custom messages, but we set it anyway
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, message]);

  const confirmLeave = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const cancelLeave = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  return {
    isDirty,
    blocker,
    confirmLeave,
    cancelLeave,
  };
}
