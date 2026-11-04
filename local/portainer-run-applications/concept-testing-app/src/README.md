# Portainer V3 Concept Test

A self-service, self-paced concept test for the Portainer V3 UI. Participants work through six steps (current Portainer, pick words, explore the V3 demo, pick words again, final thoughts, claim swag), can leave and come back to the same step, and can continue on another device with a resume link. Researchers see results at `/admin` and can export a CSV.

Built with Next.js (App Router, standalone output), Tailwind + shadcn/ui, and SQLite (better-sqlite3). It ships as a single container image and runs on Kubernetes with a persistent volume for the database (`k8s/concept-test.yaml`).

## Configuration

| Variable         | Default                                  | Purpose                                                        |
| ---------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `DEMO_URL`       | `https://portainer-laptop.heyronmar.com` | Where the "Open demo" button sends participants                |
| `DATABASE_PATH`  | `/data/concept-test.db`                  | SQLite file. In the container it sits on the `/data` volume.   |
| `ADMIN_USER`     | _(none)_                                 | Basic-auth user for `/admin`. `/admin` is disabled until this is set. |
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

## Container image

The image is built from the `Dockerfile` (multi-stage, `node:22-bookworm-slim`, runs as the non-root `node` user, data at `/data`) and published to `ghcr.io/heyronmar/concept-testing-app`. A GitHub Actions workflow in [portainer-public-deployments](https://github.com/heyronmar/portainer-public-deployments) builds it for `linux/amd64` and `linux/arm64` on every push that changes the app, and tags it `latest` plus the commit SHA.

To run the image locally:

```bash
docker build -t concept-test .
docker run -d -p 3000:3000 -v concept-test-data:/data \
  -e ADMIN_USER=admin -e ADMIN_PASSWORD='<password>' concept-test
```

## Deploy on Kubernetes (Portainer-IDP)

`k8s/concept-test.yaml` holds the PersistentVolumeClaim (1Gi, ReadWriteOnce), Deployment, Service and Ingress. It deploys into the `namespaces` namespace, with host `concept-test.heyronmar.com` on the cluster's default ingress class.

1. Create the admin credentials Secret. It is kept out of git on purpose:

   ```bash
   kubectl -n namespaces create secret generic concept-test-admin \
     --from-literal=username=admin --from-literal=password='<password>'
   ```

   With sealed-secrets, seal the same Secret and commit the SealedSecret instead.
2. Deploy the manifest from git in Portainer (point it at `k8s/concept-test.yaml`), or run `kubectl apply -f k8s/concept-test.yaml`.
3. Check it: `kubectl -n namespaces get pods -l app=concept-test`. The readiness and liveness probes call `GET /api/health`.

Notes:

- **One replica only.** SQLite is a single file on a ReadWriteOnce volume, so the Deployment uses the `Recreate` strategy.
- **Data lives on the PVC.** Redeploys and image updates keep it. Deleting the PVC deletes all responses, so export the CSV first.
- **Updating.** The manifest pins the image to a build tag (`sha-<commit>`, where the commit is the push to portainer-public-deployments that built it). After the workflow publishes a new image, change the tag in `k8s/concept-test.yaml` and commit; the changed manifest rolls out a new pod. Restarting the app without changing the tag keeps the running version.
- **HTTPS.** Serve it over TLS at the ingress before sharing the link. The participant cookie is marked `Secure` when the ingress sends `X-Forwarded-Proto: https`, and basic auth should only travel over TLS.
- **Changing the host or namespace.** Edit `metadata.namespace` on all four resources and `spec.rules[0].host` on the Ingress.

To back up the database:

```bash
kubectl -n namespaces cp "$(kubectl -n namespaces get pod -l app=concept-test -o name | cut -d/ -f2)":/data/concept-test.db ./concept-test-backup.db
```

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
k8s/concept-test.yaml              Kubernetes manifest (PVC, Deployment, Service, Ingress)
prototype/prototype.html           original single-file prototype (reference for flow and copy)
```
