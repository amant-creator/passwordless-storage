import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getCurrentUser } from '@/lib/get-user'
import { prisma } from '@/lib/prisma'

const f = createUploadthing()

export const ourFileRouter = {
    fileUploader: f({
        image: { maxFileSize: '4MB', maxFileCount: 10 },
        pdf: { maxFileSize: '8MB', maxFileCount: 10 },
        text: { maxFileSize: '1MB', maxFileCount: 10 },
        video: { maxFileSize: '16MB', maxFileCount: 5 },
    })
        .middleware(async () => {
            const user = await getCurrentUser()
            if (!user) throw new Error('Unauthorized')
            return { userId: user.id }
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // Save file metadata to database
            await prisma.file.create({
                data: {
                    userId: metadata.userId,
                    fileKey: file.key,
                    fileName: file.name,
                    fileUrl: file.url,
                    fileSize: file.size,
                },
            })

            return { uploadedBy: metadata.userId }
        }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
