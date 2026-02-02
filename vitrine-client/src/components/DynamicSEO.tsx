'use client'

import { useSeoMetadata } from '@/hooks/useSeoMetadata'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface DynamicSEOProps {
  slug?: string
}

export function DynamicSEO({ slug }: DynamicSEOProps) {
  const pathname = usePathname()
  const effectiveSlug = slug || pathname
  const { metadata, loading: _loading } = useSeoMetadata(effectiveSlug)

  useEffect(() => {
    if (metadata) {
      // Mettre à jour le title dynamiquement
      document.title = metadata.meta_title

      // Mettre à jour meta description
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', metadata.meta_description)

      // OG tags
      const ogTags = [
        { property: 'og:title', content: metadata.og_title || metadata.meta_title },
        { property: 'og:description', content: metadata.og_description || metadata.meta_description },
        { property: 'og:type', content: metadata.og_type },
      ]

      if (metadata.og_image_url) {
        ogTags.push({ property: 'og:image', content: metadata.og_image_url })
      }

      ogTags.forEach(({ property, content }) => {
        let tag = document.querySelector(`meta[property="${property}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute('property', property)
          document.head.appendChild(tag)
        }
        tag.setAttribute('content', content)
      })

      // Twitter Card tags
      const twitterTags = [
        { name: 'twitter:card', content: metadata.twitter_card },
        { name: 'twitter:title', content: metadata.twitter_title || metadata.meta_title },
        { name: 'twitter:description', content: metadata.twitter_description || metadata.meta_description },
      ]

      if (metadata.twitter_image_url || metadata.og_image_url) {
        twitterTags.push({
          name: 'twitter:image',
          content: metadata.twitter_image_url || metadata.og_image_url || ''
        })
      }

      twitterTags.forEach(({ name, content }) => {
        if (!content) return
        let tag = document.querySelector(`meta[name="${name}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute('name', name)
          document.head.appendChild(tag)
        }
        tag.setAttribute('content', content)
      })

      // Robots meta
      if (metadata.noindex || metadata.nofollow) {
        const robotsContent = [
          metadata.noindex ? 'noindex' : 'index',
          metadata.nofollow ? 'nofollow' : 'follow',
        ].join(', ')

        let robotsTag = document.querySelector('meta[name="robots"]')
        if (!robotsTag) {
          robotsTag = document.createElement('meta')
          robotsTag.setAttribute('name', 'robots')
          document.head.appendChild(robotsTag)
        }
        robotsTag.setAttribute('content', robotsContent)
      }

      // Canonical URL
      if (metadata.canonical_url) {
        let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
        if (!canonicalLink) {
          canonicalLink = document.createElement('link')
          canonicalLink.rel = 'canonical'
          document.head.appendChild(canonicalLink)
        }
        canonicalLink.href = metadata.canonical_url
      }
    }
  }, [metadata])

  return null
}
