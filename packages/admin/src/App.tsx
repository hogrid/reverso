import { RootLayout } from '@/components/layout';
import {
  DashboardPage,
  FormBuilderPage,
  FormsListPage,
  FormSubmissionsPage,
  MediaPage,
  NotFoundPage,
  PageEditorPage,
  PagesListPage,
  RedirectsPage,
} from '@/pages';
import { initializeTheme } from '@/stores/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@/styles/globals.css';

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
        <Routes>
          <Route path="/" element={<RootLayout />}>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
