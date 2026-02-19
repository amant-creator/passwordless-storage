// Environment variable validation for security
const requiredEnvVars = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SESSION_SECRET',
    'RP_NAME',
    'RP_ID',
    'NEXT_PUBLIC_APP_URL',
]

export function validateEnv() {
    const missing: string[] = []

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missing.push(envVar)
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}`
        )
    }

    // Validate SESSION_SECRET length
    const sessionSecret = process.env.SESSION_SECRET || ''
    if (sessionSecret.length < 32) {
        throw new Error(
            'SESSION_SECRET must be at least 32 characters long for security'
        )
    }

    // Warn if running in development
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Running in development mode. Use production for deployed applications.')
    }
}

// Call validation on startup
if (typeof window === 'undefined') {
    try {
        validateEnv()
    } catch (error) {
        console.error('❌ Environment validation failed:', error)
        // Don't exit in development, but log the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1)
        }
    }
}
