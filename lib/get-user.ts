import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function getCurrentUser() {
    const userId = await getSession()
    if (!userId) return null

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
        },
    })

    return user
}
