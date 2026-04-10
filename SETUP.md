# Live3C - Vercel Environment Setup (Supabase)

## 1) Open Vercel project
- Go to: https://vercel.com
- Select project: **Live3C**

## 2) Add environment variables
- Open **Settings → Environment Variables**
- Add:
  - `SUPABASE_URL` = your Supabase Project URL
  - `SUPABASE_ANON_KEY` = your Supabase anon public key

## 3) Redeploy
- Trigger a new deployment (or click **Redeploy**)
- During build, `scripts/inject-env.js` will inject env values into `assets/js/env.js`

## 4) Verify
- Open site on a new device/browser
- Confirm tournaments and admin data load without entering key manually

---

## Notes
- Frontend uses only anon key (safe for browser).
- Do **not** use service role key in frontend.
- If data is still missing, verify Supabase RLS policies for:
  - `tournaments`
  - `tournament_players`
  - `match_metrics`
