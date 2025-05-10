'use client';

import { QueryClient } from '@tanstack/react-query'

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000, // 10 phút
      refetchOnWindowFocus: false, // Không tự động refetch khi focus window
      retry: 1, // Số lần retry khi fail
    },
  },
}) 