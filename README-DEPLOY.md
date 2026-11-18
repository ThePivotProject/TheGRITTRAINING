THE GRIT — Vercel + Supabase

1. Supabase > SQL Editor: paste ALL of supabase.sql, Run.
2. Supabase > Settings > API: copy Project URL + anon key.
3. GitHub: upload THIS folder unpacked so package.json + src/ are at repo root. Delete old files first.
4. Vercel: Import repo, Framework Vite, Build Command: npm run build, Output: dist, Env vars VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
5. Deployments > Redeploy with 'Use existing Build Cache' UNCHECKED.
