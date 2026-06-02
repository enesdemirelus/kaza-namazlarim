# Launch Checklist — Kaza Namazlarım / Qada Prayers

> Everything that needs to be done before you publish this site to the public.
> Items are grouped by **severity** — work top-down.
>
> A ready-to-paste **AI agent prompt** lives at the bottom of this file. Hand
> that prompt (plus this file) to another AI and it will know exactly what to do.

---

## Legend

- 🔴 **Blocker** — site is broken or unsafe to publish without this
- 🟠 **High** — should be done before public launch
- 🟡 **Medium** — important polish, do before announcing widely
- 🟢 **Low / Nice-to-have** — improves quality but won't hurt to ship without

---

## 🔴 Blockers

### 1. Switch Clerk from **test** to **production** keys
`.env.local` currently uses test keys:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Test instances are **rate-limited, branded with Clerk's dev banner, and not
backed by Clerk's production guarantees**. Before launch:

1. In the Clerk dashboard, create a **Production instance**.
2. Configure OAuth providers (Google, etc.) with *production* OAuth credentials
   (the dev OAuth app from each provider must be re-created in prod mode).
3. Configure the production domain (`kazanamazlarim.com`) and SSL.
4. Copy the new `pk_live_…` and `sk_live_…` keys into your hosting provider's
   environment variables (NOT into a committed file).
5. Update `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, redirect URLs, and allowed origins
   in the Clerk production instance.

### 2. Rotate the Supabase service-role key and DB password
Both are sitting in `.env.local`:

```
SUPABASE_PASSWORD=...
SUPABASE_SERVICE_ROLE_KEY=...
```

That file is git-ignored — good. **But** these credentials may have been pasted
into chat tools, screenshots, or AI sessions. The service-role key **bypasses
Row Level Security**, so anyone holding it can read/write every user's data.

- Rotate the `SUPABASE_SERVICE_ROLE_KEY` in the Supabase dashboard.
- Rotate the database password.
- Put the new values **only** in your hosting provider's environment-variable
  store (Vercel, Netlify, etc.). Never commit them.

### 3. Fix the broken `app/manifest.json`
The PWA manifest still has placeholder values from the create-next-app
template:

```json
{
  "name": "MyWebSite",
  "short_name": "MySite",
  "theme_color": "#ffffff",
  "background_color": "#ffffff"
}
```

When a user installs the PWA, the app icon will be labelled **"MySite"**.
Fix:
- `name`: `"Kaza Namazlarım"` (or `"Qada Prayers"` — pick one for the install
  label, since manifest doesn't auto-localize).
- `short_name`: same, short form.
- Add `"description"`, `"start_url": "/"`, `"scope": "/"`, `"lang": "tr"` (or
  `"en"`), `"id": "/"`, `"categories": ["lifestyle", "utilities"]`.
- Pick a real `theme_color` / `background_color` that matches your default
  accent (the app's default is **green** — pick a hex that pairs with it).
- Verify both icon files (`/web-app-manifest-192x192.png`,
  `/web-app-manifest-512x512.png`) actually render correctly with
  `"purpose": "maskable"` — maskable icons need significant safe-zone padding
  or they get cropped. Consider providing both `"any"` and `"maskable"`
  variants.

### 4. Enable Supabase Row Level Security on every table
The server code uses the **service-role key** (`lib/supabaseServer.ts:5`),
which bypasses RLS. Every server action filters by `userId` from Clerk's
`auth()`, so server-side it's safe. **But** if RLS is not enabled on the
underlying tables, a leak of the anon key or a future endpoint that uses the
anon key would expose all rows.

Action:
1. In Supabase, ensure RLS is **enabled** on `users`, `missed_prayers`, and
   `user_settings`.
2. Add policies scoped to `auth.uid() = user_id` (even though your service-role
   key bypasses them, anon access should be locked down).
3. Confirm the `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` anon key can only read
   tables you intend to expose (right now: nothing).

---

## 🟠 High Priority — Required Before Public Launch

### 5. Legal / Privacy pages
The app collects:
- Email (via Clerk),
- IP address (implicitly, via hosting + Supabase logs),
- Geolocation coordinates (browser → reverse-geocoded via Nominatim),
- Religious activity data (missed-prayer log) — under GDPR this is **special
  category data** (Article 9: data revealing religious beliefs), which has
  stricter requirements than ordinary personal data.

You **must** publish at least:

| Page | Required for | Notes |
|------|--------------|-------|
| **Privacy Policy** | GDPR, KVKK (Turkey), Clerk ToS, Supabase ToS | List every third party: Clerk, Supabase, OpenStreetMap/Nominatim, Google Fonts, your hosting provider. Disclose the religion-data sensitivity and what you do with it. |
| **Terms of Service** | Clerk ToS requires you to have one | Limit liability, disclaim prayer-time accuracy. |
| **Cookie / Storage notice** | EU ePrivacy, KVKK | App uses `localStorage` and `sessionStorage` for theme, accent, prayer method, geocoded coords, and Clerk session cookies. Disclose. |
| **Contact / Support** | Apple/Google store policies if you ever wrap as a native app, plus general trust | An email address is enough. |
| **About / Imprint** *(optional)* | Required in Germany ("Impressum") if you market there | Skip unless you do. |

Translate each page into both `tr` and `en` and place them under
`app/[locale]/(main)/privacy/page.tsx`, `terms/page.tsx`, `cookies/page.tsx`,
`contact/page.tsx`. Add them to `app/sitemap.ts` and link them from a footer.

### 6. Add a footer with legal links + version
There is currently **no footer**. Add one that includes:
- Privacy, Terms, Cookies, Contact links (localized).
- Build version / year.
- "Prayer times are calculated using the `adhan` library — verify with your
  local authority" disclaimer (the app already informs users in `inform`
  copy, but having it in the footer is good practice).

### 7. Add `error.tsx`, `not-found.tsx`, `global-error.tsx`
None of these exist. Right now any unexpected exception shows the default
Next.js dev error page, which leaks stack traces in production builds during
the very first hydration error. Create:

- `app/[locale]/(main)/not-found.tsx` — localized 404.
- `app/[locale]/(main)/error.tsx` — generic error boundary with a "try again"
  button. Use the **Next 16** App-Router API (read
  `node_modules/next/dist/docs/` — this repo's `AGENTS.md` warns that the
  Next.js version has breaking changes from training data).
- `app/global-error.tsx` — last-resort fallback when the root layout itself
  throws.

### 8. Production environment variables
Set these in your hosting provider (Vercel/Netlify/etc.):

```
NEXT_PUBLIC_SUPABASE_URL=...           # production project
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # rotated, see Blocker #2
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

