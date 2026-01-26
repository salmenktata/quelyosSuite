# Configuration DNS - quelyos.com sur VPS Contabo

## Informations Requises

Avant de configurer les DNS, récupérez l'IP publique de votre VPS Contabo :

```bash
# Sur votre VPS Contabo, exécuter :
curl -4 ifconfig.me
# Exemple de résultat : 185.215.123.45
```

---

## Enregistrements DNS à Créer

Chez votre registrar DNS (ex: OVH, Cloudflare, Namecheap, etc.), créez les enregistrements suivants :

### 1. Domaine Principal (E-commerce Frontend)

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | @ (ou quelyos.com) | `[IP_VPS]` | 3600 |
| A | www | `[IP_VPS]` | 3600 |

**Résultat :**
- `https://quelyos.com` → Frontend Next.js (port 3001)
- `https://www.quelyos.com` → Frontend Next.js (port 3001)

---

### 2. Sous-domaine Backoffice (Admin)

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | admin | `[IP_VPS]` | 3600 |

**Résultat :**
- `https://admin.quelyos.com` → Backoffice React (port 5175)

---

### 3. Sous-domaine API (Backend Odoo)

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | api | `[IP_VPS]` | 3600 |

**Résultat :**
- `https://api.quelyos.com` → Backend Odoo (port 8069)

---

## Exemple Concret

Si votre IP VPS Contabo est **185.215.123.45**, configurez :

```
quelyos.com         A    185.215.123.45    3600
www.quelyos.com     A    185.215.123.45    3600
admin.quelyos.com   A    185.215.123.45    3600
api.quelyos.com     A    185.215.123.45    3600
```

---

## Vérification DNS (après propagation 15-60 min)

```bash
# Vérifier propagation DNS
dig +short quelyos.com
dig +short admin.quelyos.com
dig +short api.quelyos.com

# Test résolution depuis votre machine locale
nslookup quelyos.com
nslookup admin.quelyos.com
nslookup api.quelyos.com
```

**Attendu :** Tous doivent retourner l'IP de votre VPS.

---

## Configuration SSL/TLS (Let's Encrypt)

Après déploiement sur VPS, configurer SSL automatique via Certbot :

```bash
# Sur VPS, installer Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Générer certificats SSL pour tous les domaines
sudo certbot --nginx -d quelyos.com -d www.quelyos.com -d admin.quelyos.com -d api.quelyos.com

# Renouvellement automatique (cron déjà configuré par certbot)
sudo certbot renew --dry-run
```

**Résultat :** HTTPS activé automatiquement pour tous les domaines.

---

## Nginx Reverse Proxy Configuration

Sur le VPS, Nginx routera les requêtes vers les bons services :

```nginx
# /etc/nginx/sites-available/quelyos.conf

# Frontend E-commerce (quelyos.com)
server {
    listen 80;
    listen 443 ssl http2;
    server_name quelyos.com www.quelyos.com;

    ssl_certificate /etc/letsencrypt/live/quelyos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quelyos.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backoffice Admin (admin.quelyos.com)
server {
    listen 80;
    listen 443 ssl http2;
    server_name admin.quelyos.com;

    ssl_certificate /etc/letsencrypt/live/quelyos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quelyos.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5175;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend Odoo API (api.quelyos.com)
server {
    listen 80;
    listen 443 ssl http2;
    server_name api.quelyos.com;

    ssl_certificate /etc/letsencrypt/live/quelyos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/quelyos.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8069;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_redirect off;
    }
}
```

**Activer la configuration :**
```bash
sudo ln -s /etc/nginx/sites-available/quelyos.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Timeline de Propagation DNS

- **0-15 min** : Propagation rapide (serveurs DNS majeurs)
- **15-60 min** : Propagation mondiale (99% des utilisateurs)
- **24-48h** : Propagation complète garantie (100%)

**Recommandation :** Attendre 30 minutes après configuration DNS avant de tester le déploiement.

---

## Checklist DNS

- [ ] IP publique VPS récupérée
- [ ] Enregistrement A pour `quelyos.com` créé
- [ ] Enregistrement A pour `www.quelyos.com` créé
- [ ] Enregistrement A pour `admin.quelyos.com` créé
- [ ] Enregistrement A pour `api.quelyos.com` créé
- [ ] Propagation DNS vérifiée (dig/nslookup)
- [ ] Certificats SSL générés (certbot)
- [ ] Nginx reverse proxy configuré
- [ ] HTTPS fonctionne sur tous domaines
