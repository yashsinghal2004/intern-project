# Supabase Setup on Vercel - Next Steps

## Step 1: Add DATABASE_URL Environment Variable

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Click **Add New**
3. Add the following:
   - **Name**: `DATABASE_URL`
   - **Value**: Copy the value from `POSTGRES_PRISMA_URL` (from the Supabase quickstart)
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

**Important**: Use `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`) as it's optimized for Prisma with connection pooling.

## Step 2: Create PostgreSQL Migration

Since we switched from SQLite to PostgreSQL, you need to create a new migration:

```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Create a new migration
npx prisma migrate dev --name init_postgres
```

This will create a new migration file for PostgreSQL.

## Step 3: Push Changes and Redeploy

1. Commit and push all changes to GitHub:
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL for Vercel deployment"
   git push
   ```

2. Vercel will automatically redeploy

3. The migration will run automatically during build (via the `postinstall` script)

## Step 4: Verify It Works

1. Go to your deployed app
2. Click "Drop Ball"
3. It should work now! 🎉

## Troubleshooting

If you still get errors:

1. **Check Vercel logs**: Go to your deployment → Logs tab
2. **Verify DATABASE_URL**: Make sure it's set correctly in Environment Variables
3. **Check migration**: The migration should run automatically, but you can verify in Supabase dashboard

## Local Development

For local development, you can either:

**Option A**: Use the same Supabase database
- Copy `POSTGRES_PRISMA_URL` to your local `.env` file as `DATABASE_URL`

**Option B**: Use SQLite locally (temporary)
- Change `prisma/schema.prisma` provider back to `sqlite` for local dev
- Use `DATABASE_URL="file:./dev.db"` in `.env.local`