Confirm there are **no** lingering test keys.

### 9. Domain, SSL, and DNS
- Buy / point `kazanamazlarim.com` (already referenced in
  `app/[locale]/layout.tsx:25`, `app/sitemap.ts:3`, `app/robots.ts:10`) to
  your hosting provider.
- Confirm `www.kazanamazlarim.com` redirects to the apex (or vice-versa) —
  pick one canonical host. Update Clerk's allowed origins and Supabase auth
  redirect URLs to match.
- Force HTTPS at the hosting layer.

### 10. Add basic security headers
`next.config.ts` currently has **none**. Add at minimum:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()` — the app
  uses geolocation; everything else should be denied.
- A Content-Security-Policy (start with `Report-Only`). At minimum allow:
  `*.clerk.accounts.dev` (or your prod Clerk domain), `*.supabase.co`,
  `nominatim.openstreetmap.org`, `fonts.googleapis.com`, `fonts.gstatic.com`.

Use Next 16's headers API via `next.config.ts` — check the version's docs
under `node_modules/next/dist/docs/` for the current shape.

### 11. Nominatim usage compliance
`app/components/PrayerTimes.tsx:191` calls
`https://nominatim.openstreetmap.org/reverse` directly from the browser.

OSM's Nominatim usage policy:
- ≤ 1 request per second
- No heavy / bulk usage
- Must send a meaningful **User-Agent** identifying the app and an email
  (browsers can't set custom UAs reliably from `fetch`, which is exactly the
  problem)

