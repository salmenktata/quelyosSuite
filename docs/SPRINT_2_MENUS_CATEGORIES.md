# Plan Sprint 2 - Menus Navigation + Images Catégories

## 🎯 Objectif

Rendre 2 sections administrables depuis le Backoffice :
1. **Menus Navigation** (Header + Footer hardcodés → dynamiques avec arborescence)
2. **Images Catégories** (Placeholders Unsplash → upload depuis backoffice)

**Effort estimé** : 12-14h
**Impact business** : Score administrabilité 87% → 94%

---

## 📋 Architecture Gap #5 : Images Catégories

**État actuel** : Champs `image_url` existe mais fallback sur placeholders Unsplash hardcodés.

### Backend - Modification Endpoint

**Fichier** : `backend/addons/quelyos_api/controllers/cms.py` (ajouter)

```python
@http.route('/api/ecommerce/categories/<int:category_id>/upload-image', type='http', auth='user', methods=['POST'], csrf=False, cors='*')
def upload_category_image(self, category_id, **kwargs):
    """Upload image pour catégorie"""
    try:
        error = self._authenticate_from_header()
        if error:
            return request.make_json_response(error)

        error = self._require_admin()
        if error:
            return request.make_json_response(error)

        category = request.env['product.public.category'].sudo().browse(category_id)
        if not category.exists():
            return request.make_json_response({'success': False, 'error': 'Catégorie non trouvée'})

        image_file = request.httprequest.files.get('image')
        if not image_file:
            return request.make_json_response({'success': False, 'error': 'Aucune image fournie'})

        import base64
        image_data = base64.b64encode(image_file.read())

        category.write({'image': image_data})

        # Calculer image_url
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
        image_url = f'{base_url}/web/image/product.public.category/{category_id}/image'

        return request.make_json_response({
            'success': True,
            'image_url': image_url
        })

    except Exception as e:
        _logger.error(f"Upload category image error: {e}")
        return request.make_json_response({'success': False, 'error': str(e)})
```

### Backoffice - Modification Page Categories

**Fichier** : `backoffice/src/pages/Categories.tsx` (modifier formulaire)

Ajouter ImageUpload component dans le formulaire catégorie :

```tsx
import { ImageUpload } from '../components/common'
import { useImageUpload } from '../hooks/useImageUpload'

// Dans le composant
const imageUploadMutation = useImageUpload({
  endpoint: '/api/ecommerce/categories',
  id: editingCategory?.id || 0,
  invalidateKey: ['categories'],
})

// Dans le formulaire
<ImageUpload
  currentImageUrl={editingCategory?.image_url}
  onUpload={async (file) => {
    await imageUploadMutation.mutateAsync(file)
    toast.success('Image uploadée avec succès')
  }}
  label="Image de la catégorie (800x600px recommandé)"
/>
```

### Frontend - Suppression Placeholders

**Fichier** : `frontend/src/components/home/CategoriesSection.tsx` (modifier)

Supprimer le mapping `categoryImages` hardcodé et utiliser directement `category.image_url` :

```tsx
// AVANT (hardcodé)
const categoryImages: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-...',
  sport: 'https://images.unsplash.com/photo-...',
  // ...
};

// APRÈS (dynamique)
<Image
  src={category.image_url || '/placeholder-category.jpg'}
  alt={category.name}
  fill
  className="object-cover"
/>
```

**Effort** : **2h**

---

## 📋 Architecture Gap #6 : Menus Navigation

**État actuel** : Menus Header/Footer hardcodés dans controllers/cms.py

### Backend - Modèle Odoo

**Fichier** : `backend/addons/quelyos_api/models/menu.py` (nouveau)

