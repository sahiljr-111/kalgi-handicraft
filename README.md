# Kalgi Handicraft: website + admin dashboard

A single Next.js 15 app containing:

- **Public website:** SEO-first, statically generated and refreshed on demand (ISR)
- **Admin dashboard** at `/admin`
- **API** under `/api/*`

Data lives in **MongoDB Atlas** and images in **Cloudinary**. There is no separate backend server to host.

```
app/            pages (public site + /admin) and API route handlers (app/api/*)
components/     site/, admin/ and ui/ (shadcn-style primitives)
lib/            client helpers, types, cached data for pages (lib/api.ts)
server/         database, models, services (business logic), auth, email, storage
scripts/seed.ts sample content
public/seed/    placeholder product artwork (SVG) used by the sample content
```

## Brand

The colours and logo come from the business card (`design/card.jpeg`):

| Token | Value | Use |
|---|---|---|
| `navy` | `#1e1f33` | Header, hero, footer, primary buttons, dashboard sidebar |
| `gold-soft` | `#c1a25f` | Brand gold: logo, highlights, and text on navy (6.6:1 contrast) |
| `gold` | `#7d6228` | Gold text on ivory/paper backgrounds (5.3:1 contrast) |
| `ivory` / `paper` | `#fbf6ec` / `#f4ecdc` | Light page backgrounds |

The tokens live in `app/globals.css` (`@theme`).

The logo was vector-traced from the card:

- **Circle:** a geometric circle fitted to the card's pixels.
- **Peacock and wordmark:** traced from an 8× upscale using potrace.

Files in `public/brand/`:

- `kalgi-logo-on-dark.svg`: gold lockup, identical to the card, for navy backgrounds
- `kalgi-logo-on-light.svg`: navy wordmark and badge mark, for light backgrounds
- `kalgi-mark.svg`: gold disc with a navy peacock
- `kalgi-mark-knockout.svg`: gold disc with the peacock cut out

`public/icon.svg` is the favicon. `app/opengraph-image.png` is the link preview shown on WhatsApp and social media.

## SEO

SEO is automatic, so the owner never has to fill SEO fields (see `lib/seo.ts`).

- **Product pages:** the title and meta description are built from the product's own data when it is saved: name, size, price, MOQ, material, colours, category and town. Example: "Meenakari Bajot Chowki from ₹500 – Wholesale Manufacturer, Jasdan | Kalgi Handicraft". Anything typed in *Advanced settings* overrides it, and the form shows a live Google preview.
- **Category pages:** the same, built from the category name, tagline and product count.
- **Share image per product:** `app/(site)/product/[slug]/opengraph-image.tsx` makes a 1200×630 JPEG (~70 KB) with the product photo, name, price and MOQ. This is what WhatsApp and Facebook show when a product link is shared.
- **Structured data (JSON-LD):**
  - `Product` with offer price, MOQ and absolute image URLs
  - `CollectionPage` + `ItemList` for categories
  - `BreadcrumbList`
  - `LocalBusiness`/`Store` and `WebSite` on every page
  - `BlogPosting` for articles
