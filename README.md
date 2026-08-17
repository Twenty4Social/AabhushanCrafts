# Aabhushan Crafts

Public website for Aabhushan Crafts, Naxal, Kathmandu.

The site is a standard Next.js App Router project designed for zero-configuration deployment on Vercel. It has no authentication, database, private routes, or required environment variables.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Deploy on Vercel

1. Import this GitHub repository into Vercel.
2. Keep the detected framework as **Next.js**.
3. Keep the default build command (`npm run build`) and output settings.
4. Deploy. No environment variables or sign-in configuration are required.

Vercel will deploy every push to the production branch and create previews for other branches.

## Optional canonical URL

The metadata defaults to `https://aabhushancrafts.com`. To use a different production URL, set:

```text
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Main files

- `app/page.tsx` — page content, product list, rates, and news links
- `app/globals.css` — responsive visual design
- `app/layout.tsx` — metadata and social sharing configuration
- `public/images/` — supplied brand and product images
- `public/og.png` — social sharing image

The displayed gold and silver rates are dated values. Update them in `app/page.tsx` when the market rate changes.
