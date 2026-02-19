import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import { sendEmail, generateWelcomeEmail, checkEmailPreference } from '@/lib/email'
import { sanitizeInput, isValidUsername, isValidEmail, isSuspiciousInput } from '@/lib/security'
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
} from '@simplewebauthn/server'
import type {
    GenerateRegistrationOptionsOpts,
    VerifyRegistrationResponseOpts,
} from '@simplewebauthn/server'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'

const rpName = process.env.RP_NAME || 'Biometric File Storage'
const rpID = process.env.RP_ID || 'localhost'
const origin = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')

// Generate registration options
export async function POST(request: Request) {
    try {
        const { username, email } = await request.json()

        // Validate username
        if (!username || typeof username !== 'string') {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            )
        }

        // Sanitize username
        const sanitizedUsername = sanitizeInput(username, 50)

        // Validate username format
        if (!isValidUsername(sanitizedUsername)) {
            return NextResponse.json(
                { error: 'Username must be 3-32 characters (alphanumeric, underscore, hyphen only)' },
                { status: 400 }
            )
        }

        // Check for suspicious input (SQL injection, XSS attempts)
        if (isSuspiciousInput(sanitizedUsername)) {
            console.warn(`Suspicious username input attempt: ${sanitizedUsername}`)
            return NextResponse.json(
                { error: 'Invalid username format' },
                { status: 400 }
            )
        }

        // Validate email if provided
        if (email) {
            if (typeof email !== 'string') {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                )
            }

            const sanitizedEmail = sanitizeInput(email.toLowerCase().trim(), 254)

            if (!isValidEmail(sanitizedEmail)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                )
            }

            if (isSuspiciousInput(sanitizedEmail)) {
                console.warn(`Suspicious email input attempt: ${sanitizedEmail}`)
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                )
            }
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username: sanitizedUsername },
            include: { credentials: true },
        })

        // Generate registration options
        const opts: GenerateRegistrationOptionsOpts = {
            rpName,
            rpID,
            userName: sanitizedUsername,
            timeout: 60000,
            attestationType: 'none',
            // Exclude already registered credentials to avoid duplicates
            excludeCredentials: existingUser?.credentials.map((cred: typeof existingUser.credentials[number]) => ({
                id: Buffer.from(cred.credentialID).toString('base64url'),
            })) ?? [],
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                // No authenticatorAttachment restriction — allows both phone and platform (Windows Hello)
            },
        }

        const options = await generateRegistrationOptions(opts)

        if (existingUser) {
            // Existing user — just update the challenge to add a new credential
            await prisma.user.update({
                where: { id: existingUser.id },
                data: { currentChallenge: options.challenge },
            })
        } else {
            // New user — create the account, save email if provided
            const sanitizedEmail = email ? sanitizeInput(email.toLowerCase().trim(), 254) : null
            await prisma.user.create({
                data: {
                    username: sanitizedUsername,
                    currentChallenge: options.challenge,
                    ...(sanitizedEmail && isValidEmail(sanitizedEmail)
                        ? { email: sanitizedEmail }
                        : {}),
                },
            })
        }

        return NextResponse.json(options)
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Email already in use by another account' }, { status: 400 })
        }
        console.error('Registration options error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to generate registration options' },
            { status: 500 }
        )
    }
}

// Verify registration response
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { username, response } = body as {
            username: string
            response: RegistrationResponseJSON
        }

        if (!username || !response) {
            return NextResponse.json(
                { error: 'Username and response are required' },
                { status: 400 }
            )
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { username },
            include: { credentials: true },
        })

        if (!user || !user.currentChallenge) {
            return NextResponse.json(
                { error: 'User not found or no pending challenge' },
                { status: 400 }
            )
        }

        // Verify the registration response
        console.log('WebAuthn verify config:', { expectedOrigin: origin, expectedRPID: rpID })
        const opts: VerifyRegistrationResponseOpts = {
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
        }

        const verification = await verifyRegistrationResponse(opts)

        if (!verification.verified || !verification.registrationInfo) {
            return NextResponse.json(
                { error: 'Verification failed' },
                { status: 400 }
            )
        }

        const { credential } = verification.registrationInfo

        // Store credential
        await prisma.credential.create({
            data: {
                userId: user.id,
                credentialID: Buffer.from(credential.id),
                publicKey: Buffer.from(credential.publicKey),
                counter: BigInt(credential.counter),
                transports: credential.transports?.join(','),
            },
        })

        // Clear challenge
        await prisma.user.update({
            where: { id: user.id },
            data: { currentChallenge: null },
        })

        // Create session
        await createSession(user.id)

        // Send welcome email if user has an email and has opted in
        if (user.email) {
            try {
                const canSendWelcomeEmail = await checkEmailPreference(user.id, 'welcomeEmail')
                if (canSendWelcomeEmail) {
                    const welcomeHtml = generateWelcomeEmail(user.username)
                    await sendEmail({
                        to: user.email,
                        subject: `Welcome ${user.username}! 🎉 Your Biometric File Storage Account is Ready`,
                        html: welcomeHtml,
                    })
                    console.log(`Welcome email sent to ${user.email}`)
                } else {
                    console.log(`Welcome email skipped for ${user.email} (user opted out)`)
                }
            } catch (emailError: any) {
                console.error('Failed to send welcome email:', emailError?.message)
                // Don't fail the registration if email sending fails
            }
        }

        return NextResponse.json({ verified: true })
    } catch (error: any) {
        console.error('Registration verification error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to verify registration' },
            { status: 500 }
        )
    }
}
