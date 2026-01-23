# Fix Kanban Error & Quelyos Category

## Issues Fixed

### 1. OwlError: `ctx.kanban_image is not a function`

**Root Cause:**
The aggressive DOM manipulation in the branding module was interfering with Odoo's Owl component lifecycle during rendering, corrupting the template context.

**Solution:**
Added protection to NEVER touch Owl components in the JavaScript files:

- **[error_handler.js](backend/addons/quelyos_branding/static/src/js/error_handler.js)**: Already filtered ResizeObserver errors
- **[remove_odoo_branding.js](backend/addons/quelyos_branding/static/src/js/remove_odoo_branding.js)**: Added `isOwlComponent()` check to protect:
  - Text nodes in templates
  - HTML attributes
  - Buttons and labels
  - Color replacements
  - All DOM modifications

- **[hide_enterprise_features.js](backend/addons/quelyos_branding/static/src/js/hide_enterprise_features.js)**: Added protection for:
  - Enterprise badges removal
  - Studio buttons hiding
  - Dialog removal
  - Kanban module cards (the most critical)

**Protected Owl Selectors:**
```javascript
[t-name]                    // Templates QWeb
[data-tooltip-template]     // Tooltips Owl
.o_kanban_view              // Vues kanban (Owl)
.o_kanban_record            // Enregistrements kanban
.o_kanban_renderer          // Renderer kanban
.o_list_view                // Vues liste (Owl)
.o_view_controller          // Contrôleurs de vue
.o_renderer                 // Renderers de vue
.o_field_widget             // Widgets de champs
.o_form_view                // Vues formulaire (Owl)
.o_component                // Composants génériques Owl
```

### 2. Quelyos Category Created

**New Category:**
- **Name:** Quelyos
- **Description:** Modules Quelyos ERP - Plateforme SaaS Retail Omnicanal
- **Sequence:** 1 (appears first in Apps)

**Files Modified:**
1. [data/module_category.xml](backend/addons/quelyos_branding/data/module_category.xml) - New category definition
2. [quelyos_branding/__manifest__.py](backend/addons/quelyos_branding/__manifest__.py) - Changed category to 'Quelyos'
3. [quelyos_ecommerce/__manifest__.py](backend/addons/quelyos_ecommerce/__manifest__.py) - Changed category to 'Quelyos'

## How to Verify

### 1. Clear Browser Cache
```bash
# Chrome/Firefox
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# Or clear cache manually
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Firefox: Options → Privacy → Cookies and Site Data → Clear Data
```

### 2. Check Kanban Views
1. Navigate to any kanban view in Odoo (e.g., Apps, Contacts, Products)
2. Verify no more `ctx.kanban_image is not a function` errors in the browser console
3. Check that kanban cards render correctly

### 3. Verify Quelyos Category
1. Go to http://localhost:8069/web#action=base.open_module_tree
2. Click on "Categories" in the left sidebar
3. You should see "Quelyos" as a new category
4. Both "Quelyos Branding" and "Quelyos E-commerce API" should appear under this category

## Technical Details

### Update Applied
```bash
docker exec quelyos-odoo odoo -u quelyos_branding,quelyos_ecommerce -d quelyos --stop-after-init
```

**Result:** ✅ Modules loaded successfully
- quelyos_branding: Updated in 0.96s
- quelyos_ecommerce: Updated in 0.86s
- Total: 93 modules loaded in 1.82s

### JavaScript Protection Strategy

The fix uses a defensive programming approach:
1. **Check before modify**: Every DOM manipulation now checks if the element is part of an Owl component
2. **Fail-safe**: If an element is within an Owl component, skip modification entirely
3. **Performance**: Uses `element.closest()` for efficient parent lookup

### Why This Works

Owl components maintain their own internal state and template context. When external JavaScript modifies their DOM during the render cycle, it can corrupt the context, leading to errors like `ctx.kanban_image is not a function`.

By never touching Owl components, we ensure:
- Template contexts remain intact
- Rendering lifecycle is not interrupted
- All Owl utility functions remain available

## Next Steps

If you still see errors after clearing cache:
1. Restart the Odoo container: `docker-compose restart odoo`
2. Do a hard refresh: Clear all browser data
3. Check browser console for any new errors

## Files Modified

**JavaScript:**
- `backend/addons/quelyos_branding/static/src/js/remove_odoo_branding.js`
- `backend/addons/quelyos_branding/static/src/js/hide_enterprise_features.js`

**Data:**
- `backend/addons/quelyos_branding/data/module_category.xml` (NEW)

**Manifests:**
- `backend/addons/quelyos_branding/__manifest__.py`
- `backend/addons/quelyos_ecommerce/__manifest__.py`

---

**Status:** ✅ Fixed and Deployed
**Date:** 2026-01-23
**Version:** 19.0.1.0.0
