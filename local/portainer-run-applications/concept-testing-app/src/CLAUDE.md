# Portainer V3 Concept Test

A self-service, self-paced concept test for the Portainer V3 UI. Participants work through it on their own, leave, and come back to the same step. Results go into a simple database and a researcher (admin) view.

The working reference for flow, copy and questions is `prototype/prototype.html`, a single-file HTML prototype. Match its flow and content. Build the real app with the stack below. Don't port the prototype's `claude.use(...)` calls: those were the prototype's hosting runtime and don't apply here.

## Goal

A small app that can live in git and deploy as a container. It must run as a Portainer stack deployed from a git repository (docker compose), and ideally on Portainer-IDP.

## Stack

- Next.js (App Router, TypeScript, `output: "standalone"`)
- Tailwind + shadcn/ui for the form components (button, input, textarea, label, select, checkbox, card, progress, badge, table)
- SQLite with better-sqlite3, stored at `DATABASE_PATH` (default `/data/concept-test.db`) on a Docker volume
- Multi-stage Dockerfile on `node:22-bookworm-slim` (better-sqlite3 is a native module, so avoid alpine), plus `docker-compose.yml` with a named volume and a healthcheck

## Participant flow

The sidebar on the left lists the steps with done/current/locked state and a progress bar. Questions show on the right. Phones get a top stepper.

1. **Current Portainer.** Role (select), how long they've used it (select), edition (CE/BE/Both/Not sure), how often they use it, satisfaction 1–5*, ease 7-point*, what they like, what frustrates them*.
2. **Pick words (current UI).** 16 positive and 16 negative word cards. Pick 1–3 of each, then a required "why" for every picked word.
3. **Explore V3.** A button opens `DEMO_URL` (default `https://portainer-laptop.heyronmar.com`) in a new tab and records that it was opened. They can't continue until it's opened. Optional "things to try" checklist and a notes box.
4. **Pick words (V3 UI).** Same cards as step 2, so before/after can be compared.
5. **Final thoughts.** Prefer current / V3 / no preference*, likelihood to recommend V3 0–10*, open comments, OK to follow up?
6. **Claim swag.** Name, email, company (optional), street address, city, postcode, country, t-shirt size XS–3XL, consent checkbox*. Submit leads to a thank-you screen with a summary of their picked words.

`*` = required. Show inline validation messages. Participants can go back to any completed step.

## Resume and identity

- No login for participants. The first visit creates a response row with a random id and sets an httpOnly cookie.
- Show a "resume link" (`/r/<id>`) they can copy so they can continue on another device.
- Save on every Continue/Back and on field blur. Show a "Progress saved" status.

## Researcher view (`/admin`)

- Protected with HTTP basic auth via `ADMIN_USER` / `ADMIN_PASSWORD` env vars.
- Shows: started and completed counts, average satisfaction, prefer V3 vs current, the most-picked positive and negative words for current vs V3, and a table of participants. Clicking a row shows all of their answers, including the "why" text.
- CSV export at `/admin/export.csv`.

## Data

Table `responses(id TEXT PK, data JSON, step INT, submitted_at TEXT, created_at TEXT, updated_at TEXT)`. `data` holds the answers object (same shape as `blank()` in the prototype). Swag details are personal data: only the admin view and CSV expose them.

## Config (env)

`DEMO_URL`, `DATABASE_PATH`, `ADMIN_USER`, `ADMIN_PASSWORD`, `PORT` (3000).

## Deliverables

- App source, `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`, `GET /api/health`
- README covering: local dev, `docker compose up`, and deploying in Portainer (Stacks → Add stack → Repository, compose path, env vars, volume)
- Before calling it done, run `npm run build` and `docker build`, and click through the flow once
