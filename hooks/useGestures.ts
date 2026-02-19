'use client'

import { useEffect, useRef } from 'react'

export interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useSwipe(config: SwipeConfig) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef(0)
  const startYRef = useRef(0)

  useEffect(() => {
    const threshold = config.threshold || 50

    const handleTouchStart = (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX
      startYRef.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY

      const deltaX = endX - startXRef.current
      const deltaY = endY - startYRef.current

      // Swipe left
      if (Math.abs(deltaX) > threshold && Math.abs(deltaY) < threshold) {
        if (deltaX < 0) {
          config.onSwipeLeft?.()
        } else {
          config.onSwipeRight?.()
        }
      }

      // Swipe up
      if (Math.abs(deltaY) > threshold && Math.abs(deltaX) < threshold) {
        if (deltaY < 0) {
          config.onSwipeUp?.()
        } else {
          config.onSwipeDown?.()
        }
      }
    }

    const element = elementRef.current
    if (element) {
      element.addEventListener('touchstart', handleTouchStart)
      element.addEventListener('touchend', handleTouchEnd)

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [config])

  return elementRef
}

export interface GestureConfig {
  onDoubleTap?: () => void
  onLongPress?: (duration: number) => void
}

export function useGesture(config: GestureConfig) {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const lastTapRef = useRef(0)
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pressStartRef = useRef(0)

  useEffect(() => {
    const handleTouchStart = () => {
      pressStartRef.current = Date.now()
      pressTimerRef.current = setTimeout(() => {
        const duration = Date.now() - pressStartRef.current
        config.onLongPress?.(duration)
      }, 500)
    }

    const handleTouchEnd = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = null
      }

      const now = Date.now()
      const timeSinceLastTap = now - lastTapRef.current

      if (timeSinceLastTap < 300) {
        config.onDoubleTap?.()
        lastTapRef.current = 0
      } else {
        lastTapRef.current = now
      }
    }

    const element = elementRef.current
    if (element) {
      element.addEventListener('touchstart', handleTouchStart)
      element.addEventListener('touchend', handleTouchEnd)

      return () => {
        element.removeEventListener('touchstart', handleTouchStart)
        element.removeEventListener('touchend', handleTouchEnd)
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current)
      }
    }
  }, [config])

  return elementRef
}

// Hook for keyboard navigation
export function useKeyboardNav(callbacks: {
  onEnter?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          callbacks.onEnter?.()
          break
        case 'Escape':
          e.preventDefault()
          callbacks.onEscape?.()
          break
        case 'ArrowUp':
          e.preventDefault()
          callbacks.onArrowUp?.()
          break
        case 'ArrowDown':
          e.preventDefault()
          callbacks.onArrowDown?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          callbacks.onArrowLeft?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          callbacks.onArrowRight?.()
          break
        case 'Tab':
          callbacks.onTab?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [callbacks])
}
