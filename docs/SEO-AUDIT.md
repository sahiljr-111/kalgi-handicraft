# Kalgi Handicraft: SEO audit and implementation report

October 2026. This covers the website, the dashboard and the content changes made during the audit. Every fact the website states about the business is listed in section 1 with its source. Anything unconfirmed is in section 11, waiting on the owner.

## 1. Business summary

### Verified facts

Source: the IndiaMART company profile (indiamart.com/kalgi-handicraft), checked October 2026.

| Fact | Value |
|---|---|
| Name | Kalgi Handicraft |
| Owner / proprietor | Akshay B Hirani (confirmed by the owner) |
| Business type | Manufacturer: factory/manufacturing and wholesale. Proprietorship. |
| Established | 1999 |
| Team size | 11 to 25 employees |
| GSTIN | 24AXNPH4757R1ZN (registered 2021) |
| Address | Aanand Nagar, Nr. New Bus Stop, Jasdan, Dist. Rajkot, Gujarat – 360050 (confirmed by the owner) |
| Phone / WhatsApp | +91 84698 85085 |
| Email | axayp9932@gmail.com (confirmed by the owner) |
| Hours | Open all days, 8:00 AM – 8:30 PM (confirmed by the owner) |
| Order quantity | No minimum order: any quantity, from one piece (owner's decision, Oct 2026) |
| Rating | 4.5/5 from 10 buyer ratings ([testimonial page](https://www.indiamart.com/kalgi-handicraft/testimonial.html)) |
| Buyer cities on the profile | Ahmedabad, Surat, Vadodara, Rajkot, Hyderabad, Jabalpur and others |
| Products | 115 live products in 6 collections: wooden chowki & bajot, dry fruit boxes, pooja articles, jewellery & gift boxes, home décor, kitchen & utility. 3 are placeholders (section 11). |
| Top sellers (owner's list) | Bajot, Rajwadi bajot, Dry fruit box, Meenakari dry fruit box, Metal chowki, Key holder, Meenakari glass, Rajwadi patari, Patla, Steel poori dabba |

### Who buys
- Retailers and gift shops.
- Pooja-store owners.
- Bulk and corporate gifting buyers.
- Households buying single pieces.

### How they buy
Inquiry first, by WhatsApp, call or form. No online checkout.

### What the website is for
To turn Google searches (for example "meenakari chowki wholesale" or "dry fruit box manufacturer Gujarat") into WhatsApp and phone inquiries.

### Removed because it could not be verified
| Removed | Where it was |
|---|---|
| Sample testimonials | Home page |
| Rating count "120+" (the real count is 10) | Site-wide |
| Placeholder GSTIN | Footer, About |
| 8 illustrated gallery "orders" (such as "500 boxes for a pharma company") | Gallery |
| Invented founder quote | About |
| Invented "How it is made" steps | Home page |
| "Family-run" | About |
| "Hand-painted" | Hero, footer, About, product page, SEO text |
| "Custom colours & logo branding" | Home page, product page, About |
| "Pan-India shipping" | Home page, About, product page |
| "We reply within a few working hours" | Contact |
| Invented business hours | Footer, Contact |
| Unconfirmed email info@kalgihandicraft.com | Footer, Contact |
| Self-served `aggregateRating` | Structured data |

## 2. Audit findings

Method: a full crawl of the production build (`crawl.py`), Lighthouse (mobile), and code and content review.

| | Before | After |
|---|---|---|
| Pages reachable by links | 73 | 137 (all 200) |
| Sitemap URLs not reachable by any link | **59** (58 products hidden behind "Show more", plus gallery) | **0** |
| Titles longer than 65 characters | 32 | 0 |
| Meta descriptions longer than 160 characters | 2 | 0 |
| Duplicate titles | 2 | 3 (real duplicate listings; see section 11) |
| Pages without a canonical | 0, but every page without its own inherited `canonical: /` from the root layout | 0; each page has its own |
| Missing alt attributes | 0 | 0 |
| Pages with one H1 | all | all |
| Lighthouse (mobile) | n/a | Home 87/100/100/100. Category 92/100/100/100. Article 93/100/100/100. CLS 0. |

## 3. Issue tracker

| # | Priority | Issue | Fix | Verified by |
|---|---|---|---|---|
| 1 | Critical | 58 products were only reachable by clicking "Show more", which loaded more items with JavaScript. Google could not find them through links. | `CategoryBrowser` renders every product in the HTML; "Show more" only reveals hidden cards. | Crawl: 0 orphans |
| 2 | Critical | Fabricated or unverified claims: reviews, gallery, quote, GSTIN, rating count, hours, email, process | Removed or replaced with verified facts (section 1) | Manual review, crawl |
| 3 | Critical | First login (or form submit) after a server start hung for 10 s, then failed with "Database unreachable". The rate limiter queried MongoDB before connecting. | `server/rateLimit.ts` connects first. `server/db.ts` also reconnects if a cached connection has dropped. | Cold-start login: 200 in 1.7 s |
| 4 | High | Root layout set `canonical: /` for every page that did not set its own | Removed from the root; the home page sets its own | Crawl: each canonical is self-referencing |
| 5 | High | Self-served `aggregateRating` in LocalBusiness schema. Google ignores it and it can count as spammy markup. | Removed. The rating is shown as text with a link to its source. | JSON-LD review |
| 6 | High | Renaming a slug broke old URLs | Automatic 301 redirect table. No chains or loops. Admin page to manage it. | E2E: rename, then 308; rename back, no loop |
| 7 | High | No way to hide a page from Google | noindex switch on products, categories and blogs; also left out of the sitemap | Robots meta present |
| 8 | Medium | 32 titles too long | Templates capped at 65 characters, with shorter fallbacks | Crawl |
| 9 | Medium | Blog: no topics, pagination, TOC, related posts, scheduling or preview | Built (section 6) | E2E, screenshots |
| 10 | Medium | Seed blog posts were thin and generic | Replaced by 6 researched articles (950–1,200 words); old URLs 301 to the new articles | Crawl |
| 11 | Medium | Gallery had only illustrations | Hidden (404, out of the menu and sitemap) until real photos are added | Crawl |
| 12 | Medium | Category pages: generic, invented text | Rewritten. Quick facts computed live: designs, price range, materials. Links to related buying guides. | Screenshot |
| 13 | Low | Missing security headers | Permissions-Policy and HSTS (production); `X-Robots-Tag: noindex` on /admin and /api | `curl -I` |
| 14 | Low | `npm run seed:reset` could wipe the real catalogue | Refuses when imported products exist unless `--force` is passed; seed data uses verified values | Code review |

## 4. Navigation changes

- **Journal → Blogs** in the header, footer, breadcrumbs and dashboard. The URL stays `/blog`.
- **Gallery** is kept, not deleted. The menu link, page and sitemap entry appear automatically once real photos are added in *Admin → Work gallery*. Until then `/gallery` returns 404.
- **About:** rewritten from the verified facts, with a "Company facts" table and links to the collections.
- **Contact:** removed the unverified claims (reply time, hours, email). The form, WhatsApp, phone, address and map stay.
- **Footer:** "Our story" → "About us"; "Bulk order gallery" only shows when the gallery has photos.

## 5. Technical fixes

### Changed files
- `components/site/CategoryBrowser.tsx`
- `lib/seo.ts`
- `lib/api.ts`: `redirectOrNotFound`, blog paging, topics, preview
- `app/layout.tsx`
- `app/sitemap.ts`
- `next.config.ts`
- `server/db.ts`
- `server/rateLimit.ts`
- `server/services/{blog,products,categories,redirects,settings}.ts`
- Models: `BlogPost`, `Product`, `Category`, `Settings`, `Redirect`

### Redirects
Missing product, category and blog URLs check the redirect table before showing 404.

### Sitemap
Leaves out:
- noindex items
- drafts
- scheduled posts
- posts with an external canonical
- the gallery while it is empty

Includes blog topic pages.

## 6. Metadata templates

All templates live in `lib/seo.ts`. A title or description typed in the dashboard always overrides the automatic one.

| Page | Title (≤ 65 characters, first option that fits) | Description (≤ 158 characters) |
|---|---|---|
| Product | `{name} ({size}) – {category or "Wholesale Manufacturer, Jasdan"} \| Kalgi Handicraft`, then without the brand, then `{name} \| Kalgi Handicraft`. The price is added when there is no size, to tell look-alike products apart. | `Buy {name} from ₹{price} {unit}. {material}, {size}, {colours}. Direct from the manufacturer, Kalgi Handicraft, Jasdan, Gujarat. Any quantity, wholesale prices for bulk.` |
| Category | `{name} Manufacturer in Jasdan, Gujarat \| Wholesale`, then shorter forms | `{tagline}. {n} designs direct from the manufacturer in Jasdan, Gujarat. Wholesale prices and bulk orders.` |
| Blog | `{title} \| Kalgi Handicraft`, or just `{title}` if that is too long | Manual SEO description, else the summary |
| Home | `Kalgi Handicraft \| Meenakari Chowki & Dry Fruit Box Maker` | Static |
| About / Contact / Blogs | Static, 62–65 characters including the brand | Static |

### Structured data
- `LocalBusiness`/`Store` and `WebSite` on every page, with no rating.
- `Product` with Offer and images.
- `CollectionPage` + `ItemList` on category pages.
- `BreadcrumbList` on all inner pages, including blog topic pages.
- `BlogPosting` with dates, section, keywords, word count and author.

## 7. Content strategy

### Clusters
Each cluster has a buying guide that links to its collection, and the collection links back through "Buying guides".

| Cluster | Collection | Articles live |
|---|---|---|
| Chowki / bajot | `/wooden-chowki` | Chowki vs Bajot vs Patla vs Chourang · Pooja Chowki Buying Guide |
| Dry fruit boxes | `/dry-fruit-box` | Dry Fruit Boxes for Diwali, Wedding and Corporate Gifting |
| Pooja articles | `/pooja-articles` | Meenakari Pooja Thali Guide · What Is Meenakari Work? |
| Wholesale buying | all | How to Buy Handicrafts Wholesale From a Manufacturer in India |

### Rules the articles follow
- Real catalogue products and prices only.
- Outside facts (history of Meenakari, the GI tag, festivals) link to their source.
- Anything about policies (custom sizes, packing, lead time, transport, samples, payment) is written as "ask us", not as a promise.

### Next topics
Only once the owner can confirm the facts each one needs:
- Karwa Chauth thali buying guide (season: September–October)
- Navratri and Diwali bulk-buying calendar for retailers
- Meenakari vs printed finish: how to tell
- Care guide for Meenakari steel items
- Kitchen & utility: Meenakari dabbas as wedding return gifts

## 8. Blog design and dashboard

### Website
- **Listing:** featured first post, topic chips with counts, crawlable `?page=` pagination, and a self-referencing canonical on each page.
- **Article:**
  - breadcrumbs (Home › Blogs › Topic › Post)
  - topic, author, published and updated dates, reading time
  - featured image with alt text
  - "In this article" table of contents from the H2 headings: sticky on desktop, collapsible on mobile
  - tags
  - WhatsApp and collection CTA
  - three related posts (same topic or shared tags first)

### Dashboard (Blogs)
- Write, edit, delete.
- Draft, publish now, or schedule for a date and time.
- Preview of drafts and scheduled posts (signed-in only; shown with a "Preview" banner and noindex).
- Publish and unpublish from the list.
- Topic, tags, linked collection, author.
- Featured photo with required alt text.
- Google preview with character counts.
- SEO title and description (empty = automatic).
- Share image, canonical URL, "Hide from Google".
- Changing the address after publishing adds a redirect automatically.

### Dashboard (other screens)
- **Redirects** (owner only): list with hit counts, add, remove. Paths under /admin and /api are rejected.
- **Products / Categories:** a "Hide from Google" switch and a live Google preview in *Advanced settings*.
- **Business details:** rating source and rating link fields; the reviews section asks for real reviews only.

## 9. Automation rules

When something is saved in the dashboard:

| Event | What happens automatically |
|---|---|
| New product | Page, title, description, share image (1200×630), Product schema, sitemap entry, category listing. Live within seconds (on-demand revalidation). |
| Product marked "Top selling" / "Show in the big banner" | Appears in the home page Top selling grid (with a label) / the hero photo display. Most recently updated first. |
| Product or category renamed (slug changed) | 301 from the old URL. Earlier redirects to the old URL are re-pointed, so there are no chains. |
| Blog published | Listing, topic page, related posts, sitemap and home teaser update. |
| Blog scheduled | Hidden until its date. Cached pages refresh at least hourly, so it goes live within an hour of the scheduled time. |
| Blog address changed after publishing | 301 from the old URL |
| Item hidden from Google | noindex meta tag, and removed from the sitemap |
| Anything deleted | 404 and removed from the sitemap |

## 10. Testing report

All tests ran against a production build on port 3100, using the live database.

| Test | Result |
|---|---|
| Typecheck (`tsc`) and lint (`eslint`) | Pass |
| Production build | Pass |
| Crawl: status codes, titles, descriptions, canonicals, H1, alt, orphans | 137/137 pages return 200, 0 orphans, 0 long titles or descriptions |
| Old sample-post URLs | 308 to the replacement articles |
| Product rename → old URL redirects → rename back | Works, no loop. The test redirect was removed afterwards. |
| Blog: create scheduled post → public 404 → preview with banner and noindex → unpublish → delete | Pass |
| Duplicate tags (QA/qa) and repeated headings get unique ids | Pass |
| Anonymous POST to the blog and redirect APIs | 401 |
| Invalid redirect path (/admin/…) | 400 with a field error |
| Cold-start login | 200 in 1.7 s (before the fix: 503 after 10 s) |
| No horizontal scroll at 390 px and 1440 px | Blog listing, article, home, about, category, product: pass |
| Lighthouse mobile | Performance 87–93; accessibility, best practices and SEO 100. LCP 3.2–3.9 s on simulated slow 4G. |

There is no automated test suite yet; the checks above were run by hand with scripts.

## 11. Remaining requirements (owner)

### Needs the owner's confirmation
1. **Done (Oct 2026):** owner name, address, email and hours were confirmed and are now on the site. The minimum order was removed everywhere (website, SEO text, structured data, share images, inquiry form, dashboard, blog articles).
2. **Placeholder top sellers:** Key Holder, Meenakari Glass and Rajwadi Patari have "Photo coming soon" images and "Price on request". Add real photos and a starting price in *Admin → Products*.
3. **Process and policies.** Are pieces hand-painted? Are custom sizes, colours or logo branding offered? Is delivery pan-India? Are samples available? What are typical lead times? Once confirmed, these can go back into the copy and the FAQ. They help conversion.
4. **Real photos** of the unit, the team at work, and real orders, for About and the Work gallery. The IndiaMART album has "Our Warehouse" photos that could be used with permission.
5. **Real customer reviews,** with permission. Google Business Profile reviews are the most valuable.
6. **Duplicate listings.** Done: exact duplicates (same name, category and price) were merged into one product each, keeping all photos, and the removed addresses redirect. Still same name, different price, probably different designs: "6x6 Inch Dry Fruits Box Wooden" (₹80/₹100), "Dry Fruit Box" (₹100/₹120/₹200), "Meenakari Tiffin Box" (₹80/₹100), "Jewellery Box" (₹100/₹350), "Stainless Steel Pooja Thali" (₹100/₹150). Rename them with what makes them different (size, design), or merge them if they are the same item.
7. **Thin product descriptions.** Most imported products only have IndiaMART spec lines. Two or three sentences each (use, size, finish, what is included) would help ranking. Start with the best sellers.
8. **Newer IndiaMART products** are not imported yet: Meenakari glass, tableware, bullock cart dry fruit box. Re-run `scripts/import-catalog.ts` after updating the data file.
9. **Article prices.** The 6 articles quote today's prices in tables. Update them when prices change.

### Setup and security
10. Change the default admin password in *Business details → Change your password*.
11. Rotate the MongoDB Atlas password. It was shared in a file earlier.
12. Set up Cloudinary (`CLOUDINARY_*` env vars) for uploads and a CDN. This is the main lever for LCP.
13. Production env vars: `NEXT_PUBLIC_SITE_URL` (real domain), `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_GA_ID`.

### Off-site (no paid links)
14. Create or claim a Google Business Profile with the same name, address and phone as the website.
15. Link the website from the IndiaMART profile.
16. Ask happy buyers for Google reviews.

## 12. Deployment checklist

- [ ] Env vars set: `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_SITE_URL=https://<domain>`, Cloudinary, and optionally GA and Search Console.
- [ ] Atlas Network Access allows the host's outbound IPs.
- [ ] `npm run build` passes; deploy.
- [ ] Open `/robots.txt` and `/sitemap.xml`; URLs use the real domain.
- [ ] Spot-check one product, one category and one blog in the [Rich Results Test](https://search.google.com/test/rich-results).
- [ ] Search Console: verify the domain, submit `sitemap.xml`, and request indexing for the home page and the 6 collections.
- [ ] Share one product link on WhatsApp; the branded preview image appears.
- [ ] Log in to `/admin` and change the password.
- [ ] Never run `npm run seed:reset` on production.
