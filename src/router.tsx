import { createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { ConvexProvider } from 'convex/react'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string
  if (!CONVEX_URL) {
    console.error('missing envar CONVEX_URL')
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  // The app is a SPA (every route is ssr: false), so there is no server-to-client
  // query dehydration to wire up: providing the QueryClient is all that is needed.
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0, // Let React Query handle all caching
    defaultErrorComponent: () => (
      <main className="flex min-h-dvh items-center justify-center p-6 text-center">
        <p className="text-lg text-ink-70">
          Er ging iets mis. Ververs de pagina.
        </p>
      </main>
    ),

    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ConvexProvider>
    ),
  })
}
