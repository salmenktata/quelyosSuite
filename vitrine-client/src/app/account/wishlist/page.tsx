/**
 * Page wishlist (liste de souhaits)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { LoadingPage } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { formatPrice } from '@/lib/utils/formatting';
import { backendClient } from '@/lib/backend/client';
import type { WishlistItem } from '@quelyos/types';
import { logger } from '@/lib/logger';

export default function AccountWishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addToCart } = useCartStore();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account/wishlist');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const result = await backendClient.getWishlist();
        if (result.success && result.wishlist) {
          setWishlist(result.wishlist);
        }
      } catch (error) {
        logger.error('Erreur chargement wishlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const handleRemove = async (itemId: number) => {
    if (!confirm('Retirer ce produit de votre wishlist ?')) {
      return;
    }

    setRemovingId(itemId);

    try {
      const result = await backendClient.removeFromWishlist(itemId);

      if (result.success) {
        setWishlist((prev) => prev.filter((item) => item.id !== itemId));
      } else {
        throw new Error(result.error || 'Erreur suppression wishlist');
      }
    } catch (error) {
      logger.error('Erreur suppression wishlist:', error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
      alert(message);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    await addToCart(productId, 1);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await backendClient.generateWishlistShareLink();
      if (result.success && result.share_url) {
        const fullUrl = `${window.location.origin}${result.share_url}`;
        setShareUrl(fullUrl);
      } else {
        alert(result.error || 'Erreur lors de la génération du lien');
      }
    } catch (error) {
      logger.error('Erreur partage wishlist:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisableSharing = async () => {
    try {
      const result = await backendClient.disableWishlistSharing();
      if (result.success) {
        setShareUrl(null);
      }
    } catch (error) {
      logger.error('Erreur désactivation partage:', error);
    }
  };

  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-gray-600 hover:text-primary">
            Accueil
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/account" className="text-gray-600 hover:text-primary">
            Mon compte
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">Ma wishlist</span>
        </nav>

        {/* Titre */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Ma wishlist</h1>
          <div className="flex gap-3">
            {wishlist.length > 0 && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    Génération...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Partager
                  </span>
                )}
              </Button>
            )}
            <Link href="/account">
              <Button variant="outline" className="rounded-full">
                ← Retour au compte
              </Button>
            </Link>
          </div>
        </div>

        {/* Modal/Banner de partage */}
        {shareUrl && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex flex-col gap-4">
              {/* Lien et actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">Lien de partage</p>
                  <p className="text-sm text-gray-600 truncate">{shareUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCopyLink}
                    className="rounded-full"
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copié !
                      </span>
                    ) : (
                      'Copier le lien'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisableSharing}
                    className="rounded-full text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Désactiver
                  </Button>
                </div>
              </div>

              {/* Boutons de partage social */}
              <div className="flex items-center gap-3 pt-3 border-t border-primary/20">
                <span className="text-sm text-gray-600">Partager sur :</span>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Découvrez ma wishlist ! ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full transition-colors"
                  title="Partager sur WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-full transition-colors"
                  title="Partager sur Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Découvrez ma wishlist !')}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 bg-black hover:bg-gray-800 text-white rounded-full transition-colors"
                  title="Partager sur X (Twitter)"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent('Ma wishlist')}&body=${encodeURIComponent('Découvrez ma liste de souhaits : ' + shareUrl)}`}
                  className="flex items-center justify-center w-10 h-10 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors"
                  title="Partager par email"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Contenu */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : wishlist.length === 0 ? (
          /* Wishlist vide */
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="w-24 h-24 mx-auto text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              Votre wishlist est vide
            </h2>
            <p className="text-gray-500 mb-6">
              Ajoutez des produits à votre liste de souhaits pour les retrouver facilement
            </p>
            <Link href="/products">
              <Button variant="primary" size="lg" className="rounded-full">
                Découvrir nos produits
              </Button>
            </Link>
          </div>
        ) : (
          /* Liste wishlist */
          <div>
            <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
              <p className="text-gray-600">
                {wishlist.length} produit{wishlist.length > 1 && 's'} dans votre wishlist
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlist.map((item) => {
                const mainImage = item.product?.images?.find(img => img.is_main)?.url || item.product?.images?.[0]?.url || '/placeholder-product.svg';
                return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Image */}
                  <Link href={`/products/${item.product?.slug || ''}`} className="block relative aspect-square">
                    <Image
                      src={mainImage}
                      alt={item.product?.name || 'Product'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {!item.product?.in_stock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full">
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="p-4">
                    <Link
                      href={`/products/${item.product?.slug || ''}`}
                      className="font-semibold text-gray-900 hover:text-primary line-clamp-2 mb-2 block"
                    >
                      {item.product?.name}
                    </Link>

                    <p className="text-lg font-bold text-primary mb-3">
                      {formatPrice(item.product?.price ?? 0, item.product?.currency?.symbol ?? 'TND')}
                    </p>

                    <p className="text-xs text-gray-500 mb-4">
                      Ajouté le{' '}
                      {new Date(item.added_date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => item.product?.id && handleAddToCart(item.product.id)}
                        disabled={!item.product || !item.product.in_stock}
                        className="flex-1 rounded-full"
                      >
                        {item.product?.in_stock ? 'Ajouter au panier' : 'Indisponible'}
                      </Button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removingId === item.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                        title="Retirer de la wishlist"
                      >
                        {removingId === item.id ? (
                          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
