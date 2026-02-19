'use client'

import { useState } from 'react'
import { Menu, X, LogOut, Settings } from 'lucide-react'

interface MobileNavProps {
  username: string
  email?: string | null
  onLogout: () => void
  onSettings?: () => void
}

export function MobileNav({ username, email, onLogout, onSettings }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="glass border-b border-border sticky top-0 z-50 md:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            BioFiles
          </h1>
          <button
            onClick={toggleMenu}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            className="p-2 hover:bg-surface-elevated rounded-lg transition-all"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <nav
            className="absolute top-16 left-0 right-0 bg-surface border-b border-border animate-in fade-in slide-in-from-top-2"
            onClick={closeMenu}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="pb-4 border-b border-border">
                <p className="text-sm text-muted mb-1">Logged in as</p>
                <p className="font-semibold text-text">{username}</p>
                <p className="text-xs text-muted mt-1">{email || 'Email not set'}</p>
              </div>

              <button
                onClick={onSettings}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-surface-elevated transition-all"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-blue-400" />
                <span>Settings & Preferences</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Backdrop for menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  )
}
