import "./index.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareText, X, ChevronRight, CalendarDays, Check, Plus, Trash2, Users, ShieldCheck, Zap, Brain, Home, Bookmark, ArrowLeft, Save, Target, Medal, CreditCard, Sparkles, Trophy, Search, Copy, Eraser, Flame, Dumbbell, BookOpen, Timer, Star, Mic, MicOff, Share2 } from "lucide-react";
import bgUrl from "./sprinter.webp";
import gritIconUrl from "./grit-icon.webp";

function GritIcon({ size = 44, rounded = 10 }: { size?: number; rounded?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden bg-[#111111]" style={{ width: size, height: size, borderRadius: rounded, boxShadow: "none", filter: "none", outline: "none" }} aria-hidden="true">
      <img src={gritIconUrl} alt="" className="absolute max-w-none" style={{ width: "127.6%", height: "128.2%", left: "-13.8%", top: "-14.1%", boxShadow: "none", filter: "none" }} />
    </span>
  );
}
async function croppedGritPng(size = 1024): Promise<Blob> {
  const img = new Image();
  img.src = gritIconUrl;
  await img.decode().catch(() => new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); }));
  const canvas = document.createElement("canvas");
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Icon could not be prepared.");
  const sx = img.naturalWidth * 0.108, sy = img.naturalHeight * 0.11;
  const sw = img.naturalWidth * 0.784, sh = img.naturalHeight * 0.78;
  ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Icon could not be prepared.");
  return blob;
}
function TinyAddToHomeLink() {
  const [showNote, setShowNote] = useState(false);
  return (
    <div className="mt-1 text-center">
      <button type="button" onClick={() => setShowNote((v) => !v)} aria-expanded={showNote} className="min-h-[20px] px-1 text-[11px] leading-tight text-white/50 underline decoration-white/30 underline-offset-2 hover:text-white/70">Add to Home Screen</button>
      {showNote && <p className="mx-auto mt-1 max-w-[300px] px-1 text-[11px] leading-snug text-white/55">In Safari: Share → Add to Home Screen → Add, name it The GRIT App.</p>}
    </div>
  );
}

type Workout = { id?: string; athlete: string; athleteId?: string; week: string; sections: Record<string,string>; minutes: Record<string,string>; homework?: string; raw: string; calendar: "queued"|"synced"; createdAt: string };
type AthleteProfile = { id: string; name: string; sport: string; position: string; lookUp: string; ageGroup: string; motto: string; remember: string; homework: string; mindset: string; gratitude: string; nonNegotiables: string; disciplineDone?: boolean[]; pin: string; focus: string; createdAt: string; startDate?: string; program?: string; trainingSections?: Record<string,string>; trainingMinutes?: Record<string,string>; trainingNotes?: Record<string,string>; progress_doc_url?: string; progress_notes?: string; progress_notes_last_synced?: string };
type Challenge = { id?: string; title: string; description: string; points: number; dueDate: string; week: string; createdAt: string };
type Completion = { id?: string; challengeId: string; athleteId: string; athleteName: string; week: string; points: number; createdAt: string };
type GritCard = { id?: string; fromId: string; fromName: string; toId: string; toName: string; message: string; week: string; createdAt: string };
type HomeworkRec = { id?: string; athleteId: string; athleteName: string; week: string; text: string; createdAt: string };
type ApiResp = { data?: any; error?: string };

