/**
 * API Response Anonymizer
 * Transforms backend-specific field names to standard e-commerce conventions
 */

// Mapping des champs backend → standards
const FIELD_MAPPINGS: Record<string, string> = {
  // Prix
  list_price: 'price',
  standard_price: 'cost_price',

  // Identifiants
  default_code: 'sku',
  categ_id: 'category_id',

  // Stock
  qty_available: 'stock_quantity',
  virtual_available: 'available_quantity',
  outgoing_qty: 'reserved_quantity',
  incoming_qty: 'incoming_quantity',

  // Dates (snake_case Odoo → snake_case standard)
  create_date: 'created_at',
  write_date: 'updated_at',

  // Relations
  attribute_lines: 'attributes',
  product_template_attribute_value_ids: 'attribute_value_ids',
  product_variant_ids: 'variant_ids',

  // Pricelist
  pricelist_id: 'price_list_id',
  applied_on: 'apply_to',
  compute_price: 'price_computation',

  // Partner/Customer
  'res.partner': 'customer',
  partner_id: 'customer_id',
};

// Valeurs à transformer
const VALUE_MAPPINGS: Record<string, Record<string, string>> = {
  apply_to: {
    '3_global': 'all_products',
    '2_product_category': 'category',
    '1_product': 'product',
    '0_product_variant': 'variant',
  },
  price_computation: {
    fixed: 'fixed_price',
    percentage: 'percentage_discount',
    formula: 'formula',
  },
};

// Mode transition : garder les deux noms (ancien + nouveau)
// Passer à false pour migration complète
const DUAL_NAMING_MODE = false;

/**
 * Transforme récursivement un objet en renommant les champs
 */
export function anonymizeResponse<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => anonymizeResponse(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      // Transformer la valeur récursivement
      let newValue = anonymizeResponse(value);

      // Appliquer mapping de valeurs si applicable
      const standardKey = FIELD_MAPPINGS[key];
      if (standardKey && VALUE_MAPPINGS[standardKey] && typeof newValue === 'string') {
        newValue = VALUE_MAPPINGS[standardKey][newValue] || newValue;
      }

      if (DUAL_NAMING_MODE) {
        // Garder l'ancien nom
        result[key] = newValue;
        // Ajouter le nouveau nom si mapping existe
        if (standardKey) {
          result[standardKey] = newValue;
        }
      } else {
        // Mode migration complète : renommer uniquement
        const newKey = standardKey || key;
        result[newKey] = newValue;
      }
    }

    return result as T;
  }

  return data;
}

/**
 * Transforme les paramètres de requête (inverse mapping pour envoi au backend)
 */
export function denormalizeRequest<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Créer mapping inverse
  const reverseFieldMappings: Record<string, string> = {};
  for (const [odooKey, standardKey] of Object.entries(FIELD_MAPPINGS)) {
    reverseFieldMappings[standardKey] = odooKey;
  }

  if (Array.isArray(data)) {
    return data.map(item => denormalizeRequest(item)) as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const originalKey = reverseFieldMappings[key] || key;
      result[originalKey] = denormalizeRequest(value);
    }

    return result as T;
  }

  return data;
}

/**
 * Liste des endpoints à anonymiser (tous par défaut)
 * Mettre à false pour désactiver sur certains endpoints
 */
export const ANONYMIZE_ENDPOINTS: Record<string, boolean> = {
  '/products': true,
  '/categories': true,
  '/cart': true,
  '/orders': true,
  '/customers': true,
  '/pricelists': true,
};

/**
 * Vérifie si un endpoint doit être anonymisé
 */
export function shouldAnonymize(path: string): boolean {
  // Par défaut, anonymiser tout
  for (const [endpoint, enabled] of Object.entries(ANONYMIZE_ENDPOINTS)) {
    if (path.includes(endpoint) && !enabled) {
      return false;
    }
  }
  return true;
}
