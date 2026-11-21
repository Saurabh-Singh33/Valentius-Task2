# TaskMaster Frontend — React + Vite

A responsive single-page React frontend built with Vite, React Router 6, and modern CSS, connected to the Node.js/Express Task API.

---

## 🌟 Key Features & Requirements

### 1. Routes & Pages (`react-router-dom`)
- **`GET /login`**: User authentication form with email and password client-side validation.
- **`GET /register`**: Account creation form with email format checks, min 8-char password checks, and password confirmation matching.
- **`GET /tasks` (List View)**:
  - Displays all tasks owned by the logged-in user.
  - Interactive search bar (filters by title or description in real time).
  - Status filter pills (`All`, `Pending`, `Completed`).
  - Statistics overview cards (Total Tasks, Completed, Pending, and Completion Rate progress bar).
  - Quick-action completion toggle checkbox with optimistic UI feedback.
  - Deletion confirmation modal.
  - Links to view details or edit.
- **`GET /tasks/:id` (Detail View)**:
  - Full task details including title, multi-line description, and status pill.
  - Formatted timestamps for creation date and last updated date.
  - Actions to toggle completion status, edit task, delete task, or return to list.
- **`GET /tasks/new` (Create Task Form)**:
  - Client-side input validation for required title (1–200 characters) and description (up to 2000 characters).
  - Live character counter.
  - Immediate visual feedback on field blur and form submission.
- **`GET /tasks/:id/edit` (Edit Task Form)**:
  - Pre-populates existing task data from the API.
  - Re-uses validation logic with loading states.
- **`*` (404 Not Found)**: Friendly fallback page with a button to return to home.

### 2. Real API Integration & No Mock Data
- Connects directly to the backend Express REST API via `src/services/api.js`.
- Configured with Vite proxy (`/api` -> `http://localhost:3000`) and fallback direct API URL.
- Handles authorization via JWT Bearer tokens stored in `localStorage`.

### 3. Visible Loading & Error States
- Visible spinner components displayed during API fetch operations.
- Error alerts with helpful messages and "Retry" buttons if the network or API fails.
- Graceful offline fallback: if the backend server is stopped or unreachable, the application shows a clear, informative message rather than crashing or showing a blank screen.

### 4. Client-Side Form Validation
- **Title**: Required, trimmed non-empty, max 200 characters.
- **Description**: Optional, max 2000 characters.
- **Email**: Standard email format validation regex.
- **Password**: 8 to 72 characters (matching backend constraints).
- **Confirm Password**: Validates matching passwords on registration.

### 5. State Management
- **`AuthContext` (`src/context/AuthContext.jsx`)**:
  - Global authentication state (`user`, `token`, `isAuthenticated`, `loading`).
  - Restores session automatically on refresh by validating the stored token against `GET /api/auth/me`.
  - Exposes `login()`, `register()`, and `logout()` helpers.
- **Component State**:
  - Local state (`useState`, `useMemo`, `useEffect`) for filters, search, task editing, and optimistic UI updates.

### 6. Responsive Layout
- Fully responsive design engineered for mobile devices (320px+), tablets, and desktop displays.
- Responsive sticky navbar with mobile hamburger menu toggle.
- Responsive grid for stats, flex layouts for toolbars, and adaptive task cards.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app will be available at: **http://localhost:5173**

### 3. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── context/
    │   └── AuthContext.jsx       # Global authentication state
    ├── services/
    │   └── api.js               # API client wrapping fetch
    ├── components/
    │   ├── Navbar.jsx           # Responsive header & auth actions
    │   ├── ProtectedRoute.jsx   # Route guard for authenticated pages
    │   ├── LoadingSpinner.jsx   # Accessible loading spinner
    │   ├── ErrorAlert.jsx       # Error banner with retry button
    │   └── ConfirmModal.jsx     # Delete confirmation dialog
    └── pages/
        ├── TaskListPage.jsx     # Route: /tasks
        ├── TaskDetailPage.jsx   # Route: /tasks/:id
        ├── TaskFormPage.jsx     # Routes: /tasks/new & /tasks/:id/edit
        ├── LoginPage.jsx        # Route: /login
        ├── RegisterPage.jsx     # Route: /register
        └── NotFoundPage.jsx     # Route: *
```
