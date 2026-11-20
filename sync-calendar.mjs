// Node sync script — same job as the Supabase Edge Function, runnable anywhere:
//   node scripts/sync-calendar.mjs
// Env vars (never commit these):
//   GOOGLE_SERVICE_ACCOUNT_JSON — full service-account JSON (one line)
//   CALENDAR_ID — thepiviotproject@kbuiltsoftball.com
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Run it by hand, from a cron job, or via .github/workflows/sync-calendar.yml.
import crypto from "node:crypto";
const SA = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");
const CAL = process.env.CALENDAR_ID || "thepiviotproject@kbuiltsoftball.com";
const SUPABASE_URL = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SA.client_email || !SUPABASE_URL || !KEY) { console.error("Missing env: GOOGLE_SERVICE_ACCOUNT_JSON, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const claim = b64url(JSON.stringify({ iss: SA.client_email, scope: "https://www.googleapis.com/auth/calendar.readonly", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now }));
const sign = crypto.createSign("RSA-SHA256"); sign.update(`${header}.${claim}`); sign.end();
const jwt = `${header}.${claim}.${b64url(sign.sign(SA.private_key))}`;
const tok = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}` })).json();
if (!tok.access_token) { console.error("Google token failed", tok); process.exit(1); }
const timeMin = new Date().toISOString(), timeMax = new Date(Date.now() + 30 * 86400000).toISOString();
const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CAL)}/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=250`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
const data = await res.json(); if (!res.ok) { console.error(data); process.exit(1); }
const events = (data.items || []).filter((e) => e.status !== "cancelled" && /grit|mindstrong|speed, strength/i.test(`${e.summary || ""} ${e.description || ""}`)).map((e) => ({ id: `cal-${e.id}`, title: e.summary || "GRIT Session", desc: (e.description || "").split("\n")[0].slice(0, 200), start: e.start?.dateTime || e.start?.date || "", end: e.end?.dateTime || e.end?.date || "", source: "Google Calendar", calendarEventId: e.id, location: e.location || "" })).filter((e) => e.start);
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
// Delete old Google Calendar rows only (manual adds stay)
await fetch(`${SUPABASE_URL}/rest/v1/grit_records?collection=eq.grit_next_sessions&value->>source=eq.Google%20Calendar`, { method: "DELETE", headers: H });
if (events.length) {
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/grit_records`, { method: "POST", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(events.map((v) => ({ collection: "grit_next_sessions", value: v }))) });
  if (!ins.ok) { console.error(await ins.text()); process.exit(1); }
}
console.log(`Synced ${events.length} GRIT sessions to Supabase.`);
