import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  checkRateLimit,
  isSuspiciousInput,
} from '../security'

describe('sanitizeInput', () => {
  it('should throw error for non-string input', () => {
    expect(() => sanitizeInput(123 as any)).toThrow('Invalid input type')
    expect(() => sanitizeInput(null as any)).toThrow('Invalid input type')
    expect(() => sanitizeInput(undefined as any)).toThrow('Invalid input type')
  })

  it('should remove null bytes', () => {
    expect(sanitizeInput('hello\0world')).toBe('helloworld')
  })

  it('should truncate to max length', () => {
    const longString = 'a'.repeat(2000)
    expect(sanitizeInput(longString, 100)).toHaveLength(100)
    expect(sanitizeInput(longString)).toHaveLength(1000)
  })

  it('should remove script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('')
    expect(sanitizeInput('hello<script>evil</script>world')).toBe('helloworld')
  })

  it('should remove javascript: protocol', () => {
    expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)')
    expect(sanitizeInput('onmouseover = evil()')).toBe('evil()')
  })

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('should handle normal strings', () => {
    expect(sanitizeInput('Hello World')).toBe('Hello World')
    expect(sanitizeInput('test@example.com')).toBe('test@example.com')
  })
})

describe('isValidEmail', () => {
  it('should return true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@example.org')).toBe(true)
  })

  it('should return false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('invalid')).toBe(false)
    expect(isValidEmail('invalid@')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user name@example.com')).toBe(false)
  })

  it('should return false for emails exceeding 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    expect(isValidEmail(longEmail)).toBe(false)
  })
})

describe('isValidUsername', () => {
  it('should return true for valid usernames', () => {
    expect(isValidUsername('john')).toBe(true)
    expect(isValidUsername('john_doe')).toBe(true)
    expect(isValidUsername('john-doe')).toBe(true)
    expect(isValidUsername('JohnDoe123')).toBe(true)
    expect(isValidUsername('abc')).toBe(true)
  })

  it('should return false for usernames too short', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('')).toBe(false)
  })

  it('should return false for usernames too long', () => {
    expect(isValidUsername('a'.repeat(33))).toBe(false)
  })

  it('should return false for usernames with invalid characters', () => {
    expect(isValidUsername('john doe')).toBe(false)
    expect(isValidUsername('john@doe')).toBe(false)
    expect(isValidUsername('john.doe')).toBe(false)
    expect(isValidUsername('john!doe')).toBe(false)
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('should allow requests within limit', () => {
    const identifier = 'test-user-1'
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(identifier, 60000, 5)).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    const identifier = 'test-user-2'
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, 60000, 5)
    }
    expect(checkRateLimit(identifier, 60000, 5)).toBe(false)
  })

  it('should reset after window expires', () => {
    const identifier = 'test-user-3'
    for (let i = 0; i < 5; i++) {
      checkRateLimit(identifier, 60000, 5)
    }
    expect(checkRateLimit(identifier, 60000, 5)).toBe(false)
    
    vi.advanceTimersByTime(61000)
    expect(checkRateLimit(identifier, 60000, 5)).toBe(true)
  })
})

describe('isSuspiciousInput', () => {
  it('should detect SQL keywords', () => {
    expect(isSuspiciousInput('SELECT * FROM users')).toBe(true)
    expect(isSuspiciousInput('DROP TABLE users')).toBe(true)
    expect(isSuspiciousInput('INSERT INTO users')).toBe(true)
    expect(isSuspiciousInput('DELETE FROM users')).toBe(true)
    expect(isSuspiciousInput('UNION SELECT')).toBe(true)
  })

  it('should detect SQL injection patterns', () => {
    expect(isSuspiciousInput("' OR 1=1")).toBe(true)
    expect(isSuspiciousInput("admin'--")).toBe(true)
    expect(isSuspiciousInput('user/*comment*/')).toBe(true)
  })

  it('should return false for normal input', () => {
    expect(isSuspiciousInput('Hello World')).toBe(false)
    expect(isSuspiciousInput('john_doe')).toBe(false)
    expect(isSuspiciousInput('test@example.com')).toBe(false)
  })
})