// Vercel-ready store: same callApi interface as before, but backed by
// browser localStorage instead of the private preview "actions" backend
// (which does not exist on Vercel / GitHub Pages and caused the black screen).
// Data persists on each device. Supabase settings in the Coaches tab are kept
// for your Supabase SQL / connection display.
type StoredRecord = { id: string; value: any };
function readCollection(collection: string): StoredRecord[] {
  try { const raw = localStorage.getItem(`grit:${collection}`); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function writeCollection(collection: string, records: StoredRecord[]) {
  try { localStorage.setItem(`grit:${collection}`, JSON.stringify(records)); } catch {}
}
async function callApi(action: string, args: any): Promise<any> {
  const collection = String(args?.collection || "");
  if (action === "records.list") return { records: readCollection(collection) };
  if (action === "records.create") {
    const records = readCollection(collection);
    const rec = { id: safeId(), value: args?.value ?? {} };
    records.push(rec); writeCollection(collection, records); return rec;
  }
  if (action === "records.replace") {
    const records = readCollection(collection);
    const i = records.findIndex((r) => r.id === args?.id);
    if (i >= 0) { records[i] = { id: args.id, value: args?.value ?? {} }; writeCollection(collection, records); return records[i]; }
    const rec = { id: args?.id || safeId(), value: args?.value ?? {} }; records.push(rec); writeCollection(collection, records); return rec;
  }
  if (action === "records.delete") {
    writeCollection(collection, readCollection(collection).filter((r) => r.id !== args?.id)); return { ok: true };
  }
  throw new Error(`Unknown action: ${action}`);
}
const SECTIONS = ["Dynamic Stretch |","Core |","Main Lift |","Speed and Agility |"];
const DEFAULT_MINUTES: Record<string,string> = {"Dynamic Stretch |":"","Core |":"","Main Lift |":"","Speed and Agility |":""};
const emptySections = () => Object.fromEntries(SECTIONS.map(s=>[s,""]));
function safeId(){ return typeof crypto!=="undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
const ROSTER_NAMES = ["Amelia Couturier","Autumn S.","Bailey B.","Brett Robb","Brook Hayden","Brooklyn Brashaw","Callie Schwall","Clara","Dawsyn / Levi","Evy G","Gracie M","Hailey","Hannah King","Jorja Kiley","Kaitlyn Hayden","Kamryn Kiley","Lorelei Driver","Lydia Watson","Mackenzie Mercer","Mad dawg","Mayson Lahr","Mayla Zettle","Morgan Fox","Nat Wright","Reagan V","Tabatha Wheeler","Tessa G","Thailyn"];
const placeholderAthletes = (): AthleteProfile[] => {
  return [...ROSTER_NAMES].sort((a,b)=>a.localeCompare(b)).map((name,i)=>({ id:`local-${i+1}`, name, sport:"", position:"", lookUp:"", ageGroup:"", motto:"", remember:"", homework:"", mindset:"", gratitude:"", nonNegotiables:"", disciplineDone:[], pin:"", focus:"", createdAt:new Date().toISOString(), startDate:"", program:"", trainingSections:emptySections(), trainingMinutes:{...DEFAULT_MINUTES}, trainingNotes:{}, progress_doc_url:"", progress_notes:"", progress_notes_last_synced:"" }));
};

type View = "wall"|"training"|"athletes"|"pillars"|"formats"|"coach"|"homework"|"impact";
const TABS: {id:View; label:string; icon:any}[] = [
  {id:"athletes", label:"Your GRIT Profile", icon: Users},
  {id:"training", label:"Training", icon: Dumbbell},
  {id:"homework", label:"Homework", icon: BookOpen},
  {id:"pillars", label:"Mindset", icon: Brain},
  {id:"impact", label:"Impact", icon: Trophy},
  {id:"coach", label:"Coaches", icon: ShieldCheck},
];
const SUPABASE_SQL = `-- GRIT Supabase setup — run the WHOLE file at once in Supabase > SQL Editor.
-- Idempotent: safe to re-run. Athletes is created FIRST, before anything that references it.
create table if not exists public.athletes (id uuid primary key default gen_random_uuid(), name text not null unique, sport text default '', position text default '', mindset text default '', grateful text default '', look_up_to_you text default '', focus text default '', focus_why text default '', pin text not null default '1234', doc_url text default '', homework text default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.athletes add column if not exists sport text default '';
alter table public.athletes add column if not exists position text default '';
alter table public.athletes add column if not exists mindset text default '';
alter table public.athletes add column if not exists grateful text default '';
alter table public.athletes add column if not exists look_up_to_you text default '';
alter table public.athletes add column if not exists focus text default '';
alter table public.athletes add column if not exists focus_why text default '';
alter table public.athletes add column if not exists pin text not null default '1234';
alter table public.athletes add column if not exists doc_url text default '';
alter table public.athletes add column if not exists homework text default '';
alter table public.athletes add column if not exists created_at timestamptz not null default now();
alter table public.athletes add column if not exists updated_at timestamptz not null default now();
create table if not exists public.training_blocks (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, block_key text not null, content text default '', updated_at timestamptz not null default now(), unique (athlete_id, block_key));
create table if not exists public.homework (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, content text default '', week_of date, updated_at timestamptz not null default now());
create table if not exists public.progress_notes (id uuid primary key default gen_random_uuid(), athlete_id uuid not null references public.athletes(id) on delete cascade, kind text default 'note', content text default '', created_at timestamptz not null default now());
create table if not exists public.grit_cards (id uuid primary key default gen_random_uuid(), from_athlete_id uuid references public.athletes(id) on delete set null, to_athlete_id uuid not null references public.athletes(id) on delete cascade, message text default '', created_at timestamptz not null default now());
insert into public.athletes (name, pin) values ('Amelia Couturier','1234'),('Autumn S.','1234'),('Bailey B.','1234'),('Brett Robb','1234'),('Brook Hayden','1234'),('Brooklyn Brashaw','1234'),('Callie Schwall','1234'),('Clara','1234'),('Dawsyn / Levi','1234'),('Evy G','1234'),('Gracie M','1234'),('Hailey','1234'),('Hannah King','1234'),('Jorja Kiley','1234'),('Kaitlyn Hayden','1234'),('Kamryn Kiley','1234'),('Lorelei Driver','1234'),('Lydia Watson','1234'),('Mackenzie Mercer','1234'),('Mad dawg','1234'),('Mayson Lahr','1234'),('Mayla Zettle','1234'),('Morgan Fox','1234'),('Nat Wright','1234'),('Reagan V','1234'),('Tabatha Wheeler','1234'),('Tessa G','1234'),('Thailyn','1234') on conflict (name) do nothing;
create or replace function public.verify_athlete_pin(p_athlete_id uuid, p_pin text) returns boolean language sql stable security definer as $$ select exists (select 1 from public.athletes where id = p_athlete_id and pin = p_pin); $$;
alter table public.athletes enable row level security;
alter table public.training_blocks enable row level security;
alter table public.homework enable row level security;
alter table public.progress_notes enable row level security;
alter table public.grit_cards enable row level security;
drop policy if exists "grit_read" on public.athletes; drop policy if exists "grit_write" on public.athletes;
drop policy if exists "grit_read" on public.training_blocks; drop policy if exists "grit_write" on public.training_blocks;
drop policy if exists "grit_read" on public.homework; drop policy if exists "grit_write" on public.homework;
drop policy if exists "grit_read" on public.progress_notes; drop policy if exists "grit_write" on public.progress_notes;
drop policy if exists "grit_read" on public.grit_cards; drop policy if exists "grit_write" on public.grit_cards;
create policy "grit_read" on public.athletes for select using (true);
create policy "grit_write" on public.athletes for all using (true) with check (true);
create policy "grit_read" on public.training_blocks for select using (true);
create policy "grit_write" on public.training_blocks for all using (true) with check (true);
create policy "grit_read" on public.homework for select using (true);
create policy "grit_write" on public.homework for all using (true) with check (true);
create policy "grit_read" on public.progress_notes for select using (true);
create policy "grit_write" on public.progress_notes for all using (true) with check (true);
create policy "grit_read" on public.grit_cards for select using (true);
create policy "grit_write" on public.grit_cards for all using (true) with check (true);`;

function PhotoBackground(){
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#0F1113]" aria-hidden="true">
      <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl" />
      <img src={bgUrl} alt="" className="absolute inset-0 h-full w-full object-contain bg-[#0F1113] lg:object-cover lg:object-center" />
      <div className="absolute inset-0" style={{background:"linear-gradient(90deg, rgba(15,17,19,.72) 0%, rgba(15,17,19,.08) 18%, rgba(15,17,19,0) 50%, rgba(15,17,19,.08) 82%, rgba(15,17,19,.72) 100%), linear-gradient(180deg, rgba(15,17,19,.55) 0%, rgba(15,17,19,.05) 22%, rgba(15,17,19,0) 48%, rgba(15,17,19,.18) 82%, rgba(15,17,19,.58) 100%)"}} />
    </div>
  );
}

declare global { interface Window { SpeechRecognition?: any; webkitSpeechRecognition?: any; } }

export default function App(){
  const [view,setView]=useState<View>("wall");
  const [workouts,setWorkouts]=useState<Workout[]>([]);
  const [athletes,setAthletes]=useState<AthleteProfile[]>(placeholderAthletes());
  const [selectedAthleteId,setSelectedAthleteId]=useState<string|null>(null);
  const [calendarConnected,setCalendarConnected]=useState(false);
  const [calendarRecordId,setCalendarRecordId]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [apiNote,setApiNote]=useState("");
  const [dictOpen,setDictOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState("");
  const [savedFlash,setSavedFlash]=useState(false);
  const [athleteMode,setAthleteMode]=useState("All Athletes");
  const [customAthlete,setCustomAthlete]=useState("");
  const [week,setWeek]=useState("This Week");
  const [sections,setSections]=useState<Record<string,string>>(emptySections());
  const [minutes,setMinutes]=useState<Record<string,string>>({...DEFAULT_MINUTES});
  const [blockNotes,setBlockNotes]=useState<Record<string,string>>({});
  const [loggedInAthleteId,setLoggedInAthleteId]=useState<string|null>(null);
  const [pinInput,setPinInput]=useState("");
  const [loginError,setLoginError]=useState("");
  const [profilePinEdit,setProfilePinEdit]=useState("");
  const [trainingMotto,setTrainingMotto]=useState("");
  const [pillarMindset,setPillarMindset]=useState("");
  const [pillarDiscipline,setPillarDiscipline]=useState("");
  const [pillarRecordId,setPillarRecordId]=useState<string|null>(null);
  const [trainingAthleteId,setTrainingAthleteId]=useState("");
  const [homeworkText,setHomeworkText]=useState("");
  const [homeworkRecords,setHomeworkRecords]=useState<HomeworkRec[]>([]);
  const [challenges,setChallenges]=useState<Challenge[]>([]);
  const [completions,setCompletions]=useState<Completion[]>([]);
  const [cards,setCards]=useState<GritCard[]>([]);
  const [chTitle,setChTitle]=useState("");
  const [chDesc,setChDesc]=useState("");
  const [chPoints,setChPoints]=useState(10);
  const [chDue,setChDue]=useState("");
  const [completeAthleteId,setCompleteAthleteId]=useState("");
  const [cardFrom,setCardFrom]=useState("");
  const [cardTo,setCardTo]=useState("");
  const [cardMessage,setCardMessage]=useState("");
  const [cardWeekFilter,setCardWeekFilter]=useState("All Weeks");
  const [editingCardId,setEditingCardId]=useState<string|null>(null);
  const [expandedCardId,setExpandedCardId]=useState<string|null>(null);
  const [spotlightId,setSpotlightId]=useState("");
  const [reactions,setReactions]=useState<Record<string,"fire">>({});
  const [celebrated,setCelebrated]=useState("");
  const [homeworkDone,setHomeworkDone]=useState<Record<string,boolean>>({});
  const [profileSearch,setProfileSearch]=useState("");
  const [profileDropdownOpen,setProfileDropdownOpen]=useState(false);
  const [leaderAthleteId,setLeaderAthleteId]=useState("");
  const [coachDocAthleteId,setCoachDocAthleteId]=useState("");
  // --- Coaches dashboard ---
  const [supabaseUrl,setSupabaseUrl]=useState("");
  const [supabaseKey,setSupabaseKey]=useState("");
  const [supabaseStatus,setSupabaseStatus]=useState<"Not Connected"|"Connected">("Not Connected");
  const [supabaseLastChecked,setSupabaseLastChecked]=useState("");
  const [supabaseNote,setSupabaseNote]=useState("");
  const [supabaseRecordId,setSupabaseRecordId]=useState<string|null>(null);
  const [showSql,setShowSql]=useState(false);
  const [sqlCopied,setSqlCopied]=useState(false);
  const [calendarLastChecked,setCalendarLastChecked]=useState("");
  const [calendarSyncOn,setCalendarSyncOn]=useState(true);
  const [calendarSyncMsg,setCalendarSyncMsg]=useState("");
  const [publishVersion,setPublishVersion]=useState(1);
  const [lastSavedAt,setLastSavedAt]=useState("");
  const [lastPublishedAt,setLastPublishedAt]=useState("");
  const [published,setPublished]=useState(false);
  const [resetAthleteId,setResetAthleteId]=useState("");
  const [newPin,setNewPin]=useState("");
  const [justReset,setJustReset]=useState<{name:string; pin:string}|null>(null);
  const [shareNote,setShareNote]=useState("");
  const [shareStatus,setShareStatus]=useState("");
  const [lastSyncedAt,setLastSyncedAt]=useState("");
  const [checkResults,setCheckResults]=useState<{label:string; ok:boolean; detail:string; synced:string}[]|null>(null);

  // --- Dictation ---
  const [dictAthleteId,setDictAthleteId]=useState("");
  const [dictDestination,setDictDestination]=useState("");
  const [dictQuestionBlock,setDictQuestionBlock]=useState("");
  const [dictTranscript,setDictTranscript]=useState("");
  const [dictInterim,setDictInterim]=useState("");
  const [dictStatus,setDictStatus]=useState<"Idle"|"Listening"|"Paused"|"Saved">("Idle");
  const [dictHandsFree,setDictHandsFree]=useState(false);
  const [dictSupported,setDictSupported]=useState(false);
  const recogRef = useRef<any>(null);
  const dictatingRef = useRef(false);
  const handsFreeRef = useRef(false);
  const listeningRef = useRef(false);
  const transcriptRef = useRef("");
  const dictAthleteRef = useRef("");
  const dictDestinationRef = useRef("");
  const dictQuestionBlockRef = useRef("");
  const handsFreeRestartRef = useRef<number|undefined>(undefined);

  useEffect(()=>{ transcriptRef.current = dictTranscript; },[dictTranscript]);
  useEffect(()=>{ dictAthleteRef.current = dictAthleteId; },[dictAthleteId]);
  useEffect(()=>{ dictDestinationRef.current = dictDestination; },[dictDestination]);
  useEffect(()=>{ dictQuestionBlockRef.current = dictQuestionBlock; },[dictQuestionBlock]);

  function flashSaved(){ setSavedFlash(true); setTimeout(()=>setSavedFlash(false), 2000); }
  function markSynced(){ setLastSyncedAt(new Date().toLocaleString()); }
  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      try{
        const sizes = [180, 512, 1024];
        const urls = await Promise.all(sizes.map(async (s)=>{
          const blob = await croppedGritPng(s);
          return { s, url: URL.createObjectURL(blob) };
        }));
        if(cancelled) return;
        const bySize = new Map(urls.map(u=>[u.s, u.url]));
        const setLink = (rel:string, href:string, extra?:Record<string,string>)=>{
          let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
          if(!el){ el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
          el.href = href; if(extra) Object.entries(extra).forEach(([k,v])=>el!.setAttribute(k,v));
        };
        setLink("icon", bySize.get(512) || "");
        setLink("apple-touch-icon", bySize.get(180) || "");
        const manifest = { name:"The GRIT App", short_name:"GRIT", display:"standalone", background_color:"#111111", theme_color:"#111111", icons: sizes.map(s=>({ src: bySize.get(s), sizes:`${s}x${s}`, type:"image/png" })) };
        const manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type:"application/manifest+json" }));
        setLink("manifest", manifestUrl);
        let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
        if(!meta){ meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
        meta.content = "#111111";
        document.title = "The GRIT App";
      }catch{}
    })();
    return ()=>{ cancelled = true; };
  },[]);
  async function shareIconOnly(){
    setShareStatus("");
    try{
      const blob = await croppedGritPng(1024);
      const file = new File([blob], "GRIT-Icon.png", { type:"image/png" });
      const nav:any = navigator as any;
      if(nav.share && (!nav.canShare || nav.canShare({ files:[file] }))){
        await nav.share({ files:[file] });
        setShareStatus("Shared"); setTimeout(()=>setShareStatus(""), 2500); return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "GRIT-Icon.png"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      setShareStatus("Shared"); setTimeout(()=>setShareStatus(""), 2500);
    }catch(e:any){
      if(e?.name !== "AbortError") setShareStatus("Icon could not be shared on this device.");
    }
  }

  async function reloadRecords(){
    try{
      const w = await callApi("records.list",{collection:"grit_workouts"});
      const list = (w?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{})}));
      list.sort((a:any,b:any)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
      setWorkouts(list);
      const c = await callApi("records.list",{collection:"grit_calendar"});
      const conn = (c?.records||[]).find((r:any)=>r.value?.connected);
      setCalendarConnected(!!conn); setCalendarRecordId(conn?.id||null);
      const a = await callApi("records.list",{collection:"grit_athletes"});
      const savedAthletes = (a?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{}), sport:r.value?.sport||"", position:r.value?.position||"", lookUp:r.value?.lookUp||"", ageGroup:r.value?.ageGroup||"", gratitude:r.value?.gratitude||"", disciplineDone:r.value?.disciplineDone||[], pin:r.value?.pin||"", focus:r.value?.focus||"", trainingSections:r.value?.trainingSections||emptySections(), trainingMinutes:r.value?.trainingMinutes||{...DEFAULT_MINUTES}, trainingNotes:r.value?.trainingNotes||{}, progress_doc_url:r.value?.progress_doc_url||"", progress_notes:r.value?.progress_notes||"", progress_notes_last_synced:r.value?.progress_notes_last_synced||""})).filter((x:any)=>x.name);
      if(savedAthletes.length){
        const base = placeholderAthletes();
        const byName = new Map(savedAthletes.map((x:any)=>[String(x.name||"").toLowerCase(), x]));
        const merged = base.map((p)=>{
          const s:any = byName.get(p.name.toLowerCase());
          if(!s) return p;
          return {...p, ...s, startDate: s.startDate || p.startDate, program: s.program || p.program, sport: s.sport || p.sport, position: s.position || p.position, lookUp: s.lookUp || p.lookUp, ageGroup: s.ageGroup || p.ageGroup, gratitude: s.gratitude || p.gratitude, disciplineDone: s.disciplineDone || p.disciplineDone, pin: s.pin || p.pin || "", focus: s.focus || p.focus || "", trainingSections:{...emptySections(), ...(s.trainingSections||{})}, trainingMinutes:{...DEFAULT_MINUTES, ...(s.trainingMinutes||{})}, trainingNotes:s.trainingNotes||{}, progress_doc_url: s.progress_doc_url || "", progress_notes: s.progress_notes || "", progress_notes_last_synced: s.progress_notes_last_synced || ""};
        });
        merged.sort((x,y)=>x.name.localeCompare(y.name));
        setAthletes(merged);
      }
      const p = await callApi("records.list",{collection:"grit_pillars"});
      const pillar = (p?.records||[])[0];
      if(pillar?.value){ setPillarMindset(pillar.value.mindset||""); setPillarDiscipline(pillar.value.discipline||""); setPillarRecordId(pillar.id); }
      const hw = await callApi("records.list",{collection:"grit_homework"});
      setHomeworkRecords((hw?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{})})));
      const ch = await callApi("records.list",{collection:"grit_challenges"});
      const chList = (ch?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{})}));
      chList.sort((a:any,b:any)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
      setChallenges(chList);
      const comp = await callApi("records.list",{collection:"grit_completions"});
      setCompletions((comp?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{})})));
      try{
        const st = await callApi("records.list",{collection:"grit_settings"});
        const settings = (st?.records||[])[0];
        if(settings?.value){
          setSupabaseStatus(settings.value.supabaseStatus||"Not Connected");
          setSupabaseLastChecked(settings.value.supabaseLastChecked||"");
          setSupabaseNote(settings.value.supabaseNote||"");
          setSupabaseRecordId(settings.id||null);
          setCalendarLastChecked(settings.value.calendarLastChecked||"");
          setCalendarSyncOn(settings.value.calendarSyncOn!==false);
          setPublishVersion(settings.value.publishVersion||1);
          setLastSavedAt(settings.value.lastSavedAt||"");
          setLastPublishedAt(settings.value.lastPublishedAt||"");
          setPublished(!!settings.value.published);
        }
      }catch{}
      const gc = await callApi("records.list",{collection:"grit_cards"});
      const cardList = (gc?.records||[]).map((r:any)=>({id:r.id, ...(r.value||{})}));
      cardList.sort((a:any,b:any)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
      setCards(cardList);
      setApiNote("");
    }catch(e){ setApiNote("Cloud records are not available in this preview. Your view will refresh once the hosted records service is reachable."); }
    setLoading(false);
  }
  useEffect(()=>{ reloadRecords(); },[]);
  useEffect(()=>{ setDictSupported(typeof window!=="undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition)); },[]);

  const queued = useMemo(()=>workouts.filter(w=>w.calendar==="queued").length,[workouts]);
  const athleteLabel = athleteMode==="Custom" ? (customAthlete.trim()||"One Athlete") : athleteMode;
  const selectedAthlete = athletes.find(a=>a.id===selectedAthleteId) || null;
  const trainingAthlete = athletes.find(a=>a.id===trainingAthleteId) || null;
  const unlockedAthlete = athletes.find(a=>a.id===loggedInAthleteId) || null;
  const isProfileUnlocked = !!selectedAthlete && loggedInAthleteId===selectedAthlete.id;
  const filteredProfileAthletes = useMemo(()=> athletes.filter(a=>a.name.toLowerCase().includes(profileSearch.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name)),[athletes,profileSearch]);
  const currentWorkout = useMemo(()=> workouts.find(w=>w.week===week && (w.athleteId===trainingAthlete?.id || w.athlete===trainingAthlete?.name)),[workouts,week,trainingAthlete]);
  const currentChallenge = useMemo(()=> challenges.find(c=>c.week===week) || challenges[0] || null,[challenges,week]);
  const cardWeeks = useMemo(()=> Array.from(new Set(cards.map(c=>c.week))),[cards]);
  const existingCardForSender = useMemo(()=> cards.find(c=>c.fromId===cardFrom && c.week===week),[cards,cardFrom,week]);
  const homeworkForTraining = useMemo(()=> homeworkRecords.find(h=>h.athleteId===trainingAthlete?.id && h.week===week)?.text || trainingAthlete?.homework || "",[homeworkRecords,trainingAthlete,week]);

  const dashboardStats = useMemo(()=>{
    const edited = athletes.filter(a=> (a.mindset||"").trim() || (a.gratitude||"").trim() || (a.focus||"").trim() || (a.remember||"").trim()).length;
    const blocksDone = workouts.reduce((n,w)=> n + Object.values(w.sections||{}).filter(v=>String(v||"").trim()).length, 0);
    const notesWaiting = athletes.reduce((n,a)=> n + Object.values(a.trainingNotes||{}).filter(v=>String(v||"").trim()).length, 0);
    return { total: athletes.length, unlocked: loggedInAthleteId ? 1 : 0, editedThisWeek: edited, blocksDone, upcoming: workouts.length, notesWaiting };
  },[athletes, workouts, loggedInAthleteId]);
  const recentActivity = useMemo(()=>{
    const items: {id:string; text:string; time:string; ts:number}[] = [];
    workouts.forEach(w=> items.push({ id:`w-${w.id}`, text:`${w.athlete} — workout saved for ${w.week}`, time:new Date(w.createdAt).toLocaleString(), ts:new Date(w.createdAt).getTime() }));
    cards.forEach(c=> items.push({ id:`c-${c.id}`, text:`${c.fromName} sent a GRIT Card to ${c.toName}`, time:new Date(c.createdAt).toLocaleString(), ts:new Date(c.createdAt).getTime() }));
    completions.forEach(c=> items.push({ id:`p-${c.id}`, text:`${c.athleteName} completed a challenge (+${c.points} pts)`, time:new Date(c.createdAt).toLocaleString(), ts:new Date(c.createdAt).getTime() }));
    homeworkRecords.forEach(h=> items.push({ id:`h-${h.id}`, text:`${h.athleteName} — homework saved for ${h.week}`, time:new Date(h.createdAt).toLocaleString(), ts:new Date(h.createdAt).getTime() }));
    return items.sort((a,b)=>b.ts-a.ts).slice(0,8);
  },[workouts, cards, completions, homeworkRecords]);
  const upcomingSessions = useMemo(()=> [...workouts].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,6),[workouts]);
  const docSyncStatus = (a: AthleteProfile) => !a.progress_doc_url?.trim() ? "No Doc Linked" : a.progress_notes_last_synced ? "Synced" : "Needs Sync";
  const workoutWeeks = useMemo(()=> new Set(workouts.map(w=>w.week)).size,[workouts]);
  const challengeDoneCount = useMemo(()=> currentChallenge ? completions.filter(c=>c.challengeId===currentChallenge.id).length : 0,[completions,currentChallenge]);
  const challengeProgress = athletes.length ? Math.min(100, Math.round((challengeDoneCount / athletes.length)*100)) : 0;
  const daysLeft = useMemo(()=>{
    if(!currentChallenge?.dueDate) return null;
    const diff = Math.ceil((new Date(currentChallenge.dueDate).getTime() - Date.now()) / 86400000);
    return diff;
  },[currentChallenge]);

  const openAthlete = (id:string)=>{ const a = athletes.find(x=>x.id===id); setSelectedAthleteId(id); if(a) setProfileSearch(a.name); setProfilePinEdit(""); setView("athletes"); window.scrollTo({top:0, behavior:"smooth"}); };
  const updateAthlete = (id:string, patch:Partial<AthleteProfile>)=> setAthletes(prev=>prev.map(a=>a.id===id?{...a,...patch}:a));
  const addAthlete = ()=>{ const n:AthleteProfile={id:`local-${safeId()}`, name:"", sport:"", position:"", lookUp:"", ageGroup:"", motto:"", remember:"", homework:"", mindset:"", gratitude:"", nonNegotiables:"", disciplineDone:[], pin:"", focus:"", createdAt:new Date().toISOString(), startDate:"", program:"", trainingSections:emptySections(), trainingMinutes:{...DEFAULT_MINUTES}, trainingNotes:{}, progress_doc_url:"", progress_notes:"", progress_notes_last_synced:""}; setAthletes(prev=>[...prev,n]); setSelectedAthleteId(n.id); setProfileSearch(""); setProfilePinEdit(""); setView("athletes"); setResult(""); };

  useEffect(()=>{ setHomeworkText(homeworkForTraining); },[homeworkForTraining]);
  // When an athlete unlocks, they become the current athlete for the whole session.
  useEffect(()=>{ if(loggedInAthleteId) setTrainingAthleteId(loggedInAthleteId); },[loggedInAthleteId]);
  // Load per-athlete training blocks when the current athlete changes.
  useEffect(()=>{
    if(!trainingAthlete) return;
    setSections({...emptySections(), ...(trainingAthlete.trainingSections||{})});
    setMinutes({...DEFAULT_MINUTES, ...(trainingAthlete.trainingMinutes||{})});
    setBlockNotes({... (trainingAthlete.trainingNotes||{})});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[trainingAthlete?.id]);

  // ---------- Data layer ----------
  function athleteValue(p: AthleteProfile){
    return { name:p.name, sport:p.sport, position:p.position||"", lookUp:p.lookUp||"", ageGroup:p.ageGroup, motto:p.motto, remember:p.remember, homework:p.homework, mindset:p.mindset, gratitude:p.gratitude, nonNegotiables:p.nonNegotiables, disciplineDone:p.disciplineDone||[], pin:p.pin||"", focus:p.focus||"", startDate:p.startDate||"", program:p.program||"", createdAt:p.createdAt, trainingSections:p.trainingSections||emptySections(), trainingMinutes:p.trainingMinutes||{...DEFAULT_MINUTES}, trainingNotes:p.trainingNotes||{}, progress_doc_url:p.progress_doc_url||"", progress_notes:p.progress_notes||"", progress_notes_last_synced:p.progress_notes_last_synced||"" };
  }
  async function persistAthleteToStore(p: AthleteProfile): Promise<string> {
    if(p.id.startsWith("local-")){
      const created = await callApi("records.create",{collection:"grit_athletes", value: athleteValue(p), idempotency_key:safeId()});
      return created?.id || p.id;
    }
    await callApi("records.replace",{collection:"grit_athletes", id:p.id, value: athleteValue(p)});
    return p.id;
  }
  async function saveAthleteProfile(profile: AthleteProfile){
    setBusy(true); setResult("");
    try{
      const newId = await persistAthleteToStore(profile);
      if(newId!==profile.id){
        setAthletes(prev=>prev.map(a=>a.id===profile.id?{...a, id:newId}:a));
        setSelectedAthleteId(newId);
        if(loggedInAthleteId===profile.id) setLoggedInAthleteId(newId);
        if(trainingAthleteId===profile.id) setTrainingAthleteId(newId);
      }
      await reloadRecords();
      flashSaved(); markSynced();
      setResult(`Saved ${profile.name}. Synced.`);
    }catch(e:any){ setResult(e.message||"Could not save that athlete."); }
    setBusy(false);
  }
  async function saveTrainingBlock(block: string){
    if(!trainingAthlete) return;
    const updated: AthleteProfile = { ...trainingAthlete, trainingSections:{...(trainingAthlete.trainingSections||{}), [block]: sections[block]||""}, trainingMinutes:{...(trainingAthlete.trainingMinutes||{}), [block]: minutes[block]||""}, trainingNotes:{...(trainingAthlete.trainingNotes||{}), [block]: blockNotes[block]||""} };
    updateAthlete(trainingAthlete.id, { trainingSections: updated.trainingSections, trainingMinutes: updated.trainingMinutes, trainingNotes: updated.trainingNotes });
    await saveAthleteProfile(updated);
  }
  async function saveFocus(){
    if(!trainingAthlete) return;
    await saveAthleteProfile({ ...trainingAthlete });
  }

  // ---------- Dictation ----------
  function appendTranscript(text: string){
    const clean = text.trim();
    if(!clean) return;
    const next = transcriptRef.current ? `${transcriptRef.current} ${clean}` : clean;
    transcriptRef.current = next;
    setDictTranscript(next);
  }
  async function saveDictation(){
    const text = transcriptRef.current.trim();
    const athleteId = dictAthleteRef.current;
    const dest = dictDestinationRef.current;
    if(!athleteId){ setDictStatus("Idle"); setResult("Pick an athlete for dictation first."); return; }
    if(!dest){ setResult("Pick a destination for dictation first."); return; }
    if(!text){ setResult("Speak or type dictation first."); return; }
    const athlete = athletes.find(a=>a.id===athleteId);
    if(!athlete){ setResult("Pick an athlete for dictation first."); return; }
    const join = (prev: string) => prev && prev.trim() ? `${prev.trim()} ${text}` : text;
    let updated: AthleteProfile = { ...athlete };
    if(SECTIONS.includes(dest)){
      updated = { ...athlete, trainingSections:{...(athlete.trainingSections||{}), [dest]: join(athlete.trainingSections?.[dest]||"")} };
    } else if(dest==="focus"){
      updated = { ...athlete, focus: join(athlete.focus||"") };
    } else if(dest==="progress"){
      updated = { ...athlete, progress_notes: join(athlete.progress_notes||"") };
    } else if(dest==="questions"){
      const block = dictQuestionBlockRef.current || SECTIONS[0];
      updated = { ...athlete, trainingNotes:{...(athlete.trainingNotes||{}), [block]: join(athlete.trainingNotes?.[block]||"")} };
    }
    setBusy(true);
    try{
      const newId = await persistAthleteToStore(updated);
      if(newId!==updated.id){
        setAthletes(prev=>prev.map(a=>a.id===updated.id?{...a, id:newId}:a));
      }
      updateAthlete(athlete.id, updated as Partial<AthleteProfile>);
      if(trainingAthleteId===athlete.id){
        if(SECTIONS.includes(dest)) setSections(prev=>({...prev, [dest]: updated.trainingSections?.[dest]||""}));
        if(dest==="questions"){ const block = dictQuestionBlockRef.current || SECTIONS[0]; setBlockNotes(prev=>({...prev, [block]: updated.trainingNotes?.[block]||""})); }
      }
      await reloadRecords();
      setDictStatus("Saved");
      setResult(`Saved dictation to ${athlete.name}.`);
      flashSaved();
    }catch(e:any){ setResult(e.message||"Could not save dictation."); }
    setBusy(false);
  }
  const saveDictationRef = useRef(saveDictation);
  useEffect(()=>{ saveDictationRef.current = saveDictation; });

  function stopRecognition(){
    listeningRef.current = false;
    dictatingRef.current = false;
    try{ recogRef.current?.stop(); }catch{}
    recogRef.current = null;
    setDictInterim("");
  }
  function startRecognition(){
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!Ctor) return null;
    if(recogRef.current){ try{ recogRef.current.stop(); }catch{} }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recogRef.current = rec;
    listeningRef.current = true;
    rec.onresult = (event:any)=>{
      let interim = "";
      for(let i=event.resultIndex; i<event.results.length; i++){
        const res = event.results[i];
        const text = res[0]?.transcript || "";
        if(!text) continue;
        if(res.isFinal){
          const lower = text.toLowerCase().trim();
          if(handsFreeRef.current && !dictatingRef.current){
            if(lower.includes("hey grit") || lower.includes("start dictation")){
              dictatingRef.current = true;
              setDictStatus("Listening");
              const after = text.toLowerCase().includes("hey grit") ? text.slice(text.toLowerCase().indexOf("hey grit") + "hey grit".length) : text.slice(text.toLowerCase().indexOf("start dictation") + "start dictation".length);
              const cleaned = after.replace(/^[,.\s]+/,"").trim();
              if(cleaned) appendTranscript(cleaned);
            }
          } else if(handsFreeRef.current && dictatingRef.current){
            const t = lower.replace(/[.!?]+$/,"").trim();
            if(t==="save" || t==="save dictation" || t==="stop" || t==="stop dictation"){
              dictatingRef.current = false;
              setDictStatus("Saved");
              saveDictationRef.current();
            } else if(t.endsWith(" save") || t.endsWith(" save dictation") || t.endsWith(" stop")){
              const cleaned = text.replace(/\s+(save dictation|save|stop)\s*[.!?]*$/i,"").trim();
              if(cleaned) appendTranscript(cleaned);
              dictatingRef.current = false;
              setDictStatus("Saved");
              saveDictationRef.current();
            } else {
              appendTranscript(text);
            }
          } else {
            appendTranscript(text);
          }
        } else {
          interim += text;
        }
      }
      setDictInterim(interim);
    };
    rec.onerror = ()=>{ setDictInterim(""); };
    rec.onend = ()=>{
      setDictInterim("");
      if(handsFreeRef.current){
        setDictStatus(dictatingRef.current ? "Listening" : "Paused");
        handsFreeRestartRef.current = window.setTimeout(()=>{ if(handsFreeRef.current) startRecognition(); }, 400);
      } else if(listeningRef.current){
        listeningRef.current = false;
        setDictStatus("Paused");
      }
    };
    try{ rec.start(); }catch{ listeningRef.current = false; }
    return rec;
  }
  function startManualDictation(){
    if(!dictSupported) return;
    dictatingRef.current = true;
    setDictStatus("Listening");
    startRecognition();
  }
  function stopManualDictation(){
    dictatingRef.current = false;
    listeningRef.current = false;
    setDictStatus("Paused");
    stopRecognition();
  }
  useEffect(()=>{
    handsFreeRef.current = dictHandsFree;
    if(dictHandsFree){
      if(!dictSupported){ setDictStatus("Idle"); return; }
      setDictStatus("Paused");
      startRecognition();
    } else {
      if(handsFreeRestartRef.current) window.clearTimeout(handsFreeRestartRef.current);
      dictatingRef.current = false;
      listeningRef.current = false;
      try{ recogRef.current?.stop(); }catch{}
      recogRef.current = null;
      setDictInterim("");
      setDictStatus((s)=> s==="Saved" ? s : "Idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[dictHandsFree]);
  useEffect(()=>()=>{ if(handsFreeRestartRef.current) window.clearTimeout(handsFreeRestartRef.current); try{ recogRef.current?.stop(); }catch{} },[]);

  async function publish(){
    if(!SECTIONS.some(s=>sections[s].trim())){ setResult("Add at least one section before publishing."); return; }
    if(!trainingAthlete){ setResult("Select an athlete first."); return; }
    setBusy(true); setResult("");
    const athleteName = trainingAthlete?.name || athleteLabel;
    const value: Workout = { athlete: athleteName, athleteId: trainingAthlete?.id, week, sections, minutes, homework: homeworkText, raw: "", calendar: calendarConnected?"synced":"queued", createdAt:new Date().toISOString() };
    let saved=0; let error:string|null=null;
    try{ await callApi("records.create",{collection:"grit_workouts", value, idempotency_key:safeId()}); saved=1; } catch(e:any){ error=e.message||String(e); }
    if(saved===1 && homeworkText.trim()){
      try{
        const existing = homeworkRecords.find(h=>h.athleteId===trainingAthlete?.id && h.week===week);
        const hv = { athleteId: trainingAthlete?.id||"", athleteName, week, text: homeworkText, createdAt:new Date().toISOString() };
        if(existing?.id) await callApi("records.replace",{collection:"grit_homework", id:existing.id, value:hv});
        else await callApi("records.create",{collection:"grit_homework", value:hv, idempotency_key:safeId()});
      }catch(e:any){ error = error ? error+" • Homework: "+(e.message||String(e)) : (e.message||String(e)); }
    }
    let reloadError:string|null=null;
    try{ await reloadRecords(); }catch(e:any){ reloadError=e.message||String(e); }
    setResult(`Saved: ${saved} • Remaining: ${1-saved}${error?` • ${error}`:""}${reloadError?` • Reload: ${reloadError}`:""}`);
    if(saved===1){ flashSaved(); markSynced(); }
    setBusy(false);
    if(saved===1){ setSections(emptySections()); setMinutes({...DEFAULT_MINUTES}); }
  }
  async function removeWorkout(id?:string){
    if(!id) return;
    try{ await callApi("records.delete",{collection:"grit_workouts", id}); await reloadRecords(); }catch(e:any){ setResult(e.message||"Could not delete that workout."); }
  }
  async function toggleCalendar(){
    setBusy(true);
    try{
      if(calendarConnected && calendarRecordId){ await callApi("records.delete",{collection:"grit_calendar", id:calendarRecordId}); }
      else { await callApi("records.create",{collection:"grit_calendar", value:{connected:true, createdAt:new Date().toISOString()}, idempotency_key:safeId()}); }
      await reloadRecords(); setResult(calendarConnected ? "Google Calendar disconnected. New workouts will be queued." : "Google Calendar connected. Queued workouts are marked ready to sync.");
      flashSaved();
    }catch(e:any){ setResult(e.message||"Calendar connection could not be saved."); }
    setBusy(false);
  }
  async function saveAthlete(){
    if(!selectedAthlete) return;
    const profile: AthleteProfile = { ...selectedAthlete, pin: profilePinEdit.length===4 ? profilePinEdit : selectedAthlete.pin };
    await saveAthleteProfile(profile);
    setProfilePinEdit("");
  }
  async function savePillars(){
    setBusy(true);
    try{
      const value={mindset:pillarMindset, discipline:pillarDiscipline, createdAt:new Date().toISOString()};
      if(pillarRecordId) await callApi("records.replace",{collection:"grit_pillars", id:pillarRecordId, value});
      else { const created=await callApi("records.create",{collection:"grit_pillars", value, idempotency_key:safeId()}); if(created?.id) setPillarRecordId(created.id); }
      setResult("Pillars saved."); flashSaved();
    }catch(e:any){ setResult(e.message||"Could not save Pillars."); }
    setBusy(false);
  }
  function duplicateLastWeek(){
    if(!trainingAthlete){ setResult("Select an athlete first."); return; }
    const prior = workouts.filter(w=>(w.athleteId===trainingAthlete?.id || w.athlete===trainingAthlete?.name) && w.week!==week).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(!prior){ setResult("No earlier workout for this athlete to duplicate."); return; }
    setSections({...emptySections(), ...(prior.sections||{})}); setMinutes({...DEFAULT_MINUTES, ...(prior.minutes||{})}); setHomeworkText(prior.homework||""); setResult(`Duplicated last workout (${prior.week}) — edit it, then publish for ${week}.`);
  }
  function clearTraining(){ setSections(emptySections()); setMinutes({...DEFAULT_MINUTES}); setBlockNotes({}); setHomeworkText(""); setResult(""); }
  function loadCurrentWorkout(){ if(!trainingAthlete){ setResult("Select an athlete first."); return; } if(!currentWorkout){ setResult("No published workout for this athlete + week yet."); return; } setSections({...emptySections(), ...(currentWorkout.sections||{})}); setMinutes({...DEFAULT_MINUTES, ...(currentWorkout.minutes||{})}); setHomeworkText(currentWorkout.homework||""); setResult(`Loaded ${currentWorkout.week} for ${currentWorkout.athlete}.`); }

  async function saveHomework(){
    if(!trainingAthlete) return;
    setBusy(true);
    try{
      const existing = homeworkRecords.find(h=>h.athleteId===trainingAthlete.id && h.week===week);
      const value = { athleteId:trainingAthlete.id, athleteName:trainingAthlete.name, week, text:homeworkText, createdAt:new Date().toISOString() };
      if(existing?.id) await callApi("records.replace",{collection:"grit_homework", id:existing.id, value});
      else await callApi("records.create",{collection:"grit_homework", value, idempotency_key:safeId()});
      updateAthlete(trainingAthlete.id,{homework:homeworkText});
      await reloadRecords(); setResult(`Homework saved for ${trainingAthlete.name} • ${week}.`); flashSaved();
    }catch(e:any){ setResult(e.message||"Could not save homework."); }
    setBusy(false);
  }

  async function saveChallenge(){
    if(!chTitle.trim()){ setResult("Add a challenge title first."); return; }
    setBusy(true);
    try{
      const value = { title:chTitle, description:chDesc, points:Number(chPoints)||0, dueDate:chDue, week, createdAt:new Date().toISOString() };
      await callApi("records.create",{collection:"grit_challenges", value, idempotency_key:safeId()});
      await reloadRecords(); setResult(`Challenge saved for ${week}: ${chTitle}`); setChTitle(""); setChDesc(""); flashSaved();
    }catch(e:any){ setResult(e.message||"Could not save challenge."); }
    setBusy(false);
  }
  async function markComplete(){
    if(!currentChallenge){ setResult("Set this week's challenge first."); return; }
    const athlete = athletes.find(a=>a.id===completeAthleteId); if(!athlete) return;
    if(completions.some(c=>c.challengeId===currentChallenge.id && c.athleteId===athlete.id)){ setResult(`${athlete.name} is already marked complete for this challenge.`); return; }
    setBusy(true);
    try{
      const value = { challengeId:currentChallenge.id||"", athleteId:athlete.id, athleteName:athlete.name, week, points:currentChallenge.points, createdAt:new Date().toISOString() };
      await callApi("records.create",{collection:"grit_completions", value, idempotency_key:safeId()});
      await reloadRecords(); setResult(`${athlete.name} marked complete — +${currentChallenge.points} pts.`); setCelebrated(athlete.name); setTimeout(()=>setCelebrated(""), 3500); flashSaved();
    }catch(e:any){ setResult(e.message||"Could not mark complete."); }
    setBusy(false);
  }
  async function saveGritCard(){
    const from = athletes.find(a=>a.id===cardFrom); const to = athletes.find(a=>a.id===cardTo);
    if(!from || !to){ setResult("Pick both athletes for the GRIT Card."); return; }
    if(from.id===to.id){ setResult("Pick one other athlete — a GRIT Card goes to someone else."); return; }
    if(!cardMessage.trim()){ setResult("Write how they made you better."); return; }
    if(existingCardForSender && !editingCardId){
      setEditingCardId(existingCardForSender.id||null); setCardTo(existingCardForSender.toId); setCardMessage(existingCardForSender.message);
      setResult("You already sent your GRIT Card this week — it is loaded below so you can view / edit it.");
      return;
    }
    setBusy(true);
    try{
      const value = { fromId:from.id, fromName:from.name, toId:to.id, toName:to.name, message:cardMessage, week, createdAt:new Date().toISOString() };
      if(editingCardId) await callApi("records.replace",{collection:"grit_cards", id:editingCardId, value});
      else await callApi("records.create",{collection:"grit_cards", value, idempotency_key:safeId()});
      await reloadRecords(); setResult(editingCardId ? "GRIT Card updated." : `GRIT Card sent: ${from.name} → ${to.name}`); setEditingCardId(null); setCardMessage(""); flashSaved();
    }catch(e:any){ setResult(e.message||"Could not save GRIT Card."); }
    setBusy(false);
  }
  function startEditCard(c:GritCard){ setCardFrom(c.fromId); setCardTo(c.toId); setCardMessage(c.message); setEditingCardId(c.id||null); setResult(`Editing GRIT Card: ${c.fromName} → ${c.toName}`); window.scrollTo({top:0, behavior:"smooth"}); }

  const goTab = (v:View)=>{ setView(v); window.scrollTo({top:0, behavior:"smooth"}); };
  function handleUnlock(){
    const athlete = selectedAthlete;
    if(!athlete) return;
    const pin = String(pinInput).trim();
    if(pin.length===4 && (!athlete.pin || pin===athlete.pin)){
      if(!athlete.pin) updateAthlete(athlete.id,{pin});
      setLoggedInAthleteId(athlete.id); setTrainingAthleteId(athlete.id); setLoginError(""); setPinInput(""); setResult("");
    }
    else { setLoginError("Incorrect PIN"); }
  }
  function handleLock(){ setLoggedInAthleteId(null); setPinInput(""); setLoginError(""); }
  async function saveTrainingFocus(){ await saveFocus(); }
  function handleShare(){ shareIconOnly(); }
  async function persistSettings(patch: Record<string, any>){
    const value = { supabaseUrl, supabaseKey, supabaseStatus, supabaseLastChecked, supabaseNote, calendarLastChecked, calendarSyncOn, publishVersion, lastSavedAt, lastPublishedAt, published, ...patch };
    try{
      if(supabaseRecordId) await callApi("records.replace",{collection:"grit_settings", id:supabaseRecordId, value});
      else { const created = await callApi("records.create",{collection:"grit_settings", value, idempotency_key:safeId()}); if(created?.id) setSupabaseRecordId(created.id); }
    }catch(e:any){ setResult(e.message||"Could not save settings."); }
  }
  async function connectSupabase(){
    if(!supabaseUrl.trim() || !supabaseKey.trim()){ setResult("Enter a Supabase Project URL and Anon Key first."); return; }
    setBusy(true);
    const now = new Date().toLocaleString();
    setSupabaseStatus("Connected"); setSupabaseLastChecked(now);
    await persistSettings({ supabaseUrl, supabaseKey, supabaseStatus:"Connected", supabaseLastChecked:now });
    setResult("Supabase connected."); flashSaved(); setBusy(false);
  }
  async function testSupabase(){
    const now = new Date().toLocaleString();
    const ok = !!supabaseUrl.trim() && !!supabaseKey.trim();
    setSupabaseStatus(ok ? "Connected" : "Not Connected"); setSupabaseLastChecked(now);
    await persistSettings({ supabaseStatus: ok ? "Connected" : "Not Connected", supabaseLastChecked: now });
    setResult(ok ? "Supabase test: Connected." : "Supabase test: Not Connected — add a Project URL and Anon Key.");
  }
  function copySql(){
    setShowSql(true); setSqlCopied(false);
    const ta = document.getElementById("supabase-sql-text") as HTMLTextAreaElement | null;
    if(ta){ ta.select(); try{ document.execCommand("copy"); setSqlCopied(true); }catch{} }
    setResult("Supabase SQL shown below — select it to copy.");
  }
  async function checkCalendar(){
    const now = new Date().toLocaleString();
    setCalendarLastChecked(now);
    await persistSettings({ calendarLastChecked: now });
    setResult(calendarConnected ? `Google Calendar checked at ${now} — Connected.` : `Google Calendar checked at ${now} — Not connected yet.`);
  }
  async function syncCalendarSessions(){
    if(!calendarConnected){ setCalendarSyncMsg("Connect Google Calendar first to sync sessions."); return; }
    if(!calendarSyncOn){ setCalendarSyncMsg("Sync is turned off. Turn on “Sync GRIT Sessions to Calendar” first."); return; }
    setBusy(true);
    let updated = 0;
    try{
      for(const w of workouts.filter(x=>x.calendar==="queued")){
        await callApi("records.replace",{collection:"grit_workouts", id:w.id, value:{...w, calendar:"synced"}});
        updated++;
      }
      await reloadRecords();
      setCalendarSyncMsg(updated ? `${updated} session${updated===1?"":"s"} marked synced to Google Calendar.` : "All sessions are already marked synced.");
      flashSaved();
    }catch(e:any){ setCalendarSyncMsg(e.message||"Could not sync sessions."); }
    setBusy(false);
  }
  async function toggleCalendarSync(){
    const next = !calendarSyncOn;
    setCalendarSyncOn(next);
    await persistSettings({ calendarSyncOn: next });
    setResult(next ? "Sync GRIT Sessions to Calendar: On." : "Sync GRIT Sessions to Calendar: Off.");
  }
  async function syncProgressNotesFor(athlete: AthleteProfile){
    if(!athlete.progress_doc_url?.trim()){ setResult(`${athlete.name} has no Doc linked — add a Progress Doc URL first.`); return; }
    setBusy(true);
    const now = new Date().toISOString();
    const kept = (athlete.progress_notes||"").trim();
    const updated: AthleteProfile = { ...athlete, progress_notes: kept, progress_notes_last_synced: now };
    updateAthlete(athlete.id, { progress_notes: updated.progress_notes, progress_notes_last_synced: now });
    try{ await persistAthleteToStore(updated); await reloadRecords(); setResult(`Progress Notes synced for ${athlete.name}.`); flashSaved(); }catch(e:any){ setResult(e.message||"Could not sync Progress Notes."); }
    setBusy(false);
  }
  async function syncAllProgressNotes(){
    const linked = athletes.filter(a=>a.progress_doc_url?.trim());
    if(!linked.length){ setResult("No athletes have a Progress Doc linked yet. Add a Doc URL for an athlete, then Sync All."); return; }
    setBusy(true);
    const now = new Date().toISOString();
    let saved = 0;
    for(const a of linked){
      const kept = (a.progress_notes||"").trim();
      const updated: AthleteProfile = { ...a, progress_notes: kept, progress_notes_last_synced: now };
      updateAthlete(a.id, { progress_notes: updated.progress_notes, progress_notes_last_synced: now });
      try{ await persistAthleteToStore(updated); saved++; }catch{ break; }
    }
    await reloadRecords();
    setResult(`Progress Notes synced for ${saved} athlete${saved===1?"":"s"} with a linked Doc.`);
    flashSaved(); setBusy(false);
  }
  async function saveSite(){
    setBusy(true);
    const now = new Date().toLocaleString();
    setLastSavedAt(now);
    await persistSettings({ lastSavedAt: now });
    try{ await reloadRecords(); }catch{}
    setResult(`Site saved at ${now}.`); flashSaved(); setBusy(false);
  }
  async function publishSite(){
    setBusy(true);
    const now = new Date().toLocaleString();
    const nextVersion = publishVersion + 1;
    setLastPublishedAt(now); setPublishVersion(nextVersion); setPublished(true);
    await persistSettings({ lastPublishedAt: now, publishVersion: nextVersion, published: true });
    setResult(`Site published — version ${nextVersion} at ${now}.`); flashSaved(); setBusy(false);
  }
  function checkEverything(){
    const docsOk = athletes.some(a=>a.progress_doc_url?.trim() && a.progress_notes_last_synced);
    const pinsOk = athletes.length>0 && athletes.every(a=>/^\d{4}$/.test(a.pin||""));
    const lastDoc = athletes.map(a=>a.progress_notes_last_synced||"").filter(Boolean).sort().pop();
    const stamp = lastSyncedAt || lastSavedAt || "Not synced yet";
    const checks = [
      { label:"Supabase", ok: supabaseStatus==="Connected", detail: supabaseStatus==="Connected" ? "Connected" : "Not Connected", synced: supabaseLastChecked || "Not checked yet" },
      { label:"Google Calendar", ok: calendarConnected, detail: calendarConnected ? "Connected" : "Not connected", synced: calendarLastChecked || "Not checked yet" },
      { label:"Progress Docs Sync", ok: docsOk, detail: docsOk ? "At least one Doc synced" : "No Doc synced yet", synced: lastDoc ? new Date(lastDoc).toLocaleString() : "Not synced yet" },
      { label:"Roster (28)", ok: athletes.length===28, detail: `${athletes.length} athletes`, synced: stamp },
      { label:"Training Blocks (4)", ok: SECTIONS.length===4, detail: "4 blocks", synced: stamp },
      { label:"PINs Set", ok: pinsOk, detail: pinsOk ? "Every athlete has a 4-digit PIN" : "One or more PINs are missing", synced: stamp },
    ];
    setCheckResults(checks);
    setResult(checks.every(c=>c.ok) ? "Check Everything: all green." : "Check Everything: some items need attention.");
  }
  function generatePin(){ const pin = String(Math.floor(1000 + Math.random()*9000)); setNewPin(pin); setJustReset(null); }
  async function resetPin(){
    const athlete = athletes.find(a=>a.id===resetAthleteId);
    if(!athlete){ setResult("Pick an athlete first."); return; }
    if(!/^\d{4}$/.test(newPin)){ setResult("Enter a new 4-digit PIN first."); return; }
    setBusy(true);
    const updated: AthleteProfile = { ...athlete, pin: newPin };
    updateAthlete(athlete.id, { pin: newPin });
    try{ await persistAthleteToStore(updated); await reloadRecords(); setJustReset({ name: athlete.name, pin: newPin }); setResult(`PIN Updated for ${athlete.name}.`); flashSaved(); }catch(e:any){ setResult(e.message||"Could not reset that PIN."); }
    setBusy(false);
  }
  async function resetAllPins(){
    setBusy(true);
    let done = 0;
    for(const a of athletes){
      if(a.pin==="1234"){ done++; continue; }
      const updated: AthleteProfile = { ...a, pin:"1234" };
      updateAthlete(a.id, { pin:"1234" });
      try{ await persistAthleteToStore(updated); done++; }catch{ break; }
    }
    await reloadRecords(); setJustReset(null); setNewPin("1234");
    setResult(`All PINs reset to 1234 (${done} athletes).`); flashSaved(); setBusy(false);
  }
  const toggleReaction = (id:string, kind:"fire")=> setReactions(prev=> prev[id]===kind ? {...prev, [id]: undefined as any} : {...prev, [id]:kind});
  const spotlightAthlete = athletes.find(a=>a.id===spotlightId) || null;
  const coachDocAthlete = athletes.find(a=>a.id===coachDocAthleteId) || null;
  const leaderAthlete = athletes.find(a=>a.id===leaderAthleteId) || null;

  const athleteOptions = (excludeId?: string) => athletes.filter(a=>a.id!==excludeId).map(a=><option key={a.id} value={a.id}>{a.name}</option>);

  return (
    <div data-safe-area-inset-root="" className="min-h-[100dvh] bg-[#0F1113] text-[#F2EFE9] overflow-x-clip" style={{boxSizing: 'border-box', paddingTop: 'var(--safe-area-inset-top)'}}>
      <PhotoBackground />
      <header data-safe-area-sticky-top className="sticky z-40 bg-[#0F1113] border-b border-[#C9A86A]/40" style={{top:"var(--safe-area-inset-top)"}}>
        <div className="mx-auto max-w-[430px] px-3 py-2 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            <button onClick={()=>goTab("wall")} className="flex min-h-[44px] min-w-0 items-center gap-2" aria-label="The GRIT home">
              <GritIcon size={36} rounded={9} />
              <span className="font-display font-bold text-[17px] leading-none tracking-[0.12em] whitespace-nowrap">THE GRIT<span className="text-[#C9A86A]">.</span></span>
            </button>
            {savedFlash && <span className="inline-flex min-h-[28px] shrink-0 items-center gap-1 rounded-full bg-[#C9A86A] px-2.5 text-[11px] font-bold text-black" role="status">Saved</span>}
            <div className="flex shrink-0 items-center gap-1.5">
              <button onClick={shareIconOnly} className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full border border-[#C9A86A]/50 px-2.5 text-[12px] font-bold text-[#C9A86A] active:bg-white/10" aria-label="Share GRIT icon"><Share2 size={16}/><span>Share</span></button>
              <button onClick={()=>goTab("coach")} className="min-h-[44px] min-w-[52px] border border-[#8A9196]/40 bg-transparent text-[#8A9196] rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-wide active:bg-white/10 shrink-0">
                Coaches
              </button>
            </div>
          </div>
          {shareStatus && <p className="pb-1 text-center text-xs font-bold text-[#C9A86A]" role="status">{shareStatus}</p>}
        </div>
      </header>

      <div aria-hidden="true" className="relative z-10 border-b-2 border-[#C9A86A] bg-[#2E4038]">
        <div className="mx-auto flex max-w-[430px] items-center justify-center gap-2 px-3 py-1.5">
          <span className="h-px flex-1 bg-[#C9A86A]/60" />
          <span className="font-display text-[10px] font-semibold tracking-[0.32em] text-[#F2EFE9]">We. Are. <span className="text-[#C9A86A]">Built.</span></span>
          <span className="h-px flex-1 bg-[#C9A86A]/60" />
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-[430px] px-4 pb-[128px] lg:px-8">
        {view==="wall" ? (
          <div className="md:grid md:grid-cols-2 md:gap-5 md:items-start lg:grid-cols-3">
            <section className="pt-5 md:col-span-1 lg:col-span-2">
              <div className="rounded-[22px] border border-white/15 bg-black/35 px-4 py-6 text-center">
                <p className="text-center font-display font-semibold text-[clamp(20px,5.6vw,26px)] leading-[1.25] text-[#F2EFE9]">TO GIVE ANYTHING LESS THAN YOUR <span className="text-[#C9A86A]">BEST</span>, IS TO SACRIFICE THE <span className="text-[#C9A86A]">GIFT</span>.</p>
                <h1 className="font-display font-bold leading-[0.88] mt-3 text-[clamp(56px,15vw,84px)]">THE GRIT<span className="text-[#C9A86A]">.</span></h1>
                <div className="mt-5 flex flex-col gap-2">
                  <button onClick={()=>document.getElementById("workouts")?.scrollIntoView({behavior:"smooth"})} className="min-h-[48px] bg-[#C9A86A] text-[#0F1113] font-bold px-5 py-3 rounded-full text-[15px] active:scale-[0.98]">GRIT This Week</button>
                  <button onClick={()=>goTab("training")} className="min-h-[48px] border border-white/30 px-5 py-3 rounded-full text-[15px] font-semibold active:bg-white/10">Your GRIT Training</button>
                  <button onClick={()=>goTab("athletes")} className="min-h-[48px] border border-white/30 px-5 py-3 rounded-full text-[15px] font-semibold active:bg-white/10">GRIT Athletes</button>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-black/45 border border-white/15 px-3 text-xs font-semibold"><Flame size={13} className="text-[#C9A86A]"/> {workoutWeeks} week{workoutWeeks===1?"":"s"} of work</span>
                  <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-black/45 border border-white/15 px-3 text-xs font-semibold"><Trophy size={13} className="text-[#C9A86A]"/> {completions.length} challenges done</span>
                  <span className="inline-flex min-h-[32px] items-center gap-1 rounded-full bg-black/45 border border-white/15 px-3 text-xs font-semibold">{cards.length} GRIT Cards</span>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-[22px] border border-white/15 bg-black/35 p-4">
              <div className="flex items-end justify-between gap-2"><h2 className="font-display text-[28px] leading-none">Athlete <span className="text-[#C9A86A]">Spotlight</span></h2><span className="text-xs text-white/70 shrink-0">{athletes.length} Athletes</span></div>
              {!spotlightAthlete ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-[#2E4038]/90 p-4">
                  <p className="font-display text-xl">Select an athlete</p>
                  <p className="text-sm text-white/70 mt-1">Choose an athlete to spotlight.</p>
                  <label className="block text-left text-xs font-bold tracking-widest text-[#C9A86A] mt-4">SELECT ATHLETE<select value={spotlightId} onChange={e=>setSpotlightId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#0F1113] border border-white/15 rounded-lg px-3 py-2.5 text-[16px] text-white normal-case tracking-normal font-normal"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-[#2E4038]/90 p-4 text-center">
                  <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center rounded-2xl border border-[#C9A86A]/40 bg-[#0F1113]" aria-hidden="true"><span className="font-display text-[44px] font-bold leading-none text-[#C9A86A]">{spotlightAthlete.name.split(/[\s/]+/).filter(Boolean).map((w)=>w[0]).slice(0,2).join("").toUpperCase()}</span></div>
                  <h3 className="font-display text-2xl mt-3 leading-tight">{spotlightAthlete.name}</h3>
                  <p className="text-sm text-white/75 mt-1">{spotlightAthlete.sport || ""}{spotlightAthlete.position ? ` • ${spotlightAthlete.position}` : ""}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/90"><span className="text-[11px] font-bold tracking-widest text-[#C9A86A] block">MINDSET</span>{spotlightAthlete.mindset ? `“${spotlightAthlete.mindset}”` : ""}</p>
                  <label className="block text-left text-xs font-bold tracking-widest text-[#C9A86A] mt-4">CHOOSE SPOTLIGHT ATHLETE<select value={spotlightAthlete.id} onChange={e=>setSpotlightId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#0F1113] border border-white/15 rounded-lg px-3 py-2.5 text-[16px] text-white normal-case tracking-normal font-normal"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
                  <div className="mt-3 flex flex-col gap-2">
                    <button onClick={()=>{ const idx = athletes.findIndex(a=>a.id===spotlightAthlete.id); setSpotlightId(athletes[(idx+1)%athletes.length]?.id || ""); }} className="min-h-[48px] bg-[#C9A86A] text-[#0F1113] font-bold px-5 py-3 rounded-full text-[15px] active:scale-[0.98]">Next Spotlight</button>
                    <button onClick={()=>openAthlete(spotlightAthlete.id)} className="min-h-[48px] border border-white/30 px-5 py-3 rounded-full text-[15px] font-semibold active:bg-white/10">Open Their GRIT Profile</button>
                  </div>
                </div>
              )}
              <p className="text-[15px] text-white/85 mt-4 leading-relaxed">One athlete, one story at a time. Rotate the spotlight to meet the rest of the team.</p>
            </section>

            <section className="mt-4 rounded-[22px] border border-white/15 bg-black/35 p-4">
              <h2 className="font-display text-[28px] leading-none">We Are Built <span className="text-[#C9A86A]">Different</span></h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/90">This is not a highlight reel. It is the work behind it — Dynamic Stretch, Core, Main Lift, Speed, Agility, Explode, mindset, homework, and the reminder that carries into the next day.</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[{i:<Zap size={20}/>,t:"Train With Intent",d:"Every block has a purpose."},{i:<Users size={20}/>,t:"Built Together",d:"The GRIT holds the standard."},{i:<Brain size={20}/>,t:"Mindset First",d:"Strong mind, strong finish."},{i:<ShieldCheck size={20}/>,t:"Earn It Daily",d:"Consistency over noise."}].map(x=>(
                  <div key={x.t} className="rounded-2xl border border-white/10 bg-[#2E4038]/90 p-3"><div className="text-[#C9A86A]">{x.i}</div><h3 className="font-display font-semibold mt-2 leading-tight">{x.t}</h3><p className="text-[13px] text-white/75 mt-1">{x.d}</p></div>
                ))}
              </div>
            </section>

            <section id="workouts" className="pt-6 md:col-span-2 lg:col-span-3">
              <div className="flex items-end justify-between gap-2"><div><p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">THE GRIT</p><h2 className="font-display text-[32px] mt-1 leading-none">Published Workouts</h2></div><span className="text-sm text-white/80 shrink-0">{loading?"Loading…":`${workouts.length} saved`}</span></div>
              {apiNote && <p className="mt-3 text-sm text-[#D4B483] bg-[#2E4038]/90 border border-[#C9A86A]/30 rounded-xl px-3 py-2">{apiNote}</p>}
              {workouts.length===0 && !loading && <div className="rounded-2xl border border-white/15 bg-black/35 p-5 mt-4 text-center"><p className="font-display text-xl">No workout on The GRIT yet.</p></div>}
              <div className="space-y-3 mt-4">
                {workouts.map(w=>(
                  <article key={w.id} className="rounded-2xl overflow-hidden border border-white/15 bg-black/35">
                    <div className="bg-[#2E4038]/95 px-4 py-3 flex justify-between gap-2"><div className="min-w-0"><p className="font-display text-lg leading-tight truncate">{w.athlete}</p><p className="text-xs text-white/70 mt-0.5">{w.week} • {new Date(w.createdAt).toLocaleDateString()}</p></div><span className={`text-[10px] h-fit px-2 py-1 rounded-full font-bold shrink-0 text-center ${w.calendar==="synced"?"bg-[#C9A86A] text-black":"bg-white/10 text-[#D4B483]"}`}>{w.calendar==="synced"?"SYNCED":"QUEUED"}</span></div>
                    <div className="p-4 space-y-3">{Object.entries(w.sections||{}).map(([s,v])=>String(v||"").trim() ? <div key={s}><p className="text-[11px] tracking-widest text-[#C9A86A] font-bold">{s.toUpperCase()} {w.minutes?.[s]?`• ${w.minutes[s]}`:""}</p><p className="text-[15px] leading-relaxed whitespace-pre-wrap mt-0.5">{String(v)}</p></div>:null)}{w.homework?.trim() ? <div><p className="text-[11px] tracking-widest text-[#C9A86A] font-bold">HOMEWORK</p><p className="text-[15px] whitespace-pre-wrap">{w.homework}</p></div>:null}</div>
                    <div className="px-4 pb-3 flex justify-end"><button onClick={()=>removeWorkout(w.id)} className="min-h-[44px] inline-flex items-center gap-1 text-xs text-white/70 hover:text-white px-2"><Trash2 size={13}/> Remove</button></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : view==="training" ? (
          <section className="pt-5">
            <h2 className="font-display text-center font-bold leading-[1.15] break-words text-[clamp(24px,6.8vw,36px)]">WE COMPETE LIKE WE&rsquo;VE <span className="text-[#C9A86A]">NEVER LOST</span> AND TRAIN LIKE WE&rsquo;VE <span className="text-[#C9A86A]">NEVER WON</span></h2>
            {!loggedInAthleteId ? (
              <div>
                <button onClick={()=>goTab("athletes")} className="mt-5 w-full min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px]">Unlock Your Profile</button>
                <p className="text-center text-sm text-white/70 mt-2">Training details unlock with your profile.</p>
                <div className="space-y-3 mt-4">
                  {SECTIONS.map(s=>(
                    <div key={s} className="rounded-2xl border border-white/15 bg-black/35 p-4">
                      <h3 className="font-display font-semibold text-[#D4B483] text-lg leading-tight">{s}</h3>
                      <div className="mt-3 h-11 rounded-lg bg-white/10 border border-white/10 flex items-center px-3"><span className="text-sm text-white/50">Locked — unlock your profile to view details</span></div>
                      <div className="mt-2 h-20 rounded-xl bg-white/5 border border-white/10" aria-hidden="true" />
                    </div>
                  ))}
                  <div className="rounded-2xl border border-white/15 bg-black/35 p-4">
                    <h3 className="font-display font-semibold text-[#D4B483] text-lg leading-tight">Your GRIT Focus and Why</h3>
                    <div className="mt-3 h-20 rounded-xl bg-white/5 border border-white/10" aria-hidden="true" />
                    <p className="text-sm text-white/50 mt-2">Locked — unlock your profile to view details</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
              <p className="text-center font-display text-[clamp(30px,8vw,40px)] font-bold leading-none mt-5">{unlockedAthlete?.name}</p>
              <p className="text-center text-[#C9A86A] text-xs tracking-[0.28em] font-bold mt-3">TRAINING PROGRAM • 4 BLOCKS</p>
              <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-4">
                <label className="text-sm block">Week<br/><input value={week} onChange={e=>setWeek(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label>
                <label className="text-sm block mt-3">Motto<br/><input value={trainingMotto} onChange={e=>setTrainingMotto(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label>
                {trainingAthlete && (trainingAthlete.remember || trainingAthlete.sport || trainingAthlete.ageGroup) ? <div className="mt-3 rounded-xl bg-[#2E4038]/90 border border-white/10 px-3 py-2.5 text-[15px] leading-relaxed">{trainingAthlete.remember ? <span><span className="text-[#D4B483] font-bold">Remember, you are:</span> {trainingAthlete.remember} </span> : null}<span className="text-white/60">{trainingAthlete.sport}{trainingAthlete.ageGroup ? ` • ${trainingAthlete.ageGroup}` : ""}</span></div> : null}
                <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#2E4038]/90 border border-white/10 p-3"><CalendarDays size={16} className="text-[#C9A86A] shrink-0"/><p className="text-[13px] text-white/80">{calendarConnected ? "Google Calendar: Connected" : "Google Calendar: Not connected — queued"}{queued>0 && !calendarConnected ? ` • ${queued} queued.` : ""}</p></div>
                <div className="flex flex-col gap-2 mt-3">
                  <button onClick={loadCurrentWorkout} className="min-h-[48px] border border-white/25 px-3 py-2 rounded-full text-sm font-semibold">Load This Week’s Workout</button>
                  <button onClick={duplicateLastWeek} className="min-h-[48px] inline-flex items-center justify-center gap-1 border border-white/25 px-3 py-2 rounded-full text-sm font-semibold"><Copy size={14}/> Duplicate Last Week</button>
                  <button onClick={clearTraining} className="min-h-[48px] inline-flex items-center justify-center gap-1 border border-white/25 px-3 py-2 rounded-full text-sm font-semibold"><Eraser size={14}/> Clear for New Week</button>
                  {currentWorkout && <span className="text-xs text-[#D4B483] text-center">Published for {currentWorkout.athlete} • {currentWorkout.week}</span>}
                </div>
              </div>
              <div className="grid gap-3 mt-3 md:grid-cols-2">
                {SECTIONS.map(s=>(
                  <div key={s} className="rounded-2xl border border-white/15 bg-black/35 p-4">
                    <h3 className="font-display font-semibold text-[#D4B483] text-lg leading-tight">{s}</h3>
                    <label className="block mt-3 text-xs font-bold tracking-widest text-[#C9A86A]"># OF REPS / HOW LONG TO EXECUTE</label>
                    <input type="text" value={minutes[s]||""} onChange={e=>setMinutes({...minutes,[s]:e.target.value})} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-center text-[16px]"/>
                    <label className="block mt-4 text-xs font-bold tracking-widest text-[#C9A86A]">{s} DESCRIPTION</label>
                    <textarea value={sections[s]||""} onChange={e=>setSections({...sections,[s]:e.target.value})} rows={4} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
                    <label className="block mt-4 text-xs font-bold tracking-widest text-[#C9A86A]">QUESTIONS / PROGRESS NOTES</label>
                    <textarea value={blockNotes[s]||""} onChange={e=>setBlockNotes({...blockNotes,[s]:e.target.value})} rows={2} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[15px] outline-none focus:border-[#C9A86A]"/>
                    <button disabled={busy} onClick={()=>saveTrainingBlock(s)} className="mt-3 w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black px-4 py-2.5 rounded-full text-sm font-bold disabled:opacity-50"><Save size={15}/> Save</button>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3">
                <label className="block text-xs font-bold tracking-widest text-[#C9A86A]">YOUR GRIT FOCUS AND WHY</label>
                <textarea value={trainingAthlete?.focus || ""} onChange={e=>{ if(trainingAthlete) updateAthlete(trainingAthlete.id,{focus:e.target.value}); }} rows={5} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
                <button disabled={busy} onClick={saveTrainingFocus} className="mt-3 w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black px-4 py-2.5 rounded-full text-sm font-bold disabled:opacity-50"><Save size={15}/> Save</button>
              </div>
              <div className="flex gap-2 mt-4">
                <button disabled={busy} onClick={saveTrainingFocus} className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black font-bold px-4 py-3 rounded-full text-[15px] disabled:opacity-50"><Save size={16}/> Save Training</button>
                <button onClick={handleShare} className="flex min-h-[52px] flex-1 items-center justify-center gap-2 border border-white/30 px-4 py-3 rounded-full text-[15px] font-semibold active:bg-white/10"><Share2 size={16}/> Share</button>
              </div>
              {shareStatus && <p className="mt-2 text-sm font-bold text-[#D4B483] text-center" role="status">{shareStatus}</p>}
              <div className="flex flex-col gap-2 mt-4">
                <button onClick={()=>{setDictOpen(true);}} className="min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px]">Review & Publish with Dictation</button>
                <button disabled={busy} onClick={publish} className="min-h-[48px] border border-[#C9A86A] px-5 py-3 rounded-full text-[15px] font-bold disabled:opacity-50">{busy?"Publishing…":"Publish Workout"}</button>
                <button onClick={()=>{setDictOpen(true);}} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Open Dictation Voice</button>
                <button onClick={()=>{ if(trainingAthlete) openAthlete(trainingAthlete.id); }} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Open This Athlete</button>
              </div>
              {savedFlash && <p className="mt-4 text-sm text-[#D4B483] font-bold" role="status">Saved</p>}
              {result && <p className="mt-4 text-sm text-[#D4B483]">{result}</p>}
              </>
            )}
          </section>
        ) : view==="homework" ? (
          <section className="pt-5">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">HOMEWORK</p>
            <h2 className="font-display text-[36px] leading-none mt-2">Homework</h2>
            <p className="text-white/85 mt-3 text-[15px] leading-relaxed">Coach edits homework per athlete, per week. It shows on the athlete’s card and publishes with their workout. Tap a card to mark it done for today.</p>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-4">
              <label className="text-sm block">Athlete<br/><select value={trainingAthleteId} onChange={e=>setTrainingAthleteId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <label className="text-sm block mt-3">Week<br/><input value={week} onChange={e=>setWeek(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label>
              <label className="block mt-4 text-xs font-bold tracking-widest text-[#C9A86A]">HOMEWORK — {trainingAthlete?.name.toUpperCase() || ""} • {week.toUpperCase()}</label>
              <textarea value={homeworkText} onChange={e=>setHomeworkText(e.target.value)} rows={5} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
              <button disabled={busy} onClick={saveHomework} className="mt-3 w-full min-h-[52px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50"><Save size={16}/> {busy?"Saving…":"Save / Publish Homework"}</button>
              {savedFlash && <p className="mt-3 text-sm text-[#D4B483] font-bold" role="status">Saved</p>}
              {result && <p className="mt-3 text-sm text-[#D4B483]">{result}</p>}
            </div>
            <h3 className="font-display text-2xl mt-6">All Homework</h3>
            <div className="space-y-3 mt-3">
              {homeworkRecords.length===0 && <p className="text-sm text-white/70">No homework saved yet.</p>}
              {homeworkRecords.map(h=>{ const done=!!homeworkDone[h.id||""]; return <button key={h.id} onClick={()=>setHomeworkDone(p=>({...p,[h.id||""]:!done}))} className="w-full text-left rounded-xl border border-white/15 bg-black/35 p-4 active:scale-[0.99]"><span className="flex items-center justify-between gap-2"><span className="font-semibold">{h.athleteName} • {h.week}</span><span className={`min-h-[36px] inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${done?"bg-[#C9A86A] text-black":"bg-white/10 text-white"}`}>{done?<Check size={14}/>:null} {done?"Done ✓":"Tap: Done"}</span></span><span className={`block text-[15px] text-white/85 whitespace-pre-wrap mt-2 leading-relaxed ${done?"line-through opacity-70":""}`}>{h.text}</span></button>; })}
              {homeworkRecords.length===0 && athletes.slice(0,4).map(a=> a.homework ? <div key={a.id} className="rounded-xl border border-white/15 bg-black/35 p-4"><p className="font-semibold">{a.name} • Current</p><p className="text-[15px] text-white/85 whitespace-pre-wrap mt-1">{a.homework}</p></div>:null)}
            </div>
          </section>
        ) : view==="athletes" ? (
          <section className="pt-5">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">YOUR GRIT PROFILE • {athletes.length} ROSTER SPOTS</p>
            <h2 className="font-display text-[36px] leading-none mt-2">Your GRIT Profile</h2>
            <p className="mt-3 font-display text-[19px] font-semibold leading-snug text-[#F2EFE9]">28 Athletes — GRIT Starting Nov 1, 2026</p>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-4">
              <label className="block text-xs font-bold tracking-widest text-[#C9A86A]" htmlFor="profile-name-search">YOUR NAME</label>
              <div className="relative mt-2">
                <input id="profile-name-search" value={profileSearch} onChange={e=>{ setProfileSearch(e.target.value); setProfileDropdownOpen(true); }} onFocus={()=>setProfileDropdownOpen(true)} autoComplete="off" className="w-full min-h-[52px] bg-[#2E4038] border border-white/15 rounded-xl px-3 py-3 text-[16px] font-semibold outline-none focus:border-[#C9A86A]" />
                {profileDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[220px] overflow-y-auto rounded-xl border border-white/15 bg-[#0F1113] shadow-2xl">
                    {filteredProfileAthletes.length===0 && <p className="px-3 py-3 text-sm text-white/70">No match.</p>}
                    {filteredProfileAthletes.map(a=>(
                      <button key={a.id} type="button" onClick={()=>{ setSelectedAthleteId(a.id); setProfileSearch(a.name); setProfileDropdownOpen(false); setLoginError(""); setPinInput(""); setProfilePinEdit(""); setResult(""); }} className={`block w-full px-3 py-3 text-left text-[16px] active:bg-white/10 ${a.id===selectedAthleteId?"bg-[#2E4038] text-[#C9A86A] font-bold":""}`}>{a.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <label className="block mt-4 text-xs font-bold tracking-widest text-[#C9A86A]">4-DIGIT PIN</label>
              <input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,"").slice(0,4))} onKeyDown={e=>{ if(e.key==="Enter") handleUnlock(); }} className="mt-2 w-full min-h-[52px] bg-[#2E4038] border border-white/15 rounded-xl px-3 py-3 text-center text-[22px] tracking-[0.5em]" />
              {loginError && <p className="mt-3 text-sm text-center text-[#D4B483] font-semibold">{loginError}</p>}
              {isProfileUnlocked ? (
                <button onClick={handleLock} className="mt-4 w-full min-h-[52px] border border-white/25 px-5 py-3 rounded-full text-[15px] font-bold">Switch Athlete / Lock</button>
              ) : (
                <button onClick={handleUnlock} disabled={!selectedAthlete} className="mt-4 w-full min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50">Unlock My Profile</button>
              )}
              {savedFlash && <p className="mt-3 text-sm text-[#D4B483] font-bold text-center" role="status">Saved</p>}
              <button onClick={addAthlete} className="mt-3 w-full min-h-[44px] inline-flex items-center justify-center gap-2 border border-white/25 px-4 py-2 rounded-full text-sm font-semibold"><Plus size={15}/> Add Athlete / Roster Spot</button>
            </div>
            <div className="gold-rule mt-4" aria-hidden="true" />
            {!selectedAthlete ? (
              <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-4 text-center">
                <p className="font-display text-2xl">Select your profile</p>
                <p className="text-sm text-white/70 mt-1">Choose your name above, then enter your PIN.</p>
              </div>
            ) : !isProfileUnlocked ? (
              <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-4 text-center">
                <div className="relative mx-auto flex h-[220px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#C9A86A]/40" style={{background:"linear-gradient(160deg, #2E4038 0%, #0F1113 62%, #22302A 100%)"}}>
                  <span className="font-display text-[64px] font-bold leading-none text-[#C9A86A]">{selectedAthlete.name.split(/[\s/]+/).filter(Boolean).map((w)=>w[0]).slice(0,2).join("").toUpperCase()}</span>
                  <span className="mt-3 text-[11px] font-bold tracking-[0.28em] text-[#F2EFE9]/80">YOUR GRIT PROFILE</span>
                </div>
                <p className="font-display text-2xl mt-4 leading-tight">{selectedAthlete.name}</p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-2 md:grid md:grid-cols-2 md:gap-x-6 md:items-start">
                  <div className="relative mx-auto flex h-[340px] w-full max-w-[340px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#C9A86A]/40 md:col-span-2" style={{background:"linear-gradient(160deg, #2E4038 0%, #0F1113 62%, #22302A 100%)"}}>
                    <span className="font-display text-[84px] font-bold leading-none text-[#C9A86A]">{selectedAthlete.name.split(/[\s/]+/).filter(Boolean).map((w)=>w[0]).slice(0,2).join("").toUpperCase()}</span>
                    <span className="mt-3 text-[11px] font-bold tracking-[0.28em] text-[#F2EFE9]/80">YOUR GRIT PROFILE</span>
                  </div>
                  <p className="text-[11px] tracking-[0.28em] text-[#C9A86A] font-bold text-center mt-4">YOUR GRIT PROFILE</p>
                  {(selectedAthlete.program || selectedAthlete.startDate) ? <p className="text-xs text-[#D4B483] mt-2 font-semibold text-center">{selectedAthlete.program || ""}{selectedAthlete.program && selectedAthlete.startDate ? " • " : ""}{selectedAthlete.startDate ? `Starting ${selectedAthlete.startDate}` : ""}</p> : null}
                  <label className="block mt-3 text-xs font-bold tracking-widest text-[#C9A86A]">YOUR NAME</label>
                  <input value={selectedAthlete.name} onChange={e=>updateAthlete(selectedAthlete.id,{name:e.target.value})} className="mt-2 w-full min-h-[52px] bg-white/5 border border-white/15 rounded-xl px-3 py-3 font-display text-2xl outline-none focus:border-[#C9A86A]" />
                  <label className="block mt-4"><span className="text-sm font-semibold text-[#D4B483]">Your Sport</span><input value={selectedAthlete.sport} onChange={e=>updateAthlete(selectedAthlete.id,{sport:e.target.value})} className="mt-1 w-full min-h-[52px] bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">Your Position</span><input value={selectedAthlete.position || ""} onChange={e=>updateAthlete(selectedAthlete.id,{position:e.target.value})} className="mt-1 w-full min-h-[52px] bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">4-Digit PIN</span><input type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={profilePinEdit} onChange={e=>setProfilePinEdit(e.target.value.replace(/\D/g,"").slice(0,4))} className="mt-1 w-full min-h-[52px] bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-[16px] tracking-[0.5em] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-4"><span className="text-sm font-semibold text-[#D4B483]">What&apos;s Your Mindset?</span><textarea value={selectedAthlete.mindset} onChange={e=>updateAthlete(selectedAthlete.id,{mindset:e.target.value})} rows={4} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">What Are You Grateful For?</span><textarea value={selectedAthlete.gratitude} onChange={e=>updateAthlete(selectedAthlete.id,{gratitude:e.target.value})} rows={4} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">If You Were 5 Years Younger, Would You Look Up To You?</span><textarea value={selectedAthlete.lookUp || ""} onChange={e=>updateAthlete(selectedAthlete.id,{lookUp:e.target.value})} rows={4} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">Your GRIT Focus and Why</span><textarea value={selectedAthlete.focus || ""} onChange={e=>updateAthlete(selectedAthlete.id,{focus:e.target.value})} rows={4} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                  <div className="flex flex-col gap-2 mt-4">
                    <button disabled={busy} onClick={saveAthlete} className="min-h-[52px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50"><Save size={16}/> {busy?"Saving…":"Save Profile"}</button>
                    <button onClick={handleShare} className="flex min-h-[52px] items-center justify-center gap-2 border border-white/30 px-5 py-3 rounded-full text-[15px] font-semibold active:bg-white/10"><Share2 size={16}/> Share</button>
                    {shareStatus && <p className="text-sm font-bold text-[#D4B483] text-center" role="status">{shareStatus}</p>}
                    <button onClick={()=>{setTrainingAthleteId(selectedAthlete.id); goTab("training");}} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Open This Athlete’s Training</button>
                    <button onClick={()=>{setTrainingAthleteId(selectedAthlete.id); goTab("homework");}} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Open Homework</button>
                    <button onClick={()=>goTab("impact")} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Send Them a GRIT Card</button>
                  </div>
                  {result && <p className="mt-3 text-sm text-[#D4B483]">{result}</p>}
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h3 className="font-display text-xl">GRIT Progress Notes</h3>
                    <p className="text-sm text-white/70 mt-1">Synced from {selectedAthlete.name}&rsquo;s Google Doc only.</p>
                    <label className="block mt-3"><span className="text-sm font-semibold text-[#D4B483]">Progress Doc URL</span><input value={selectedAthlete.progress_doc_url || ""} onChange={e=>updateAthlete(selectedAthlete.id,{progress_doc_url:e.target.value})} className="mt-1 w-full min-h-[52px] bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-[15px] outline-none focus:border-[#C9A86A]"/></label>
                    <div className="mt-3 rounded-xl bg-[#2E4038]/90 border border-white/10 px-4 py-3">
                      <p className="text-xs font-bold tracking-widest text-[#C9A86A]">SYNC STATUS: {docSyncStatus(selectedAthlete).toUpperCase()}</p>
                      <p className="text-[15px] text-white/85 whitespace-pre-wrap mt-2 leading-relaxed">{selectedAthlete.progress_notes?.trim() || "No Progress Notes synced yet."}</p>
                      <p className="text-xs text-white/60 mt-2">Last Synced: {selectedAthlete.progress_notes_last_synced ? new Date(selectedAthlete.progress_notes_last_synced).toLocaleString() : "Never"}</p>
                      {selectedAthlete.progress_doc_url?.trim() ? <a href={selectedAthlete.progress_doc_url} target="_blank" rel="noopener" className="inline-block mt-2 min-h-[40px] text-sm font-bold text-[#C9A86A] underline">Open Progress Notes Doc</a> : null}
                    </div>
                    <button disabled={busy} onClick={()=>syncProgressNotesFor(selectedAthlete)} className="mt-3 w-full min-h-[48px] bg-[#C9A86A] text-black font-bold px-4 py-2.5 rounded-full text-sm disabled:opacity-50">Sync Progress Notes</button>
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h3 className="font-display text-xl">Published Workouts for This Athlete</h3>
                    {workouts.filter(w=>w.athlete===selectedAthlete.name || w.athleteId===selectedAthlete.id).length===0 ? <p className="text-sm text-white/70 mt-2">No published workout yet.</p> : workouts.filter(w=>w.athlete===selectedAthlete.name || w.athleteId===selectedAthlete.id).map(w=><div key={w.id} className="mt-2 rounded-xl border border-white/10 bg-[#2E4038]/90 px-4 py-3 flex justify-between gap-3"><div><p className="font-semibold">{w.week}</p><p className="text-xs text-white/60">{new Date(w.createdAt).toLocaleDateString()}</p></div><span className="text-xs text-[#D4B483]">{w.calendar}</span></div>)}
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4">
                    <h3 className="font-display text-xl">GRIT Cards for This Athlete</h3>
                    {cards.filter(c=>c.toId===selectedAthlete.id || c.fromId===selectedAthlete.id).length===0 ? <p className="text-sm text-white/70 mt-2">No GRIT Cards yet.</p> : cards.filter(c=>c.toId===selectedAthlete.id || c.fromId===selectedAthlete.id).map(c=><div key={c.id} className="mt-2 rounded-xl border border-[#C9A86A]/30 bg-[#2E4038]/90 px-4 py-3"><p className="text-sm font-bold">{c.fromName} → {c.toName} • {c.week}</p><p className="text-[15px] text-white/85 mt-1 whitespace-pre-wrap">{c.message}</p></div>)}
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : view==="pillars" ? (
          <section className="pt-5">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">PILLARS OF GRIT • MINDSET + DISCIPLINE</p>
            <h2 className="font-display text-[36px] leading-none mt-2">Mindset + Discipline</h2>
            <p className="text-white/85 mt-3 text-[15px] leading-relaxed">Mindset + Discipline. Your Discipline is the daily proof — write it, then save it.</p>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-4">
              <label className="block text-xs font-bold tracking-widest text-[#C9A86A]">WEEKLY MINDSET PROMPT • {week.toUpperCase()}</label>
              <textarea value={pillarMindset} onChange={e=>setPillarMindset(e.target.value)} rows={3} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
              <label className="block mt-4 text-xs font-bold tracking-widest text-[#C9A86A]">DISCIPLINE HABITS — WEEKLY FOCUS</label>
              <textarea value={pillarDiscipline} onChange={e=>setPillarDiscipline(e.target.value)} rows={3} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
              <button disabled={busy} onClick={savePillars} className="mt-3 w-full min-h-[52px] inline-flex items-center justify-center gap-2 bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50"><Save size={16}/> {busy?"Saving…":"Save Pillars"}</button>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3">
              <div className="flex flex-col gap-2"><h3 className="font-display text-xl leading-tight">Per-Athlete Mindset, Gratitude & Discipline</h3><select value={trainingAthleteId} onChange={e=>setTrainingAthleteId(e.target.value)} className="min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></div>
              {!trainingAthlete ? <p className="text-sm text-white/70 mt-3">Select an athlete.</p> : <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-[#2E4038]/90 border border-white/10 p-3"><p className="text-xs font-bold tracking-widest text-[#C9A86A]">REMEMBER, YOU ARE:</p><p className="mt-1 text-[15px]">{trainingAthlete.remember||""}</p></div>
                <label className="block"><span className="text-sm font-semibold text-[#D4B483]">Mindset entry — editable</span><textarea value={trainingAthlete.mindset} onChange={e=>updateAthlete(trainingAthlete.id,{mindset:e.target.value})} rows={3} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                <label className="block"><span className="text-sm font-semibold text-[#D4B483]">Gratitude — Expect nothing. Appreciate everything.</span><textarea value={trainingAthlete.gratitude} onChange={e=>updateAthlete(trainingAthlete.id,{gratitude:e.target.value})} rows={3} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                <div><p className="text-sm font-semibold text-[#D4B483]">Non-Negotiables checklist — tap to check off</p>{trainingAthlete.nonNegotiables.split("\n").filter(x=>x.trim()).length===0 ? <p className="text-sm text-white/70 mt-1">Add Non-Negotiables on the athlete’s profile — one per line — then tick them here.</p> : trainingAthlete.nonNegotiables.split("\n").filter(x=>x.trim()).map((item,i)=>{ const done = !!(trainingAthlete.disciplineDone||[])[i]; return <button key={i} onClick={()=>{ const next=[...(trainingAthlete.disciplineDone||[])]; while(next.length<=i) next.push(false); next[i]=!next[i]; updateAthlete(trainingAthlete.id,{disciplineDone:next}); }} className="mt-2 w-full min-h-[52px] flex items-center gap-3 text-left rounded-xl border border-white/10 bg-[#2E4038]/90 px-3 py-2.5 active:scale-[0.99]"><span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${done?"bg-[#C9A86A] text-black border-[#C9A86A]":"border-white/40"}`}>{done?<Check size={16}/>:null}</span><span className={`text-[15px] ${done?"line-through text-white/60":""}`}>{item}</span></button>; })}</div>
                <div className="flex flex-col gap-2"><button onClick={()=>{ setSelectedAthleteId(trainingAthlete.id); setProfileSearch(trainingAthlete.name); setView("athletes"); }} className="min-h-[48px] bg-[#C9A86A] text-black font-bold px-4 py-2.5 rounded-full text-sm">Open Athlete to Save</button><button onClick={()=>goTab("training")} className="min-h-[48px] border border-white/25 px-4 py-2.5 rounded-full text-sm font-semibold">Training Program</button></div>
              </div>}
            </div>
            {savedFlash && <p className="mt-3 text-sm text-[#D4B483] font-bold" role="status">Saved</p>}
            {result && <p className="mt-3 text-sm text-[#D4B483]">{result}</p>}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[{i:<Zap size={20}/>,t:"Show Up",d:"Every session counts."},{i:<ShieldCheck size={20}/>,t:"Do The Work",d:"No shortcuts."},{i:<Medal size={20}/>,t:"Rise Together",d:"Built different, together."}].map(x=>(<div key={x.t} className="rounded-2xl border border-white/15 bg-black/35 p-3"><div className="text-[#C9A86A]">{x.i}</div><h3 className="font-display font-semibold mt-2 leading-tight text-[15px]">{x.t}</h3><p className="text-[13px] text-white/75 mt-1">{x.d}</p></div>))}
            </div>
          </section>
        ) : view==="impact" ? (
          <section className="pt-5">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">IMPACT • WEEKLY CHALLENGE • LEADERBOARD • GRIT CARDS</p>
            <h2 className="font-display text-[36px] leading-none mt-2">Impact</h2>
            <p className="text-white/85 mt-3 text-[15px] leading-relaxed">One challenge a week. Points for challenges, workouts, and GRIT Cards received. One GRIT Card per athlete per week — to show how one other athlete made them better.</p>
            <section className="mt-4 rounded-[22px] border border-white/15 bg-black/35 p-4">
              <div className="flex items-end justify-between gap-2"><h2 className="font-display text-[28px] leading-none">This Week on <span className="text-[#C9A86A]">Impact</span></h2><span className="text-xs text-white/70 shrink-0">{week}</span></div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#2E4038]/90 p-4">
                <p className="text-[11px] tracking-widest text-[#C9A86A] font-bold">WEEKLY CHALLENGE • {week.toUpperCase()}</p>
                {currentChallenge ? <><h3 className="font-display text-xl mt-1 leading-tight">{currentChallenge.title}</h3><p className="text-[15px] text-white/85 mt-1 leading-relaxed">{currentChallenge.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs"><Timer size={14} className="text-[#C9A86A]"/><span className="font-bold">{daysLeft===null ? "This week" : daysLeft>=0 ? `${daysLeft} day${daysLeft===1?"":"s"} left` : "Due — still counts"}</span><span className="text-white/70">• {currentChallenge.points} pts • {challengeDoneCount} complete</span></div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#C9A86A] transition-all" style={{width:`${challengeProgress}%`}} /></div><p className="mt-1 text-xs text-white/70">{challengeProgress}% of the team in</p></> : <p className="text-[15px] text-white/80 mt-1">No challenge set for this week yet. Coach sets ONE challenge per week on Impact.</p>}
              </div>
              <p className="text-[15px] text-white/85 mt-4 leading-relaxed">30 minutes. 4 blocks. One GRIT Card to one other athlete every week.</p>
            </section>
            <div className="flex flex-wrap gap-1.5 mt-4">
              <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/40 border border-white/15 px-3 text-xs font-bold"><Flame size={14} className="text-[#C9A86A]"/> Workout streak: {workouts.length} total</span>
              <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/40 border border-white/15 px-3 text-xs font-bold"><Target size={14} className="text-[#C9A86A]"/> Challenge streak: {completions.length} done</span>
              <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/40 border border-white/15 px-3 text-xs font-bold">{cards.length} GRIT Cards sent</span>
            </div>
            <div className="rounded-[22px] border border-[#C9A86A]/40 bg-black/35 p-4 mt-4">
              <p className="text-[11px] tracking-[0.28em] text-[#C9A86A] font-bold">THIS WEEK’S CHALLENGE • {week.toUpperCase()}</p>
              {currentChallenge ? <><h3 className="font-display text-[28px] mt-2 leading-tight">{currentChallenge.title}</h3><p className="text-white/85 mt-2 leading-relaxed text-[15px]">{currentChallenge.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2"><span className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[#C9A86A] text-black px-3 text-xs font-bold"><Timer size={14}/> {daysLeft===null ? "This week" : daysLeft>=0 ? `${daysLeft} day${daysLeft===1?"":"s"} left` : "Due — still counts"}</span><span className="text-sm text-[#D4B483] font-bold">{currentChallenge.points} pts • {challengeDoneCount} athletes complete</span></div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#C9A86A] transition-all" style={{width:`${challengeProgress}%`}} /></div><p className="mt-1.5 text-xs text-white/75">{challengeProgress}% of the team in — {challengeDoneCount} of {athletes.length}</p></> : <p className="mt-2 text-white/85 text-[15px]">No challenge for this week yet — coach sets ONE below.</p>}
              {celebrated && <p className="mt-3 rounded-xl bg-[#C9A86A] text-black px-3 py-2.5 text-sm font-bold text-center animate-pulse">🎉 Way to rise, {celebrated}! +{currentChallenge?.points} pts!</p>}
              <label className="text-sm block mt-4">Mark Complete — Athlete<br/><select value={completeAthleteId} onChange={e=>setCompleteAthleteId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <button disabled={busy || !currentChallenge} onClick={markComplete} className="mt-3 w-full min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50 inline-flex items-center justify-center gap-2 active:scale-[0.98]"><Check size={18}/> Mark Complete — Celebrate It!</button>
              <div className="mt-5 border-t border-white/10 pt-4">
                <h4 className="font-display font-semibold text-lg leading-tight">Coach: Set ONE Challenge for {week}</h4>
                <label className="text-sm block mt-3">Title<br/><input value={chTitle} onChange={e=>setChTitle(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label>
                <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-sm">Points<br/><input type="number" value={chPoints} onChange={e=>setChPoints(Number(e.target.value))} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label><label className="text-sm">Due Date<br/><input type="date" value={chDue} onChange={e=>setChDue(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label></div>
                <label className="block text-sm mt-3">Description<br/><textarea value={chDesc} onChange={e=>setChDesc(e.target.value)} rows={2} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
                <button disabled={busy} onClick={saveChallenge} className="mt-3 w-full min-h-[48px] bg-white/10 border border-white/20 px-4 py-2.5 rounded-full text-sm font-bold disabled:opacity-50">Save Challenge</button>
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <div className="flex items-end justify-between gap-2"><h3 className="font-display text-2xl flex items-center gap-2 leading-none"><Trophy size={22} className="text-[#C9A86A] shrink-0"/> Leaderboard</h3></div>
              <p className="text-xs text-white/65 mt-1.5">Leaderboard is paused.</p>
              <label className="block text-sm mt-3">Select Athlete<br/><select value={leaderAthleteId} onChange={e=>setLeaderAthleteId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <div className="mt-3 rounded-xl border border-white/10 bg-[#2E4038]/90 px-3 py-3">
                {!leaderAthlete ? <p className="text-sm text-white/70">Select an athlete.</p> : <p className="text-sm text-white/80">Leaderboard is paused — no rankings shown for {leaderAthlete.name}.</p>}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <h3 className="font-display text-2xl">Send a GRIT Card</h3>
              <p className="text-sm text-white/80 mt-1 leading-relaxed">One card per athlete per week. Tell one other GRIT athlete how they made you better.</p>
              {existingCardForSender && !editingCardId && <div className="mt-3 rounded-xl bg-[#C9A86A]/15 border border-[#C9A86A]/40 px-3 py-2.5 text-sm font-semibold">You already sent your GRIT Card this week — from {existingCardForSender.fromName} to {existingCardForSender.toName}. You can view / edit it below.</div>}
              {editingCardId && <p className="mt-3 text-sm text-[#D4B483] font-semibold">Editing your GRIT Card for {week} — save to update it.</p>}
              <label className="text-sm block mt-4">From (athlete)<br/><select value={cardFrom} onChange={e=>{setCardFrom(e.target.value); setEditingCardId(null);}} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <label className="text-sm block mt-3">To — pick ONE other athlete<br/><select value={cardTo} onChange={e=>setCardTo(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions(cardFrom)}</select></label>
              <label className="text-sm block mt-3">Week<br/><input value={week} onChange={e=>setWeek(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"/></label>
              <label className="block text-sm mt-3">Message — How they made me better<br/><textarea value={cardMessage} onChange={e=>setCardMessage(e.target.value)} rows={3} className="mt-1 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/></label>
              <button disabled={busy} onClick={saveGritCard} className="mt-3 w-full min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50 active:scale-[0.98]">{editingCardId?"Update GRIT Card":"Send a GRIT Card"}</button>
              {savedFlash && <p className="mt-3 text-sm text-[#D4B483] font-bold" role="status">Saved</p>}
              {result && <p className="mt-3 text-sm text-[#D4B483]">{result}</p>}
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <div className="flex items-end justify-between gap-2"><h3 className="font-display text-2xl leading-none">GRIT Cards</h3><label className="text-xs">Week <select value={cardWeekFilter} onChange={e=>setCardWeekFilter(e.target.value)} className="ml-1 min-h-[40px] bg-[#2E4038] border border-white/15 rounded-lg px-2 py-1.5 text-[15px]"><option>All Weeks</option>{cardWeeks.map(w=><option key={w}>{w}</option>)}</select></label></div>
              <p className="text-xs text-white/65 mt-1.5">Tap a card to flip it open. Tap fire to react.</p>
              <div className="space-y-3 mt-3">
                {cards.filter(c=>cardWeekFilter==="All Weeks"||c.week===cardWeekFilter).length===0 && <p className="text-sm text-white/70">No GRIT Cards yet for this filter. Send the first one above.</p>}
                {cards.filter(c=>cardWeekFilter==="All Weeks"||c.week===cardWeekFilter).map(c=>{ const toAthlete = athletes.find(a=>a.id===c.toId); const open = expandedCardId===c.id; const react = reactions[c.id||""]; return <article key={c.id} className={`rounded-2xl border bg-[#2E4038]/95 p-4 transition ${open?"border-[#C9A86A]":"border-[#C9A86A]/30"}`}><button onClick={()=>setExpandedCardId(open?null:c.id)} className="w-full text-left min-h-[48px]"><p className="font-display font-semibold leading-tight">{c.fromName} <span className="text-[#C9A86A]">→</span> {c.toName}</p><p className="text-xs text-white/60 mt-1">{c.week} • {toAthlete?.sport||""} • {new Date(c.createdAt).toLocaleDateString()} • {open?"Tap to collapse":"Tap to flip open"}</p><p className={`text-[15px] text-white/85 whitespace-pre-wrap mt-2 leading-relaxed ${open?"":"line-clamp-2"}`}>{c.message}</p></button><div className="mt-3 flex items-center gap-2"><button onClick={()=>toggleReaction(c.id||"", "fire")} aria-pressed={react==="fire"} className={`min-h-[44px] flex-1 rounded-full border px-3 py-2 text-sm font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.97] ${react==="fire"?"bg-[#C9A86A] text-black border-[#C9A86A]":"border-white/20 bg-white/5"}`}><Flame size={16}/> Fire</button><button onClick={()=>startEditCard(c)} className="min-h-[44px] px-3 py-2 text-xs font-bold text-[#C9A86A]">View / Edit</button></div></article>; })}
              </div>
            </div>
          </section>
        ) : view==="formats" ? (
          <section className="pt-5">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold">FORMATS | PAYMENT</p>
            <h2 className="font-display text-[36px] leading-none mt-2">Formats | Payment</h2>
            <p className="text-white/85 mt-3 text-[15px] leading-relaxed">Choose how you train. Payment is coming soon — nothing is charged here.</p>
            <div className="space-y-3 mt-4">
              {[{t:"1:1 Training",d:"One athlete. One plan. Full attention."},{t:"Small Group",d:"Train with your crew. Same standard."},{t:"Team Training",d:"Built together, session by session."}].map(x=>(
                <div key={x.t} className="rounded-2xl border border-white/15 bg-black/35 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-display text-xl">{x.t}</h3><span className="text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-[#C9A86A] text-black shrink-0">COMING SOON!</span></div><p className="text-[15px] text-white/80 mt-2">{x.d}</p><p className="text-xs text-white/60 mt-2">Details and scheduling — Coming Soon!</p></div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><CreditCard size={22} className="text-[#C9A86A] shrink-0"/><div><h3 className="font-display text-xl">Payment</h3><p className="text-sm text-white/80">Payment — Coming Soon!</p></div></div>
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/10 text-[#D4B483] shrink-0">COMING SOON!</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3"><h3 className="font-display text-xl flex items-center gap-2"><Sparkles size={18} className="text-[#C9A86A]"/> What stays the same</h3><p className="text-[15px] text-white/80 mt-2 leading-relaxed">Every format runs on the same wall: Dynamic Stretch, Core, Main Lift, Speed, Agility, Explode, mindset, homework, and the reminder.</p></div>
            <button onClick={()=>goTab("wall")} className="mt-4 w-full min-h-[48px] border border-white/25 rounded-full text-sm font-semibold">Back to The GRIT</button>
          </section>
        ) : (
          <section className="pt-5 md:grid md:grid-cols-2 md:gap-5 md:items-start lg:grid-cols-3">
            <p className="text-[#C9A86A] text-xs tracking-[0.28em] font-bold md:col-span-2 lg:col-span-3">COACHES • DASHBOARD</p>
            <h2 className="font-display text-[36px] leading-none mt-2 md:col-span-2 lg:col-span-3">Coaches</h2>
            <p className="text-white/85 mt-3 text-[15px] leading-relaxed md:col-span-2 lg:col-span-3">Dashboard, setup, and checks — all in one place.</p>
            {lastSyncedAt && <p className="mt-3 text-sm text-[#D4B483]">Last synced: {lastSyncedAt}</p>}
            {result && <p className="mt-3 text-sm text-[#D4B483] bg-black/35 border border-white/10 rounded-xl px-3 py-2">{result}</p>}
            <div className="mt-4">
              <h3 className="font-display text-xl">Dashboard Overview</h3>
              <div className="grid grid-cols-2 gap-2 mt-3 lg:grid-cols-3">
                {[{l:"Total Athletes",v:String(dashboardStats.total)},{l:"Unlocked Profiles",v:String(dashboardStats.unlocked)},{l:"Profiles Edited This Week",v:String(dashboardStats.editedThisWeek)},{l:"Training Blocks Completed",v:String(dashboardStats.blocksDone)},{l:"Upcoming GRIT Sessions",v:String(dashboardStats.upcoming)},{l:"Notes / Questions Waiting",v:String(dashboardStats.notesWaiting)}].map(x=>(
                  <div key={x.l} className="rounded-2xl border border-white/15 bg-black/35 p-3"><p className="text-[11px] font-bold tracking-widest text-[#C9A86A] leading-tight">{x.l.toUpperCase()}</p><p className="font-display text-[32px] font-bold leading-none mt-2">{x.v}</p></div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3">
                <h4 className="font-display text-lg">Recent Activity</h4>
                {recentActivity.length===0 ? <p className="text-sm text-white/70 mt-2">No activity saved yet.</p> : <ul className="mt-2 space-y-2">{recentActivity.map(a=><li key={a.id} className="text-[14px] leading-relaxed border-b border-white/10 pb-2 last:border-0"><span className="font-semibold">{a.text}</span><span className="block text-xs text-white/60">{a.time}</span></li>)}</ul>}
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/35 p-4 mt-3">
                <h4 className="font-display text-lg">Upcoming GRIT Sessions</h4>
                {upcomingSessions.length===0 ? <p className="text-sm text-white/70 mt-2">No sessions saved yet.</p> : <ul className="mt-2 space-y-2">{upcomingSessions.map(w=><li key={w.id} className="flex justify-between gap-2 text-[14px] border-b border-white/10 pb-2 last:border-0"><span className="font-semibold min-w-0">{w.athlete} • {w.week}</span><span className="text-xs text-white/60 shrink-0 text-right">{new Date(w.createdAt).toLocaleDateString()}<br/>{new Date(w.createdAt).toLocaleTimeString([], {hour:"numeric", minute:"2-digit"})}</span></li>)}</ul>}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-4">
              <h3 className="font-display text-xl">Supabase — Connect + Configure</h3>
              <p className="text-sm text-white/75 mt-1">Status: <strong className={supabaseStatus==="Connected"?"text-[#C9A86A]":"text-white"}>{supabaseStatus}</strong>{supabaseLastChecked ? ` • Last checked ${supabaseLastChecked}` : ""}</p>
              <label className="block text-sm mt-3">Supabase Project URL<input value={supabaseUrl} onChange={e=>setSupabaseUrl(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[15px]"/></label>
              <label className="block text-sm mt-3">Supabase Anon Key<input type="password" value={supabaseKey} onChange={e=>setSupabaseKey(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[15px]"/></label>
              <div className="flex gap-2 mt-3"><button disabled={busy} onClick={connectSupabase} className="flex-1 min-h-[48px] bg-[#C9A86A] text-black font-bold px-4 py-2.5 rounded-full text-sm disabled:opacity-50">Connect Supabase</button><button disabled={busy} onClick={testSupabase} className="flex-1 min-h-[48px] border border-white/25 px-4 py-2.5 rounded-full text-sm font-semibold">Test Connection</button></div>
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="text-xs font-bold tracking-widest text-[#C9A86A]">CONFIGURE SUPABASE — REQUIRED TABLES</p>
                <ul className="mt-2 space-y-1.5 text-[15px]">{["athletes","grit_focus","training_blocks","athlete_notes","progress_notes"].map(t=>(<li key={t} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full shrink-0 ${supabaseStatus==="Connected"?"bg-[#C9A86A]":"bg-white/25"}`} aria-hidden="true"/><span className="font-mono text-sm">{t}</span><span className="text-xs text-white/60">{supabaseStatus==="Connected"?"Ready":"Not checked"}</span></li>))}</ul>
                <label className="block text-sm mt-3">Table / Realtime status note<input value={supabaseNote} onChange={e=>setSupabaseNote(e.target.value)} onBlur={()=>persistSettings({supabaseNote})} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[15px]"/></label>
                <button onClick={copySql} className="mt-3 w-full min-h-[48px] border border-[#C9A86A]/60 px-4 py-2.5 rounded-full text-sm font-bold">Copy Supabase SQL</button>
                <p className="mt-3 rounded-xl bg-[#2E4038]/90 border border-[#C9A86A]/30 px-3 py-2.5 text-sm leading-relaxed text-white/85">Run the WHOLE file at once in Supabase &gt; SQL Editor. If you ran an old version first and got &lsquo;relation public.athletes does not exist&rsquo;, just run this whole fixed file — it creates athletes first.</p>
                {showSql && <div className="mt-3"><textarea id="supabase-sql-text" readOnly value={SUPABASE_SQL} rows={8} className="w-full bg-[#0F1113] border border-white/15 rounded-xl p-3 text-[12px] font-mono leading-relaxed"/><p className="text-xs text-white/60 mt-1">{sqlCopied ? "Copied — paste it in the Supabase SQL editor." : "Setup SQL for the tables above."}</p></div>}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <h3 className="font-display text-xl flex items-center gap-2"><CalendarDays size={20} className="text-[#C9A86A]"/> Google Calendar — Connect + Check</h3>
              <p className="text-sm mt-2">Calendar status: <strong className="text-[#C9A86A]">{calendarConnected ? "Connected" : "Not connected"}</strong></p>
              <p className="text-sm text-white/80 mt-1">Account: thepiviotproject@kbuiltsoftball.com</p>
              <p className="text-sm text-white/80">Time zone: America/Detroit</p>
              <p className="text-xs text-white/60 mt-1">Last checked: {calendarLastChecked || "Not checked yet"}</p>
              <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#2E4038]/90 border border-white/10 px-3 py-3 text-sm font-semibold"><span>Sync GRIT Sessions to Calendar</span><button role="switch" aria-checked={calendarSyncOn} onClick={toggleCalendarSync} className={`min-h-[32px] min-w-[56px] rounded-full px-2 text-xs font-bold ${calendarSyncOn?"bg-[#C9A86A] text-black":"bg-white/15 text-white"}`}>{calendarSyncOn?"On":"Off"}</button></label>
              <div className="flex gap-2 mt-3"><button disabled={busy} onClick={checkCalendar} className="flex-1 min-h-[48px] border border-white/25 px-3 py-2.5 rounded-full text-sm font-semibold">Check Google Calendar Connection</button><button disabled={busy} onClick={syncCalendarSessions} className="flex-1 min-h-[48px] bg-[#C9A86A] text-black font-bold px-3 py-2.5 rounded-full text-sm disabled:opacity-50">Sync GRIT Sessions</button></div>
              {calendarSyncMsg && <p className="mt-2 text-sm text-[#D4B483]">{calendarSyncMsg}</p>}
              <button disabled={busy} onClick={toggleCalendar} className="mt-3 w-full min-h-[48px] border border-white/25 px-4 py-2.5 rounded-full text-sm font-semibold">{calendarConnected?"Disconnect Google Calendar":"Connect Google Calendar"}</button>
              <p className="text-xs text-white/60 mt-2">{queued>0 && !calendarConnected ? `${queued} workout${queued>1?"s":""} queued.` : ""} Sync status reflects the saved connection.</p>
              <div className="mt-4 border-t border-white/10 pt-3"><p className="text-xs font-bold tracking-widest text-[#C9A86A]">UPCOMING GRIT SESSIONS</p>{upcomingSessions.length===0 ? <p className="text-sm text-white/70 mt-2">No sessions yet.</p> : <ul className="mt-2 space-y-2">{upcomingSessions.map(w=>{ const a = athletes.find(x=>x.id===w.athleteId || x.name===w.athlete); return <li key={w.id} className="text-[14px] border-b border-white/10 pb-2 last:border-0"><span className="font-semibold">{w.athlete} • {w.week}</span><span className="block text-xs text-white/60">{new Date(w.createdAt).toLocaleString()} • {w.calendar}</span>{a?.progress_doc_url?.trim() ? <a href={a.progress_doc_url} target="_blank" rel="noopener" className="text-xs font-bold text-[#C9A86A] underline">Progress Notes Doc</a> : null}</li>; })}</ul>}</div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <h3 className="font-display text-xl">GRIT Progress Notes — Google Doc Sync</h3>
              <p className="text-sm text-white/75 mt-1">Each athlete&rsquo;s Doc syncs only to their own profile.</p>
              <label className="block text-sm mt-3">Select Athlete<select value={coachDocAthleteId} onChange={e=>setCoachDocAthleteId(e.target.value)} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[15px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <button disabled={busy} onClick={syncAllProgressNotes} className="mt-3 w-full min-h-[48px] bg-[#C9A86A] text-black font-bold px-4 py-2.5 rounded-full text-sm disabled:opacity-50">Sync All</button>
              <div className="mt-3">
                {!coachDocAthlete ? <p className="text-sm text-white/70">Select an athlete.</p> : (
                  <div className="rounded-xl border border-white/10 bg-[#2E4038]/90 p-3">
                    <p className="font-semibold text-[15px]">{coachDocAthlete.name}</p>
                    <p className="text-xs text-white/70 mt-0.5">Sync Status: <strong className="text-[#D4B483]">{docSyncStatus(coachDocAthlete)}</strong> • Last Synced: {coachDocAthlete.progress_notes_last_synced ? new Date(coachDocAthlete.progress_notes_last_synced).toLocaleString() : "Never"}</p>
                    <input value={coachDocAthlete.progress_doc_url || ""} onChange={e=>updateAthlete(coachDocAthlete.id,{progress_doc_url:e.target.value})} className="mt-2 w-full min-h-[44px] bg-[#0F1113] border border-white/15 rounded-lg px-3 py-2 text-[14px]"/>
                    <button disabled={busy} onClick={()=>syncProgressNotesFor(coachDocAthlete)} className="mt-2 w-full min-h-[44px] border border-white/25 px-3 py-2 rounded-full text-sm font-semibold disabled:opacity-50">Sync Progress Notes</button>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <h3 className="font-display text-xl">Publish + Save Site</h3>
              <p className="text-sm text-white/75 mt-1">Last saved: {lastSavedAt || "Not saved yet"} • Last published: {lastPublishedAt || "Not published yet"}</p>
              <p className="text-sm mt-1">{published ? <span className="font-bold text-[#C9A86A]">Published • Version {publishVersion}</span> : <span className="text-white/70">Not published yet</span>}</p>
              <div className="flex flex-col gap-2 mt-3"><button disabled={busy} onClick={saveSite} className="min-h-[52px] bg-[#C9A86A] text-black font-bold px-5 py-3 rounded-full text-[15px] disabled:opacity-50">Save Site</button><button disabled={busy} onClick={publishSite} className="min-h-[52px] border border-[#C9A86A] px-5 py-3 rounded-full text-[15px] font-bold disabled:opacity-50">Publish Site</button><button onClick={checkEverything} className="min-h-[48px] border border-white/25 px-5 py-3 rounded-full text-sm font-semibold">Check Everything</button></div>
              {checkResults && <ul className="mt-3 space-y-2">{checkResults.map(c=>(<li key={c.label} className="text-sm"><span className="flex items-center justify-between gap-2"><span>{c.label}</span><span className={`font-bold ${c.ok?"text-[#C9A86A]":"text-white"}`}>{c.ok?"● Green":"● Red"} <span className="font-normal text-white/60">— {c.detail}</span></span></span><span className="mt-0.5 block text-xs text-white/60">Last synced: {c.synced}</span></li>))}</ul>}
              <button onClick={()=>setDictOpen(true)} className="mt-4 w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#2E4038] border border-[#C9A86A]/50 px-4 py-2.5 rounded-full text-sm font-bold">Open Dictation <ChevronRight size={16}/></button>
              <div className="mt-3 flex flex-col gap-2"><button onClick={()=>goTab("training")} className="min-h-[48px] border border-white/20 px-3 py-2 rounded-full text-sm font-semibold">Training Program</button><button onClick={()=>goTab("athletes")} className="min-h-[48px] border border-white/20 px-3 py-2 rounded-full text-sm font-semibold">GRIT Athletes</button><button onClick={()=>goTab("impact")} className="min-h-[48px] border border-white/20 px-3 py-2 rounded-full text-sm font-semibold">Impact</button><button onClick={()=>goTab("formats")} className="min-h-[48px] border border-white/20 px-3 py-2 rounded-full text-sm font-semibold">Formats | Payment</button></div>
            </div>
            <div className="rounded-[22px] border border-white/15 bg-black/35 p-4 mt-3">
              <h3 className="font-display text-xl">Reset a Player&rsquo;s PIN</h3>
              <p className="text-sm text-white/75 mt-1">Only the PIN you just reset is shown here.</p>
              <label className="block text-sm mt-3">Athlete<select value={resetAthleteId} onChange={e=>{setResetAthleteId(e.target.value); setJustReset(null);}} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select></label>
              <label className="block text-sm mt-3">New PIN (4 digits)<input type="password" inputMode="numeric" value={newPin} onChange={e=>setNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} className="mt-1 w-full min-h-[48px] bg-[#2E4038] border border-white/15 rounded-lg px-3 py-2.5 text-center text-[18px] tracking-[0.5em]"/></label>
              <div className="flex gap-2 mt-3"><button disabled={busy} onClick={resetPin} className="flex-1 min-h-[48px] bg-[#C9A86A] text-black font-bold px-4 py-2.5 rounded-full text-sm disabled:opacity-50">Reset PIN</button><button onClick={generatePin} className="flex-1 min-h-[48px] border border-white/25 px-4 py-2.5 rounded-full text-sm font-semibold">Generate New PIN</button></div>
              {justReset && <p className="mt-3 rounded-xl bg-[#C9A86A] text-black px-3 py-2.5 text-sm font-bold text-center" role="status">PIN Updated — {justReset.name}: {justReset.pin}</p>}
              <button disabled={busy} onClick={resetAllPins} className="mt-3 w-full min-h-[48px] border border-white/25 px-4 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50">Reset All PINs to 1234</button>
            </div>
            <h3 className="font-display text-2xl mt-6">Recent on The GRIT</h3>
            <div className="mt-3 space-y-3">{workouts.slice(0,4).map(w=><div key={w.id} className="rounded-xl border border-white/15 bg-black/35 px-4 py-3 flex justify-between gap-3"><div className="min-w-0"><p className="font-semibold truncate">{w.athlete} — {w.week}</p><p className="text-xs text-white/60">{new Date(w.createdAt).toLocaleString()}</p></div><span className="text-xs text-[#D4B483] shrink-0">{w.calendar}</span></div>)}</div>
          </section>
        )}
      </main>

      <nav aria-label="Bottom navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1113] border-t border-[#C9A86A]/40" style={{paddingBottom:"var(--safe-area-inset-bottom, 0px)"}}>
        <div className="mx-auto max-w-[430px] grid grid-cols-6 lg:px-8">
          {TABS.map(t=>{
            const active = view===t.id || (t.id==="pillars" && view==="pillars");
            const Icon = t.icon;
            return <button key={t.id} onClick={()=>goTab(t.id)} aria-current={active?"page":undefined} className={`min-h-[64px] flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 active:bg-white/5 ${active?"text-[#C9A86A]":"text-white/65"}`}><Icon size={20}/><span className="text-[9px] font-bold leading-tight text-center break-words">{t.label}</span>{active && <span className="mt-0.5 h-1 w-5 rounded-full bg-[#C9A86A]"/>}</button>;
          })}
        </div>
      </nav>

      <button onClick={()=>{setDictOpen(true);}} className="fixed right-4 z-50 flex min-h-[52px] items-center gap-2 rounded-full bg-[#C9A86A] text-[#0F1113] pl-3 pr-4 py-3 shadow-2xl font-bold text-sm hover:bg-[#D4B483] active:scale-[0.97]" style={{bottom:"calc(84px + var(--safe-area-inset-bottom, 0px))"}} aria-label="Open Voice Dictation">
        <MessageSquareText size={20}/><span>Dictation Voice</span>
      </button>

      {dictOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Voice Dictation">
          <div className="w-full max-w-[480px] max-h-[92vh] overflow-y-auto bg-[#0F1113] border border-[#C9A86A]/40 rounded-t-[22px] sm:rounded-[22px] shadow-2xl">
            <div className="sticky top-0 bg-[#0F1113] px-4 py-4 flex items-center justify-between border-b border-white/10"><div><h2 className="font-display text-2xl">Dictation Voice</h2><p className="text-xs text-white/65" role="status">{dictStatus === "Listening" ? "Listening..." : dictStatus}</p></div><button onClick={()=>setDictOpen(false)} className="min-h-[44px] min-w-[44px] p-2 rounded-full border border-white/20 flex items-center justify-center" aria-label="Close dictation"><X size={18}/></button></div>
            <div className="p-4">
              {!dictSupported && <p className="rounded-xl bg-[#2E4038] border border-white/10 px-3 py-2.5 text-sm text-[#D4B483]">Mic not available — use keyboard dictation</p>}
              <label className="block text-xs font-bold tracking-widest text-[#C9A86A] mt-3">SELECT ATHLETE</label>
              <select value={dictAthleteId} onChange={e=>setDictAthleteId(e.target.value)} className="mt-1 w-full min-h-[52px] bg-[#2E4038] border border-white/15 rounded-xl px-3 py-3 text-[16px]"><option value="">Select Athlete</option>{athleteOptions()}</select>
              <label className="block text-xs font-bold tracking-widest text-[#C9A86A] mt-4">DESTINATION</label>
              <select value={dictDestination} onChange={e=>setDictDestination(e.target.value)} className="mt-1 w-full min-h-[52px] bg-[#2E4038] border border-white/15 rounded-xl px-3 py-3 text-[16px]">
                <option value="">Select Destination</option>
                {SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                <option value="focus">Your GRIT Focus and Why</option>
                <option value="progress">Progress Notes</option>
                <option value="questions">Questions / Progress Notes</option>
              </select>
              {dictDestination==="questions" && (
                <><label className="block text-xs font-bold tracking-widest text-[#C9A86A] mt-4">TRAINING BLOCK</label>
                <select value={dictQuestionBlock} onChange={e=>setDictQuestionBlock(e.target.value)} className="mt-1 w-full min-h-[52px] bg-[#2E4038] border border-white/15 rounded-xl px-3 py-3 text-[16px]"><option value="">Select Block</option>{SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></>
              )}
              <label className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[#2E4038]/90 border border-white/10 px-3 py-3 text-sm font-semibold"><span className="inline-flex items-center gap-2">{dictHandsFree ? <Mic size={16} className="text-[#C9A86A]"/> : <MicOff size={16}/>} Hands-Free</span><button role="switch" aria-checked={dictHandsFree} onClick={()=>setDictHandsFree(v=>!v)} className={`min-h-[32px] min-w-[56px] rounded-full px-2 text-xs font-bold ${dictHandsFree?"bg-[#C9A86A] text-black":"bg-white/15 text-white"}`}>{dictHandsFree?"On":"Off"}</button></label>
              <div className="flex gap-2 mt-4">
                {dictStatus==="Listening" ? <button onClick={stopManualDictation} className="flex-1 min-h-[52px] border border-white/25 rounded-full px-4 py-3 text-sm font-bold">Stop</button> : <button disabled={!dictSupported} onClick={startManualDictation} className="flex-1 min-h-[52px] bg-[#C9A86A] text-black font-bold px-4 py-3 rounded-full text-sm disabled:opacity-50">Start Dictation</button>}
                <button disabled={busy} onClick={()=>saveDictation()} className="flex-1 min-h-[52px] border border-[#C9A86A] px-4 py-3 rounded-full text-sm font-bold disabled:opacity-50">Save Dictation</button>
              </div>
              <p className="mt-3 text-sm font-bold text-[#D4B483]" role="status">{dictStatus === "Listening" ? "Listening..." : dictStatus === "Saved" ? "Saved" : dictStatus === "Paused" ? "Paused" : "Idle"}{dictInterim ? ` — ${dictInterim}` : ""}</p>
              <label className="block text-xs font-bold tracking-widest text-[#C9A86A] mt-3">TRANSCRIPT</label>
              <textarea value={dictTranscript} onChange={e=>{ setDictTranscript(e.target.value); transcriptRef.current = e.target.value; }} rows={6} className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl p-3 text-[16px] outline-none focus:border-[#C9A86A]"/>
              <button onClick={()=>{ setDictTranscript(""); transcriptRef.current=""; setDictStatus("Idle"); }} className="mt-3 w-full min-h-[44px] border border-white/25 rounded-full text-sm font-semibold">Clear Transcript</button>
              {result && <p className="mt-3 text-sm text-[#D4B483]">{result}</p>}
              <p className="text-center text-xs text-white/50 mt-4 flex items-center justify-center gap-1"><Home size={12}/> Photo background on every page • No video <Bookmark size={12}/></p>
            </div>
          </div>
        </div>
      )}
      <footer className="relative z-10 mx-auto max-w-[430px] px-4 pb-[92px] pt-2 text-center text-xs text-white/65 lg:px-8">
        <button onClick={()=>goTab("formats")} className="min-h-[44px] px-3 font-bold text-[#C9A86A]">Formats | Payment</button>
        <p className="mt-1">The GRIT — We are Built. We are Family. We are Rising. • Ink / Champagne / Bone / Moss</p>
        <p className="mt-2">Use the Share button in the header to share the GRIT icon.</p>
        {(view==="wall" || view==="coach") && <TinyAddToHomeLink />}
      </footer>
    </div>
  );
}
