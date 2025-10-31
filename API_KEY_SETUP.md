# 🔑 API Key Setup Instructions

## The Error You're Seeing

The error "Function error:" occurs because the GEMINI_API_KEY is missing or not properly configured.

## How to Fix

### Step 1: Get a Gemini API Key
1. Go to https://makersuite.google.com/app/apikey (or https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Add the API Key to Your Environment

#### For Local Development:
1. Open the `.env.local` file in your project root
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
   ```
   GEMINI_API_KEY="AIzaSy..."
   VITE_GEMINI_API_KEY="AIzaSy..."
   ```
3. Save the file
4. Restart your dev server:
   ```bash
   # Stop the server (Ctrl+C)
   yarn dev
   ```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add a new variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
4. Redeploy your application

### Step 3: Test
1. Upload a document and extract text
2. Try clicking "Summarize Text", "Simplify Language", or "Translate Text"
3. You should now see the processed result instead of an error

## Why Two Variables?

- `GEMINI_API_KEY` - Used by the Vercel serverless function (server-side)
- `VITE_GEMINI_API_KEY` - Used for local development fallback (client-side)

Both should have the same value.

## Still Getting Errors?

Check the browser console (F12) for detailed error messages. Common issues:
- API key is invalid or expired
- API key quota exceeded (free tier has limits)
- Network/CORS issues
- Text is too long (try summarizing shorter sections)
