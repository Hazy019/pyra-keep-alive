'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * GSAPProvider registers ScrollTrigger once and coordinates the single scroll "story"
 * across the marketing landing page.
 * Respects prefers-reduced-motion and degrades cleanly.
 */
export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      // 1. Section reveal pattern
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 82%',
              once: true,
            },
          },
        )
      })

      // 2. Staggered group reveal — feature cards, how-it-works steps
      const staggerGroups = gsap.utils.toArray<HTMLElement>('.stagger-group')
      staggerGroups.forEach((group) => {
        gsap.fromTo(
          group.children,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: group,
              start: 'top 75%',
              once: true,
            },
          },
        )
      })

      // 3. Product screenshot parallax
      const productShot = document.querySelector('.product-shot')
      if (productShot) {
        gsap.to(productShot, {
          yPercent: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: productShot,
            scrub: true,
          },
        })
      }

      // 4. Floating cards stagger reveal over product shot
      const floatingCards = gsap.utils.toArray<HTMLElement>('.floating-stat-card')
      if (floatingCards.length > 0) {
        gsap.fromTo(
          floatingCards,
          { opacity: 0, y: 20, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.18,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.product-shot-container',
              start: 'top 70%',
              once: true,
            },
          },
        )
      }

      // 5. Trusted-by stat count-up
      gsap.utils.toArray<HTMLElement>('.stat-number').forEach((el) => {
        const target = Number(el.dataset.value ?? '0')
        const suffix = el.dataset.suffix ?? ''
        const prefix = el.dataset.prefix ?? ''
        const decimals = Number(el.dataset.decimals ?? '0')

        const obj = { val: 0 }
        gsap.to(obj, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onUpdate: () => {
            const formatted = decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString()
            el.textContent = `${prefix}${formatted}${suffix}`
          },
        })
      })
    })

    return () => {
      ctx.revert()
    }
  }, [])

  return <>{children}</>
}
