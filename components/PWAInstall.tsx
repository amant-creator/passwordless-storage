'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function PWAInstall() {
  const [isinstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration)
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker registration failed:', error)
        })
    }

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  if (!isinstallable || !showPrompt) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm glass rounded-lg p-4 border border-blue-500/30 bg-blue-500/5 shadow-lg animate-in slide-in-from-bottom-2 z-50"
      role="alert"
      aria-label="Install app prompt"
    >
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm mb-2">Install App</p>
          <p className="text-xs text-muted mb-3">
            Install Biometric File Storage on your device for offline access and app-like experience
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
              aria-label="Install app"
            >
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-2 bg-surface hover:bg-surface-elevated text-muted text-sm rounded-lg transition-all"
              aria-label="Dismiss app install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
