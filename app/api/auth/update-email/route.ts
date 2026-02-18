import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/get-user'

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { email } = await request.json()

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
        }

        await prisma.user.update({
            where: { id: currentUser.id },
            data: { email: email.toLowerCase().trim() },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
        }
        console.error('Update email error:', error)
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
    }
}
