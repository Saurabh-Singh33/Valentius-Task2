require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in the environment");
}

const app = express();
const jwtSecret = process.env.JWT_SECRET;

// CORS configuration allowing frontend clients (Vercel, Netlify, localhost)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function validateCredentials(req, res, next) {
  const { email, password } = req.body ?? {};
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.length > 254
  ) {
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

// Health check endpoint for Render / Railway / status monitoring
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: db.isPostgres ? "postgresql" : "sqlite",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Task API is running",
    endpoints: {
      health: "/api/health",
      register: "POST /api/auth/register",
      login: "POST /api/auth/login",
      tasks: "/api/tasks",
    },
  });
});

// Authentication endpoints
app.post("/api/auth/register", validateCredentials, async (req, res, next) => {
  try {
    const passwordHash = await bcrypt.hash(req.credentials.password, 12);
    const user = await db.createUser(req.credentials.email, passwordHash);
    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.code === "23505") {
      return sendError(res, 409, "Email is already registered");
    }
    return next(error);
  }
});

app.post("/api/auth/login", validateCredentials, async (req, res, next) => {
  try {
    const user = await db.findUserByEmail(req.credentials.email);
    if (!user || !(await bcrypt.compare(req.credentials.password, user.password_hash))) {
      return sendError(res, 401, "Invalid email or password");
    }
    const publicUser = { id: user.id, email: user.email };
    return res.json({ user: publicUser, token: createToken(publicUser) });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/auth/me", authenticate, async (req, res, next) => {
  try {
    const user = await db.findUserById(req.userId);
    if (!user) return sendError(res, 404, "User not found");
    res.json({ user });
  } catch (error) {
    return next(error);
  }
});

// Protected Task Routes
app.use("/api/tasks", authenticate);

app.get("/api/tasks", async (req, res, next) => {
  try {
    const tasks = await db.getTasks(req.userId);
    res.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await db.getTaskById(req.params.id, req.userId);
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ task });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/tasks", validateTask, async (req, res, next) => {
  try {
    const task = await db.createTask(req.userId, req.task);
    res.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/tasks/:id", validateTask, async (req, res, next) => {
  try {
    const task = await db.updateTask(req.params.id, req.userId, req.task);
    if (!task) return sendError(res, 404, "Task not found");
    res.json({ task });
  } catch (error) {
    return next(error);
  }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const existing = await db.getTaskById(req.params.id, req.userId);
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

    const task = await db.updateTask(req.params.id, req.userId, {
      title: title.trim(),
      description,
      completed,
    });
    res.json({ task });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const deleted = await db.deleteTask(req.params.id, req.userId);
    if (!deleted) return sendError(res, 404, "Task not found");
    res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, 400, "Request body must be valid JSON");
  }
  console.error("Unhandled error:", err);
  return sendError(res, 500, "Internal server error");
});

const port = Number(process.env.PORT) || 3000;

// Initialize database and start server
async function startServer() {
  try {
    await db.initDb();
    app.listen(port, () => console.log(`Task API listening on port ${port}`));
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }
}

startServer();
