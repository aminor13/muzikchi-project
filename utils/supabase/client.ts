import { createBrowserClient } from '@supabase/ssr'

const originalConsoleError = console.error

// Suppress specific Supabase network errors
console.error = (...args) => {
  const errorString = args.join(' ')
  if (
    errorString.includes('https://') && 
    errorString.includes('supabase') && 
    (errorString.includes('400') || errorString.includes('406'))
  ) {
    // Suppress the error
    return
  }
  originalConsoleError.apply(console, args)
}

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    }
  )
}