- **`sitemap.xml`:** every product, category and article, with product photos for Google Images. It refreshes the moment content is added, edited or deleted (`server/revalidate.ts`), and at least hourly.
- **Instant updates:** a new product has its own page, metadata, share image and sitemap entry immediately. A deleted or hidden product returns 404 and drops out of the sitemap.
- **Optional environment variables:**
  - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`: Search Console HTML-tag verification.
  - `NEXT_PUBLIC_GA_ID`: Google Analytics 4. WhatsApp and call clicks are sent as `generate_lead` events.
- **In production,** set `NEXT_PUBLIC_SITE_URL` to the real domain. Canonical URLs, the sitemap and structured data all use it.
- **Blogs:** topics (`/blog/topic/<topic>`), crawlable pagination, a table of contents built from the article's headings, related posts, drafts, scheduling and signed-in preview (`/api/blog/preview?id=…`). Each post can set its own SEO title and description, share image, canonical URL and "Hide from Google" (noindex).
- **Redirects:** renaming a product, category or blog adds a 301 from the old address automatically. Admin → Redirects lists them and lets the owner add one by hand.
- **Hide from Google:** products, categories and blogs have a noindex switch. Hidden items are also left out of the sitemap.
- **Content rules:** the site states only verified facts. See [docs/SEO-AUDIT.md](docs/SEO-AUDIT.md) for the sources and the open questions for the owner. `scripts/content-cleanup.ts` applies the verified content and business details, and `scripts/catalog-update.ts` applies the catalogue changes (no minimum order, merged duplicates, top sellers). Both are safe to re-run.

## Run locally

```bash
npm install
cp .env.example .env.local    # then fill in MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
npm run seed                  # only needed for an empty database
npm run dev                   # http://localhost:3000   dashboard: /admin
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` then `npm start` | Production build and server |
| `npm run seed` | Adds sample content and the first owner account, if the database is empty |
| `npm run seed:reset` | Wipes content (not users) and reseeds sample data. Refuses to run once the real IndiaMART catalogue is imported (add `--force` to override). |
| `npm run typecheck` / `npm run lint` | Checks |

Without Cloudinary keys, dev uploads go to `./.uploads`. In production, uploads are **disabled** until Cloudinary is configured, so images can't silently vanish on redeploy.

> **The sample content is placeholder.** Product images are generated SVG illustrations. Phone, WhatsApp, GST number and testimonials are made up, and sample inquiries and testimonials are prefixed "Sample:". Replace them from the dashboard before launch.

## How it fits together

- **Public pages** (`app/(site)`) read MongoDB directly through `lib/api.ts`, cached with tags such as `products` and `settings`. Category, product and blog pages are pre-rendered at build time.
- **Admin writes** go through `/api/*` route handlers into `server/services/*`, which call `revalidateTag()`. The public site updates within seconds; no rebuild is needed.
- **Auth:** email + password, JWT in an httpOnly cookie (`jose`), checked in `middleware.ts` for `/admin` and in every admin API route. There are two roles: owner and staff.
- **Images:** the browser uploads straight to Cloudinary using a signature from `/api/upload/sign`, so files never pass through the server and hosting request-size limits don't apply. The server verifies Cloudinary's response signature before saving the image to the media library. `next/image` uses a custom loader (`lib/imageLoader.ts`), so Cloudinary does the resizing and WebP/AVIF conversion instead of the host.
- **Spam protection:** a honeypot field, plus rate limits stored in MongoDB (5 inquiries per 15 min, 10 logins per 15 min, per IP) that work on serverless hosts.
- **Email:** each new inquiry emails the owner via SMTP. The email is sent after the response (`after()`), so visitors aren't kept waiting.
- **SEO:** metadata per page, JSON-LD (`LocalBusiness`, `Product`, `BreadcrumbList`, `CollectionPage`, `BlogPosting`), `sitemap.xml`, `robots.txt` and self-hosted fonts.

## Deploy (free / low cost)

### 1. MongoDB Atlas (free M0)
1. **Network Access → Add IP → `0.0.0.0/0`**. Serverless hosts have no fixed IP, so a strong database password is your protection.
2. **Database Access:** rotate the user's password if it has ever been shared, then update `MONGODB_URI`.
3. **Backups:** M0 has no automatic backups. For the PRD's daily backup, either upgrade to Flex, or run a scheduled `mongodump` (for example a nightly GitHub Action) to storage you control.

### 2. Cloudinary (free plan)
1. Sign up at cloudinary.com. Copy **Cloud name, API key and API secret** from the dashboard.
2. Put them in the host's environment variables (below). No upload preset is needed; uploads are signed.

### 3. Hosting (pick one)

| Host | Cost | Notes |
|---|---|---|
| **Netlify** | Free plan allows commercial sites | `netlify.toml` is included. Import the repo, add the env vars and deploy. |
| **Vercel** | Hobby is free but **non-commercial only**; Pro is about $20/month | Best Next.js support. Import the repo, add the env vars and deploy. |

Cloudflare Pages/Workers is **not recommended** here: Mongoose and SMTP need Node APIs that Workers doesn't fully provide.

**Environment variables** to set on the host (see `.env.example`):

```
NEXT_PUBLIC_SITE_URL   https://www.yourdomain.com
MONGODB_URI            mongodb+srv://…/kalgi?retryWrites=true&w=majority
JWT_SECRET             (openssl rand -hex 32)
ADMIN_EMAIL, ADMIN_PASSWORD   (only used if the database has no users)
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, NOTIFY_EMAIL   (optional)
```

The build reads MongoDB to pre-render pages, so `MONGODB_URI` must be available at build time too. Both hosts expose env vars to builds by default.

### 4. Your domain
1. In the host: **Domains → Add** `yourdomain.com` and `www.yourdomain.com`.
2. At your registrar, add the DNS records the host shows. Usually that's an `A`/`ALIAS` record for the root domain and a `CNAME` for `www`. HTTPS is issued automatically.
3. Set `NEXT_PUBLIC_SITE_URL` to the final URL (for example `https://www.yourdomain.com`) and redeploy.
4. **Google Search Console:** add the domain and submit `https://www.yourdomain.com/sitemap.xml`.
5. Add the website to your Google Business Profile, with the same name, address and phone as Admin → Settings.

### 5. After the first deploy: checklist
- Sign in at `/admin`, change the password in Settings, and update business details, WhatsApp number and map link.
- Upload one real photo to confirm Cloudinary works.
- Send a test inquiry from a product page and confirm the email arrives.
- Replace the sample products, images and testimonials with real ones, and delete the "Sample:" inquiries.

## API reference

Admin routes need the session cookie (set by `POST /api/auth/login`).

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/products` (`category`, `featured`, `q`, `sort`, `minPrice`, `maxPrice`, `page`, `limit`, admin: `status`) | Public |
| GET | `/api/products/:slug` (includes `related`) · `/api/products/id/:id` | Public · Admin |
| POST · PUT · DELETE | `/api/products`, `/api/products/:id`, `POST /api/products/:id/duplicate` | Admin |
| GET | `/api/categories` (`?all=true` for admins) · `/api/categories/:idOrSlug` | Public |
| POST · PUT · DELETE | `/api/categories`, `/api/categories/:id`, `PUT /api/categories/reorder` | Admin |
| POST | `/api/inquiries` (rate-limited, honeypot) | Public |
| GET · PATCH · DELETE | `/api/inquiries`, `/api/inquiries/:id`, `GET /api/inquiries/export` (CSV) | Admin |
| POST · GET · PUT | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/password` | — |
| GET · POST | `/api/upload` (mode / local upload), `POST /api/upload/sign` (Cloudinary signature) | Admin |
| GET · POST · DELETE | `/api/media`, `/api/media/:id` | Admin |
| GET · PUT | `/api/settings` | Public · Owner |
| CRUD | `/api/blog` (`/api/blog/id/:id` for admins), `/api/gallery` | Public read · Admin write |
| GET | `/api/stats` | Admin |
| CRUD | `/api/users` | Owner |
| POST | `/api/events` (WhatsApp click counter) | Public |
| GET | `/api/health` | Public |

## Not done yet
- WhatsApp notification to the owner on new inquiries (PRD Phase 2)
- Optional reCAPTCHA if spam gets past the honeypot and rate limit
- An automated test suite. The checks so far were run by hand: headless-browser flows, rate limiting, revalidation and Lighthouse.
