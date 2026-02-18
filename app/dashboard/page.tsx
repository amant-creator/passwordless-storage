'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadDropzone } from '@/lib/uploadthing'
import { LogOut, Trash2, FileIcon, Download, Upload as UploadIcon } from 'lucide-react'

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
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                My Files
                            </h1>
                            <p className="text-sm text-muted">Welcome, {user?.username}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface hover:bg-surface-elevated transition-all border border-border"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Upload Section */}
                <div className="mb-8">
                    {!uploadMode ? (
                        <button
                            onClick={() => setUploadMode(true)}
                            className="w-full glass rounded-2xl p-12 border-2 border-dashed border-border hover:border-blue-500 transition-all group"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
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
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
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
