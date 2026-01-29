'use client';

import { useEffect, useState } from 'react';
import { backendClient, Testimonial } from '@/lib/backend/client';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/image-proxy';

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const response = await backendClient.getTestimonials({ featured_only: true, limit: 6 });
      if (response.success) {
        setTestimonials(response.testimonials);
      }
      setIsLoading(false);
    };
    fetchTestimonials();
  }, []);

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-6 animate-pulse">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ce que nos clients disent
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Découvrez les témoignages de nos clients satisfaits
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 hover:shadow-md transition">
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= testimonial.rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-700'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>

      {/* Contenu */}
      <blockquote className="text-gray-700 dark:text-gray-300 mb-6 italic">
        "{testimonial.content}"
      </blockquote>

      {/* Auteur */}
      <div className="flex items-center gap-3">
        {testimonial.avatarUrl ? (
          <Image
            src={getProxiedImageUrl(testimonial.avatarUrl)}
            alt={testimonial.customerName || 'Auteur'}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-lg">
              {testimonial.customerName?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{testimonial.customerName || 'Anonyme'}</p>
          {(testimonial.customerTitle || testimonial.customerCompany) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {[testimonial.customerTitle, testimonial.customerCompany].filter(Boolean).join(' - ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
