'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startRegistration, startAuthentication } from '@simplewebauthn/browser'
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'
import { Fingerprint, Shield, Upload, Lock, Mail } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login')
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request')
  const [otpCode, setOtpCode] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: registerEmail.trim() || undefined }),
      })

      if (!optionsRes.ok) {
        const data = await optionsRes.json()
        throw new Error(data.error || 'Failed to start registration')
      }

      const options: PublicKeyCredentialCreationOptionsJSON = await optionsRes.json()

      // Start WebAuthn registration
      const attResp = await startRegistration({ optionsJSON: options })

      // Verify registration
      const verifyRes = await fetch('/api/auth/register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: attResp }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        throw new Error(data.error || 'Failed to verify registration')
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Registration error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Cancel Authorization')
        setError('Operation was cancelled')
      } else {
        setError(err.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Get authentication options
      const optionsRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!optionsRes.ok) {
        const data = await optionsRes.json()
        throw new Error(data.error || 'Failed to start authentication')
      }

      const options: PublicKeyCredentialRequestOptionsJSON = await optionsRes.json()

      // Start WebAuthn authentication
      const authResp = await startAuthentication({ optionsJSON: options })

      // Verify authentication
      const verifyRes = await fetch('/api/auth/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: authResp }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        throw new Error(data.error || 'Failed to verify authentication')
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Cancel Authorization')
        setError('Operation was cancelled')
      } else {
        setError(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!username.trim()) {
      setError('Please enter your username')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
      setOtpStep('verify')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the OTP code')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 via-purple-600/10 to-teal-600/10 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10">
        {/* Hero section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass mb-6">
            <Fingerprint className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-linear-to-r from-blue-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
            Biometric File Storage
          </h1>
          <p className="text-muted text-lg">
            Passwordless security with biometric authentication
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-xs text-muted">Secure</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Lock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <p className="text-xs text-muted">No Passwords</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Upload className="w-6 h-6 mx-auto mb-2 text-teal-400" />
            <p className="text-xs text-muted">Easy Upload</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setOtpStep('request'); setOtpCode(''); setRegisterEmail('') }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'login'
                ? 'bg-primary text-white'
                : 'bg-transparent text-muted hover:text-text'
                }`}
              disabled={loading}
            >
              Login
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setOtpStep('request'); setOtpCode('') }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'register'
                ? 'bg-primary text-white'
                : 'bg-transparent text-muted hover:text-text'
                }`}
              disabled={loading}
            >
              Register
            </button>
            <button
              onClick={() => { setMode('otp'); setError(''); setOtpStep('request'); setOtpCode('') }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${mode === 'otp'
                ? 'bg-primary text-white'
                : 'bg-transparent text-muted hover:text-text'
                }`}
              disabled={loading}
            >
              Email OTP
            </button>
          </div>

          <div className="space-y-4">
            {/* OTP Mode */}
            {mode === 'otp' ? (
              <>
                {otpStep === 'request' ? (
                  <>
                    <div>
                      <label htmlFor="username-otp" className="block text-sm font-medium mb-2">Username</label>
                      <input
                        id="username-otp"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        className="w-full px-4 py-3 bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        disabled={loading}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleSendOTP() }}
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}
                    <button
                      onClick={handleSendOTP}
                      disabled={loading || !username.trim()}
                      className="w-full bg-linear-to-r from-blue-500 via-purple-500 to-teal-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Mail className="w-5 h-5" />
                          Send OTP to Email
                        </span>
                      )}
                    </button>
                    <p className="text-xs text-center text-muted">A 6-digit code will be sent to your registered email</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-center text-muted">OTP sent! Check your email for the 6-digit code.</p>
                    <div>
                      <label htmlFor="otp-code" className="block text-sm font-medium mb-2">Enter OTP Code</label>
                      <input
                        id="otp-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-2xl tracking-widest"
                        disabled={loading}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleVerifyOTP() }}
                      />
                    </div>
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}
                    <button
                      onClick={handleVerifyOTP}
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-linear-to-r from-blue-500 via-purple-500 to-teal-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                    <button
                      onClick={() => { setOtpStep('request'); setOtpCode(''); setError('') }}
                      className="w-full text-sm text-muted hover:text-text transition-all"
                    >
                      ← Send a new code
                    </button>
                  </>
                )}
              </>
            ) : (
              /* Biometric (login / register) mode */
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (mode === 'login') handleLogin()
                        else handleRegister()
                      }
                    }}
                  />
                </div>

                {/* Email field — only shown during registration */}
                {mode === 'register' && (
                  <div>
                    <label htmlFor="register-email" className="block text-sm font-medium mb-2">
                      Email <span className="text-muted font-normal">(optional — for OTP fallback login)</span>
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted mt-1">Add your email now so you can log in via OTP if biometrics aren't available later.</p>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={mode === 'login' ? handleLogin : handleRegister}
                  disabled={loading || !username.trim()}
                  className="w-full bg-linear-to-r from-blue-500 via-purple-500 to-teal-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Fingerprint className="w-5 h-5" />
                      {mode === 'login' ? 'Login with Biometrics' : 'Register with Biometrics'}
                    </span>
                  )}
                </button>

                <p className="text-xs text-center text-muted mt-4">
                  {mode === 'login'
                    ? 'Use your biometric sensor (Face ID, Touch ID, Windows Hello) to authenticate'
                    : 'Your biometric data is stored securely on your device and never leaves it'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
      `}</style>
    </div>
  )
}
