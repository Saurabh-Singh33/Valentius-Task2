require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { DatabaseSync } = require("node:sqlite");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in the environment");
}

const app = express();
const db = new DatabaseSync("tasks.db");
const jwtSecret = process.env.JWT_SECRET;

db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(cors());
app.use(express.json({ limit: "10kb" }));

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function validateCredentials(req, res, next) {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
    return sendError(res, 400, "A valid email is required");
  }
  if (
    typeof password !== "string" ||
    Buffer.byteLength(password, "utf8") < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return sendError(res, 400, "Password must be between 8 and 72 bytes");
  }
  req.credentials = { email: email.trim().toLowerCase(), password };
  next();
}

function authenticate(req, res, next) {
  const match = req.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return sendError(res, 401, "A bearer token is required");

  try {
    const payload = jwt.verify(match[1], jwtSecret);
    if (typeof payload !== "object" || typeof payload.sub !== "number") {
      return sendError(res, 401, "Invalid token");
    }
    req.userId = payload.sub;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
}

function validateTask(req, res, next) {
  const { title, description = "", completed = false } = req.body ?? {};
  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return sendError(res, 400, "Title is required and must be 200 characters or fewer");
  }
  if (typeof description !== "string" || description.length > 2000) {
    return sendError(res, 400, "Description must be a string of 2000 characters or fewer");
  }
  if (typeof completed !== "boolean") {
    return sendError(res, 400, "Completed must be a boolean");
  }
  req.task = { title: title.trim(), description, completed };
  next();
}

function createToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: "1h" });
}

function formatTask(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: Boolean(task.completed),
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

app.post("/api/auth/register", validateCredentials, async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.credentials.password, 12);
    const result = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(req.credentials.email, passwordHash);
    const user = { id: Number(result.lastInsertRowid), email: req.credentials.email };
    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return sendError(res, 409, "Email is already registered");
    }
    return next(error);
  }
});

app.post("/api/auth/login", validateCredentials, async (req, res, next) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(req.credentials.email);
    if (!user || !(await bcrypt.compare(req.credentials.password, user.password_hash))) {
      return sendError(res, 401, "Invalid email or password");
    }
    const publicUser = { id: user.id, email: user.email };
    return res.json({ user: publicUser, token: createToken(publicUser) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", authenticate, (req, res) => {
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId);
  if (!user) return sendError(res, 404, "User not found");
  res.json({ user });
});

app.use("/api/tasks", authenticate);

app.get("/api/tasks", (req, res) => {
  const tasks = db
    .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id")
    .all(req.userId)
    .map(formatTask);
  res.json({ tasks });
});

app.get("/api/tasks/:id", (req, res) => {
  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!task) return sendError(res, 404, "Task not found");
  res.json({ task: formatTask(task) });
});

app.post("/api/tasks", validateTask, (req, res) => {
  const result = db
    .prepare(
      "INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)",
    )
    .run(req.userId, req.task.title, req.task.description, Number(req.task.completed));
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ task: formatTask(task) });
});

app.put("/api/tasks/:id", validateTask, (req, res) => {
  const result = db
    .prepare(`
      UPDATE tasks
      SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `)
    .run(req.task.title, req.task.description, Number(req.task.completed), req.params.id, req.userId);
  if (!result.changes) return sendError(res, 404, "Task not found");

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  res.json({ task: formatTask(task) });
});

app.patch("/api/tasks/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  if (!existing) return sendError(res, 404, "Task not found");

  const title = req.body?.title !== undefined ? req.body.title : existing.title;
  const description = req.body?.description !== undefined ? req.body.description : existing.description;
  const completed = req.body?.completed !== undefined ? req.body.completed : Boolean(existing.completed);

  if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
    return sendError(res, 400, "Title is required and must be 200 characters or fewer");
  }
  if (typeof description !== "string" || description.length > 2000) {
    return sendError(res, 400, "Description must be a string of 2000 characters or fewer");
  }
  if (typeof completed !== "boolean") {
    return sendError(res, 400, "Completed must be a boolean");
  }

  db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title.trim(), description, Number(completed), req.params.id, req.userId);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.userId);
  res.json({ task: formatTask(task) });
});

app.delete("/api/tasks/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (!result.changes) return sendError(res, 404, "Task not found");
  res.status(204).end();
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, 400, "Request body must be valid JSON");
  }
  console.error(err);
  return sendError(res, 500, "Internal server error");
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Task API listening on port ${port}`));
