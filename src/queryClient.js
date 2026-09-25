import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           15_000,      // 15초 캐시 유지
      gcTime:              5 * 60_000,  // 5분 후 GC
      retry:               1,
      refetchOnWindowFocus: true,       // 창 포커스 시 백그라운드 갱신
    }
  }
})
