'use client';

import React, { useState, memo } from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { DynamicMenu } from '@/components/cms';

// =============================================================================
// ICONS
// =============================================================================

const Icons = {
  CreditCard: ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  Delivery: ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  Shield: ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  Support: ({ className = "w-7 h-7" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  Phone: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  Email: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  ArrowRight: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
  Facebook: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  Instagram: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
    </svg>
  ),
  TikTok: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
  YouTube: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  WhatsApp: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
};

// =============================================================================
// TYPES & DATA
// =============================================================================

interface TrustBadge {
  icon: React.FC<{ className?: string }>;
  title: string;
  subtitle: string;
}

interface SocialLink {
  key: string;
  url: string | undefined;
  label: string;
  hoverClass: string;
  icon: React.ReactNode;
}

const TRUST_BADGES: TrustBadge[] = [
  {
    icon: Icons.CreditCard,
    title: 'Paiement à la livraison',
    subtitle: 'Payez en espèces à la réception de votre commande'
  },
  {
    icon: Icons.Delivery,
    title: 'Livraison 24-48h',
    subtitle: 'Livraison rapide partout en Tunisie'
  },
  {
    icon: Icons.Shield,
    title: 'Paiement sécurisé',
    subtitle: 'Vos données sont protégées et cryptées'
  },
  {
    icon: Icons.Support,
    title: 'Support réactif',
    subtitle: 'Une équipe à votre écoute 7j/7'
  },
];

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const TrustBadgeItem = memo(({ badge, index }: { badge: TrustBadge; index: number }) => (
  <div
    className="group flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all duration-300"
  >
    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center group-hover:from-secondary/30 group-hover:to-secondary/10 transition-all duration-300">
      <div className="text-secondary">
        <badge.icon />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-secondary transition-colors">
        {badge.title}
      </h3>
      <p className="text-gray-400 text-xs leading-relaxed">
        {badge.subtitle}
      </p>
    </div>
  </div>
));
TrustBadgeItem.displayName = 'TrustBadgeItem';

const TrustBadgesSection = memo(() => (
  <section className="bg-gradient-to-b from-primary to-primary-dark py-12 relative overflow-hidden">
    {/* Decorative elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full blur-3xl" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TRUST_BADGES.map((badge, index) => (
          <TrustBadgeItem key={index} badge={badge} index={index} />
        ))}
      </div>
    </div>
  </section>
));
TrustBadgesSection.displayName = 'TrustBadgesSection';

const SocialLinkButton = memo(({ link }: { link: SocialLink }) => {
  if (!link.url) return null;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center hover:scale-110 hover:-translate-y-0.5 transition-all duration-300 ${link.hoverClass}`}
      aria-label={link.label}
    >
      {link.icon}
    </a>
  );
});
SocialLinkButton.displayName = 'SocialLinkButton';

const SocialLinks = memo(({ social, whatsapp }: {
  social: { facebook?: string; instagram?: string; twitter?: string; youtube?: string; tiktok?: string };
  whatsapp?: string;
}) => {
  const links: SocialLink[] = [
    { key: 'facebook', url: social.facebook, label: 'Facebook', hoverClass: 'hover:bg-[#1877f2] hover:border-[#1877f2]', icon: <Icons.Facebook /> },
    { key: 'instagram', url: social.instagram, label: 'Instagram', hoverClass: 'hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-pink-500 hover:to-purple-600 hover:border-pink-500', icon: <Icons.Instagram /> },
    { key: 'tiktok', url: social.tiktok, label: 'TikTok', hoverClass: 'hover:bg-black hover:border-gray-600', icon: <Icons.TikTok /> },
    { key: 'youtube', url: social.youtube, label: 'YouTube', hoverClass: 'hover:bg-red-600 hover:border-red-600', icon: <Icons.YouTube /> },
    { key: 'whatsapp', url: whatsapp ? `https://wa.me/${whatsapp}` : undefined, label: 'WhatsApp', hoverClass: 'hover:bg-[#25d366] hover:border-[#25d366]', icon: <Icons.WhatsApp /> },
  ];

  return (
    <div className="flex gap-2">
      {links.map((link) => (
        <SocialLinkButton key={link.key} link={link} />
      ))}
    </div>
  );
});
SocialLinks.displayName = 'SocialLinks';

const NewsletterForm = memo(() => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Merci pour votre inscription !');
      setEmail('');
    } finally {
      setIsSubscribing(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Entrez votre email"
          className="w-full px-5 py-3.5 pr-28 rounded-xl bg-gray-800/50 border border-gray-700/50 focus:outline-none focus:border-secondary/50 focus:bg-gray-800 text-sm text-white placeholder-gray-500 transition-all duration-300"
          required
        />
        <button
          type="submit"
          disabled={isSubscribing}
          className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-secondary to-secondary-dark text-primary-dark rounded-lg hover:from-secondary-light hover:to-secondary transition-all duration-300 text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
        >
          {isSubscribing ? (
            <span className="w-4 h-4 border-2 border-primary-dark/30 border-t-primary-dark rounded-full animate-spin" />
          ) : (
            <>
              <span>OK</span>
              <Icons.ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
      {message && (
        <p className="text-green-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {message}
        </p>
      )}
    </div>
  );
});
NewsletterForm.displayName = 'NewsletterForm';

const ContactInfo = memo(({ phone, phoneFormatted, email }: {
  phone?: string;
  phoneFormatted?: string;
  email?: string;
}) => (
  <div className="space-y-3">
    {phone && (
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="flex items-center gap-3 text-gray-400 hover:text-secondary transition-colors group"
      >
        <span className="w-9 h-9 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all">
          <Icons.Phone className="w-4 h-4" />
        </span>
        <span className="text-sm">{phoneFormatted || phone}</span>
      </a>
    )}
    {email && (
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-3 text-gray-400 hover:text-secondary transition-colors group"
      >
        <span className="w-9 h-9 rounded-lg bg-gray-800/50 border border-gray-700/50 flex items-center justify-center group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all">
          <Icons.Email className="w-4 h-4" />
        </span>
        <span className="text-sm">{email}</span>
      </a>
    )}
  </div>
));
ContactInfo.displayName = 'ContactInfo';

const FooterColumn = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
      <span className="w-1 h-5 bg-gradient-to-b from-secondary to-secondary-dark rounded-full" />
      {title}
    </h3>
    {children}
  </div>
));
FooterColumn.displayName = 'FooterColumn';

const BottomBar = memo(({ brandName, year }: { brandName: string; year: number }) => (
  <div className="border-t border-gray-800/50">
    <div className="container mx-auto px-4 py-5">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">
          &copy; {year} <span className="text-secondary">{brandName}</span>. Tous droits réservés.
        </p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-secondary transition-colors">
            Politique de confidentialité
          </Link>
          <Link href="/terms" className="hover:text-secondary transition-colors">
            CGV
          </Link>
          <Link href="/returns" className="hover:text-secondary transition-colors">
            Retours & Remboursements
          </Link>
        </div>
      </div>
    </div>
  </div>
));
BottomBar.displayName = 'BottomBar';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const Footer: React.FC = () => {
  const { config } = useSiteConfig();
  const { brand, social } = config;
  const year = new Date().getFullYear();

  return (
    <>
      <TrustBadgesSection />

      <footer className="bg-gray-950 text-gray-300">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

            {/* Brand & Newsletter - Takes more space */}
            <div className="lg:col-span-4 space-y-6">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="w-11 h-11 bg-gradient-to-br from-primary via-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                  <span className="text-white font-bold text-lg">
                    {(brand?.name || 'Quelyos').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white block leading-tight">{brand?.name || 'Quelyos'}</span>
                  <span className="text-xs text-gray-500">Votre boutique en ligne</span>
                </div>
              </Link>

              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                {brand?.description || 'Votre boutique en ligne de confiance'}
              </p>

              <div>
                <p className="text-sm text-gray-300 mb-3 font-medium">
                  Recevez nos offres exclusives
                </p>
                <NewsletterForm />
              </div>

              <SocialLinks social={social} whatsapp={brand?.whatsapp} />
            </div>

            {/* Quick Links */}
            <div className="lg:col-span-3">
              <FooterColumn title="Liens Rapides">
                <DynamicMenu
                  code="footer_quick"
                  orientation="vertical"
                  className="space-y-2.5"
                  itemClassName="text-gray-200 hover:text-secondary text-sm transition-colors duration-200 flex items-center gap-2 group"
                  showIcons={false}
                  maxDepth={1}
                />
              </FooterColumn>
            </div>

            {/* Customer Service */}
            <div className="lg:col-span-3">
              <FooterColumn title="Service Client">
                <DynamicMenu
                  code="footer_service"
                  orientation="vertical"
                  className="space-y-2.5"
                  itemClassName="text-gray-200 hover:text-secondary text-sm transition-colors duration-200 flex items-center gap-2 group"
                  showIcons={false}
                  maxDepth={1}
                />
              </FooterColumn>
            </div>

            {/* Contact */}
            <div className="lg:col-span-2">
              <FooterColumn title="Contact">
                <ContactInfo
                  phone={brand?.phone}
                  phoneFormatted={brand?.phoneFormatted}
                  email={brand?.email}
                />
              </FooterColumn>
            </div>
          </div>
        </div>

        <BottomBar brandName={brand?.name || 'Quelyos'} year={year} />
      </footer>
    </>
  );
};

export default Footer;
export { Footer };
