import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    __ENV?: {
      SUPABASE_URL?: string
      SUPABASE_ANON_KEY?: string
      APP_URL?: string
    }
  }
}

export function createClient() {
  const env = typeof window !== 'undefined' ? window.__ENV : undefined
  const url = env?.SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const anonKey = env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  return createBrowserClient(url, anonKey)
}
