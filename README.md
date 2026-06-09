# DocuFlow Engine

Automated video walkthrough to structured Markdown documentation engine.

Transforms Loom, uploaded MP4, or direct video URLs into developer-ready corporate and technical documentation using AI-powered analysis.

## Architecture

```
Client ──POST /api/jobs──→ Express API ──BullMQ──→ Background Worker
                              │                        │
                           MongoDB                  ffmpeg + Gemini AI
```

- **Web API** — Express + TypeScript monolith (REST + WebSocket)
- **Queue** — BullMQ on Redis for reliable async processing
- **Worker** — Downloads video, extracts audio via ffmpeg, samples frames, sends to Gemini 2.5 Flash
- **Database** — MongoDB with Mongoose (User, Workspace, Job models)
- **Realtime** — WebSocket for job status updates

## Prerequisites

- Node.js 20+
- MongoDB 7+ (running on `localhost:27017`)
- Redis 7+ (running on `localhost:6379`)
- Gemini API key ([get one here](https://aistudio.google.com/apikey))

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — set GEMINI_API_KEY at minimum

# Start dev server (hot reload)
npm run dev
```

Server starts at `http://localhost:3000`.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create user + workspace |
| `POST` | `/api/auth/login` | No | Login, returns JWT |
| `POST` | `/api/jobs` | JWT | Submit video URL for processing |
| `GET` | `/api/jobs` | JWT | List workspace jobs |
| `GET` | `/api/jobs/:id` | JWT | Get job details |
| `DELETE` | `/api/jobs/:id` | JWT | Delete a job |
| `POST` | `/api/webhooks/stripe` | No | Stripe subscription events |

### Example: Create a Job

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}' | jq -r '.token')

curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"sourceUrl":"https://loom.com/share/your-video"}'
```

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests (requires MongoDB running)
npm run test:int

# Type checking
npm run typecheck
```

### Bruno API Collection

An [Bruno](https://www.usebruno.com/) collection is available at `bruno/`. Open Bruno → Open Collection → select the `bruno/` folder.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload via tsx |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Full test suite |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Alias for typecheck |

## Project Structure

```
src/
├── config/        # Environment, database connection
├── middleware/     # JWT auth, error handler
├── models/        # Mongoose schemas (User, Workspace, Job)
├── routes/        # Express route handlers
├── services/      # BullMQ queue, worker, ffmpeg, Gemini AI
├── types/         # TypeScript type definitions
├── validators/    # Zod input schemas
├── websocket/     # WebSocket handler
└── server.ts      # App entry point
```

## CI/CD

On push to `main`, GitHub Actions:
1. Spins up MongoDB + Redis service containers
2. Runs linting, type checking, and full test suite
3. Builds the project

Configure deployment in `.github/workflows/ci.yml`.

## Environment Variables

| Variable | Default | Required |
|----------|---------|----------|
| `PORT` | `3000` | No |
| `NODE_ENV` | `development` | No |
| `MONGO_URI` | `mongodb://localhost:27017/docuflow` | No |
| `REDIS_URL` | `redis://localhost:6379` | No |
| `JWT_SECRET` | `dev-secret-...` | No (change in prod) |
| `GEMINI_API_KEY` | — | Yes (for job processing) |
| `STRIPE_SECRET_KEY` | — | No |
| `CORS_ORIGIN` | `http://localhost:5173` | No |
