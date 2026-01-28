// frontend/src/main.tsx - React app entry point and DOM mounting
import React from 'react';
import ReactDOM from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from '@/styles';

import App from './App';
import { ErrorFallback } from './ErrorFallback';

// ============================================================================
// React Query Client Configuration
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Don't refetch on window focus (local API)
      retry: 1, // Retry once on failure
      staleTime: 1000 * 60 * 5, // 5 minute stale time
      gcTime: 1000 * 60 * 10, // 10 minute garbage collection time for cache
      refetchOnMount: true, // Show cached data while refetching
    },
    mutations: {
      retry: 1, // Retry mutations once - not sure if this is necessary
    },
  },
});

// ============================================================================
// App Root
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <App />
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);