You will get **IP-banned** if even a handful of users use the app
simultaneously. Options:
- **Best:** proxy through your own server route (`app/api/geocode/route.ts`)
  that adds a proper UA and caches results.
- Or switch to a paid geocoder (LocationIQ, Mapbox, Google) — Nominatim is
  for low-traffic / dev use.
- Or accept the risk and live without reverse-geocoded location names.

### 12. Decide what to do with the empty API directories
- `app/api/seed-prayers/` — empty
- `app/api/table-one/` — empty

Either remove them (Next will still create routes if they ever pick up a
`route.ts`) or implement them. Empty directories are noise.

### 13. Remove unused dependencies
`package.json` lists deps that have no imports anywhere in `app/`,
`components/`, or `lib/`:
- `react-quran`
- `axios` (the app uses `fetch`)

Removing trims the bundle and supply-chain surface. Run a tree-shake check
with `npx depcheck` to find any others.

---

## 🟡 Medium Priority — Important Polish

### 14. SEO / social-share previews
`app/[locale]/layout.tsx` defines OpenGraph + Twitter metadata but **no
image**. When someone shares the site on WhatsApp / Twitter / iMessage they
get a text-only preview. Add:

- A 1200×630 PNG `app/opengraph-image.png` (Next 16 auto-wires this).
- A 1200×600 PNG `app/twitter-image.png` (or just reuse the OG image).
- Change `twitter.card` from `"summary"` to `"summary_large_image"`.