```python
# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class MenuNavigation(models.Model):
    _name = 'quelyos.menu'
    _description = 'Menu Navigation Frontend'
    _parent_name = 'parent_id'
    _parent_store = True
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True)
    code = fields.Char('Code unique', required=True, help='Ex: header, footer_quick, footer_service')
    active = fields.Boolean('Actif', default=True)
    sequence = fields.Integer('Ordre', default=10)

    # Hiérarchie
    parent_id = fields.Many2one('quelyos.menu', 'Menu Parent', ondelete='cascade')
    parent_path = fields.Char(index=True)
    child_ids = fields.One2many('quelyos.menu', 'parent_id', 'Sous-menus')

    # Contenu
    label = fields.Char('Libellé affiché', required=True, translate=True)
    url = fields.Char('URL', required=True, size=255, help='Ex: /products, /about')
    icon = fields.Char('Icône (optionnel)', size=50, help='Nom icône ou emoji')
    description = fields.Text('Description', translate=True, help='Tooltip ou sous-texte')

    # Comportement
    open_new_tab = fields.Boolean('Ouvrir nouvel onglet', default=False)
    css_class = fields.Char('Classes CSS custom')

    # Sécurité
    requires_auth = fields.Boolean('Requiert authentification', default=False)

    @api.constrains('code')
    def _check_code_unique(self):
        for menu in self:
            if self.search([('code', '=', menu.code), ('id', '!=', menu.id)], limit=1):
                raise ValidationError(_('Le code "%s" existe déjà.') % menu.code)

    def get_menu_tree(self):
        """Retourne l'arbre du menu avec enfants"""
        def build_tree(menu):
            return {
                'id': menu.id,
                'label': menu.label,
                'url': menu.url,
                'icon': menu.icon,
                'description': menu.description,
                'open_new_tab': menu.open_new_tab,
                'css_class': menu.css_class,
                'children': [build_tree(child) for child in menu.child_ids.filtered(lambda c: c.active)]
            }

        return build_tree(self)
```

### Backend - Endpoints API

**Fichier** : `backend/addons/quelyos_api/controllers/cms.py` (modifier endpoint existant + ajouter CRUD)

