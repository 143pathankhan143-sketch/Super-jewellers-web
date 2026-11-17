# Super Jewellers

A mobile-responsive, static storefront and invite-only catalogue manager built with HTML, CSS and vanilla JavaScript. Supabase provides the product database, email/password authentication and image storage. The site can be hosted on GitHub Pages; no server or service-role key is required. Storefront copy now carries over the provided Canva site's 22K/24K gold and silver, craft, pricing, trust, Latur, and Be Shine 925-silver wording while retaining the existing original luxury design. Customer-review quotes were intentionally left out at your direction; add only genuine, authorised reviews if you want a review section later. The two Instagram profiles, Maps link, and WhatsApp Channel supplied by you are configured in `js/config.js`. The Rate My Shop URL and direct WhatsApp enquiry number remain blank placeholders because only a channel link—not an enquiry phone number or review URL—was supplied. The latest supplied shop address, phone, offerings, services, payment methods, crowd guidance, and selected hours (Monday–Sunday, 10:00 AM–9:00 PM) are also on the storefront.

## Project files

```text
index.html                 Public storefront
admin.html                 Admin sign-in and protected dashboard
privacy.html               Privacy notice starter page
terms.html                 Terms and support starter page
css/style.css              Responsive styles and storefront/admin UI
js/config.js               Public Supabase project URL/key + verified business details
js/supabase.js             Supabase client and shared helpers
js/main.js                 Catalogue, filtering, product details, WhatsApp enquiries
js/admin.js                Auth-gated product/category/image management
assets/                    Cinematic campaign portrait and photographic collection imagery
supabase/schema.sql         Tables, RLS policies, admin function, Storage and cached rate table
supabase/rates.sql          Repeatable rates-table migration for existing projects
supabase/config.toml        Supabase Edge Function settings
supabase/functions/metal-rates/index.ts  Secure cached India INR gold/silver spot feed
.github/workflows/pages.yml GitHub Pages deployment
```

## 1. Create and configure Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com/). Choose a strong database password and keep it private.
2. In **Project Settings → API** (or **Data API**), copy the **Project URL** and the public **anon / publishable** key. In `js/config.js`, replace `https://YOUR-PROJECT.supabase.co` and `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY` with those values.
   - The public anon/publishable key is intended for browser use and is safe only with the policies in `supabase/schema.sql` enabled.
   - **Never paste a `service_role` key or secret key into this website, GitHub, or any browser code.**
3. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and run it once. It creates the `products`, `categories`, `admin_users`, and read-only-public `metal_rates` tables, access policies, an admin-check function, the `product-images` bucket and its policies. The bucket allows public image reads and limits uploads to JPG, PNG, or WebP at 5 MB. If you already ran the earlier version of `schema.sql`, run `supabase/rates.sql` once to add the daily rates table instead of rerunning the full schema.
4. Disable public sign-up. In **Authentication → Providers → Email**, turn off **Enable sign ups** (wording may appear as “Allow new users to sign up”). Existing invited/manual users can still sign in. Also review **Authentication → URL Configuration** and add the deployed GitHub Pages URL to the allowed redirect/site URL list if Supabase asks for it.
5. Create a single admin login manually: in **Authentication → Users**, use **Add user / Create new user**, enter the business admin email and a strong unique password, and confirm the user if prompted. Do not add a public registration form.
6. Copy that user's **UUID** from the users list. In SQL Editor, run this with the real UUID (replace the example value):

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE-THE-REAL-AUTH-USER-UUID-HERE');
   ```

   This membership list is intentionally writable only by a project owner in SQL Editor. Client-side checks are not the security boundary; Row Level Security and the storage policies enforce admin access in the database. To revoke admin access, delete that user's row from `public.admin_users` and/or delete the Auth user.
7. In `js/config.js`, set `whatsappNumber` to a verified WhatsApp chat number in international digits only (example format: `919876543210`, no plus or spaces) when available, and fill in `businessPhone`, `businessAddress`, `openingHours`, and `reviewUrl` as available. `instagramUrl`, `instagramOfficialUrl`, `mapsUrl`, and `whatsappChannelUrl` are populated with the profile/channel/map links you supplied. Leaving other fields blank intentionally shows a prompt rather than an invented destination. The supplied WhatsApp Channel link is used by the contact and product CTAs until a direct number is configured; those buttons say “Join WhatsApp Channel” rather than implying a private chat. Set `whatsappNumber` to switch product buttons to per-piece prefilled WhatsApp enquiries. Do not publish guessed or unverified contact information.
8. Visit `admin.html`, sign in with the manually created account, add categories and products, and upload real product photography. Product prices and descriptions are managed in the dashboard. The homepage uses an illustrative preview collection only while Supabase is not configured; after configuration, it loads live active products and does not substitute demo listings if the database is unavailable.

### Daily gold and silver rates

The rate panel shows **24K and 22K gold per 10 g** and **silver per kg** using an INR spot-price API, cached server-side in `public.metal_rates`. The free feed is delayed by about 15 minutes and is an India-wide spot benchmark—not a Latur jeweller's retail board rate. It excludes GST, making charges, and local premiums, so the storefront labels it as indicative. It does not hard-code sample prices.

The other site you shared (`superjwellers.com`) identifies its shop as **Shaniwar Peth, Karad** with a different phone number, so it appears to be a separate jeweller—not the Latur store. Its fetched rate panel says it was updated **29 October 2026**, so we do not use its prices or business details.

### Free pricing setup

The current integration uses [goldprice.dev's free spot API](https://goldprice.dev/docs/quickstart). Its no-key feed is delayed by about 15 minutes and is limited to 10 requests/minute and 100/hour per IP; a free API key is optional and gives a 5,000-call monthly quota. The site's docs describe these prices as spot-based, excluding GST and making charges. The Edge Function makes requests server-side and caches the result in Supabase, so visitors do not call the third-party API directly. This integration does not need an external provider key.

1. For a new Supabase project, run the updated `supabase/schema.sql` once. If you already ran the earlier website schema, run `supabase/rates.sql` once instead. The `metal_rates` table is public-read only; browser clients cannot write rates.
2. Deploy `supabase/functions/metal-rates/index.ts` as an Edge Function named **`metal-rates`**. In the Supabase Dashboard, open **Edge Functions → Deploy a new function**, create `metal-rates`, paste the contents of `index.ts`, and deploy. Turn **Verify JWT** off for this public, rates-only endpoint, matching `supabase/config.toml`. The function uses Supabase's server-side service credential to update the cache; it is never included in frontend code.
3. No third-party metals API key or paid provider account is needed for this free feed. The website calls the Edge Function, which refreshes its cached prices periodically and falls back to the last cached result if the source is unavailable.

Supabase has a $0 Free plan with quotas. Its pricing page lists unlimited API requests within plan limits and 500,000 Edge Function invocations/month; free projects can pause after a week of inactivity. Check [Supabase pricing](https://supabase.com/pricing) and the [official Edge Function quota guide](https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations). The rate values remain indicative spot benchmarks—not a guaranteed Latur shop quote.

### Google Maps

The contact section links to the supplied Google Maps destination, both Instagram profiles, and WhatsApp Channel. The supplied Latur address and phone are configured in `js/config.js`. The map panel is a visual locator; its `MAP` link opens the provided directions link. `RATE MY SHOP` remains a placeholder until you provide its review URL.

### Image behavior

The storefront now uses locally stored, high-resolution campaign imagery: an Indian bridal editorial hero, plus dedicated gold, diamond and silver images. These custom-created visuals are campaign art, not photographs of Super Jewellers inventory; upload the business's own verified product photography for actual pieces before publishing them as available stock. Newly uploaded product photographs are stored in Supabase Storage and public object URLs are saved in `products.image_url`. The admin upload validates size and file type in the browser; Supabase bucket limits and RLS policies also enforce upload limits and admin access. Keep backups of originals and remove abandoned uploads from Storage when replacing a product image—the current UI leaves the old object in place rather than risking deletion of an image reused elsewhere.

## 2. Run locally

Because ES modules are used, preview with a local HTTP server rather than opening `index.html` as a `file://` URL. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. For a functional admin session, configure Supabase first. The site relies on the Supabase JavaScript v2 CDN and Google Fonts in a normal browser; if either is blocked, product administration or remote fonts may not load. The bundled artwork and core layout remain local.

## 3. Deploy to GitHub Pages

1. Put the project at the root of a GitHub repository and commit the full project, including `.github/workflows/pages.yml`.
2. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build/deployment source.
3. Push to the repository's `main` branch. The included workflow uploads the static repository and deploys it to Pages. You can also run it manually from **Actions → Deploy static site to GitHub Pages → Run workflow**.
4. Wait for the green workflow run, then open the Pages URL. For a project site it is usually `https://USERNAME.github.io/REPOSITORY/`; for a user/org site it is `https://USERNAME.github.io/`.
5. Update Supabase **Authentication → URL Configuration** with the deployed site URL if needed. Test the storefront, a product's WhatsApp link, and the admin login on the deployed URL.
6. Since `js/config.js` contains the public Supabase URL/key and is downloaded by every visitor, do not place personal data or secrets there. Restrict the Supabase key using the available API-key controls where supported and rely on RLS for all data access.

The Pages deployment is static and preserves relative paths, so it works at both repository subpaths and custom domains. Configure a custom domain under GitHub Pages if desired.

## 4. Security and operations checklist

- [ ] Supabase schema ran successfully; verify RLS is enabled on `products`, `categories`, and `admin_users`.
- [ ] Public sign-up is disabled and there is only the intended manual admin account.
- [ ] The intended admin UUID exists in `public.admin_users`; no service-role or secret key is present in frontend code or repository history.
- [ ] Try the public site signed out: only active products should be visible, and inactive products must remain hidden.
- [ ] Admin add/edit/delete/category changes and image uploads work after signing in; sign out when finished.
- [ ] Replace all bracketed business-information placeholders with verified details and add the map embed only for the confirmed address.
- [ ] Set a verified WhatsApp number and test the prefilled enquiry text from a mobile device.
- [ ] Keep Supabase backups enabled as appropriate for your plan and periodically review Auth users, Storage objects and project logs.

## Notes

- Categories can be created and removed in the dashboard. A category containing products cannot be deleted; reassign/delete those products first. Renaming a category is deliberately not a direct operation because it affects every product assigned to it.
- A price of `0` is treated as “Price on enquiry” on the storefront. Enter a positive price to show an INR amount.
- Product and category content is escaped before rendering in the browser. Use trusted Supabase project configuration and keep the dashboard access limited to authorised accounts.
