/**
 * Système i18n léger pour le frontend e-commerce
 * Centralise tous les labels UI pour faciliter les traductions futures
 */

export type Locale = 'fr' | 'en' | 'ar';

export interface TranslationKeys {
  // Products page
  'products.filter.title': string;
  'products.filter.clear': string;
  'products.filter.selections': string;
  'products.filter.featured': string;
  'products.filter.new': string;
  'products.filter.bestseller': string;
  'products.filter.price': string;
  'products.filter.price.apply': string;
  'products.filter.categories': string;
  'products.filter.categories.all': string;
  'products.sort.name': string;
  'products.sort.newest': string;
  'products.sort.price_asc': string;
  'products.sort.price_desc': string;
  'products.sort.popular': string;
  'products.empty': string;
  'products.empty.reset': string;
  'products.view.grid': string;
  'products.view.list': string;

  // Common
  'common.currency': string;
  'common.currency.symbol': string;
  'common.home': string;
  'common.products': string;
  'common.add_to_cart': string;
  'common.buy_now': string;
  'common.in_stock': string;
  'common.out_of_stock': string;
  'common.low_stock': string;

  // Cart
  'cart.title': string;
  'cart.empty': string;
  'cart.total': string;
  'cart.checkout': string;

  // Compare
  'compare.max_reached': string;
  'compare.add': string;
  'compare.remove': string;
}

const translations: Record<Locale, TranslationKeys> = {
  fr: {
    // Products page
    'products.filter.title': 'Filtrer',
    'products.filter.clear': 'Effacer tout',
    'products.filter.selections': 'Sélections',
    'products.filter.featured': 'Produits vedettes',
    'products.filter.new': 'Nouveautés',
    'products.filter.bestseller': 'Meilleures ventes',
    'products.filter.price': 'Prix',
    'products.filter.price.apply': 'Appliquer',
    'products.filter.categories': 'Catégories',
    'products.filter.categories.all': 'Toutes les catégories',
    'products.sort.name': 'Nom (A-Z)',
    'products.sort.newest': 'Nouveautés',
    'products.sort.price_asc': 'Prix croissant',
    'products.sort.price_desc': 'Prix décroissant',
    'products.sort.popular': 'Popularité',
    'products.empty': 'Aucun produit trouvé',
    'products.empty.reset': 'Réinitialiser les filtres',
    'products.view.grid': 'Vue grille',
    'products.view.list': 'Vue liste',

    // Common
    'common.currency': 'TND',
    'common.currency.symbol': 'DT',
    'common.home': 'Accueil',
    'common.products': 'Produits',
    'common.add_to_cart': 'Ajouter au panier',
    'common.buy_now': 'Acheter maintenant',
    'common.in_stock': 'En stock',
    'common.out_of_stock': 'Rupture de stock',
    'common.low_stock': 'Stock limité',

    // Cart
    'cart.title': 'Panier',
    'cart.empty': 'Votre panier est vide',
    'cart.total': 'Total',
    'cart.checkout': 'Commander',

    // Compare
    'compare.max_reached': 'Vous pouvez comparer maximum 4 produits',
    'compare.add': 'Ajouter à la comparaison',
    'compare.remove': 'Retirer de la comparaison',
  },

  en: {
    // Products page
    'products.filter.title': 'Filter',
    'products.filter.clear': 'Clear all',
    'products.filter.selections': 'Selections',
    'products.filter.featured': 'Featured products',
    'products.filter.new': 'New arrivals',
    'products.filter.bestseller': 'Bestsellers',
    'products.filter.price': 'Price',
    'products.filter.price.apply': 'Apply',
    'products.filter.categories': 'Categories',
    'products.filter.categories.all': 'All categories',
    'products.sort.name': 'Name (A-Z)',
    'products.sort.newest': 'Newest',
    'products.sort.price_asc': 'Price: Low to High',
    'products.sort.price_desc': 'Price: High to Low',
    'products.sort.popular': 'Popularity',
    'products.empty': 'No products found',
    'products.empty.reset': 'Reset filters',
    'products.view.grid': 'Grid view',
    'products.view.list': 'List view',

    // Common
    'common.currency': 'TND',
    'common.currency.symbol': 'DT',
    'common.home': 'Home',
    'common.products': 'Products',
    'common.add_to_cart': 'Add to cart',
    'common.buy_now': 'Buy now',
    'common.in_stock': 'In stock',
    'common.out_of_stock': 'Out of stock',
    'common.low_stock': 'Low stock',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',

    // Compare
    'compare.max_reached': 'You can compare up to 4 products',
    'compare.add': 'Add to comparison',
    'compare.remove': 'Remove from comparison',
  },

  ar: {
    // Products page
    'products.filter.title': 'تصفية',
    'products.filter.clear': 'مسح الكل',
    'products.filter.selections': 'التحديدات',
    'products.filter.featured': 'منتجات مميزة',
    'products.filter.new': 'جديد',
    'products.filter.bestseller': 'الأكثر مبيعاً',
    'products.filter.price': 'السعر',
    'products.filter.price.apply': 'تطبيق',
    'products.filter.categories': 'الفئات',
    'products.filter.categories.all': 'جميع الفئات',
    'products.sort.name': 'الاسم (أ-ي)',
    'products.sort.newest': 'الأحدث',
    'products.sort.price_asc': 'السعر: من الأقل إلى الأعلى',
    'products.sort.price_desc': 'السعر: من الأعلى إلى الأقل',
    'products.sort.popular': 'الأكثر شعبية',
    'products.empty': 'لا توجد منتجات',
    'products.empty.reset': 'إعادة تعيين الفلاتر',
    'products.view.grid': 'عرض شبكي',
    'products.view.list': 'عرض قائمة',

    // Common
    'common.currency': 'دينار',
    'common.currency.symbol': 'د.ت',
    'common.home': 'الرئيسية',
    'common.products': 'المنتجات',
    'common.add_to_cart': 'أضف إلى السلة',
    'common.buy_now': 'اشتري الآن',
    'common.in_stock': 'متوفر',
    'common.out_of_stock': 'نفذ من المخزون',
    'common.low_stock': 'مخزون محدود',

    // Cart
    'cart.title': 'السلة',
    'cart.empty': 'سلتك فارغة',
    'cart.total': 'المجموع',
    'cart.checkout': 'إتمام الطلب',

    // Compare
    'compare.max_reached': 'يمكنك مقارنة 4 منتجات كحد أقصى',
    'compare.add': 'إضافة للمقارنة',
    'compare.remove': 'إزالة من المقارنة',
  },
};

// Default locale
const DEFAULT_LOCALE: Locale = 'fr';

/**
 * Get translation for a key
 */
export function t(key: keyof TranslationKeys, locale: Locale = DEFAULT_LOCALE): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: Locale = DEFAULT_LOCALE): TranslationKeys {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

/**
 * Check if locale is supported
 */
export function isLocaleSupported(locale: string): locale is Locale {
  return locale in translations;
}

export { translations, DEFAULT_LOCALE };
