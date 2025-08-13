# Quick Railway Deployment 🚀

## Prerequisites

- GitHub repository with your code
- Railway account

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

## Step 2: Deploy to Railway

### Option A: Using Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Click "Deploy Now"

### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

## Step 3: Configure Environment Variables

In Railway dashboard, add these variables:

```env
NODE_ENV=production
DATABASE_URL=file:./dev.db
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here
```

## Step 4: Get Your URL

- Railway will provide a URL like: `https://your-app.railway.app`
- You can also add a custom domain

## Step 5: Test Your App

- Visit your Railway URL
- Test admin login: `emanhassanmahmoud1@gmail.com` / `Emovmmm#951753`

## That's it! 🎉

Your Municipality Complaints System is now live on Railway!

### Default Admin Accounts

- `emanhassanmahmoud1@gmail.com` / `Emovmmm#951753`
- `karemelolary8@gmail.com` / `Emovmmm#951753`

### Need Help?

- Check [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed guide
- Check Railway logs for any issues
- Ensure all files are committed to GitHub