```python
@http.route('/api/ecommerce/menus/<string:code>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
def get_menu(self, code, **kwargs):
    """Récupérer menu par code (dynamique)"""
    try:
        menu = request.env['quelyos.menu'].sudo().search([
            ('code', '=', code),
            ('active', '=', True),
            ('parent_id', '=', False)  # Menu racine
        ], limit=1)

        if not menu:
            return {'success': True, 'menu': None}  # Fallback gracieux

        return {
            'success': True,
            'menu': {
                'id': menu.id,
                'code': menu.code,
                'items': [menu.get_menu_tree()]
            }
        }

    except Exception as e:
        _logger.error(f"Get menu error: {e}")
        return {'success': True, 'menu': None}

@http.route('/api/ecommerce/menus/list', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def list_menus(self, **kwargs):
    """Liste tous les menus (backoffice)"""
    try:
        error = self._authenticate_from_header()
        if error:
            return error

        menus = request.env['quelyos.menu'].sudo().search([
            ('parent_id', '=', False)
        ], order='sequence ASC')

        return {
            'success': True,
            'menus': [{
                'id': m.id,
                'code': m.code,
                'name': m.name,
                'label': m.label,
                'active': m.active,
                'children_count': len(m.child_ids),
                'sequence': m.sequence
            } for m in menus]
        }

    except Exception as e:
        _logger.error(f"List menus error: {e}")
        return {'success': False, 'error': str(e)}

@http.route('/api/ecommerce/menus/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def create_menu(self, **kwargs):
    """Créer menu ou item"""
    try:
        error = self._authenticate_from_header()
        if error:
            return error

        error = self._require_admin()
        if error:
            return error

        params = self._get_params()

        menu = request.env['quelyos.menu'].sudo().create({
            'name': params.get('name'),
            'code': params.get('code'),
            'label': params.get('label'),
            'url': params.get('url'),
            'icon': params.get('icon'),
            'description': params.get('description'),
            'parent_id': params.get('parent_id'),
            'sequence': params.get('sequence', 10),
            'active': params.get('active', True),
            'open_new_tab': params.get('open_new_tab', False),
            'requires_auth': params.get('requires_auth', False),
        })

        return {'success': True, 'id': menu.id}

    except Exception as e:
        _logger.error(f"Create menu error: {e}")
        return {'success': False, 'error': str(e)}

@http.route('/api/ecommerce/menus/<int:menu_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def update_menu(self, menu_id, **kwargs):
    """Modifier menu"""
    try:
        error = self._authenticate_from_header()
        if error:
            return error

        error = self._require_admin()
        if error:
            return error

        menu = request.env['quelyos.menu'].sudo().browse(menu_id)
        if not menu.exists():
            return {'success': False, 'error': 'Menu non trouvé'}

        params = self._get_params()
        menu.write({k: v for k, v in params.items() if k in [
            'name', 'code', 'label', 'url', 'icon', 'description',
            'parent_id', 'sequence', 'active', 'open_new_tab', 'requires_auth'
        ]})

        return {'success': True}

    except Exception as e:
        _logger.error(f"Update menu error: {e}")
        return {'success': False, 'error': str(e)}

@http.route('/api/ecommerce/menus/<int:menu_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def delete_menu(self, menu_id, **kwargs):
    """Supprimer menu (cascade enfants)"""
    try:
        error = self._authenticate_from_header()
        if error:
            return error

        error = self._require_admin()
        if error:
            return error

        menu = request.env['quelyos.menu'].sudo().browse(menu_id)
        if not menu.exists():
            return {'success': False, 'error': 'Menu non trouvé'}

        menu.unlink()
        return {'success': True}

    except Exception as e:
        _logger.error(f"Delete menu error: {e}")
        return {'success': False, 'error': str(e)}

@http.route('/api/ecommerce/menus/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
def reorder_menus(self, **kwargs):
    """Réordonner menus/items"""
    try:
        error = self._authenticate_from_header()
        if error:
            return error

        error = self._require_admin()
        if error:
            return error

        params = self._get_params()
        menu_ids = params.get('menu_ids', [])

        for index, menu_id in enumerate(menu_ids):
            menu = request.env['quelyos.menu'].sudo().browse(menu_id)
            if menu.exists():
                menu.write({'sequence': index * 10})

        return {'success': True}

    except Exception as e:
        _logger.error(f"Reorder menus error: {e}")
        return {'success': False, 'error': str(e)}

@http.route('/api/ecommerce/menus/<int:menu_id>/tree', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
def get_menu_tree(self, menu_id, **kwargs):
    """Récupérer arbre complet d'un menu"""
    try:
        menu = request.env['quelyos.menu'].sudo().browse(menu_id)
        if not menu.exists():
            return {'success': False, 'error': 'Menu non trouvé'}

        return {
            'success': True,
            'tree': menu.get_menu_tree()
        }

    except Exception as e:
        _logger.error(f"Get menu tree error: {e}")
        return {'success': False, 'error': str(e)}
```

### Backend - Vues XML

