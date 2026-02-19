import nodemailer from 'nodemailer'
import { prisma } from './prisma'

interface EmailPreferences {
    welcomeEmail?: boolean
    notifications?: boolean
}

function getTransporter() {
    const user = process.env.EMAIL_USER
    const pass = process.env.EMAIL_PASS

    if (!user || !pass) {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in .env.local')
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    })
}

interface EmailOptions {
    to: string
    subject: string
    html: string
}

export async function checkEmailPreference(userId: string, preferenceType: keyof EmailPreferences = 'welcomeEmail'): Promise<boolean> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            return false
        }

        const preferences = (user.emailPreferences as unknown as EmailPreferences) || {}
        return preferences[preferenceType] !== false // Default to true if not specified
    } catch (error) {
        console.error('Error checking email preference:', error)
        return false
    }
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        const transporter = getTransporter()
        const result = await transporter.sendMail({
            from: `"Biometric File Storage" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        })
        return result
    } catch (error) {
        console.error('Email send error:', error)
        throw error
    }
}

export function generateWelcomeEmail(username: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 24px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 32px; font-weight: bold;">Welcome to Biometric File Storage! 🎉</h1>
                <p style="margin: 12px 0 0 0; font-size: 18px; color: #e0e7ff;">
                    Account: <strong style="font-size: 20px; color: #fff;">${username}</strong>
                </p>
            </div>

            <!-- Main Content -->
            <div style="background: #f8fafc; padding: 40px 24px;">
                <p style="color: #1e293b; font-size: 16px; margin: 0 0 24px 0;">
                    Hello <strong style="font-size: 18px; color: #667eea;">${username}</strong>,
                </p>

                <!-- User Profile Info Box -->
                <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; padding: 16px; margin: 0 0 24px 0; border-radius: 8px;">
                    <p style="color: #475569; font-size: 13px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Your Account Details</p>
                    <p style="color: #1e293b; font-size: 15px; margin: 8px 0 0 0;">
                        <strong>Username:</strong> <span style="color: #667eea; font-weight: bold; font-size: 16px;">${username}</span>
                    </p>
                </div>

                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Thank you for registering with us! We're excited to have you on board. Your account has been successfully created and is ready to use.
                </p>

                <!-- Key Features -->
                <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 24px 0; border-radius: 8px;">
                    <h3 style="color: #667eea; font-size: 16px; margin: 0 0 16px 0;">Quick Start Guide</h3>
                    <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li><strong>Secure Access:</strong> Use your biometric credentials or WebAuthn authenticator to log in securely</li>
                        <li><strong>Upload Files:</strong> Store and manage your files in your personal dashboard</li>
                        <li><strong>Email Backup:</strong> You can add an email address to your account for OTP-based login as a fallback</li>
                        <li><strong>File Management:</strong> Download, delete, or organize your uploaded files anytime</li>
                    </ul>
                </div>

                <!-- Features Overview -->
                <div style="background: white; padding: 20px; margin: 24px 0; border-radius: 8px;">
                    <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 16px 0;">🔐 Key Features</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px; color: #475569;">
                        <div>
                            <strong style="color: #667eea;">✓ Passwordless Login</strong>
                            <p style="margin: 4px 0 0 0;">No passwords needed - use your biometric data</p>
                        </div>
                        <div>
                            <strong style="color: #667eea;">✓ Secure Storage</strong>
                            <p style="margin: 4px 0 0 0;">Your files are encrypted and protected</p>
                        </div>
                        <div>
                            <strong style="color: #667eea;">✓ Easy Access</strong>
                            <p style="margin: 4px 0 0 0;">Access your files from anywhere</p>
                        </div>
                        <div>
                            <strong style="color: #667eea;">✓ Multiple Auth Methods</strong>
                            <p style="margin: 4px 0 0 0;">WebAuthn, Email OTP, and more</p>
                        </div>
                    </div>
                </div>

                <!-- Getting Started -->
                <div style="background: #f0f4ff; padding: 20px; margin: 24px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                    <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Getting Started</h3>
                    <ol style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Log in to your dashboard using your biometric authenticator</li>
                        <li>Complete your profile by adding an email address (optional but recommended)</li>
                        <li>Start uploading and managing your files</li>
                        <li>Share or download files as needed</li>
                    </ol>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${appUrl}/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                        Go to Dashboard
                    </a>
                </div>

                <!-- Support & Tips -->
                <div style="background: white; padding: 20px; margin: 24px 0; border-radius: 8px;">
                    <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">💡 Tips</h3>
                    <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Keep your authenticator device secure</li>
                        <li>Enable email OTP login for account recovery</li>
                        <li>Regularly backup important files</li>
                        <li>Contact support if you have any issues</li>
                    </ul>
                </div>

                <!-- Closing -->
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                    If you have any questions or need assistance, feel free to reach out to our support team. We're here to help!
                </p>

                <p style="color: #64748b; font-size: 14px; margin: 16px 0 0 0;">
                    Best regards,<br/>
                    <strong>Biometric File Storage Team</strong>
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #1e293b; padding: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0 0 8px 0;">
                    This is an automated message. Please do not reply to this email.
                </p>
                <p style="margin: 0;">
                    © 2026 Biometric File Storage. All rights reserved.
                </p>
            </div>
        </div>
    `
}
