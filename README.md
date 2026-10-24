# TaskFlow — MERN + TypeScript

A full-stack task manager (Kanban-style board) built with **MongoDB, Express, React, Node.js** — 100% TypeScript.

## Features
- JWT authentication (register / login / protected routes), bcrypt password hashing
- Per-user tasks: create, edit, delete, change status inline
- Priority, due dates, overdue highlighting
- Search (debounced) + priority filter, live stats dashboard (MongoDB aggregation)
- Zod request validation, centralized error handling, typed API client
- Responsive UI with automatic dark mode
- Production mode: Express serves the built React app

## Tech
| Layer    | Stack |
|----------|-------|
| Database | MongoDB + Mongoose 8 |
| Backend  | Express 4, Zod, JWT, bcryptjs, tsx |
| Frontend | React 18, Vite 5, React Router 6 |

## Quick start
Requirements: Node 18+ and MongoDB (local, or `docker compose up -d` using the included file).

```bash
npm run install:all          # installs root, server and client deps
# server/.env is pre-created (edit JWT_SECRET!). See server/.env.example
npm run dev                  # API on :5000, client on http://localhost:5173
```

### Production
```bash
npm run build
npm start                    # serves API + built client on http://localhost:5000
```

## API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login, returns JWT |
| GET  | /api/auth/me | Current user |
| GET  | /api/tasks?status=&priority=&q= | List/filter tasks |
| GET  | /api/tasks/stats | Counts per status |
| POST | /api/tasks | Create task |
| PUT  | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Structure
```
server/src  config/ models/ middleware/ routes/ utils/ index.ts
client/src  components/ context/ pages/ api.ts types.ts App.tsx
```

## Ideas to extend
Drag-and-drop columns, tags, team sharing, refresh tokens, tests (Vitest + Supertest), deployment (Render / Railway + MongoDB Atlas).