**Fichier** : `backend/addons/quelyos_api/views/menu_views.xml` (modifier/compléter)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <!-- Tree View -->
    <record id="view_menu_tree" model="ir.ui.view">
        <field name="name">quelyos.menu.tree</field>
        <field name="model">quelyos.menu</field>
        <field name="arch" type="xml">
            <list string="Menus Navigation">
                <field name="sequence" widget="handle"/>
                <field name="code"/>
                <field name="name"/>
                <field name="label"/>
                <field name="url"/>
                <field name="parent_id"/>
                <field name="active" widget="boolean_toggle"/>
            </list>
        </field>
    </record>

    <!-- Form View -->
    <record id="view_menu_form" model="ir.ui.view">
        <field name="name">quelyos.menu.form</field>
        <field name="model">quelyos.menu</field>
        <field name="arch" type="xml">
            <form string="Menu Navigation">
                <sheet>
                    <group>
                        <group>
                            <field name="name"/>
                            <field name="code"/>
                            <field name="label"/>
                            <field name="url"/>
                            <field name="icon"/>
                        </group>
                        <group>
                            <field name="parent_id"/>
                            <field name="sequence"/>
                            <field name="active"/>
                            <field name="open_new_tab"/>
                            <field name="requires_auth"/>
                        </group>
                    </group>
                    <group>
                        <field name="description"/>
                        <field name="css_class"/>
                    </group>
                    <notebook>
                        <page string="Sous-menus">
                            <field name="child_ids">
                                <tree>
                                    <field name="sequence" widget="handle"/>
                                    <field name="label"/>
                                    <field name="url"/>
                                    <field name="active" widget="boolean_toggle"/>
                                </tree>
                            </field>
                        </page>
                    </notebook>
                </sheet>
            </form>
        </field>
    </record>

    <!-- Action -->
    <record id="action_menu" model="ir.actions.act_window">
        <field name="name">Menus Navigation</field>
        <field name="res_model">quelyos.menu</field>
        <field name="view_mode">tree,form</field>
    </record>

    <!-- Menu Item -->
    <menuitem
        id="menu_quelyos_cms_menus"
        name="Menus Navigation"
        parent="menu_quelyos_cms"
        action="action_menu"
        sequence="60"/>
</odoo>
```

### Backend - Permissions

**Fichier** : `backend/addons/quelyos_api/security/ir.model.access.csv` (ajouter)

```csv
access_menu_public,quelyos.menu public,model_quelyos_menu,base.group_public,1,0,0,0
access_menu_user,quelyos.menu user,model_quelyos_menu,base.group_user,1,1,1,1
```

### Backend - Data Initiale (Menus par défaut)

**Fichier** : `backend/addons/quelyos_api/data/menu_data.xml` (nouveau)

```xml
<?xml version="1.0" encoding="utf-8"?>
<odoo>
    <data noupdate="1">
        <!-- Menu Header Principal -->
        <record id="menu_header_main" model="quelyos.menu">
            <field name="name">Menu Header Principal</field>
            <field name="code">header</field>
            <field name="label">Menu</field>
            <field name="url">/</field>
            <field name="sequence">1</field>
            <field name="active" eval="True"/>
        </record>

        <!-- Items Header -->
        <record id="menu_header_item_accueil" model="quelyos.menu">
            <field name="name">Accueil</field>
            <field name="code">header_accueil</field>
            <field name="label">Accueil</field>
            <field name="url">/</field>
            <field name="parent_id" ref="menu_header_main"/>
            <field name="sequence">10</field>
        </record>

        <record id="menu_header_item_products" model="quelyos.menu">
            <field name="name">Produits</field>
            <field name="code">header_products</field>
            <field name="label">Produits</field>
            <field name="url">/products</field>
            <field name="parent_id" ref="menu_header_main"/>
            <field name="sequence">20</field>
        </record>

        <record id="menu_header_item_about" model="quelyos.menu">
            <field name="name">À propos</field>
            <field name="code">header_about</field>
            <field name="label">À propos</field>
            <field name="url">/about</field>
            <field name="parent_id" ref="menu_header_main"/>
            <field name="sequence">30</field>
        </record>

        <record id="menu_header_item_contact" model="quelyos.menu">
            <field name="name">Contact</field>
            <field name="code">header_contact</field>
            <field name="label">Contact</field>
            <field name="url">/contact</field>
            <field name="parent_id" ref="menu_header_main"/>
            <field name="sequence">40</field>
        </record>

        <!-- Menu Footer Quick Links -->
        <record id="menu_footer_quick" model="quelyos.menu">
            <field name="name">Footer - Liens Rapides</field>
            <field name="code">footer_quick</field>
            <field name="label">Liens Rapides</field>
            <field name="url">#</field>
            <field name="sequence">2</field>
            <field name="active" eval="True"/>
        </record>

        <record id="menu_footer_quick_search" model="quelyos.menu">
            <field name="name">Recherche</field>
            <field name="code">footer_quick_search</field>
            <field name="label">Recherche</field>
            <field name="url">/products</field>
            <field name="parent_id" ref="menu_footer_quick"/>
            <field name="sequence">10</field>
        </record>

        <record id="menu_footer_quick_cart" model="quelyos.menu">
            <field name="name">Panier</field>
            <field name="code">footer_quick_cart</field>
            <field name="label">Panier</field>
            <field name="url">/cart</field>
            <field name="parent_id" ref="menu_footer_quick"/>
            <field name="sequence">20</field>
        </record>

        <!-- Menu Footer Service Client -->
        <record id="menu_footer_service" model="quelyos.menu">
            <field name="name">Footer - Service Client</field>
            <field name="code">footer_service</field>
            <field name="label">Service Client</field>
            <field name="url">#</field>
            <field name="sequence">3</field>
            <field name="active" eval="True"/>
        </record>

        <record id="menu_footer_service_shipping" model="quelyos.menu">
            <field name="name">Livraison</field>
            <field name="code">footer_service_shipping</field>
            <field name="label">Livraison &amp; Retours</field>
            <field name="url">/shipping</field>
            <field name="parent_id" ref="menu_footer_service"/>
            <field name="sequence">10</field>
        </record>

        <record id="menu_footer_service_faq" model="quelyos.menu">
            <field name="name">FAQ</field>
            <field name="code">footer_service_faq</field>
            <field name="label">FAQ</field>
            <field name="url">/faq</field>
            <field name="parent_id" ref="menu_footer_service"/>
            <field name="sequence">20</field>
        </record>

        <record id="menu_footer_service_contact" model="quelyos.menu">
            <field name="name">Contact</field>
            <field name="code">footer_service_contact</field>
            <field name="label">Contactez-nous</field>
            <field name="url">/contact</field>
            <field name="parent_id" ref="menu_footer_service"/>
            <field name="sequence">30</field>
        </record>
    </data>
