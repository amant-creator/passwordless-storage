import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers to prevent common attacks
export function addSecurityHeaders(response: NextResponse) {
    // Prevent clickjacking attacks
    response.headers.set('X-Frame-Options', 'DENY')
    
    // Prevent MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff')
    
    // Enable XSS protection in older browsers
    response.headers.set('X-XSS-Protection', '1; mode=block')
    
    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';"
    )
    
    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    // Permissions Policy (formerly Feature Policy)
    response.headers.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=()'
    )
    
    // Force HTTPS
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    
    return response
}

// Validate and sanitize input strings
export function sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
        throw new Error('Invalid input type')
    }
    
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '')
    
    // Truncate to max length
    sanitized = sanitized.substring(0, maxLength)
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=/gi, '')
    
    return sanitized.trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
}

// Validate username format (alphanumeric, underscore, hyphen)
export function isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,32}$/
    return usernameRegex.test(username)
}

// Rate limiting store (in-memory)
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
    identifier: string,
    windowMs: number = 60000, // 1 minute
    maxRequests: number = 100
): boolean {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)
    
    if (!record) {
        rateLimitStore.set(identifier, { count: 1, timestamp: now })
        return true
    }
    
    // If window has expired, reset
    if (now - record.timestamp > windowMs) {
        rateLimitStore.set(identifier, { count: 1, timestamp: now })
        return true
    }
    
    // Check if exceeds limit
    if (record.count >= maxRequests) {
        return false
    }
    
    // Increment counter
    record.count++
    return true
}

// Clean up old rate limit entries (run periodically)
export function cleanupRateLimit() {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [key, record] of rateLimitStore.entries()) {
        if (now - record.timestamp > maxAge) {
            rateLimitStore.delete(key)
        }
    }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
    setInterval(cleanupRateLimit, 5 * 60 * 1000)
}

// Apply rate limiting middleware
export function rateLimitMiddleware(
    request: NextRequest,
    windowMs?: number,
    maxRequests?: number
): NextResponse | null {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    if (!checkRateLimit(ip, windowMs, maxRequests)) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        )
    }
    
    return null
}

// Generate CSRF token
export function generateCSRFToken(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false
    // In production, use session storage or database to verify
    return typeof token === 'string' && typeof sessionToken === 'string'
}

// SQL Injection prevention - check for common SQL patterns
export function isSuspiciousInput(input: string): boolean {
    const suspiciousPatterns = [
        /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /(-{2}|\/\*|\*\/|;)/g,
        /(\bOR\b|\bAND\b)\s*1\s*=\s*1/gi,
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(input))
}
