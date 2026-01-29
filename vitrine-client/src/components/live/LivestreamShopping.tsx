'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useToast } from '@/store/toastStore';
import { backendClient, LiveEvent } from '@/lib/backend/client';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import { logger } from '@/lib/logger';

export function LivestreamShopping() {
  const toast = useToast();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribedEvents, setSubscribedEvents] = useState<Set<number>>(new Set());
  const [email, setEmail] = useState('');
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    fetchLiveEvents();
  }, []);

  const fetchLiveEvents = async () => {
    try {
      const response = await backendClient.getLiveEvents({ limit: 6 });
      if (response.success && response.liveEvents) {
        setEvents(response.liveEvents);
      }
    } catch (_error) {
      logger.error('Error fetching live events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleSubscribe = (eventId: number) => {
    setSubscribedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
        toast.info('Rappel annule');
      } else {
        newSet.add(eventId);
        toast.success('Vous serez notifie au debut du live !');
      }
      return newSet;
    });
  };

  const handleGlobalSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Vous recevrez les alertes pour tous les prochains lives !');
      setEmail('');
    }
  };

  // Attendre le montage côté client pour éviter hydration mismatch
  if (!hasMounted || isLoading) {
    return (
      <section className="py-12 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-10 bg-white/10 rounded-full w-40 mx-auto mb-4 animate-pulse" />
            <div className="h-8 bg-white/10 rounded w-96 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-72 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/10 rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // No events - hide section
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="font-semibold">Live Shopping</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Achetez en direct avec nous !
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Rejoignez nos sessions de shopping en direct pour decouvrir des produits exclusifs,
            poser vos questions et profiter d&apos;offres speciales reservees aux viewers.
          </p>
        </div>

        {/* Upcoming Lives */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-colors group"
            >
              {/* Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                {(event.thumbnail || event.thumbnailUrl) ? (
                  <Image
                    src={getProxiedImageUrl(event.thumbnail || event.thumbnailUrl || '')}
                    alt={event.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Live badge or countdown */}
                <div className="absolute top-4 left-4">
                  {event.isLive || event.state === 'live' ? (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      EN DIRECT
                    </span>
                  ) : (
                    <span className="bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm font-medium">
                      A venir
                    </span>
                  )}
                </div>

                {/* Product count */}
                <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full text-sm">
                  {event.productCount} produits
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {(event.hostName || event.host)?.[0] || 'L'}
                  </div>
                  <div>
                    <p className="font-medium text-white">{event.hostName || event.host}</p>
                    <p className="text-xs text-white/60">Presentateur</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{event.title || event.name}</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">{event.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(event.scheduledAt)}</span>
                  </div>

                  <button
                    onClick={() => handleSubscribe(event.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                      subscribedEvents.has(event.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {subscribedEvents.has(event.id) ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Rappel actif
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Me rappeler
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
          <h3 className="text-xl font-bold mb-2">Ne manquez aucun live !</h3>
          <p className="text-white/70 mb-6">
            Inscrivez-vous pour etre alerte de tous nos prochains evenements shopping en direct
          </p>

          <form onSubmit={handleGlobalSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors"
            >
              S&apos;inscrire
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2">Chat en direct</h4>
            <p className="text-white/60 text-sm">
              Posez vos questions et interagissez avec le presentateur
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2">Offres exclusives</h4>
            <p className="text-white/60 text-sm">
              Profitez de reductions speciales reservees aux viewers
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="font-semibold mb-2">Achat instantane</h4>
            <p className="text-white/60 text-sm">
              Ajoutez les produits au panier en un clic pendant le live
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
