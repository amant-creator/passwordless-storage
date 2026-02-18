import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'
import type { Prisma } from '@prisma/client'

function getTransporter() {
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS
    if (!user || !pass || user === 'your-gmail@gmail.com') {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env.local')
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    })
}

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
    try {
        const { username } = await request.json()

        if (!username || typeof username !== 'string') {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({ where: { username } })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (!user.email) {
            return NextResponse.json(
                { error: 'No email registered for this account. Please add an email first.' },
                { status: 400 }
            )
        }

        const otp = generateOTP()
        const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        await prisma.user.update({
            where: { id: user.id },
            data: { otpCode: otp, otpExpiry: expiry } as Prisma.UserUpdateInput,
        })

        const transporter = getTransporter()
        await transporter.sendMail({
            from: `"Biometric File Storage" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Your Login OTP Code',
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 24px; border-radius: 12px; background: #0f172a; color: #e2e8f0;">
                    <h2 style="color: #60a5fa; margin-bottom: 8px;">Login Code</h2>
                    <p style="color: #94a3b8;">Use the code below to log in. It expires in <strong>10 minutes</strong>.</p>
                    <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; text-align: center; padding: 24px 0; color: #f8fafc;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 12px;">If you did not request this, ignore this email.</p>
                </div>
            `,
        })

        return NextResponse.json({ success: true, message: 'OTP sent to your registered email' })
    } catch (error: any) {
        console.error('OTP send error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to send OTP' },
            { status: 500 }
        )
    }
}
