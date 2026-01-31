# Nginx Security Configuration

Configuration nginx pour sécuriser l'API Quelyos avec CORS restrictif et rate limiting.

## Fichiers

- `quelyos-api-security.conf` - Configuration principale nginx

## Déploiement Rapide

```bash
# Développement local
sudo cp quelyos-api-security.conf /usr/local/etc/nginx/servers/
sudo nginx -t && sudo nginx -s reload

# Production
sudo cp quelyos-api-security.conf /etc/nginx/conf.d/
sudo nginx -t && sudo systemctl reload nginx
```

## Fonctionnalités

✅ **CORS Restrictif** - Liste blanche domaines autorisés  
✅ **Rate Limiting** - Protection DoS (100-200 req/min selon endpoint)  
✅ **Headers Sécurité** - CSP, X-Frame-Options, HSTS  
✅ **Protection CSRF** - Vérification Origin  

## Documentation

Voir `docs/SECURITY_P1_FIXES.md` pour détails complets.
