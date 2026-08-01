/**
 * Centralized API Client Service
 * 
 * This module handles all network requests to the FastAPI backend.
 * It automatically injects the JWT token from localStorage (if running on the client),
 * parses JSON responses, and normalizes error messages according to our legacy `utils.js` logic.
 * 
 * Why a centralized client?
 * By wrapping the native `fetch` API, we ensure that:
 * 1. The Authorization header is consistently applied.
 * 2. Error handling (FastAPI's 422 Validation Errors, 401 Unauthorized, etc.) is unified.
 * 3. We avoid repeating `try/catch` and token retrieval logic in every component.
 */

// Use an environment variable for the API base URL.
// In Server Components, we must use the absolute URL to reach FastAPI.
// In Client Components, we use a relative URL so Next.js rewrites can proxy the request.
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') 
  : '';

/**
 * Extracts a readable error message from a FastAPI error response.
 * Mimics the behavior of `getErrorMessage` from the legacy `utils.js`.
 * 
 * @param error The parsed error object from the API.
 * @returns A user-friendly error string.
 */
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'detail' in error) {
    const apiError = error as Record<string, unknown>;
    if (typeof apiError.detail === 'string') {
      return apiError.detail;
    } else if (Array.isArray(apiError.detail)) {
      return apiError.detail.map((err: unknown) => {
        if (err && typeof err === 'object' && 'msg' in err) {
          return (err as Record<string, unknown>).msg;
        }
        return String(err);
      }).join('. ');
    }
  }
  return 'An error occurred. Please try again.';
}

interface FetchOptions extends RequestInit {
  // Optional flag to bypass authentication if needed
  skipAuth?: boolean;
}

/**
 * Core fetch wrapper.
 * 
 * @param endpoint The API endpoint path (e.g., '/api/posts')
 * @param options Standard Fetch API options (method, body, headers, etc.)
 * @returns The parsed JSON response, or throws an error string.
 */
export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, headers: customHeaders, ...restOptions } = options;
  
  const headers = new Headers(customHeaders);
  
  // Ensure we send and accept JSON by default, unless otherwise specified (like FormData)
  if (!headers.has('Content-Type') && !(restOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Only attempt to access localStorage if we are in the browser (Client Component context)
  if (!skipAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...restOptions,
    });

    // Check if the response has content
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      // Handle authentication failures (e.g., token expired)
      if (response.status === 401 && typeof window !== 'undefined') {
         console.warn("Unauthorized API call - token may be expired.");
         // Optionally emit an event here so the auth hook can log the user out
      }
      
      const errorMessage = getErrorMessage(data);
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: unknown) {
    // If it's already an error we threw, rethrow it. Otherwise, it's a network issue.
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error or API is unreachable.');
  }
}
