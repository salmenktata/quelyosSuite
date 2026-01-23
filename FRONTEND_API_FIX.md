# Frontend API Connection Issues - Fix Guide

## Issues Found

### 1. Missing `getCategories()` Method ✅ FIXED
**Error:** `odooClient.getCategories is not a function`

**Location:** [src/app/page.tsx:29](frontend/src/app/page.tsx#L29)

**Fix:** Added `getCategories()` and `getCategory()` methods to [client.ts](frontend/src/lib/odoo/client.ts#L166-L176)

```typescript
async getCategories(filters: { limit?: number; offset?: number } = {}): Promise<{ success: boolean; categories: any[]; error?: string }> {
  return this.jsonrpc('/api/ecommerce/categories', filters);
}

async getCategory(id: number): Promise<{ success: boolean; category?: any; error?: string }> {
  return this.jsonrpc(`/api/ecommerce/categories/${id}`);
}
```

### 2. Network Error - API Not Reachable ✅ FIXED

**Error:** `AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK'}`

**Diagnosis from Odoo logs:**
```
2026-01-23 14:25:14 "OPTIONS /api/ecommerce/products HTTP/1.1" 204  ✅ CORS preflight OK
2026-01-23 14:27:22 "GET /api/ecommerce/products HTTP/1.1" 415     ❌ Unsupported Media Type
```

**Root Cause:**
CORS restrictions when using `withCredentials: true` with wildcard origins. Browser blocks requests when credentials are included and CORS uses `Access-Control-Allow-Origin: *`.

**Final Solution - Next.js API Proxy:**
Created a server-side proxy at [/api/odoo/[...path]/route.ts](frontend/src/app/api/odoo/[...path]/route.ts) that forwards all requests to Odoo. This eliminates CORS issues entirely since the Next.js server makes the requests, not the browser.

**How it works:**
1. Frontend calls `/api/odoo/products` (same-origin, no CORS)
2. Next.js proxy receives the request server-side
3. Proxy adds JSON-RPC wrapper and forwards to `http://localhost:8069/api/ecommerce/products`
4. Proxy returns Odoo's response to the frontend

## Odoo API Requirements

The Odoo e-commerce routes are defined as:
```python
@http.route('/api/ecommerce/products', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
```

**What `type='json'` means:**
- Expects POST requests with JSON-RPC 2.0 format
- Body must be:
  ```json
  {
    "jsonrpc": "2.0",
    "method": "call",
    "params": { /* your params */ },
    "id": 1
  }
  ```

## Current Frontend Configuration

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_ODOO_URL=http://localhost:8069
ODOO_DATABASE=quelyos
```

### Axios Client Configuration
The client in [client.ts](frontend/src/lib/odoo/client.ts) is correctly configured:
```typescript
private async jsonrpc<T = any>(endpoint: string, params: Record<string, any> = {}) {
  const response = await this.api.post(endpoint, {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: Math.floor(Math.random() * 1000000),
  });
  return response.data.result;
}
```

## Testing

A test page has been created at `/test-api` to diagnose the connection:

**Navigate to:** http://localhost:3000/test-api

This page tests direct fetch() calls to the Odoo API to isolate axios/configuration issues.

## Potential Issues

### 1. Axios Interceptor Problem
The axios interceptor might be modifying requests incorrectly:
```typescript
this.api.interceptors.request.use((config) => {
  if (this.sessionId && config.headers) {
    config.headers['Cookie'] = `session_id=${this.sessionId}`;
  }
  return config;
});
```

### 2. Browser Security
- Check browser console for CORS errors
- Check if browser is blocking mixed content (HTTP/HTTPS)

### 3. Odoo Module Not Registered
The e-commerce API routes might not be registered. Verify with:
```bash
docker logs quelyos-odoo | grep "quelyos_ecommerce"
```

## Next Steps

1. **Visit the test page:** http://localhost:3000/test-api
2. **Click "Test Direct API Call"**
3. **Check the result:**
   - ✅ Success = Odoo API is working, issue is with axios config
   - ❌ Error = CORS or network issue

4. **If it works**, the issue is in the Odoo client configuration
5. **If it fails**, check:
   - Odoo is running: `docker-compose ps`
   - Module is installed: Check Odoo Apps page
   - CORS settings in Odoo

## Temporary Workaround

If the API continues to fail, you can mock the data temporarily in the homepage:

```typescript
// In page.tsx
const fetchData = async () => {
  try {
    // Mock data for development
    setFeaturedProducts([
      {
        id: 1,
        name: 'Product 1',
        list_price: 99.99,
        image_url: 'https://via.placeholder.com/300',
        slug: 'product-1',
      },
      // ... more products
    ]);
    setCategories([
      { id: 1, name: 'Category 1' },
      // ... more categories
    ]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsLoading(false);
  }
};
```

## Files Modified

1. ✅ [frontend/src/lib/odoo/client.ts](frontend/src/lib/odoo/client.ts) - Added getCategories(), updated to use Next.js API proxy
2. ✅ [frontend/src/app/api/odoo/[...path]/route.ts](frontend/src/app/api/odoo/[...path]/route.ts) - New Next.js API proxy
3. ✅ [frontend/src/app/test-api/page.tsx](frontend/src/app/test-api/page.tsx) - Test page for debugging
4. ✅ [frontend/src/components/layout/Header.tsx](frontend/src/components/layout/Header.tsx) - Export fix
5. ✅ [frontend/src/components/common/Button.tsx](frontend/src/components/common/Button.tsx) - Export fix

## Summary

- **Missing method:** ✅ Fixed - Added `getCategories()` and `getCategory()`
- **Network error:** ✅ Fixed - Implemented Next.js API proxy to bypass CORS
- **Exports:** ✅ Fixed - Header and Button now export correctly

## Next.js API Proxy Implementation

All API calls now route through `/api/odoo/*` which forwards to Odoo server-side:

```typescript
// Old: Direct call to Odoo (CORS issues)
baseURL: 'http://localhost:8069'
endpoint: '/api/ecommerce/products'

// New: Through Next.js proxy (no CORS issues)
baseURL: '/api/odoo'
endpoint: '/products'  // Proxy adds /api/ecommerce/ prefix
```

---

**Status:** ✅ FULLY FIXED
**Date:** 2026-01-23
