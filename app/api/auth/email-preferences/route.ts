import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

interface EmailPreferences {
    welcomeEmail?: boolean
    notifications?: boolean
}

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const sessionId = cookieStore.get('session')?.value

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Decode sessionId to get userId (format: userId:timestamp:signature)
        const [userId] = sessionId.split(':')

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ preferences: user.emailPreferences as unknown as EmailPreferences })
    } catch (error: any) {
        console.error('Email preferences fetch error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch preferences' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies()
        const sessionId = cookieStore.get('session')?.value

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Decode sessionId to get userId
        const [userId] = sessionId.split(':')

        const body = await request.json()
        const { preferences } = body as { preferences: EmailPreferences }

        if (!preferences || typeof preferences !== 'object') {
            return NextResponse.json(
                { error: 'Invalid preferences object' },
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Merge with existing preferences
        const currentPreferences = (user.emailPreferences as unknown as EmailPreferences) || {}
        const updatedPreferences = { ...currentPreferences, ...preferences }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                emailPreferences: updatedPreferences,
            },
        })

        return NextResponse.json({
            message: 'Preferences updated successfully',
            preferences: updated.emailPreferences as unknown as EmailPreferences,
        })
    } catch (error: any) {
        console.error('Email preferences update error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to update preferences' },
            { status: 500 }
        )
    }
}
