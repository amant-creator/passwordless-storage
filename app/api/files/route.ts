import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const files = await prisma.file.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                fileUrl: true,
                fileSize: true,
                createdAt: true,
            },
        })

        return NextResponse.json({ files })
    } catch (error) {
        console.error('Get files error:', error)
        return NextResponse.json(
            { error: 'Failed to get files' },
            { status: 500 }
        )
    }
}
