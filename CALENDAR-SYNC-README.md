# GRIT Calendar — Backend Sync (Supabase)

Yes, this updates and syncs through a backend. It needs BOTH:
1. **A script** — something has to talk to Google. A website can't silently read
   a private Google Calendar. The script is `supabase/functions/sync-calendar/index.ts`
   (runs inside Supabase) or `scripts/sync-calendar.mjs` (runs anywhere with Node).
2. **Built into the app** — done. `App.tsx` reads collection `grit_next_sessions`
   from Supabase in `reloadRecords()` and shows the next one at the top of Training.
   All phones read the same rows. No pasting, no iCal link needed once this is on.

## How it flows
Google Calendar (thepiviotproject@kbuiltsoftball.com)
  → every 30 min, script pulls next 30 days, keeps events matching GRIT / MindSTRONG / Speed+Strength
  → writes them to Supabase `public.grit_records`, collection `grit_next_sessions`
  → app loads them on every open → "Next GRIT Session" at top of Training

Manual adds in the app also write to the same collection (source "Manual"),
so they show on all phones too. The sync never deletes Manual rows.

## One-time setup (15 min)
1. **Google Cloud Console** (console.cloud.google.com) → New project (or use existing)
   → APIs & Services → Enable "Google Calendar API"
   → IAM & Admin → Service Accounts → Create → name it `grit-calendar-sync`
   → Keys → Add Key → JSON → download the file. Keep it private.
2. **Share the calendar with the service account:**
   Google Calendar → Settings → thepiviotproject calendar → Share with specific
   people → paste the service-account email (ends in `@...iam.gserviceaccount.com`)
   → "Make changes to events" → Send.
3. **Supabase — pick ONE runner:**
   **Option A — Edge Function (recommended, no GitHub needed):**
   - `supabase link` + `supabase functions deploy sync-calendar`
     (or paste `supabase/functions/sync-calendar/index.ts` into Dashboard → Edge Functions → New)
   - Dashboard → Edge Functions → Secrets: add `GOOGLE_SERVICE_ACCOUNT_JSON`
     (paste the whole JSON file contents), `CALENDAR_ID` = thepiviotproject@kbuiltsoftball.com
   - Edge Functions → sync-calendar → Cron / Schedule → every 30 minutes.
   **Option B — GitHub Action:**
   - GitHub repo → Settings → Secrets and variables → Actions → add:
     `GOOGLE_SERVICE_ACCOUNT_JSON`, `CALENDAR_ID`,
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API)
   - Push. It runs every 30 min automatically (Actions tab → Run workflow to test now).
   **Option C — Run it by hand:** `node scripts/sync-calendar.mjs` with those 4 env vars set.
4. **App:** nothing extra. The app already reads `grit_next_sessions`.
   Deploy the updated `App.tsx` to Vercel as usual. Supabase URL + Anon Key
   must already be in Vercel env (they are — that's how athletes/workouts sync).

## Test it
- Supabase → Table Editor → `grit_records` → filter `collection = grit_next_sessions`
  → you should see rows appear within 30 min (or right after a manual run).
- Open the app → log in as any athlete with a session coming up → top of
  Training shows "NEXT GRIT SESSION" with the real date/time.

## What it does NOT do
- It never writes to Google Calendar. One-way: Google → Supabase → app.
- It never exposes the service-account key to phones. The key lives only in
  Supabase secrets / GitHub secrets. Phones only ever use the Supabase Anon key.
