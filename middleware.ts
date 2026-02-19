import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, rateLimitMiddleware } from '@/lib/security'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    
    // Apply security headers to all responses
    addSecurityHeaders(response)
    
    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const rateLimitError = rateLimitMiddleware(request, 60000, 100)
        if (rateLimitError) {
            return rateLimitError
        }
    }
    
    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