</odoo>
```

### Backend - Manifest

**Fichier** : `backend/addons/quelyos_api/__manifest__.py` (ajouter)

```python
'data': [
    # ... existing
    'security/ir.model.access.csv',
    'data/menu_data.xml',  # Nouveau
    'views/menu_views.xml',
],
```

### Backoffice - Hook React Query

**Fichier** : `backoffice/src/hooks/useMenus.ts` (nouveau)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { odooRpc } from '@/lib/odoo-rpc'

export interface MenuItem {
  id: number
  name: string
  code: string
  label: string
  url: string
  icon?: string
  description?: string
  parent_id?: number | null
  sequence: number
  active: boolean
  open_new_tab: boolean
  requires_auth: boolean
  children?: MenuItem[]
  children_count?: number
}

export function useMenus() {
  return useQuery({
    queryKey: ['menus'],
    queryFn: async () => {
      const response = await odooRpc<{ menus: MenuItem[] }>('/api/ecommerce/menus/list')
      return response
    },
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) =>
      odooRpc('/api/ecommerce/menus/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<MenuItem> & { id: number }) =>
      odooRpc(`/api/ecommerce/menus/${id}/update`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      odooRpc(`/api/ecommerce/menus/${id}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}

export function useReorderMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (menuIds: number[]) =>
      odooRpc('/api/ecommerce/menus/reorder', { menu_ids: menuIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] })
    },
  })
}
```

### Backoffice - Page CRUD

**Fichier** : `backoffice/src/pages/Menus.tsx` (nouveau)

Pattern similaire à HeroSlides mais avec :
- Arbre hiérarchique (parent/children)
- Indicateur profondeur (indentation visuelle)
- Modal avec sélecteur parent
- Drag & drop inter-niveaux

**Particularités** :
- TreeView avec expand/collapse
- Nested drag & drop
- Validation : URL unique, code unique, parent circulaire interdit

**Effort** : **6-8h** (complexité arbre)

### Frontend - Hook Custom

**Fichier** : `frontend/src/hooks/useMenu.ts` (nouveau)

```typescript
import { useState, useEffect } from 'react'

