/**
 * Drop-in replacement for fetch() that auto-injects X-Tenant-Domain header.
 * Use this instead of raw fetch() for all backend API calls outside BaseApiClient.
 */
export function tenantFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)

  if (!headers.has('X-Tenant-Domain')) {
    const domain = typeof window !== 'undefined' ? window.location.hostname : ''
    if (domain) {
      headers.set('X-Tenant-Domain', domain)
    }
  }

  return fetch(input, { ...init, headers })
}
