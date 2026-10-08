import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react'

const SearchControl = ({
  value,
  onChange,
  onFilter,
  isMobileSearchOpen = false,
  onToggleMobileSearch,
}) => {
  const inputWrapRef = useRef(null)
  const filterButtonRef = useRef(null)

  useLayoutEffect(() => {
    const inputWrap = inputWrapRef.current
    const filterButton = filterButtonRef.current

    if (!inputWrap || !filterButton) {
      return
    }

    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches

    if (!isMobileViewport) {
      gsap.set([inputWrap, filterButton], { clearProps: 'all' })
      return
    }

    gsap.killTweensOf([inputWrap, filterButton])

    if (isMobileSearchOpen) {
      gsap.set(inputWrap, {
        display: 'flex',
        width: 0,
        opacity: 0,
        pointerEvents: 'none',
      })

      gsap.to(filterButton, {
        opacity: 0,
        scale: 0.9,
        duration: 0.18,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(filterButton, { display: 'none' })
        },
      })

      gsap.to(inputWrap, {
        width: '100%',
        opacity: 1,
        duration: 0.28,
        ease: 'power2.out',
        onStart: () => {
          gsap.set(inputWrap, { pointerEvents: 'auto' })
        },
      })

      return
    }

    gsap.set(filterButton, { display: 'inline-flex' })
    gsap.fromTo(
      filterButton,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' },
    )

    gsap.to(inputWrap, {
      width: 0,
      opacity: 0,
      duration: 0.22,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(inputWrap, {
          display: 'none',
          pointerEvents: 'none',
        })
      },
    })
  }, [isMobileSearchOpen])

  return (
    <div
      className={`search-row hub-search-row ${
        isMobileSearchOpen ? 'is-mobile-open' : ''
      }`}
    >
      <div className="hub-search-expandable">
        <button
          type="button"
          className="icon-button hub-search-toggle"
          onClick={onToggleMobileSearch}
          aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
        >
          {isMobileSearchOpen ? <IconX size={18} /> : <IconSearch size={18} />}
        </button>

        <div ref={inputWrapRef} className="hub-search-input-wrap">
          <IconSearch
            className="hub-search-icon"
            size={18}
          />
          <input
            className="pill-input hub-search-input"
            placeholder="Search timetables..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>

      <button
        ref={filterButtonRef}
        type="button"
        className="icon-button hub-filter-button"
        onClick={onFilter}
      >
        <IconFilter size={20} />
      </button>
    </div>
  )
}

export default SearchControl
