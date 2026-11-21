# Full-Stack Task Management System

A complete full-stack web application featuring an authenticated Node.js + Express REST API with SQLite database, paired with a modern, responsive React frontend built using Vite and React Router 6.

---

## 📂 Architecture Overview

```
Internship-Task2/
├── backend/                  # Node.js + Express REST API
│   ├── server.js             # API routes, middleware, SQLite DB & auth
│   ├── test_api.js           # Automated integration test suite
│   ├── .env                  # Environment variables (PORT, JWT_SECRET)
│   ├── package.json          # Dependencies (express, bcryptjs, jsonwebtoken, cors)
│   └── README.md             # Complete REST API endpoint documentation
│
└── frontend/                 # React + Vite Frontend
    ├── index.html            # HTML entry point with Inter font
    ├── vite.config.js        # Vite config with API proxy
    ├── package.json          # Dependencies (react, react-router-dom, lucide-react)
    ├── README.md             # Frontend routes and architecture docs
    └── src/
        ├── context/          # AuthContext for user session & JWT management
        ├── services/         # API client module wrapping native fetch
        ├── components/       # Navbar, ProtectedRoute, LoadingSpinner, ErrorAlert, Modal
        └── pages/            # TaskListPage, TaskDetailPage, TaskFormPage, Login, Register, 404
```

---

## 🛠 Features & Requirements Breakdown

### 1. Backend REST API (Node.js + Express)
- **Database**: SQLite using Node's built-in `node:sqlite` (`DatabaseSync`), storing users and tasks with foreign keys.
- **Authentication**:
  - `POST /api/auth/register`: Hashes passwords with `bcryptjs` (salt rounds: 12).
  - `POST /api/auth/login`: Validates credentials and issues signed JWT bearer tokens (1 hour expiry).
  - `GET /api/auth/me`: Validates token and returns current user profile.
- **CRUD Task Endpoints**:
  - `GET /api/tasks`: List all tasks belonging to the authenticated user.
  - `GET /api/tasks/:id`: Retrieve single task by ID (returns 404 if not found or unauthorized).
  - `POST /api/tasks`: Create new task with validation (title 1–200 chars, description <= 2000 chars, completed boolean).
  - `PUT /api/tasks/:id`: Full update of an existing task.
  - `PATCH /api/tasks/:id`: Partial update (e.g. toggle completion status).
  - `DELETE /api/tasks/:id`: Delete task (returns 204 No Content).
- **Protection**: JWT authentication middleware checks `Authorization: Bearer <token>`; rejects missing or invalid tokens with HTTP 401.
- **Status Codes**: 200/201 on success, 400 for bad input / validation errors, 401 for unauthorized, 404 for not found, 409 for duplicate email.
- **CORS Enabled**: Configured for cross-origin requests from the React frontend.

### 2. Frontend Application (React + Vite)
- **Routing**: React Router 6 with 6 distinct views:
  1. `/tasks` — Task list view with search, filter (All / Pending / Completed), statistics dashboard, quick checkbox toggle, and delete dialog.
  2. `/tasks/:id` — Detail view with timestamps, formatted description, status pill, and action buttons.
  3. `/tasks/new` — Create task form with client-side validation and character counters.
  4. `/tasks/:id/edit` — Edit task form with pre-populated data.
  5. `/login` — User login form with input validation.
  6. `/register` — Account registration form with password confirmation.
  7. `*` — 404 Not Found page with return navigation.
- **Data Fetching**: Pure REST API consumption using `fetch` via `src/services/api.js` (no hardcoded mock arrays).
- **Loading & Error Handling**:
  - Visible spinner animations while fetching or mutating data.
  - Error alert banners with retry buttons on failure.
  - Graceful degradation: handles network outages and server downtime without crashing.
- **Client-Side Validation**:
  - Real-time feedback and validation messages before submitting to API.
  - Character counter boundaries (Title <= 200, Description <= 2000).
- **Responsive Design**: Mobile-first design with responsive navbar drawer, flexible grid, and touch-friendly controls.

---

## ⚡ How to Run the Project

### Prerequisites
- Node.js version **22.5.0 or higher** (e.g. Node v22.17.0)

---

### Step 1: Start the Backend Server

```bash
cd backend
npm install
npm start
```
The backend API will start on **http://localhost:3000**.

> **Note**: To run backend integration tests:
> ```bash
> cd backend
> npm test
> ```

---

### Step 2: Start the Frontend Application

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
```
The frontend will start at **http://localhost:5173**.

---

### Step 3: Use the Application

1. Open **http://localhost:5173** in your web browser.
2. Click **Register** to create a test user (e.g. `user@example.com`, password: `password123`).
3. You will be automatically logged in and redirected to your **Task Dashboard** (`/tasks`).
4. Click **New Task** (`/tasks/new`) to add a task with title and optional description.
5. In the dashboard, you can:
   - Search tasks by keywords in title or description.
   - Filter by status (`All`, `Pending`, `Completed`).
   - Toggle completion status with the checkbox for immediate feedback.
   - Click the eye icon (`/tasks/:id`) to inspect full details and timestamps.
   - Click the edit icon (`/tasks/:id/edit`) to modify task content.
   - Click the trash icon to delete with confirmation.
6. Test error handling: stop the backend server (`Ctrl+C` in the backend terminal) and refresh the page; notice the user-friendly error message with a "Retry" button.

---

## 📋 REST API Reference Summary

| Method | Endpoint | Auth | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | `{ email, password }` | Register new user |
| `POST` | `/api/auth/login` | No | `{ email, password }` | Login and get JWT |
| `GET` | `/api/auth/me` | Yes | None | Get current user info |
| `GET` | `/api/tasks` | Yes | None | List user's tasks |
| `GET` | `/api/tasks/:id` | Yes | None | Get task by ID |
| `POST` | `/api/tasks` | Yes | `{ title, description?, completed? }` | Create new task |
| `PUT` | `/api/tasks/:id` | Yes | `{ title, description?, completed? }` | Replace entire task |
| `PATCH` | `/api/tasks/:id` | Yes | `{ title?, description?, completed? }` | Partial task update |
| `DELETE` | `/api/tasks/:id` | Yes | None | Delete task |
