import { useEffect, useState } from 'react'

/**
 * ScrollAnimations component provides:
 * 1. Global top scroll progress indicator with lime glow
 * 2. High-performance IntersectionObserver orchestrating reveal transitions on all devices
 */
export function ScrollAnimations() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight
          if (totalHeight > 0) {
            const currentProgress = (window.scrollY / totalHeight) * 100
            setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
          }
          ticking = false
        })
        ticking = true
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) {
      document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
        el.classList.add('is-revealed')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed')
            // Once revealed, we don't need to observe it again
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    )

    const observeElements = () => {
      const elements = document.querySelectorAll('[data-scroll-reveal]:not(.is-revealed)')
      elements.forEach((el) => observer.observe(el))
    }

    observeElements()

    // MutationObserver to attach to dynamically loaded or router-transitioned content
    const mutationObserver = new MutationObserver(() => {
      observeElements()
    })

    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [])

  return (
    <>
      {/* Top Reading / Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[9999] pointer-events-none transition-opacity duration-300"
        style={{ opacity: scrollProgress > 0.5 ? 1 : 0 }}
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-[#10b981] via-[#d2ff3a] to-[#bef529] shadow-[0_0_12px_rgba(210,255,58,0.7)] transition-all duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
    </>
  )
}
