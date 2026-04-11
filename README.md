# Task Management System (MERN)

Full-stack task management app with JWT authentication, personal and assigned tasks, and role-based permissions per assignment requirements.

## Tech stack

- **Frontend:** React 18, React Router, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Bearer tokens), bcrypt password hashing

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd assignment_mern
```

**Backend**

```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI and JWT_SECRET (use a long random string for production)
npm install
```

**Frontend**

```bash
cd ../client
cp .env.example .env
# Optional: set VITE_API_URL if the API is on another origin (production)
npm install
```

### 2. Seed sample users (optional)

From `server/`:

```bash
npm run seed
```

### 3. Run locally

Terminal 1 — API (default port `5000`):

```bash
cd server
npm run dev
```

Terminal 2 — React (default port `5173`, proxies `/api` to the backend):

```bash
cd client
npm run dev
```

Open `http://localhost:5173`.

## Sample user credentials

After `npm run seed` in `server/`:

| Email               | Password    | Notes        |
|---------------------|-------------|--------------|
| `alice@example.com` | `password123` | Sample user 1 |
| `bob@example.com`   | `password123` | Sample user 2 |

You can also register new accounts from the UI.

## API overview

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (JWT)
- `GET /api/users` — Other users (for assigning tasks)
- `GET|POST /api/tasks` — List / create tasks
- `GET|PATCH|DELETE /api/tasks/:id` — Task detail / update / delete

**Assigned tasks**

- **Assignee:** may send only `status` in `PATCH`.
- **Assigner:** may send only `dueDate` in `PATCH`.
- **Personal task owner:** may update all fields.

## Production build

**Client**

```bash
cd client
npm run build
```

Serve the `client/dist` folder as static files and set `VITE_API_URL` at build time to your API URL, or serve the API and client under the same origin with a reverse proxy.

**Server**

Set `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` (your deployed frontend URL) in the server environment.

## Deployment (mandatory for submission)

1. Deploy MongoDB (Atlas recommended).
2. Deploy the Node API (e.g. Render, Railway, Fly.io) with the env vars above.
3. Deploy the static frontend (e.g. Vercel, Netlify, Cloudflare Pages) with `VITE_API_URL` pointing to the API, **or** configure the host to proxy `/api` to the backend.
4. Add the **deployed app URL** to your submission as required.

## Project structure

```
assignment_mern/
├── client/          # React (Vite) SPA
├── server/          # Express API
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── scripts/ # seed script
└── README.md
```

## License

Private / assignment use.
