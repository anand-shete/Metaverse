# Local development

Two ways to run the API and MongoDB locally. The web app always runs on the host with Vite.

## Prerequisites

- Docker and Docker Compose
- Node.js 24 and pnpm 11.9.0 (for the web app, or for API hot-reload)
- AWS credentials (S3 uploads) and a Groq API key

## 1. Environment files

```sh
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Fill AWS and Groq values in `apps/api/.env`. Local defaults for Mongo, CORS, and JWT are already set.

## 2. Full local stack (`docker compose up`)

Builds the API image and starts MongoDB + API:

```sh
docker compose up --build
```

| Service | Host address |
| ------- | ------------ |
| API     | http://localhost:3000 |
| Health  | http://localhost:3000/api/v1/health |
| DB health | http://localhost:3000/api/v1/health/db |
| MongoDB | `mongodb://localhost:27018/metaverse` (host port 27018 so it does not clash with a local Mongo) |

Compose overrides `MONGO_URI` to `mongodb://mongo:27017/metaverse` so the API container talks to the Mongo service by name.

In another terminal:

```sh
pnpm install
pnpm dev:web
```

Open the Vite URL (default http://localhost:5173). CORS allows `localhost:5173` and `127.0.0.1:5173`.

Stop the stack with `docker compose down`. Data persists in the `mongo-data` volume; add `-v` to wipe it.

## 3. Mongo only + API hot-reload

Use this when you are changing API source:

```sh
docker compose up mongo
pnpm install
pnpm dev:api
```

Point the host API at the published Mongo port:

```sh
# in apps/api/.env
MONGO_URI=mongodb://localhost:27018/metaverse
```

Override the host port with `MONGO_HOST_PORT` if 27018 is taken (`MONGO_HOST_PORT=27019 docker compose up mongo`). If you already run Mongo on the host at 27017, skip Compose Mongo and use `pnpm dev:api` against that instance.

## Production compose (not for local use)

[`apps/api/compose.yml`](../apps/api/compose.yml) is the EC2 deploy stack: it pulls an ECR image, mounts `.env.production`, and runs Redis. GitHub Actions [`CD-api.yml`](../.github/workflows/CD-api.yml) copies that file to the server. Do not use it for local development.
