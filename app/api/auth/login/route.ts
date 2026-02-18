import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'
import {
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
    GenerateAuthenticationOptionsOpts,
    VerifyAuthenticationResponseOpts,
    AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

const rpID = process.env.RP_ID || 'localhost'
const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Generate authentication options
export async function POST(request: Request) {
    try {
        const { username } = await request.json()

        if (!username || typeof username !== 'string') {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            )
        }

        // Get user and credentials
        const user = await prisma.user.findUnique({
            where: { username },
            include: { credentials: true },
        })

        if (!user || user.credentials.length === 0) {
            return NextResponse.json(
                { error: 'User not found or no credentials registered' },
                { status: 400 }
            )
        }

        // Generate authentication options
        const opts: GenerateAuthenticationOptionsOpts = {
            rpID,
            timeout: 60000,
            allowCredentials: user.credentials.map((cred) => ({
                id: Buffer.from(cred.credentialID).toString('base64url'),
                transports: cred.transports ? (cred.transports.split(',') as AuthenticatorTransportFuture[]) : undefined,
            })),
            userVerification: 'preferred',
        }

        const options = await generateAuthenticationOptions(opts)

        // Store challenge
        await prisma.user.update({
            where: { id: user.id },
            data: { currentChallenge: options.challenge },
        })

        return NextResponse.json(options)
    } catch (error) {
        console.error('Authentication options error:', error)
        return NextResponse.json(
            { error: 'Failed to generate authentication options' },
            { status: 500 }
        )
    }
}

// Verify authentication response
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { username, response } = body as {
            username: string
            response: AuthenticationResponseJSON
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

        // Find the credential
        const credential = user.credentials.find(
            (cred) => Buffer.from(cred.credentialID).toString('base64url') === response.id
        )

        if (!credential) {
            return NextResponse.json(
                { error: 'Credential not found' },
                { status: 400 }
            )
        }

        // Verify the authentication response
        const opts: VerifyAuthenticationResponseOpts = {
            response,
            expectedChallenge: user.currentChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: Buffer.from(credential.credentialID).toString('base64url'),
                publicKey: credential.publicKey,
                counter: Number(credential.counter),
            },
        }

        const verification = await verifyAuthenticationResponse(opts)

        if (!verification.verified) {
            return NextResponse.json(
                { error: 'Verification failed' },
                { status: 400 }
            )
        }

        // Update counter
        await prisma.credential.update({
            where: { id: credential.id },
            data: { counter: BigInt(verification.authenticationInfo.newCounter) },
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
        console.error('Authentication verification error:', error)
        return NextResponse.json(
            { error: 'Failed to verify authentication' },
            { status: 500 }
        )
    }
}
