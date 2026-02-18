import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
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
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Generate registration options
export async function POST(request: Request) {
    try {
        const { username } = await request.json()

        if (!username || typeof username !== 'string') {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            )
        }

        // Generate registration options
        const opts: GenerateRegistrationOptionsOpts = {
            rpName,
            rpID,
            userName: username,
            timeout: 60000,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        }

        const options = await generateRegistrationOptions(opts)

        // Create user with challenge
        await prisma.user.create({
            data: {
                username,
                currentChallenge: options.challenge,
            },
        })

        return NextResponse.json(options)
    } catch (error) {
        console.error('Registration options error:', error)
        return NextResponse.json(
            { error: 'Failed to generate registration options' },
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
        })

        if (!user || !user.currentChallenge) {
            return NextResponse.json(
                { error: 'User not found or no pending challenge' },
                { status: 400 }
            )
        }

        // Verify the registration response
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

        return NextResponse.json({ verified: true })
    } catch (error) {
        console.error('Registration verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify registration' },
            { status: 500 }
        )
    }
}
