# Deploying to Vercel

## Prerequisites
1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`

## Environment Variables
Before deploying, you need to set up your environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project (or create a new one)
3. Go to Settings → Environment Variables
4. Add the following variables:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `HF_API_KEY` - Your Hugging Face API key (optional, if you want to use HuggingFace)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Push your code to GitHub/GitLab/Bitbucket
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel will auto-detect the framework (Vite)
5. Add your environment variables
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to link/create a project
4. Add environment variables via dashboard or CLI:
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add HF_API_KEY
   ```
5. Deploy: `vercel --prod`

## API Routes
Your serverless functions will be available at:
- `/api/gemini` - Gemini AI processing (summarize, simplify, translate)
- `/api/huggingface` - Hugging Face processing (alternative)

## Local Development
To test the API routes locally:
```bash
npm run dev
```

The Vercel dev server will automatically serve your API routes at `http://localhost:5173/api/*`

## Troubleshooting
- If you get 404 errors on API routes, make sure `vercel.json` is in the root directory
- If functions timeout, the text might be too long - try summarizing first
- Check function logs in Vercel dashboard under "Functions" tab
