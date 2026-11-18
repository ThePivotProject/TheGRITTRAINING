import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Shared backend for THE GRIT.
// - If VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set in Vercel, every
//   save goes to Supabase table public.grit_records, so ALL phones share
//   the same athletes / workouts / homework / cards / settings.
// - If they are NOT set (or Supabase is unreachable), it falls back to
//   browser localStorage so the app NEVER black-screens. It will sync
//   to Supabase on the next load once env vars are set.
// Same callApi interface the app already uses:
//   records.list / records.create / records.replace / records.delete
//   { collection, value, id }  ->  { records: [{id, value}] } / {id, value}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon) : null;
export const isSupabaseConfigured = !!supabase;

function safeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// ---- localStorage fallback (same shape) ----
type Stored = { id: string; value: any };
function readLocal(c: string): Stored[] {
  try { const r = localStorage.getItem(`grit:${c}`); return r ? JSON.parse(r) : []; } catch { return []; }
}
function writeLocal(c: string, recs: Stored[]) {
  try { localStorage.setItem(`grit:${c}`, JSON.stringify(recs)); } catch {}
}
async function localCallApi(action: string, args: any): Promise<any> {
  const col = String(args?.collection || "");
  if (action === "records.list") return { records: readLocal(col) };
  if (action === "records.create") {
    const recs = readLocal(col); const rec = { id: safeId(), value: args?.value ?? {} };
    recs.push(rec); writeLocal(col, recs); return rec;
  }
  if (action === "records.replace") {
    const recs = readLocal(col);
    const i = recs.findIndex((r) => r.id === args?.id);
    if (i >= 0) { recs[i] = { id: args.id, value: args?.value ?? {} }; writeLocal(col, recs); return recs[i]; }
    const rec = { id: args?.id || safeId(), value: args?.value ?? {} }; recs.push(rec); writeLocal(col, recs); return rec;
  }
  if (action === "records.delete") {
    writeLocal(col, readLocal(col).filter((r) => r.id !== args?.id)); return { ok: true };
  }
  throw new Error(`Unknown action: ${action}`);
}

export async function callApi(action: string, args: any): Promise<any> {
  const col = String(args?.collection || "");
  if (!supabase) return localCallApi(action, args);
  try {
    if (action === "records.list") {
      const { data, error } = await supabase.from("grit_records").select("id,value").eq("collection", col).order("created_at", { ascending: true });
      if (error) throw error;
      return { records: (data || []).map((r: any) => ({ id: r.id, value: r.value })) };
    }
    if (action === "records.create") {
      const { data, error } = await supabase.from("grit_records").insert({ collection: col, value: args?.value ?? {} }).select("id,value").single();
      if (error) throw error;
      return { id: data.id, value: data.value };
    }
    if (action === "records.replace") {
      // grit_records.id is uuid. App uses "local-..." ids before first save;
      // those can never exist in Supabase, so insert a fresh row instead.
      if (!args?.id || !isUuid(String(args.id))) {
        const { data, error } = await supabase.from("grit_records").insert({ collection: col, value: args?.value ?? {} }).select("id,value").single();
        if (error) throw error;
        return { id: data.id, value: data.value };
      }
      const { data, error } = await supabase.from("grit_records").upsert({ id: args.id, collection: col, value: args?.value ?? {} }, { onConflict: "id" }).select("id,value").single();
      if (error) throw error;
      return { id: data.id, value: data.value };
    }
    if (action === "records.delete") {
      if (args?.id && isUuid(String(args.id))) {
        const { error } = await supabase.from("grit_records").delete().eq("id", args.id);
        if (error) throw error;
      }
      return { ok: true };
    }
    throw new Error(`Unknown action: ${action}`);
  } catch (e) {
    console.warn("[GRIT] Supabase unavailable, using local fallback:", e);
    return localCallApi(action, args);
  }
}
