import { cookies } from 'next/headers'
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { prisma } from './prisma';

const SESSION_COOKIE_NAME = 'session'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

export const RP_ID = process.env.RP_ID || 'localhost';
export const RP_NAME = process.env.RP_NAME || 'Biometric File Storage';
export const EXPECTED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function createSession(userId: string) {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION / 1000,
        path: '/',
    })
}

export async function getSession(): Promise<string | null> {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE_NAME)
    return session?.value ?? null
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getRegistrationOptions(username: string) {
    const user = await prisma.user.findUnique({
        where: { username },
        include: { credentials: true },
    });

    return generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: new TextEncoder().encode(user?.id || 'new-user'), // Handles new users appropriately later
        userName: username,
        // Don't exclude credentials here for simplicity, or handle if needed
        attestationType: 'none',
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform',
        },
    });
}

export async function verifyRegistration(response: any, expectedChallenge: string) {
    return verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: EXPECTED_ORIGIN,
        expectedRPID: RP_ID,
    });
}

export async function getAuthenticationOptions(user: any) {
    const allowCredentials = user.credentials.map((cred: any) => ({
        id: cred.credentialID,
        type: 'public-key' as const,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    }));

    return generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
    });
}

export async function verifyAuthentication(
    response: any,
    expectedChallenge: string,
    credentialPublicKey: Uint8Array,
    previousCounter: number
) {
    return verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: EXPECTED_ORIGIN,
        expectedRPID: RP_ID,
        credential: {
            id: response.id,
            publicKey: credentialPublicKey as Uint8Array<ArrayBuffer>,
            counter: previousCounter,
        },
    });
}


