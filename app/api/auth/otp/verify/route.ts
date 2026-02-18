import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const { username, otp } = await request.json()

        if (!username || !otp) {
            return NextResponse.json({ error: 'Username and OTP are required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { username } })

        if (!user || !user.otpCode || !user.otpExpiry) {
            return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 })
        }

        // Check expiry
        if (new Date() > user.otpExpiry) {
            await prisma.user.update({
                where: { id: user.id },
                data: { otpCode: null, otpExpiry: null },
            })
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
        }

        // Check code
        if (user.otpCode !== otp.trim()) {
            return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 })
        }

        // Clear OTP after successful use
        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode: null, otpExpiry: null },
        })

        // Create session
        await createSession(user.id)

        return NextResponse.json({ verified: true })
    } catch (error) {
        console.error('OTP verify error:', error)
        return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
    }
}
