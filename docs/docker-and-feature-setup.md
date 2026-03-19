# Vitamin D feature: Docker setup

## Simple setup: Postgres in Docker, app on your machine

Use this when you **don’t** run an app-server container — only Postgres runs in Docker. The API and frontends run locally with `npm run dev`.

| What              | Where        | Role |
|-------------------|-------------|------|
| **Postgres (vitd-db)** | Docker      | Database — patients, test results, recommendation snapshots. |
| **API + web-patient**  | Your machine | `npm run dev` — server on port 3003, frontend on 3001. |

### One-time setup

From repo root:

```powershell
npm run db:setup
```

This starts the Postgres container (`vitd-db`), runs migrations, and seeds a demo patient. **Copy the `patientId`** printed at the end.

### Run the app

```powershell
npm run dev
```

Then open **http://localhost:3001**, paste the patient ID, and click **“Load latest”**. You’ll see the Vitamin D test result and the recommended dosing plan.

### Handy commands

| Command | Description |
|--------|-------------|
| `npm run db:up`   | Start Postgres in Docker (background). |
| `npm run db:down` | Stop and remove the Postgres container. |
| `npm run db:setup`| Start Postgres + migrate + seed (first time). |

`packages/server/.env` should contain:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
```

---

## (Optional) Full Docker: vitd-db + app-server

If you later run the **API inside Docker** as well, you need both containers.

### 1. Put tables in the database (migrations)

From your **PC** (repo root), with **vitd-db** running and port 5432 mapped to the host:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm -w packages/server run db:migrate
```

This creates the tables inside **vitd-db**. Use the same user/password/db name you used when you ran the postgres container (e.g. `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=postgres`, `POSTGRES_DB=app`).

---

### 2. Add demo data (seed)

Still from your PC:

```powershell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
npm -w packages/server run db:seed
```

Copy the **patientId** printed in the terminal (you’ll use it in the frontend).

---

### 3. Make app-server use vitd-db

**If app-server runs in Docker**, it must connect to the DB using the **container name** as host, not `localhost`. Start (or recreate) the app-server container with:

- **Host:** `vitd-db` (name of the Postgres container)
- **Port:** `5432` (inside the Docker network)
- **Database:** `app`

Example env for the API:

```env
DATABASE_URL=postgresql://postgres:postgres@vitd-db:5432/app
```

For both containers to see each other by name, they must be on the **same Docker network**. If you started them separately, create a network and attach both:

```powershell
docker network create app-net
docker network connect app-net vitd-db
docker network connect app-net app-server
```

(If you use docker-compose, put both services in the same compose file and they’ll share a network by default.)

**If you run the API on your PC** (e.g. `npm run start:dev` in `packages/server`), use:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
```

in `packages/server/.env`. Then the API on your PC talks to **vitd-db** via `localhost:5432`.

---

### 4. Run the frontend and open the feature

From repo root:

```powershell
npm -w packages/web-patient run dev
```

- Open **http://localhost:3001**
- Paste the **patientId** from step 2
- Click **“Load latest”**

You should see the Vitamin D result and the recommended dosing plan. The page calls the API at **http://localhost:3003** (your app-server, in Docker or local).

---

## Quick checklist

- [ ] **vitd-db** running (postgres:16, port 5432)
- [ ] **app-server** running (port 3003), with `DATABASE_URL` pointing at vitd-db (use `vitd-db` as host if both in Docker, or `localhost` if API runs on host)
- [ ] Migrations run once (step 1)
- [ ] Seed run once (step 2), patientId copied
- [ ] **web-patient** running, browser at http://localhost:3001, patientId pasted, “Load latest” clicked
