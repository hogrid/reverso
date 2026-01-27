import { ProtectedRoute } from '@/components/auth';
import { LoadingPage } from '@/components/common/LoadingState';
import { RootLayout } from '@/components/layout';
import { initializeTheme } from '@/stores/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
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
      <BrowserRouter>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RootLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="pages" element={<PagesListPage />} />
              <Route path="pages/:slug" element={<PageEditorPage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="forms" element={<FormsListPage />} />
              <Route path="forms/:id" element={<FormBuilderPage />} />
              <Route path="forms/:id/submissions" element={<FormSubmissionsPage />} />
              <Route path="redirects" element={<RedirectsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
