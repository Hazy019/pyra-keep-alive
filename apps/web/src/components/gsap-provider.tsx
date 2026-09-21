'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * GSAPProvider — registers ScrollTrigger + coordinates the full scroll story.
 * Enhancements:
 * 1. Nav slide-down on load
 * 2. Hero headline + subhead staggered text entrance
 * 3. Section reveal (.reveal)
 * 4. Staggered card groups (.stagger-group)
 * 5. Product screenshot parallax
 * 6. Floating stat cards
 * 7. Stat count-up
 * 8. 3D tilt on feature cards (.tilt-card)
 * 9. Magnetic effect on primary CTAs (.btn-magnetic)
 * 10. Floating loop on highlighted pricing card
 * Respects prefers-reduced-motion and degrades cleanly.
 */
export default function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    const ctx = gsap.context(() => {
      // ── 1. Nav slide-down entrance ────────────────────────────────────
      const nav = document.querySelector('.marketing-nav')
      if (nav) {
        gsap.fromTo(
          nav,
          { y: -64, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 }
        )
      }

      // ── 2. Hero content staggered entrance ───────────────────────────
      const heroContent = document.querySelector('.hero-content')
      if (heroContent) {
        const children = Array.from(heroContent.children)
        gsap.fromTo(
          children,
          { opacity: 0, y: 28, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.65,
            stagger: 0.1,
            ease: 'power3.out',
            delay: 0.3,
          }
        )
      }

      // Hero card entrance
      const heroCard = document.querySelector('.hero-card')
      if (heroCard) {
        gsap.fromTo(
          heroCard,
          { opacity: 0, x: 32, scale: 0.96 },
          { opacity: 1, x: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.45 }
        )
      }

      // ── 3. Nav scroll-aware background class ─────────────────────────
      if (nav) {
        ScrollTrigger.create({
          start: 'top -60px',
          onEnter: () => nav.classList.add('scrolled'),
          onLeaveBack: () => nav.classList.remove('scrolled'),
        })
      }

      // ── 4. Section reveal ─────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 84%', once: true },
          }
        )
      })

      // ── 5. Staggered card group reveals ──────────────────────────────
      gsap.utils.toArray<HTMLElement>('.stagger-group').forEach((group) => {
        gsap.fromTo(
          group.children,
          { opacity: 0, y: 24, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: { trigger: group, start: 'top 76%', once: true },
          }
        )
      })

      // ── 6. Product shot parallax ──────────────────────────────────────
      const productShot = document.querySelector('.product-shot')
      if (productShot) {
        gsap.to(productShot, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: productShot, scrub: 1.2 },
        })
      }

      // ── 7. Floating stat cards ────────────────────────────────────────
      const floatingCards = gsap.utils.toArray<HTMLElement>('.floating-stat-card')
      if (floatingCards.length > 0) {
        gsap.fromTo(
          floatingCards,
          { opacity: 0, y: 24, scale: 0.94 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.product-shot-container',
              start: 'top 72%',
              once: true,
            },
          }
        )
      }

      // ── 8. Stat count-up ─────────────────────────────────────────────
      gsap.utils.toArray<HTMLElement>('.stat-number').forEach((el) => {
        const target  = Number(el.dataset.value ?? '0')
        const suffix  = el.dataset.suffix ?? ''
        const prefix  = el.dataset.prefix ?? ''
        const decimals = Number(el.dataset.decimals ?? '0')
        const obj = { val: 0 }
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            const formatted = decimals > 0
              ? obj.val.toFixed(decimals)
              : Math.round(obj.val).toLocaleString()
            el.textContent = `${prefix}${formatted}${suffix}`
          },
        })
      })

      // ── 9. 3D Tilt on feature cards ───────────────────────────────────
      const tiltCards = gsap.utils.toArray<HTMLElement>('.tilt-card')
      tiltCards.forEach((card) => {
        const handleMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dx = (e.clientX - cx) / (rect.width / 2)
          const dy = (e.clientY - cy) / (rect.height / 2)
          gsap.to(card, {
            rotateY:  dx * 8,
            rotateX: -dy * 6,
            scale: 1.02,
            duration: 0.4,
            ease: 'power2.out',
            transformPerspective: 1000,
          })
        }
        const handleLeave = () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.55,
            ease: 'power3.out',
            transformPerspective: 1000,
          })
        }
        card.addEventListener('mousemove', handleMove)
        card.addEventListener('mouseleave', handleLeave)
      })

      // ── 10. Magnetic CTAs ─────────────────────────────────────────────
      const magneticBtns = gsap.utils.toArray<HTMLElement>('.btn-magnetic')
      magneticBtns.forEach((btn) => {
        const handleMove = (e: MouseEvent) => {
          const rect = btn.getBoundingClientRect()
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dx = (e.clientX - cx) * 0.25
          const dy = (e.clientY - cy) * 0.25
          gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' })
        }
        const handleLeave = () => {
          gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.5)' })
        }
        btn.addEventListener('mousemove', handleMove)
        btn.addEventListener('mouseleave', handleLeave)
      })

      // ── 11. Floating loop on highlighted pricing card ─────────────────
      const pricingHighlight = document.querySelector('.pricing-highlight')
      if (pricingHighlight) {
        gsap.to(pricingHighlight, {
          y: -8,
          duration: 3.5,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      }
    })

    return () => {
      ctx.revert()
    }
  }, [])

  return <>{children}</>
}
