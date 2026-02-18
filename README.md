# Passwordless Biometric File Storage - Setup Instructions

## Prerequisites

Before you begin, you need to set up:

1. **Supabase Database**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your database connection string from Project Settings → Database
   - It should look like: `postgresql://[user]:[password]@[host]:5432/[dbname]`

2. **UploadThing Account**
   - Go to [uploadthing.com](https://uploadthing.com) and create an account
   - Create a new app
   - Get your API token from the dashboard

## Setup Steps

### 1. Configure Environment Variables

Edit the `.env.local` file and add your credentials:

```env
# Database - Get from Supabase
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# UploadThing - Get from UploadThing dashboard
UPLOADTHING_TOKEN="your-uploadthing-token"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RP_NAME="Biometric File Storage"
RP_ID="localhost"

# Session (generate a random 32+ character string)
SESSION_SECRET="change-this-to-a-random-32-character-string"
```

### 2. Initialize Database

Run Prisma migration to create database tables:

```bash
npx prisma db push
```

Generate Prisma client:

```bash
npx prisma generate
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Testing Biometric Authentication

### Requirements
- A device with biometric capabilities:
  - **Mac**: Touch ID or Face ID
  - **Windows**: Windows Hello
  - **Android/iOS**: Fingerprint or Face unlock
  - **Alternative**: Hardware security key (YubiKey, etc.)

### Testing Steps

1. **Register a new user:**
   - Open the app in your browser
   - Click "Register" tab
   - Enter a username
   - Click "Register with Biometrics"
   - Your device will prompt for biometric authentication
   - Complete the biometric check

2. **Test login:**
   - Open the app in an incognito/private window
   - Click "Login" tab
   - Enter the same username
   - Click "Login with Biometrics"
   - Authenticate with your biometric sensor

3. **Test file operations:**
   - Upload files using the upload button
   - View your files in the dashboard
   - Download files
   - Delete files

## Troubleshooting

### "WebAuthn not supported"
- Use HTTPS in production (required for WebAuthn)
- For local development, use `localhost` (HTTP is allowed)
- Some browsers don't support WebAuthn in private/incognito mode

### Database connection errors
- Verify your DATABASE_URL is correct
- Check if Supabase project is active
- Ensure `prisma db push` ran successfully

### UploadThing errors
- Verify your UPLOADTHING_TOKEN is correct
- Check file size limits (configured in `core.ts`)
- Ensure you're logged in when uploading

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Update `RP_ID` to your domain (e.g., `your-app.vercel.app`)
5. Update `NEXT_PUBLIC_APP_URL` to your full URL
6. Deploy!

**Important:** For production, you MUST use HTTPS (Vercel provides this automatically).

## Architecture

- **Authentication**: WebAuthn (no passwords!)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **File Storage**: UploadThing
- **Framework**: Next.js 16 with App Router
- **Styling**: TailwindCSS v4 with custom theme
- **Deploying**: Vercel

## Security Notes

- Biometric data never leaves your device
- Only public key credentials are stored in the database
- Session cookies are HTTP-only and secure
- All API routes check authentication
- Files are scoped to authenticated users
