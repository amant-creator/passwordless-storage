# 🔐 Biometric Passwordless File Storage

A premium, state-of-the-art file storage application that replaces traditional passwords with biometric authentication (WebAuthn). Built with **Next.js 16**, **Prisma**, **Supabase**, and **UploadThing**.

## ✨ Features

- **🚀 Passwordless Auth**: Register and login using Face ID, Touch ID, Windows Hello, or Android Biometrics.
- **📁 Secure Storage**: Upload, list, download, and delete files with ease.
- **💎 Premium UI**: Modern glassmorphism design with smooth animations and responsive layouts.
- **🛡️ Secure Sessions**: HTTP-only, secure cookie-based session management.
- **⚡ High Performance**: Built with the Next.js App Router for speed and SEO.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Storage**: UploadThing
- **Auth**: WebAuthn (@simplewebauthn)
- **Styling**: TailwindCSS v4 + Lucide Icons

## 🚀 Getting Started

### 1. Prerequisites

Before cloning, ensure you have:
- [Node.js 18+](https://nodejs.org/)
- A [Supabase](https://supabase.com/) account (for the database)
- An [UploadThing](https://uploadthing.com/) account (for file storage)

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/wordless.git
cd wordless
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your own keys:
- **DATABASE_URL**: Your Supabase connection string (Pooler).
- **DIRECT_URL**: Your Supabase direct connection string (for migrations).
- **UPLOADTHING_TOKEN**: Your UploadThing API token.
- **SESSION_SECRET**: A random string (at least 32 characters).

### 5. Initialize Database

Run the following commands to set up your database schema:

```bash
npx prisma db push
npx prisma generate
```

### 6. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the app!

## 🧪 Testing Biometrics

- **Localhost**: You can test WebAuthn on `localhost` without HTTPS.
- **Production**: When deploying to Vercel or other platforms, you **must** use HTTPS and update the `RP_ID` and `NEXT_PUBLIC_APP_URL` in your environment variables.

## 📄 License

This project is licensed under the MIT License.