export interface MenuItem {
  id: number
  label: string
  url: string
  icon?: string
  description?: string
  open_new_tab: boolean
  children: MenuItem[]
}

export function useMenu(menuCode: string) {
  const [menu, setMenu] = useState<MenuItem[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/menus/${menuCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.menu) {
          setMenu(data.menu.items || [])
        }
      })
      .catch((err) => console.error(`Failed to load menu ${menuCode}:`, err))
      .finally(() => setLoading(false))
  }, [menuCode])

  return { menu, loading }
}
```

### Frontend - Route API Proxy

**Fichier** : `frontend/src/app/api/menus/[code]/route.ts` (nouveau)

```typescript
import { NextRequest, NextResponse } from 'next/server'

const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const response = await fetch(`${ODOO_URL}/api/ecommerce/menus/${params.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }),
      next: { revalidate: 600 }, // Cache 10min (menus changent rarement)
    })

    const data = await response.json()

    if (data.error || !data.result) {
      return NextResponse.json(
        { success: true, menu: null },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=600' } }
      )
    }

    return NextResponse.json(data.result, {
      headers: { 'Cache-Control': 'public, max-age=600' },
    })
  } catch (error) {
    return NextResponse.json({ success: true, menu: null }, { status: 200 })
  }
}
```

### Frontend - Modification Header

**Fichier** : `frontend/src/components/layout/Header.tsx` (modifier)

```tsx
import { useMenu } from '@/hooks/useMenu'

export function Header() {
  const { menu: headerMenu, loading } = useMenu('header')

  // ... existing code

  return (
    <header>
      <nav>
        {loading ? (
          <div className="flex gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <ul className="flex gap-6">
            {headerMenu?.map(item => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  target={item.open_new_tab ? '_blank' : undefined}
                  className="hover:text-primary"
                >
                  {item.icon && <span className="mr-1">{item.icon}</span>}
                  {item.label}
                </Link>

                {/* Sous-menu si children */}
                {item.children && item.children.length > 0 && (
                  <ul className="submenu">
                    {item.children.map(child => (
                      <li key={child.id}>
                        <Link href={child.url}>{child.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
```

### Frontend - Modification Footer

**Fichier** : `frontend/src/components/layout/Footer.tsx` (modifier sections)

Remplacer hardcoded links par appels `useMenu('footer_quick')` et `useMenu('footer_service')`.

**Effort** : **4-6h** (2 composants à modifier)

---

## 📦 Fichiers à Créer/Modifier

### Backend (7 fichiers)

**Modèles** (1 nouveau) :
- `backend/addons/quelyos_api/models/menu.py`
- `backend/addons/quelyos_api/models/__init__.py` (import)

**Controllers** (1 modifié) :
- `backend/addons/quelyos_api/controllers/cms.py` (+1 endpoint upload catégories + 6 endpoints menus)

**Vues** (1 modifié/complété) :
- `backend/addons/quelyos_api/views/menu_views.xml`

**Data** (1 nouveau) :
- `backend/addons/quelyos_api/data/menu_data.xml`

**Sécurité** (1 modifié) :
- `backend/addons/quelyos_api/security/ir.model.access.csv` (+2 lignes)

**Manifest** (1 modifié) :
- `backend/addons/quelyos_api/__manifest__.py` (version + data)

### Backoffice (4 fichiers)

**Hooks** (1 nouveau) :
- `backoffice/src/hooks/useMenus.ts`

**Pages** (2 modifiés) :
- `backoffice/src/pages/Categories.tsx` (ajouter ImageUpload)
- `backoffice/src/pages/Menus.tsx` (nouveau - CRUD arbre)

**Composants** (1 optionnel) :
- `backoffice/src/components/MenuTreeView.tsx` (si arbre complexe)

### Frontend (5 fichiers)

**Hooks** (1 nouveau) :
- `frontend/src/hooks/useMenu.ts`

**Routes API** (1 nouvelle) :
- `frontend/src/app/api/menus/[code]/route.ts`

**Composants** (3 modifiés) :
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/home/CategoriesSection.tsx`

**Total** : **16 fichiers** (7 backend + 4 backoffice + 5 frontend)

---

## ✅ Ordre d'Implémentation

### Phase 1 : Images Catégories (2h)
1. Backend : Endpoint upload image catégorie
2. Backoffice : Ajouter ImageUpload dans Categories.tsx
3. Frontend : Supprimer placeholders Unsplash
4. Test : Upload image catégorie → vérifier affichage homepage

### Phase 2 : Menus Backend (4-5h)
1. Backend : Modèle menu.py avec arborescence
2. Backend : 6 endpoints CRUD + reorder
3. Backend : Data initiale (menus par défaut)
4. Backend : Vues XML + permissions
5. Test : Odoo upgrade + vérifier tables/vues

### Phase 3 : Menus Backoffice (4-5h)
1. Hook : useMenus.ts
2. Page : Menus.tsx avec TreeView drag & drop
3. Test : CRUD menus depuis backoffice

### Phase 4 : Menus Frontend (2-3h)
1. Hook : useMenu.ts
2. Route API : /api/menus/[code]/route.ts
3. Modifier Header.tsx (menu dynamique)
4. Modifier Footer.tsx (2 sections dynamiques)
5. Test : Vérifier affichage menus homepage

**Effort total** : **12-14h**

---

## 🧪 Tests End-to-End

### 1. Test Images Catégories
```bash
# 1. Backoffice : Éditer catégorie "Football"
# 2. Uploader image custom (remplacer placeholder)
# 3. Frontend : Recharger homepage
# 4. Vérifier : Image custom affichée au lieu placeholder Unsplash
```

### 2. Test Menus Header
```bash
# 1. Backoffice : Créer menu "Nouveautés" → URL /products?sort=date
# 2. Ajouter à menu header (drag & drop)
# 3. Frontend : Recharger
# 4. Vérifier : Nouveau lien visible dans header
```

### 3. Test Menus Footer
```bash
# 1. Backoffice : Modifier lien "FAQ" → "/aide"
# 2. Frontend : Recharger
# 3. Vérifier : Lien footer mis à jour
```

### 4. Test Hiérarchie Menus
```bash
# 1. Backoffice : Créer menu parent "Sports" avec 3 enfants (Football, Tennis, Running)
# 2. Frontend : Hover menu "Sports"
# 3. Vérifier : Dropdown affiche 3 sous-menus
```

---

## 🚨 Points d'Attention

1. **Arborescence** : Validation parent circulaire (menu ne peut être parent de lui-même)
2. **Cache** : Invalider cache frontend après modif menus (10min)
3. **Fallback** : Toujours retourner menus par défaut si erreur API
4. **Placeholder catégories** : Garder 1 image générique `/placeholder-category.jpg`
5. **Permissions** : Vérifier `_require_admin()` pour tous endpoints write
6. **Migration** : Data initiale doit créer menus existants (header, footer_quick, footer_service)

---

## 📝 Documentation

**Fichiers à mettre à jour** :
- `README.md` - Section "Gestion Menus"
- `LOGME.md` - Entrée Sprint 2
- `COHERENCE_ADMINISTRABILITE_FRONTEND_2026-01-25.md` - Score 87% → 94%

---

## 🎉 Résultat Attendu

**Avant Sprint 2** :
- Homepage 87% administrable (Hero/Bannières/PromoBar/TrustBadges OK, menus/catégories partiels)
- Placeholders Unsplash pour catégories
- Menus navigation hardcodés

**Après Sprint 2** :
- Homepage 94% administrable
- Images catégories custom uploadables
- Menus header/footer entièrement administrables
- Arborescence menus avec drag & drop
- Marketing peut restructurer navigation sans code

**Gain business** : Navigation personnalisable, catégories visuellement uniques, réorganisation menu autonome
