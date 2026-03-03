import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateWelcomeEmail } from '../email'

describe('generateWelcomeEmail', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should generate email with username', () => {
    const email = generateWelcomeEmail('testuser')
    expect(email).toContain('testuser')
    expect(email).toContain('Welcome to Biometric File Storage')
  })

  it('should include dashboard link with default URL', () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    const email = generateWelcomeEmail('testuser')
    expect(email).toContain('http://localhost:3000/dashboard')
  })

  it('should include dashboard link with custom APP_URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
    const email = generateWelcomeEmail('testuser')
    expect(email).toContain('https://example.com/dashboard')
  })

  it('should include all key sections', () => {
    const email = generateWelcomeEmail('testuser')
    expect(email).toContain('Quick Start Guide')
    expect(email).toContain('Key Features')
    expect(email).toContain('Getting Started')
    expect(email).toContain('Go to Dashboard')
  })

  it('should include account details section', () => {
    const email = generateWelcomeEmail('myusername')
    expect(email).toContain('Your Account Details')
    expect(email).toContain('Username:')
    expect(email).toContain('myusername')
  })

  it('should handle special characters in username', () => {
    const email = generateWelcomeEmail('user_123')
    expect(email).toContain('user_123')
  })
})
