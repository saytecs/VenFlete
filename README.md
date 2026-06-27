This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deployment (Railway + Vercel)

Follow these steps to provision a production database on Railway and connect it to Vercel.

1. Create a MySQL database on Railway

	- Go to https://railway.app, create a new Project and add the MySQL plugin.
	- Copy the connection string (format: `mysql://USER:PASS@HOST:PORT/DATABASE`).

2. Configure Vercel environment variables

	- In Vercel dashboard → your project → Settings → Environment Variables, add `DATABASE_URL` with the Railway connection string.
	- Add it for both Preview and Production environments.

3. Run migrations (locally or via CI)

	- Locally (PowerShell):

	  ```powershell
	  $env:DATABASE_URL = "mysql://USER:PASS@HOST:PORT/DATABASE"
	  npx prisma migrate deploy
	  node prisma/seed.js
	  ```

	- Or use the provided GitHub Actions workflow: go to the `Actions` tab → `Deploy Prisma Migrations` → `Run workflow`. Set the repo secret `DATABASE_URL` first.

4. Redeploy the Vercel project

	- Trigger a redeploy in Vercel (or push to main). Confirm build logs succeed.

5. Verify in production

	- Open your production URL and test login and CRUD flows.

Notes

- The project includes convenience npm scripts:

  - `npm run prisma:deploy` — runs `prisma migrate deploy`.
  - `npm run db:seed` — runs `node prisma/seed.js`.
  - `npm run db:prepare` — runs deploy + seed.

