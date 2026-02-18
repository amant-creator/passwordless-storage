'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/lib/uploadthing'
import { startRegistration } from '@simplewebauthn/browser'
import { LogOut, Trash2, FileIcon, Download, Upload as UploadIcon, MonitorSmartphone, Mail } from 'lucide-react'

interface FileItem {
    id: string
    fileName: string
    fileUrl: string
    fileSize: number | null
    createdAt: string
}

interface UserData {
    id: string
    username: string
    email: string | null
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<UserData | null>(null)
    const [files, setFiles] = useState<FileItem[]>([])
    const [loading, setLoading] = useState(true)
    const [uploadMode, setUploadMode] = useState(false)
    const [emailInput, setEmailInput] = useState('')
    const [emailSaving, setEmailSaving] = useState(false)
    const [emailMsg, setEmailMsg] = useState('')

    useEffect(() => {
        checkAuth()
        loadFiles()
    }, [])

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (!response.ok) {
                router.push('/')
                return
            }
            const data = await response.json()
            setUser(data.user)
        } catch (error) {
            router.push('/')
        } finally {
            setLoading(false)
        }
    }

    const loadFiles = async () => {
        try {
            const response = await fetch('/api/files')
            if (response.ok) {
                const data = await response.json()
                setFiles(data.files)
            }
        } catch (error) {
            console.error('Failed to load files:', error)
        }
    }

    const handleSaveEmail = async () => {
        if (!emailInput.trim()) return
        setEmailSaving(true)
        setEmailMsg('')
        try {
            const res = await fetch('/api/auth/update-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setUser((prev) => prev ? { ...prev, email: emailInput } : prev)
            setEmailMsg('Email saved! You can now use Email OTP as a login fallback.')
            setEmailInput('')
        } catch (err: any) {
            setEmailMsg(err.message || 'Failed to save email')
        } finally {
            setEmailSaving(false)
        }
    }

    const handleAddDevice = async () => {
        if (!user) return
        try {
            const optionsRes = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username }),
            })
            if (!optionsRes.ok) {
                const data = await optionsRes.json()
                alert(data.error || 'Failed to start registration')
                return
            }
            const options = await optionsRes.json()
            const attResp = await startRegistration({ optionsJSON: options })
            const verifyRes = await fetch('/api/auth/register', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user.username, response: attResp }),
            })
            if (!verifyRes.ok) {
                const data = await verifyRes.json()
                alert(data.error || 'Failed to add device')
                return
            }
            alert('New device/biometric added successfully!')
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                alert('Operation was cancelled')
            } else {
                alert(err.message || 'Failed to add device')
            }
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return

        try {
            const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
            if (response.ok) {
                setFiles(files.filter((f) => f.id !== fileId))
            }
        } catch (error) {
            console.error('Failed to delete file:', error)
        }
    }

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown'
        const kb = bytes / 1024
        if (kb < 1024) return `${kb.toFixed(1)} KB`
        return `${(kb / 1024).toFixed(1)} MB`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="glass border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                My Files
                            </h1>
                            <p className="text-sm text-muted">Welcome, {user?.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAddDevice}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated transition-all border border-border text-blue-400"
                                title="Add this device/biometric for future logins"
                            >
                                <MonitorSmartphone className="w-4 h-4" />
                                Add Device
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated transition-all border border-border"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Email OTP Fallback Banner */}
                {!user?.email && (
                    <div className="mb-6 glass rounded-xl p-4 border border-yellow-500/30 bg-yellow-500/5">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-yellow-400">Add email for fallback login</p>
                                <p className="text-xs text-muted mt-1 mb-3">
                                    No Bluetooth or biometrics available? Register your email to use OTP login as a backup.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        value={emailInput}
                                        onChange={(e) => setEmailInput(e.target.value)}
                                        placeholder="your@email.com"
                                        className="flex-1 px-3 py-2 text-sm bg-surface rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                                        onKeyPress={(e) => { if (e.key === 'Enter') handleSaveEmail() }}
                                    />
                                    <button
                                        onClick={handleSaveEmail}
                                        disabled={emailSaving || !emailInput.trim()}
                                        className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg disabled:opacity-50 transition-all"
                                    >
                                        {emailSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                                {emailMsg && <p className="text-xs mt-2 text-green-400">{emailMsg}</p>}
                            </div>
                        </div>
                    </div>
                )}
                {user?.email && emailMsg && (
                    <div className="mb-6 p-3 glass rounded-xl border border-green-500/30 text-green-400 text-sm">{emailMsg}</div>
                )}

                {/* Upload Section */}
                <div className="mb-8">
                    {!uploadMode ? (
                        <button
                            onClick={() => setUploadMode(true)}
                            className="w-full glass rounded-2xl p-12 border-2 border-dashed border-border hover:border-blue-500 transition-all group"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <UploadIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">Upload Files</p>
                                    <p className="text-sm text-muted">Click to upload documents, images, videos, and more</p>
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Upload Files</h2>
                                <button
                                    onClick={() => setUploadMode(false)}
                                    className="text-muted hover:text-text"
                                >
                                    Cancel
                                </button>
                            </div>
                            <UploadDropzone
                                endpoint="fileUploader"
                                onClientUploadComplete={(res) => {
                                    console.log('Files uploaded:', res)
                                    setUploadMode(false)
                                    loadFiles()
                                }}
                                onUploadError={(error: Error) => {
                                    alert(`Upload failed: ${error.message}`)
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Files Grid */}
                {files.length === 0 ? (
                    <div className="text-center py-12">
                        <FileIcon className="w-16 h-16 mx-auto text-muted mb-4" />
                        <p className="text-muted text-lg">No files uploaded yet</p>
                        <p className="text-sm text-muted mt-2">Upload your first file to get started</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="glass rounded-xl p-5 hover:bg-surface-elevated transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                                            <FileIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium truncate" title={file.fileName}>
                                                {file.fileName}
                                            </p>
                                            <p className="text-xs text-muted">{formatFileSize(file.fileSize)}</p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs text-muted mb-4">{formatDate(file.createdAt)}</p>

                                <div className="flex gap-2">
                                    <a
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
