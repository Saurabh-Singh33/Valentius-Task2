const { Pool } = require("pg");
const { DatabaseSync } = require("node:sqlite");

const isPostgres = Boolean(process.env.DATABASE_URL);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  // Use PostgreSQL hosted instance
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.DATABASE_URL.includes("localhost") ||
      process.env.DATABASE_URL.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });
} else {
  // Fallback to SQLite for local development/testing without Postgres
  sqliteDb = new DatabaseSync("tasks.db");
}

function formatTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function initDb() {
  if (isPostgres) {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          completed BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Connected to PostgreSQL database and verified tables.");
    } finally {
      client.release();
    }
  } else {
    sqliteDb.exec(`
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
    console.log("Connected to local SQLite database (tasks.db).");
  }
}

// User methods
async function findUserByEmail(email) {
  if (isPostgres) {
    const res = await pgPool.query("SELECT * FROM users WHERE email = $1", [email]);
    return res.rows[0] || null;
  } else {
    return sqliteDb.prepare("SELECT * FROM users WHERE email = ?").get(email) || null;
  }
}

async function findUserById(id) {
  if (isPostgres) {
    const res = await pgPool.query("SELECT id, email FROM users WHERE id = $1", [id]);
    return res.rows[0] || null;
  } else {
    return sqliteDb.prepare("SELECT id, email FROM users WHERE id = ?").get(id) || null;
  }
}

async function createUser(email, passwordHash) {
  if (isPostgres) {
    const res = await pgPool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, passwordHash]
    );
    return res.rows[0];
  } else {
    const result = sqliteDb
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(email, passwordHash);
    return { id: Number(result.lastInsertRowid), email };
  }
}

// Task methods
async function getTasks(userId) {
  if (isPostgres) {
    const res = await pgPool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id",
      [userId]
    );
    return res.rows.map(formatTask);
  } else {
    return sqliteDb
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id")
      .all(userId)
      .map(formatTask);
  }
}

async function getTaskById(id, userId) {
  if (isPostgres) {
    const res = await pgPool.query(
      "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return formatTask(res.rows[0]);
  } else {
    const task = sqliteDb
      .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
      .get(id, userId);
    return formatTask(task);
  }
}

async function createTask(userId, { title, description, completed }) {
  if (isPostgres) {
    const res = await pgPool.query(
      "INSERT INTO tasks (user_id, title, description, completed) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, title, description || "", Boolean(completed)]
    );
    return formatTask(res.rows[0]);
  } else {
    const result = sqliteDb
      .prepare("INSERT INTO tasks (user_id, title, description, completed) VALUES (?, ?, ?, ?)")
      .run(userId, title, description || "", Number(completed));
    const task = sqliteDb.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    return formatTask(task);
  }
}

async function updateTask(id, userId, { title, description, completed }) {
  if (isPostgres) {
    const res = await pgPool.query(
      `UPDATE tasks
       SET title = $1, description = $2, completed = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description || "", Boolean(completed), id, userId]
    );
    return formatTask(res.rows[0]);
  } else {
    const result = sqliteDb
      .prepare(`
        UPDATE tasks
        SET title = ?, description = ?, completed = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `)
      .run(title, description || "", Number(completed), id, userId);
    if (!result.changes) return null;
    const task = sqliteDb.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(id, userId);
    return formatTask(task);
  }
}

async function patchTask(id, userId, updates) {
  const existing = await getTaskById(id, userId);
  if (!existing) return null;

  const title = updates.title !== undefined ? updates.title : existing.title;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const completed = updates.completed !== undefined ? updates.completed : existing.completed;

  return updateTask(id, userId, { title, description, completed });
}

async function deleteTask(id, userId) {
  if (isPostgres) {
    const res = await pgPool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    return res.rowCount > 0;
  } else {
    const result = sqliteDb
      .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
      .run(id, userId);
    return result.changes > 0;
  }
}

module.exports = {
  isPostgres,
  initDb,
  findUserByEmail,
  findUserById,
  createUser,
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
};