### 15. Per-page metadata
Only the root locale layout has metadata. Add per-page `generateMetadata` for:
- `/stats` — title "Stats | Qada Prayers", localized.
- `/settings` — title "Settings | Qada Prayers", `robots: { index: false }`
  (logged-in pages shouldn't be indexed anyway, but `/settings` definitely
  shouldn't).
- `/sign-in` — title "Sign in | Qada Prayers", `robots: { index: false }`.

### 16. Sitemap accuracy
`app/sitemap.ts` includes `/stats` and `/settings` — both are **behind auth**
(see `proxy.ts:11`, every non-`/sign-in` route is protected). Search engines
can't crawl them. Either:
- Remove them from the sitemap, or
- Add a public marketing/landing page at `/` so the sitemap has something
  real to index.

Also add the new legal pages to the sitemap once they exist.

### 17. Analytics + error monitoring
The repo has **zero** observability — no Sentry, no PostHog, no Plausible, no
Vercel Analytics. After launch you won't know:
- Whether the app is up,
- Whether server actions are throwing,
- How many users you have,
- Which prayer methods / locales are popular.

Add at least:
- **Error tracking**: Sentry (`@sentry/nextjs`) or Vercel's built-in error
  monitoring.
- **Privacy-friendly analytics**: Plausible or Umami (no cookies, no GDPR
  banner needed).

### 18. Replace `dangerouslySetInnerHTML` theme script with a nonce
`app/[locale]/layout.tsx:127` injects an inline script to set the theme class
on `<html>`. That's fine for now, but the inline script will be **blocked by
any reasonable CSP** you add in #10. Either:
- Add a nonce (`headers().get('x-nonce')` pattern, see Next docs in
  `node_modules/next/dist/docs/`), or
- Allow `'unsafe-inline'` in the CSP for `script-src` (less safe), or
- Use `next-themes`' built-in script (it already handles flash) and drop the
  hand-rolled one.

### 19. Localization completeness check
- Compare `messages/en.json` vs `messages/tr.json` for missing keys (run
  `diff <(jq 'paths(scalars)|join(".")' messages/en.json) <(jq 'paths(scalars)|join(".")' messages/tr.json)`).
- The `nav.title` is `"Qada Prayers"` in English. Confirm Turkish is
  `"Kaza Namazlarım"`. Also confirm any **legal page** strings get added in
  both locales.
- Some labels in the app icon / manifest can't be localized at install time —
  pick the language that matches your primary audience.

### 20. Accessibility pass
The repo has no automated a11y tooling. Before launch:
- Run Lighthouse / axe on each page; target ≥ 95 accessibility score.
- Confirm focus rings are visible on all interactive elements (the custom
  `cursor-pointer` buttons in `settings/page.tsx` need `focus-visible:` rings).
- Confirm dark-mode contrast ratios (especially accent colours over `bg-card`).
- Add `lang={locale}` — already present on `<html>` ✓.
- Add `aria-label` to icon-only buttons (the mobile settings cog at
  `app/components/NavBar.tsx:106` is missing one).

### 21. Confirm Clerk account-deletion path works
GDPR / KVKK both require a user-deletion flow. Clerk's `UserButton` exposes
"Delete account" inside `<UserProfile>`. Confirm:
1. Clicking it actually deletes the Clerk user.
2. Your `users` and `missed_prayers` rows are deleted too — they currently
   are **not** (no cascade, no webhook). Wire a Clerk **`user.deleted`
   webhook** to a Next.js route handler that deletes from Supabase, or
   document this gap clearly.

### 22. Cookie consent (EU / TR)
Clerk sets first-party session cookies — those are **strictly necessary** and
exempt from consent banners. If you add analytics that uses cookies (e.g.
Google Analytics) you'll need a consent banner. If you stick with
cookieless analytics (Plausible / Umami), you can skip the banner.

---

## 🟢 Low / Nice-to-Have

### 23. Repo hygiene
- Replace the default `README.md` (still says "create-next-app bootstrapped")
  with one that explains what this project is, how to develop it, and how to
  deploy it.
- Add a `LICENSE` file (MIT? proprietary? decide).
- Delete `public/next.svg` and `public/globe.svg` — leftover from the
  template, not referenced anywhere.
- Delete `out/` (empty static-export artefact) and add it to `.gitignore`
  if you don't use `next export`.

### 24. Console statements
Four production `.catch(console.error)` calls remain (settings page x2,
Tour.tsx, SettingsSync.tsx). These will spam users' browser consoles on every
sync failure. Replace with your error-tracking client (Sentry) or with a
toast. Not a blocker — just dust.

### 25. Performance pass
- Run a Lighthouse on a production build (`npm run build && npm start`).
- The Outfit + Geist + Geist_Mono Google fonts are all loaded — that's
  three font families. Confirm you actually use all of them; drop any that
  aren't referenced.
- Inspect bundle with `@next/bundle-analyzer`. `framer-motion` and
  `radix-ui` umbrella are large — make sure tree-shaking is working.

### 26. PWA install prompts
Decide if you want to nudge users to install the PWA. If yes, wire
`beforeinstallprompt` and show a button on the home page.

### 27. Backup strategy
Supabase has automated backups on paid tiers only. If you're on the free
tier, schedule manual `pg_dump`s before launch.

### 28. Plan a soft launch
- Test with 5–10 friends in production for a week before announcing publicly.
- Verify Clerk emails (verification, password reset) land in inboxes (check
  sender domain — Clerk's default `accounts.dev` may go to spam; set up a
  custom email domain in Clerk).
- Verify prayer times match a reputable source for at least three cities
  across time zones.

---

## Pre-Launch Final Sweep

Run through this list immediately before flipping DNS:

- [ ] Production build succeeds: `npm run build`
- [ ] `npm run lint` is clean
- [ ] `tsc --noEmit` is clean
- [ ] All env vars set in hosting provider; no `pk_test_` / `sk_test_`
- [ ] Supabase RLS enabled, policies tested
- [ ] Privacy / Terms / Cookies / Contact pages live in both locales, linked
- [ ] OG image renders correctly when sharing a link
- [ ] `kazanamazlarim.com` resolves, SSL valid, www→apex (or apex→www) works
- [ ] Sign-in works via the production Clerk instance
- [ ] Sign-up → create user → log a prayer → see it in stats works end-to-end
- [ ] Geolocation flow works on iOS Safari + Android Chrome
- [ ] Install-as-PWA shows the correct name and icon
- [ ] 404 page renders for a bad URL
- [ ] Robots.txt at `/robots.txt` is correct
- [ ] Sitemap at `/sitemap.xml` is correct
- [ ] Submit sitemap to Google Search Console + Bing Webmaster
- [ ] Error tracking captures a deliberate test error
- [ ] Account-deletion flow actually deletes Supabase rows

---

## Files referenced in this checklist

| Path | Why it's mentioned |
|------|--------------------|
| `.env.local` | Test Clerk keys, exposed Supabase secrets |
| `app/manifest.json` | Placeholder PWA metadata |
| `app/[locale]/layout.tsx` | Metadata, inline theme script |
| `app/sitemap.ts` | Auth-protected pages listed publicly |
| `app/robots.ts` | Sitemap reference |
| `app/components/PrayerTimes.tsx:191` | Nominatim direct call |
| `app/components/NavBar.tsx:106` | Icon-only button missing a11y label |
| `app/[locale]/(main)/settings/page.tsx` | `.catch(console.error)` patterns |
| `lib/supabaseServer.ts` | Uses service-role key — RLS bypass risk |
| `proxy.ts` | All routes protected — sitemap implication |
| `next.config.ts` | No security headers configured |
| `package.json` | Unused deps: `react-quran`, `axios` |
| `messages/en.json`, `messages/tr.json` | Need legal-page translations |

---

## 🤖 Prompt for an AI Agent to execute this checklist

Paste this into a fresh Claude / Cursor / Codex session along with this file:

```
You are helping me ship the website at /Users/enesdemirel/Documents/coding-projects/deployment/kaza-namazlarim/kaza-namazlarim-website
to production for the first time. The full launch checklist lives in
LAUNCH_CHECKLIST.md at the project root — read it end-to-end before doing
anything.

About the project:
- Next.js 16 + App Router. CRITICAL: This is NOT the Next.js you know from
  training data. Before writing any Next.js code, read the relevant guide in
  node_modules/next/dist/docs/ — the APIs, file conventions, and metadata
  shape may have breaking changes. AGENTS.md at the repo root says the same.
- Auth: Clerk (currently on test keys).
- DB: Supabase (server actions use the service-role key; RLS must be
  enabled separately).
- i18n: next-intl, locales "tr" (default) and "en".
- Tracks a user's missed Islamic prayers — religious-belief data, so GDPR
  Article 9 and Turkey's KVKK both apply.
- Deployment target: TBD (Vercel is most likely). Production domain is
  kazanamazlarim.com.

How to work:

1. Read LAUNCH_CHECKLIST.md completely. Then read the files it references so
   you understand the current state of the code.
2. Work in checklist order: 🔴 Blockers first, then 🟠 High, then 🟡 Medium,
   then 🟢 Low. Do not skip ahead.
3. For each item, before making changes, tell me:
   - what you plan to do,
   - which files you'll touch,
   - any decision I need to make (e.g. "which hex should the manifest
     theme_color be?", "Plausible or Umami?").
   Wait for my answer before proceeding on anything that's a judgment call.
   Do not invent legal text — for the Privacy Policy, Terms of Service,
   Cookies notice, and Contact page, draft them but flag that I must review
   with a lawyer before publishing, especially the GDPR Article 9 / KVKK
   sections about religious-belief data.
4. Items that I must do myself outside the codebase (rotating Supabase keys,
   creating a Clerk production instance, buying the domain, setting env vars
   in the hosting dashboard, enabling RLS in the Supabase dashboard,
   submitting the sitemap to Google) — do NOT attempt these. Just produce a
   short, ordered to-do list at the end so I can do them.
5. For each code change, run `npm run lint` and `npx tsc --noEmit` (or the
   project's equivalent) before declaring it done.
6. Never commit secrets. Never bypass git hooks. Never amend prior commits —
   make new ones.
7. Use the exact file paths and severity labels from LAUNCH_CHECKLIST.md when
   reporting progress so I can cross things off.
8. When everything in 🔴 and 🟠 is done, stop and report. We'll review
   together before continuing to 🟡 and 🟢.

Start by reading LAUNCH_CHECKLIST.md, then ask me your first round of
clarifying questions (hosting provider, theme colour for the manifest,
analytics choice, whether the project is MIT or proprietary, etc.). Don't
write any code in your first response.
```
