import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN })

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get file
        const file = await prisma.file.findUnique({
            where: { id },
        })

        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        if (file.userId !== user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete from UploadThing
        await utapi.deleteFiles(file.fileKey)

        // Delete from database
        await prisma.file.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete file error:', error)
        return NextResponse.json(
            { error: 'Failed to delete file' },
            { status: 500 }
        )
    }
}
