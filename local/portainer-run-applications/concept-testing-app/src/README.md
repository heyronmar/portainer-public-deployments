# Portainer V3 Concept Test

A self-service, self-paced concept test for the Portainer V3 UI. Participants work through six steps (current Portainer, pick words, explore the V3 demo, pick words again, final thoughts, claim swag), can leave and come back to the same step, and can continue on another device with a resume link. Researchers see results at `/admin` and can export a CSV.

Built with Next.js (App Router, standalone output), Tailwind + shadcn/ui, and SQLite (better-sqlite3). It ships as a single container with a named volume for the database.

## Configuration

| Variable         | Default                                  | Purpose                                                        |
| ---------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `DEMO_URL`       | `https://portainer-laptop.heyronmar.com` | Where the "Open demo" button sends participants                |
| `DATABASE_PATH`  | `/data/concept-test.db`                  | SQLite file. In Docker it sits on the `/data` volume.          |
| `ADMIN_USER`     | `admin` (in compose)                     | Basic-auth user for `/admin`                                   |
| `ADMIN_PASSWORD` | _(none)_                                 | Basic-auth password for `/admin`. `/admin` is disabled until this is set. |
| `PORT`           | `3000`                                   | Port the app listens on                                        |

See `.env.example`.

## Local development

Requires Node 22+.

```bash
npm install
cp .env.example .env
# set DATABASE_PATH=./data/concept-test.db and ADMIN_PASSWORD in .env
npm run dev
```

Open <http://localhost:3000> for the participant flow and <http://localhost:3000/admin> for the researcher view.

Other scripts: `npm run build`, `npm run lint`.

## Run with Docker Compose

```bash
cp .env.example .env        # set ADMIN_PASSWORD (and DEMO_URL if needed)
docker compose up -d --build
```

The app is on <http://localhost:3000> (change it with `HOST_PORT`). Data is stored in the named volume `concept-test-data` and survives restarts and rebuilds. The container has a healthcheck against `GET /api/health`.

To back up the database:

```bash
docker compose cp concept-test:/data/concept-test.db ./concept-test-backup.db
```

## Deploy in Portainer (stack from Git)

1. Push this repository to a Git host Portainer can reach.
2. In Portainer, open the environment, then go to **Stacks → Add stack**.
3. Name the stack (for example `concept-test`) and choose **Repository** as the build method.
4. Set **Repository URL** to this repo and **Repository reference** to the branch (for example `refs/heads/main`). Add credentials if the repo is private.
5. Set **Compose path** to `docker-compose.yml`.
6. Under **Environment variables**, add:
   - `ADMIN_PASSWORD`: a strong password (required for `/admin`)
   - `ADMIN_USER`: optional, defaults to `admin`
   - `DEMO_URL`: optional, defaults to the V3 demo
   - `HOST_PORT`: optional, defaults to `3000`
7. Optional: turn on **GitOps updates** so Portainer redeploys when the branch changes.
8. Click **Deploy the stack**. Portainer builds the image from the `Dockerfile` and creates the `concept-test-data` volume, mounted at `/data`.

The volume is what keeps responses. Redeploying or updating the stack keeps it. Removing the stack and its volumes deletes all responses, so export the CSV (or copy the `.db` file) first.

Put the app behind HTTPS (a reverse proxy or ingress) before sharing it. The participant cookie is marked `Secure` when the proxy sends `X-Forwarded-Proto: https`, and basic auth should only travel over TLS.

### Portainer-IDP

The image is self-contained: one container, one port (3000), one volume at `/data`, and env vars for config. Any platform that can build from the `Dockerfile` (or run a pre-built image) and mount a persistent volume at `/data` can run it. Keep it to **one replica**: SQLite is a single file on a single volume.

## How it works

- **Identity.** No login. On the first visit the page calls `POST /api/session`, which creates a row with a random 16-character id and sets the httpOnly cookie `ct_id`. The sidebar shows the resume link `/r/<id>`. Opening it on another device sets the same cookie there. Anyone with the link can open those answers, so participants are told to keep it private.
- **Saving.** Answers save on Continue/Back, when a text field loses focus, when a choice is clicked, and when the tab is hidden. The sidebar shows "Progress saved".
- **Validation.** Each step is checked in the browser with inline messages. On final submit, the server checks every step again before it sets `submitted_at`.
- **Data.** One table: `responses(id TEXT PK, data JSON, step INT, submitted_at TEXT, created_at TEXT, updated_at TEXT)`. `data` holds the full session object (same shape as `blank()` in `src/lib/survey.ts`). The server cleans incoming answers against the known option lists and length limits.
- **Personal data.** Swag details (name, email, address) appear only in `/admin` and `/admin/export.csv`, both behind basic auth.

## Project layout

```
src/lib/survey.ts                  questions, options, answers shape, sanitising, validation (shared)
src/lib/db.ts                      SQLite access
src/lib/report.ts                  admin aggregates and CSV
src/components/concept-test/       participant UI (sidebar, steps, fields)
src/app/api/session/route.ts       start/resume (POST) and save/submit (PUT)
src/app/r/[id]/route.ts            resume link
src/app/admin/                     researcher dashboard, participant detail, export.csv
src/app/api/health/route.ts        healthcheck
src/proxy.ts                       basic auth for /admin
prototype/prototype.html           original single-file prototype (reference for flow and copy)
```
