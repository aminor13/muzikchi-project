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

// Create a singleton client to prevent multiple instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )

  // Add error handling for auth state changes
  supabaseClient.auth.onAuthStateChange((event: string, session: any) => {
    console.log('Auth state changed:', event, session?.user?.id)
    
    if (event === 'SIGNED_OUT') {
      // Clear any cached data when user signs out
      console.log('User signed out, clearing cache')
    }
  })

  return supabaseClient
}

// Function to reset the client (useful for debugging)
export const resetClient = () => {
  supabaseClient = null
}

// Utility function for retrying failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      console.log(`Request attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        
        // Reset client on auth errors
        if (error && typeof error === 'object' && 'message' in error && 
            (String(error.message).includes('JWT') || String(error.message).includes('auth'))) {
          console.log('Auth error detected, resetting client...')
          resetClient()
        }
      }
    }
  }
  
  throw lastError
}