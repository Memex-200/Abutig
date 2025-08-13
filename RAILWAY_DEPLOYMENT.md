# Railway Deployment Guide 🚀

## Overview

This guide will help you deploy the Municipality Complaints System to Railway, a modern platform for hosting full-stack applications.

## Prerequisites

- [Railway Account](https://railway.app/)
- [GitHub Account](https://github.com/)
- Your project code pushed to GitHub

## Step 1: Prepare Your Repository

### 1.1 Ensure all files are committed

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 1.2 Verify these files exist in your repository:

- `railway.json` - Railway configuration
- `railway.toml` - Alternative Railway configuration
- `start.sh` - Startup script
- `package.json` - Main package configuration
- `server/package.json` - Server package configuration
- `prisma/schema.prisma` - Database schema

## Step 2: Deploy to Railway

### 2.1 Connect to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Click "Deploy Now"

### 2.2 Configure Environment Variables

In your Railway project dashboard, add these environment variables:

```env
NODE_ENV=production
DATABASE_URL=file:./dev.db
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2.3 Configure Domains

1. Go to your project settings
2. Click "Domains"
3. Add a custom domain or use Railway's provided domain

## Step 3: Database Setup

### 3.1 Using Railway's Database (Recommended)

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add `DATABASE_URL` to your environment variables
4. Update your `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3.2 Using SQLite (Simple Setup)

If you want to keep using SQLite:

1. The `DATABASE_URL=file:./dev.db` will work
2. Note: Data will be lost on redeployments

## Step 4: Update Frontend Configuration

### 4.1 Update API URLs

In your frontend code, update all API calls to use your Railway domain:

```typescript
// Instead of http://localhost:3001
const API_BASE_URL = "https://your-railway-app.railway.app";
```

### 4.2 Update Vite Configuration

Update `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  preview: {
    port: 5173,
    host: "0.0.0.0",
  },
});
```

## Step 5: Deployment Process

### 5.1 Railway will automatically:

1. Install dependencies (`npm run install:all`)
2. Generate Prisma client (`npm run db:generate`)
3. Push database schema (`npm run db:push`)
4. Seed database (`npm run db:seed`)
5. Build frontend (`npm run build`)
6. Start the application (`npm run start:full`)

### 5.2 Monitor Deployment

1. Check the deployment logs in Railway dashboard
2. Ensure all steps complete successfully
3. Verify the health check passes

## Step 6: Post-Deployment

### 6.1 Test Your Application

1. Visit your Railway domain
2. Test all functionality:
   - User registration/login
   - Complaint submission
   - Admin dashboard
   - File uploads
   - Email notifications

### 6.2 Default Admin Accounts

After deployment, these accounts will be available:

- Email: `emanhassanmahmoud1@gmail.com`
- Password: `Emovmmm#951753`
- Email: `karemelolary8@gmail.com`
- Password: `Emovmmm#951753`

## Troubleshooting

### Common Issues

#### 1. Build Failures

- Check Railway logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

#### 2. Database Connection Issues

- Verify `DATABASE_URL` is set correctly
- Check if database service is running
- Ensure Prisma schema is valid

#### 3. Port Issues

- Railway automatically assigns ports
- Use `process.env.PORT` in your server code
- Frontend should run on port 5173

#### 4. Environment Variables

- Ensure all required variables are set
- Check for typos in variable names
- Restart deployment after adding variables

### Useful Commands

```bash
# View Railway logs
railway logs

# Connect to Railway CLI
railway login

# Deploy manually
railway up

# Check status
railway status
```

## Monitoring and Maintenance

### 1. Logs

- Monitor application logs in Railway dashboard
- Set up log aggregation if needed

### 2. Performance

- Railway provides basic metrics
- Consider upgrading for better performance

### 3. Backups

- Database backups are automatic with Railway
- Consider additional backup strategies

### 4. Updates

- Push changes to GitHub
- Railway will automatically redeploy
- Test thoroughly before pushing

## Cost Optimization

### 1. Free Tier

- Railway offers a generous free tier
- Monitor usage to stay within limits

### 2. Scaling

- Upgrade only when needed
- Consider usage patterns

## Security Considerations

### 1. Environment Variables

- Never commit secrets to Git
- Use Railway's secure environment variables

### 2. HTTPS

- Railway provides automatic HTTPS
- Ensure all external links use HTTPS

### 3. CORS

- Update CORS settings for production domain
- Restrict to necessary origins

## Support

### Railway Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### Project Support

- Check the project README
- Review deployment logs
- Test locally before deploying

---

**Your Municipality Complaints System is now ready for Railway deployment!** 🎉

## Quick Deploy Checklist

- [ ] Repository pushed to GitHub
- [ ] Railway account created
- [ ] Project connected to Railway
- [ ] Environment variables configured
- [ ] Database service added (if using PostgreSQL)
- [ ] Domain configured
- [ ] Application tested
- [ ] Admin accounts verified
- [ ] Monitoring set up
