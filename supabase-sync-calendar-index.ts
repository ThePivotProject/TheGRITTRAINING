// Supabase Edge Function: sync-calendar
// Runs on a schedule (or on demand). Pulls the next 30 days from the Google
// Calendar for thepiviotproject@kbuiltsoftball.com and writes GRIT sessions
// into Supabase table public.grit_records, collection = "grit_next_sessions".
// The GRIT app reads that same collection in reloadRecords() — all phones
// see the same "Next GRIT Session" with no pasting, no manual entry.
//
// Secrets to set in Supabase Dashboard > Edge Functions > Secrets:
//   GOOGLE_SERVICE_ACCOUNT_JSON — full JSON of a Google Cloud service account
//   CALENDAR_ID — thepiviotproject@kbuiltsoftball.com
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — set automatically in Supabase
// Google setup (one time):
//   1. Google Cloud Console > Create Service Account (any name).
//   2. Create a JSON key for it, paste the whole JSON as GOOGLE_SERVICE_ACCOUNT_JSON.
//   3. In Google Calendar > Settings for thepiviotproject calendar > Share with
//      specific people > add the service account email > "Make changes to events".
//   4. Deploy: supabase functions deploy sync-calendar
//   5. Schedule: Supabase Dashboard > Edge Functions > sync-calendar > Cron,
//      every 30 minutes. Or call it from GitHub Actions (see .github/workflows).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CALENDAR_ID = Deno.env.get("CALENDAR_ID") || "thepiviotproject@kbuiltsoftball.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SA_JSON = JSON.parse(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "{}");

function b64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = ""; bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function googleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: SA_JSON.client_email, scope: "https://www.googleapis.com/auth/calendar.readonly", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }));
  const unsigned = `${header}.${claim}`;
  const keyData = SA_JSON.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const raw = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", raw, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64url(new Uint8Array(sig))}`;
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` });
  const data = await res.json();
  if (!data.access_token) throw new Error("Google token failed: " + JSON.stringify(data));
  return data.access_token;
}
const GRIT_MATCH = /grit|mindstrong|speed, strength/i;
Deno.serve(async () => {
  try {
    const token = await googleAccessToken();
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 86400000).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error("Calendar API: " + JSON.stringify(data));
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const events = (data.items || [])
      .filter((e: any) => e.status !== "cancelled" && GRIT_MATCH.test(`${e.summary || ""} ${e.description || ""}`))
      .map((e: any) => ({
        id: `cal-${e.id}`,
        title: e.summary || "GRIT Session",
        desc: (e.description || "").split("\n")[0].slice(0, 200),
        start: e.start?.dateTime || e.start?.date || "",
        end: e.end?.dateTime || e.end?.date || "",
        source: "Google Calendar",
        calendarEventId: e.id,
        location: e.location || "",
      }))
      .filter((e: any) => e.start);
    // Replace the whole synced set: delete old synced rows, insert fresh.
    // Manual adds (source "Manual") are NOT deleted — they live in the app
    // and are written with source Manual; the function only replaces source "Google Calendar".
    // Simplest safe approach: delete all grit_next_sessions rows whose value->>source = 'Google Calendar'.
    await supabase.from("grit_records").delete().eq("collection", "grit_next_sessions").eq("value->>source", "Google Calendar");
    if (events.length) {
      const { error } = await supabase.from("grit_records").insert(events.map((v: any) => ({ collection: "grit_next_sessions", value: v })));
      if (error) throw error;
    }
    return new Response(JSON.stringify({ ok: true, synced: events.length }), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message || String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
