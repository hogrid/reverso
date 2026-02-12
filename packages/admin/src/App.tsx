import { ProtectedRoute } from '@/components/auth';
import { LoadingPage } from '@/components/common/LoadingState';
import { RootLayout } from '@/components/layout';
import { initializeTheme } from '@/stores/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@/styles/globals.css';

// Lazy load pages for code splitting
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const PagesListPage = lazy(() =>
  import('@/pages/PagesListPage').then((m) => ({ default: m.PagesListPage }))
);
const PageEditorPage = lazy(() =>
  import('@/pages/PageEditorPage').then((m) => ({ default: m.PageEditorPage }))
);
const MediaPage = lazy(() =>
  import('@/pages/MediaPage').then((m) => ({ default: m.MediaPage }))
);
const FormsListPage = lazy(() =>
  import('@/pages/FormsListPage').then((m) => ({ default: m.FormsListPage }))
);
const FormBuilderPage = lazy(() =>
  import('@/pages/FormBuilderPage').then((m) => ({ default: m.FormBuilderPage }))
);
const FormSubmissionsPage = lazy(() =>
  import('@/pages/FormSubmissionsPage').then((m) => ({ default: m.FormSubmissionsPage }))
);
const RedirectsPage = lazy(() =>
  import('@/pages/RedirectsPage').then((m) => ({ default: m.RedirectsPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// Suspense wrapper for lazy-loaded pages
function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingPage />}>{children}</Suspense>;
}

// Create data router (required for useBlocker support)
const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: (
        <SuspensePage>
          <LoginPage />
        </SuspensePage>
      ),
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <RootLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <SuspensePage>
              <DashboardPage />
            </SuspensePage>
          ),
        },
        {
          path: 'pages',
          element: (
            <SuspensePage>
              <PagesListPage />
            </SuspensePage>
          ),
        },
        {
          path: 'pages/:slug',
          element: (
            <SuspensePage>
              <PageEditorPage />
            </SuspensePage>
          ),
        },
        {
          path: 'media',
          element: (
            <SuspensePage>
              <MediaPage />
            </SuspensePage>
          ),
        },
        {
          path: 'forms',
          element: (
            <SuspensePage>
              <FormsListPage />
            </SuspensePage>
          ),
        },
        {
          path: 'forms/:id',
          element: (
            <SuspensePage>
              <FormBuilderPage />
            </SuspensePage>
          ),
        },
        {
          path: 'forms/:id/submissions',
          element: (
            <SuspensePage>
              <FormSubmissionsPage />
            </SuspensePage>
          ),
        },
        {
          path: 'redirects',
          element: (
            <SuspensePage>
              <RedirectsPage />
            </SuspensePage>
          ),
        },
        {
          path: '*',
          element: (
            <SuspensePage>
              <NotFoundPage />
            </SuspensePage>
          ),
        },
      ],
    },
  ],
  {
    basename: '/admin',
  }
);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
