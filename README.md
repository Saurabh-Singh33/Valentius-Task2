# Full-Stack Task Management System (WA-2 + WA-3 + WA-4 Deployment)

A production-ready full-stack task management application with an authenticated Node.js Express REST API, hosted PostgreSQL database support, and a responsive React (Vite) single-page application.

---

## 🌟 Live Deployment Architecture

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│        Frontend (React)         │           │      Backend (Express API)      │
│  Hosted on Vercel or Netlify    │  HTTPS    │     Hosted on Render or Railway │
│  - React Router 6 (SPA)         │ ────────> │  - Express 5 + JWT Auth         │
│  - Real-time client validation  │   CORS    │  - Node.js 22                   │
│  - Dark-slate responsive theme  │           │  - Security & rate limits       │
└─────────────────────────────────┘           └────────────────┬────────────────┘
                                                               │
                                                               │ SSL connection
                                                               ▼
                                              ┌─────────────────────────────────┐
                                              │    Hosted Database (Postgres)   │
                                              │  Render / Railway / Neon        │
                                              │  - Foreign keys & Cascades      │
                                              │  - Users & Tasks tables         │
                                              └─────────────────────────────────┘
```

---

## 📋 Project Structure

```
Internship-Task2/
├── .gitignore                          # Ignores .env, node_modules, dist, *.db
├── render.yaml                         # 1-Click Render Blueprint (API + Postgres)
├── vercel.json                         # Vercel SPA rewrite configuration
├── netlify.toml                        # Netlify build & redirect configuration
├── README.md                           # Master setup & deployment guide
│
├── backend/                            # Express REST API
│   ├── server.js                       # API routes, middleware, error handlers
│   ├── db.js                           # Dual database adapter (PostgreSQL & SQLite)
│   ├── test_api.js                     # Automated API integration test suite
│   ├── .env.example                    # Template for environment variables
│   ├── package.json                    # Dependencies: express, pg, bcryptjs, jsonwebtoken, cors
│   └── README.md                       # API endpoint specifications
│
└── frontend/                           # React + Vite Client
    ├── index.html                      # HTML entry with Inter font
    ├── vite.config.js                  # Vite dev server with proxy
    ├── vercel.json                     # Frontend Vercel rewrites
    ├── public/_redirects               # Netlify SPA redirect rule (/* -> /index.html)
    ├── package.json                    # Dependencies: react, react-router-dom, lucide-react
    ├── README.md                       # Frontend components & routing guide
    └── src/
        ├── context/AuthContext.jsx     # User auth state & JWT persistence
        ├── services/api.js             # API client with URL normalization
        ├── components/                 # Navbar, ProtectedRoute, Spinner, ErrorAlert, Modal
        └── pages/                      # TaskListPage, TaskDetailPage, TaskFormPage, Login, Register, 404
```

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Deploy Hosted Database & Backend (Render.com or Railway.app)

#### Option A: Render.com (Recommended — Free Tier)

1. **Log in to [Render.com](https://render.com/)** and link your GitHub account (`Saurabh-Singh33/Valentius-Task2`).
2. **Create a PostgreSQL Database**:
   - In Render Dashboard, click **New +** → **PostgreSQL**.
   - **Name**: `taskmaster-db`
   - **Database**: `taskmaster`
   - **User**: `taskmaster_user`
   - **Plan**: Free
   - Click **Create Database**.
   - Once provisioned, copy the **Internal Database URL** (if backend is on Render) or **External Database URL**.
3. **Deploy the Backend Web Service**:
   - In Render Dashboard, click **New +** → **Web Service**.
   - Select your repository: `Valentius-Task2`.
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Under **Environment Variables**, add:
     - `PORT`: `3000` (or `10000`)
     - `JWT_SECRET`: A long random secret string (e.g. `super_secret_jwt_key_9921287319`)
     - `DATABASE_URL`: Paste the PostgreSQL connection URL from Step 2.
   - Click **Create Web Service**.
4. **Verify Backend**:
   - Render will deploy the service and assign a URL: `https://<your-backend-name>.onrender.com`.
   - Test it by visiting: `https://<your-backend-name>.onrender.com/api/health`
   - You should receive:
     ```json
     {
       "status": "ok",
       "database": "postgresql",
       "timestamp": "..."
     }
     ```

*(Alternatively, use Render Blueprints: In Render, select **Blueprints** and choose the repo; Render will automatically read `render.yaml` and provision both the PostgreSQL database and Web Service together!)*

---

### Step 2: Deploy Frontend (Vercel or Netlify)

#### Option A: Vercel (Recommended)

1. **Log in to [Vercel.com](https://vercel.com/)** with your GitHub account.
2. Click **Add New...** → **Project**.
3. Import `Valentius-Task2`.
4. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Set Environment Variables**:
   - Add:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://<your-backend-name>.onrender.com/api`
6. Click **Deploy**.
7. Vercel will build and publish your app at a URL such as: `https://<your-app-name>.vercel.app`.

#### Option B: Netlify

1. **Log in to [Netlify.com](https://www.netlify.com/)**.
2. Click **Add new site** → **Import an existing project** → GitHub (`Valentius-Task2`).
3. Set Build Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Set Environment Variables:
   - `VITE_API_URL`: `https://<your-backend-name>.onrender.com/api`
5. Click **Deploy site**.
6. The included `_redirects` and `netlify.toml` automatically prevent 404s when refreshing client routes.

---

### Step 3: End-to-End Verification Checklist

Once both services are deployed, test the full application flow on the live frontend URL:

1. **Registration**:
   - Navigate to `/register`.
   - Create a new account with email and password.
   - Confirm successful registration and automatic login.
2. **Dashboard & State**:
   - Verify task stats show 0 tasks.
   - Check that no console CORS errors occur in DevTools.
3. **Create Task**:
   - Click **New Task** (`/tasks/new`).
   - Enter a title and description.
   - Click **Create Task** and verify it redirects to the new task detail page.
4. **Read & Detail View**:
   - View the task in `/tasks/:id`.
   - Verify title, description, status badge, and timestamps.
5. **Update Task**:
   - Click **Mark as Complete** (or toggle checkbox in `/tasks`).
   - Click **Edit** (`/tasks/:id/edit`), modify the description, and save.
6. **Search & Filter**:
   - Add a second task.
   - Test the live search bar and status filter buttons (`All`, `Pending`, `Completed`).
7. **Delete Task**:
   - Click the delete icon.
   - Confirm deletion in the modal dialog.
   - Ensure the task is removed from the database.
8. **Refresh Test**:
   - Refresh while on `/tasks` or `/tasks/:id` to confirm client-side routing rewrites work properly without 404 errors.
9. **Logout & Protected Routes**:
   - Click **Logout**.
   - Attempt to access `/tasks` directly; verify automatic redirection to `/login`.

---

## 🔒 Security & Environment Variables

Never commit `.env` files to git. Set all credentials in the hosting dashboards:

| Environment Variable | Where to Set | Description |
|---|---|---|
| `DATABASE_URL` | Backend Dashboard (Render / Railway) | Connection string for PostgreSQL |
| `JWT_SECRET` | Backend Dashboard (Render / Railway) | Random 32+ character signing key |
| `PORT` | Backend Dashboard (Render / Railway) | Defaults to `3000` or platform port |
| `VITE_API_URL` | Frontend Dashboard (Vercel / Netlify) | Live backend API URL (`https://.../api`) |
