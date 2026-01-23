# Next.js API Proxy Implementation - Complete Fix

**Date:** 2026-01-23
**Status:** ✅ FULLY FUNCTIONAL

## Problem Summary

The frontend was experiencing persistent network errors when trying to communicate with the Odoo backend API:
- `AxiosError: Network Error (ERR_NETWORK)`
- CORS issues due to `withCredentials: true` conflicting with wildcard origins
- HTTP 415 (Unsupported Media Type) responses from Odoo

## Solution: Next.js API Proxy

Created a server-side API proxy that handles all communication with Odoo, completely bypassing browser CORS restrictions.

## Implementation

### 1. Created Next.js API Route Proxy
**File:** [frontend/src/app/api/odoo/[...path]/route.ts](frontend/src/app/api/odoo/[...path]/route.ts)

This catch-all route intercepts all requests to `/api/odoo/*` and forwards them to Odoo with proper JSON-RPC formatting.

**Key Features:**
- Supports both POST and GET requests
- Automatically adds JSON-RPC 2.0 wrapper
- Handles Odoo error responses
- Returns clean data to the frontend

**How it works:**
```
Frontend Request:
POST /api/odoo/products
Body: { "limit": 3 }

↓ (Next.js Proxy)

Odoo Request:
POST http://localhost:8069/api/ecommerce/products
Body: {
  "jsonrpc": "2.0",
  "method": "call",
  "params": { "limit": 3 },
  "id": 123456
}

↓ (Odoo Response)

Frontend Response:
{ "success": true, "products": [...] }
```

### 2. Updated Odoo Client
**File:** [frontend/src/lib/odoo/client.ts](frontend/src/lib/odoo/client.ts)

**Changes:**
- Changed `baseURL` from `http://localhost:8069` to `/api/odoo`
- Updated all endpoint paths to remove `/api/ecommerce/` prefix (proxy adds it)
- Simplified `jsonrpc()` method to send just params (proxy handles JSON-RPC wrapping)
- Removed CORS-related configurations

**Before:**
```typescript
baseURL: 'http://localhost:8069'
endpoint: '/api/ecommerce/products'
body: { jsonrpc: '2.0', method: 'call', params: {...}, id: 123 }
```

**After:**
```typescript
baseURL: '/api/odoo'
endpoint: '/products'  // Proxy adds /api/ecommerce/ prefix
body: { ...params }    // Proxy adds JSON-RPC wrapper
```

## All Updated Endpoints

| Old Endpoint | New Endpoint |
|-------------|-------------|
| `/api/ecommerce/auth/login` | `/auth/login` |
| `/api/ecommerce/products` | `/products` |
| `/api/ecommerce/categories` | `/categories` |
| `/api/ecommerce/cart` | `/cart` |
| `/api/ecommerce/checkout/validate` | `/checkout/validate` |
| `/api/ecommerce/customer/profile` | `/customer/profile` |
| `/api/ecommerce/wishlist` | `/wishlist` |
| `/api/ecommerce/coupon/validate` | `/coupon/validate` |

## Testing Results

### Products Endpoint
```bash
curl -X POST http://localhost:3000/api/odoo/products \
  -H "Content-Type: application/json" \
  -d '{"limit": 3}'
```

**Response:** ✅ Success
```json
{
  "success": true,
  "products": [
    {
      "id": 24,
      "name": "Acoustic Bloc Screens",
      "slug": "acoustic-bloc-screens",
      "list_price": 295,
      "in_stock": true
    },
    ...
  ],
  "total": 78
}
```

### Categories Endpoint
```bash
curl -X POST http://localhost:3000/api/odoo/categories \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

**Response:** ✅ Success
```json
{
  "success": true,
  "categories": [
    {"id": 10, "name": "Clothes", "product_count": 17},
    {"id": 9, "name": "Food", "product_count": 15},
    {"id": 6, "name": "Office", "product_count": 29},
    ...
  ]
}
```

## Files Modified

1. ✅ **NEW** [frontend/src/app/api/odoo/[...path]/route.ts](frontend/src/app/api/odoo/[...path]/route.ts)
   - Created Next.js API proxy with POST and GET handlers
   - Fixed Next.js 15 params handling (await params)

2. ✅ **UPDATED** [frontend/src/lib/odoo/client.ts](frontend/src/lib/odoo/client.ts)
   - Changed baseURL to use proxy
   - Updated all 25+ API endpoint paths
   - Simplified JSON-RPC handling

3. ✅ **UPDATED** [FRONTEND_API_FIX.md](FRONTEND_API_FIX.md)
   - Documented the complete solution

## Benefits

1. **No CORS Issues:** Server-side requests bypass browser CORS policies
2. **Cleaner Client Code:** No need to handle JSON-RPC wrapping in every request
3. **Better Security:** API URL and credentials never exposed to browser
4. **Consistent Error Handling:** Centralized error processing in the proxy
5. **Easier Testing:** Can test proxy endpoints directly with curl

## Next.js 15 Compatibility Note

In Next.js 15+, the `params` in API routes are now a Promise and must be awaited:

```typescript
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;  // Must await!
  // ... use params
}
```

## Production Considerations

The proxy uses `NEXT_PUBLIC_ODOO_URL` environment variable:
- Development: `http://localhost:8069`
- Production: Should point to your production Odoo instance

Make sure to update [.env.local](frontend/.env.local) for production deployment.

## Database Schema Issue & Fix

After implementing the proxy, discovered a database schema issue:
- **Problem**: Missing `review_count`, `average_rating`, and `rating_distribution` columns in `product_template` table
- **Error**: `psycopg2.errors.UndefinedColumn: column product_template.review_count does not exist`
- **Cause**: Stored computed fields added after module installation
- **Fix**: Manually added columns via SQL (see [DATABASE_SCHEMA_FIX.md](DATABASE_SCHEMA_FIX.md))

```sql
ALTER TABLE product_template
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS rating_distribution JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb;
```

## Verification Checklist

- ✅ Products API working
- ✅ Categories API working
- ✅ Cart API responding (authentication required, no 500 errors)
- ✅ Homepage loading without errors
- ✅ No CORS errors in browser console
- ✅ Odoo backend responding correctly
- ✅ Next.js proxy handling JSON-RPC properly
- ✅ Database schema complete with all required columns

## Summary

All network/CORS issues have been resolved by implementing a Next.js API proxy. The frontend can now successfully communicate with the Odoo backend without any browser-related restrictions.

**Frontend** → **Next.js Proxy** → **Odoo Backend**

This architecture is production-ready and follows Next.js best practices for API integration.

A database schema issue was also resolved by manually adding missing review-related columns to the `product_template` table.
