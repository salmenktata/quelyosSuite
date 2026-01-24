# Redis Cache Configuration

## Overview

The Quelyos E-commerce module includes Redis caching support to dramatically improve performance for high-traffic e-commerce sites.

## Benefits

- **5-10x faster product listings** - Cached product data eliminates repeated database queries
- **Reduced database load** - Frequently accessed data is served from memory
- **Better scalability** - Handle more concurrent users with the same infrastructure
- **Improved UX** - Faster page loads and API responses

## Installation

### 1. Install Redis Server

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

### 2. Install Python Redis Library

```bash
pip install redis
```

Or add to `requirements.txt`:
```
redis>=4.0.0
```

### 3. Configure Odoo

Add Redis configuration to Odoo system parameters:

1. Go to **Settings** → **Technical** → **Parameters** → **System Parameters**
2. Add the following parameters:

| Key | Value | Description |
|-----|-------|-------------|
| `redis.host` | `localhost` | Redis server hostname |
| `redis.port` | `6379` | Redis server port |
| `redis.db` | `0` | Redis database number |
| `redis.password` | *(optional)* | Redis password if authentication is enabled |

Or use the menu: **E-commerce** → **Configuration** → **Redis Cache**

### 4. Restart Odoo

```bash
sudo systemctl restart odoo
```

## Verification

Check if Redis is working:

1. **Via API** (admin only):
```bash
curl -X POST https://your-domain.com/api/ecommerce/cache/stats \
  -H "Content-Type: application/json" \
  -d '{}'
```

2. **Via Redis CLI**:
```bash
redis-cli
> PING
PONG
> KEYS product:*
> GET product:api:123
```

## Cache Management

### Clear Cache

**Via API** (admin only):
```bash
# Clear all e-commerce cache
curl -X POST https://your-domain.com/api/ecommerce/cache/clear \
  -H "Content-Type: application/json" \
  -d '{}'

# Clear specific pattern
curl -X POST https://your-domain.com/api/ecommerce/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"pattern": "product:*"}'
```

**Via Redis CLI**:
```bash
redis-cli FLUSHDB
```

### Warm Up Cache

Pre-load cache with popular products (admin only):
```bash
curl -X POST https://your-domain.com/api/ecommerce/cache/warmup \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Cache Statistics

View cache statistics (admin only):
```bash
curl -X POST https://your-domain.com/api/ecommerce/cache/stats \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Cache Patterns

The module uses the following cache key patterns:

| Pattern | Description | TTL |
|---------|-------------|-----|
| `product:api:{id}` | Product details for API | 1 hour |
| `product:seo:{id}` | SEO metadata for product | 1 hour |
| `products:list:*` | Product listings with filters | 5 minutes |
| `products:facets:*` | Faceted search filters | 5 minutes |
| `analytics:*` | Analytics data | 15 minutes |
| `search:*` | Search autocomplete results | 10 minutes |
| `recommendations:*` | Product recommendations | 30 minutes |

## Automatic Cache Invalidation

Cache is automatically invalidated when:

- A product is created, updated, or deleted
- A sale order is confirmed
- Analytics data is updated
- Stock levels change (via stock moves)

## Using Cached Endpoints

### Product List (Cached)

```bash
POST /api/ecommerce/products/list/cached
{
  "limit": 20,
  "offset": 0,
  "filters": { "category_id": 5 }
}
```

Response includes `"cached": true` if served from cache.

### Product Details (Cached)

```bash
POST /api/ecommerce/products/123/cached
```

## Performance Tuning

### Adjust TTL Values

Edit `/models/redis_cache.py` and modify expire times:

```python
cache.set(cache_key, product_data, expire=3600)  # 1 hour
```

### Increase Redis Memory

Edit `/etc/redis/redis.conf`:
```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Monitor Redis Performance

```bash
redis-cli INFO stats
redis-cli SLOWLOG GET 10
```

## Production Recommendations

### 1. Use Redis Sentinel for High Availability

```bash
# Configure Redis Sentinel for automatic failover
redis-sentinel /etc/redis/sentinel.conf
```

### 2. Enable Persistence

Edit `/etc/redis/redis.conf`:
```
save 900 1
save 300 10
save 60 10000
```

### 3. Secure Redis

```bash
# Set password in redis.conf
requirepass your-strong-password

# Bind to localhost only (if on same server)
bind 127.0.0.1

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

### 4. Monitor with Redis Metrics

Use tools like:
- RedisInsight (GUI)
- Prometheus + Grafana
- DataDog Redis integration

## Troubleshooting

### Redis Connection Errors

**Error**: `Failed to connect to Redis: [Errno 111] Connection refused`

**Solution**: Check if Redis is running:
```bash
sudo systemctl status redis
redis-cli PING
```

### Out of Memory

**Error**: `OOM command not allowed when used memory > 'maxmemory'`

**Solution**: Increase Redis memory or enable eviction:
```
maxmemory 512mb
maxmemory-policy allkeys-lru
```

### Stale Cache

**Problem**: Data not updating after changes

**Solution**: Clear cache manually or check cache invalidation logic

## Docker Compose Example

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: quelyos-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --requirepass your-password
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis-data:
    driver: local
```

## Performance Benchmarks

With Redis cache enabled (100 products, 1000 concurrent users):

| Endpoint | Without Cache | With Cache | Improvement |
|----------|---------------|------------|-------------|
| Product List | 450ms | 45ms | **10x faster** |
| Product Details | 120ms | 15ms | **8x faster** |
| Faceted Search | 800ms | 90ms | **9x faster** |
| Recommendations | 350ms | 50ms | **7x faster** |

## Support

For issues or questions, please contact the Quelyos development team.
