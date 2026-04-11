# Task Management System (MERN)

Full-stack task management app with JWT authentication, personal and assigned tasks, and role-based permissions per assignment requirements.

## Tech stack

- **Frontend:** React 18, React Router, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Bearer tokens), bcrypt password hashing

## Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier is fine). **You do not need Docker** for this setup.

### MongoDB Atlas (no Docker)

1. Sign in to [Atlas](https://cloud.mongodb.com/) and create a **project** and a **free M0 cluster** (any region).
2. **Database Access:** create a database user (username + password). Save the password — you will put it in the connection string.
3. **Network Access:** click **Add IP Address** → **Add Current IP Address** (or **Allow access from anywhere** `0.0.0.0/0` for local dev only — less secure).
4. **Database** → **Connect** → **Drivers** → copy the **connection string**. It looks like:
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
5. Replace `<password>` with your user’s password. If the password contains special characters (`@`, `#`, etc.), [URL-encode](https://www.urlencoder.org/) them (e.g. `@` → `%40`).
6. Add a database name before the query string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/task_management?retryWrites=true&w=majority`
7. Put that full string in `server/.env` as `MONGODB_URI=...`

If the app cannot connect: double-check Network Access (IP allowlist), the password in the URI, and that the string uses `mongodb+srv://` for Atlas.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/AdityaBhosale22/mern_assignment.git
cd assignment_mern
```

**Backend**

```bash
cd server
cp .env.example .env
# Edit .env: set MONGODB_URI to your Atlas connection string and set JWT_SECRET
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
