/**
 * Utility functions for API requests
 */

/**
 * Default fetch options for API requests
 */
export const defaultFetchOptions: RequestInit = {
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
};

/**
 * Constructs a valid URL for API requests that works in both client and server environments
 *
 * @param endpoint - The API endpoint path (e.g., '/api/events')
 * @returns A properly formatted URL string
 */
export function getApiUrl(endpoint: string): string {
  // Make sure the endpoint starts with a slash
  if (!endpoint.startsWith("/")) {
    endpoint = `/${endpoint}`;
  }

  // If the environment variable is set, use it
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return `${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`;
  }

  // For client-side rendering, we can use a relative URL
  if (typeof window !== "undefined") {
    return endpoint;
  }

  // For server-side rendering, we need an absolute URL
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const host = process.env.VERCEL_URL || "localhost:3000";
  return `${protocol}://${host}${endpoint}`;
}

/**
 * Makes an API request with proper credentials and headers
 *
 * @param endpoint - The API endpoint path
 * @param options - Additional fetch options to merge with defaults
 * @returns Promise with the response data
 */
export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = getApiUrl(endpoint);
  const fetchOptions = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...options?.headers,
    },
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
