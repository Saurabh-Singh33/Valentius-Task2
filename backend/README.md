# Minimal Task API

A Node.js 22.5+ REST API built with Express, SQLite, bcrypt password hashing, and JWT authentication.
It uses Node's built-in `node:sqlite` module, which is experimental in Node 22.

## Setup

```sh
npm install
```

Copy `.env.example` to `.env` and set `JWT_SECRET` to a long, random value. Then start the API:

```sh
npm start
```

The server listens on port `3000` by default. Set `PORT` to change it. SQLite creates `tasks.db` in the current directory on first start.

## Authentication

Register or log in to receive a JWT. Send it on every task request as:

```http
Authorization: Bearer <token>
```

Tokens expire after one hour. Users can access only their own tasks.

## Endpoints

All request and response bodies use JSON except `DELETE`, which returns an empty `204` response. Error responses have the shape `{ "error": "message" }`.

### Register

`POST /api/auth/register` — public.

Request:

```json
{ "email": "sam@example.com", "password": "securepass123" }
```

Email must be valid; password must be 8–72 UTF-8 bytes.

Success (`201`):

```json
{
  "user": { "id": 1, "email": "sam@example.com" },
  "token": "<jwt>"
}
```

Returns `400` for invalid input and `409` if the email is already registered.

### Log in

`POST /api/auth/login` — public.

Request uses the same fields as registration. Success (`200`) returns the same `{ "user", "token" }` shape. Returns `400` for invalid input and `401` for incorrect credentials.

### Get current user profile

`GET /api/auth/me` — requires authentication.

Success (`200`):

```json
{
  "user": { "id": 1, "email": "sam@example.com" }
}
```

Returns `401` if token is missing or invalid.

### List tasks

`GET /api/tasks` — requires authentication.

Success (`200`):

```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Read a book",
      "description": "",
      "completed": false,
      "createdAt": "2026-01-01 12:00:00",
      "updatedAt": "2026-01-01 12:00:00"
    }
  ]
}
```

### Get a task

`GET /api/tasks/:id` — requires authentication.

Success (`200`): `{ "task": { ... } }`, using the task shape above. Returns `404` if the task does not exist or belongs to another user.

### Create a task

`POST /api/tasks` — requires authentication.

Request:

```json
{ "title": "Read a book", "description": "Chapter one", "completed": false }
```

`title` is required (1–200 characters); `description` is optional (up to 2000 characters, defaults to an empty string); `completed` is optional (boolean, defaults to `false`).

Success (`201`): `{ "task": { ... } }`. Returns `400` for invalid input.

### Replace a task

`PUT /api/tasks/:id` — requires authentication.

Request uses the same fields and validation as task creation; omitted optional fields use their defaults. Success (`200`): `{ "task": { ... } }`. Returns `400` for invalid input and `404` if the task does not exist or belongs to another user.

### Partially update a task

`PATCH /api/tasks/:id` — requires authentication.

Request can include any subset of `title`, `description`, and `completed`. Fields not provided retain their previous values.

Success (`200`): `{ "task": { ... } }`. Returns `400` for invalid input and `404` if the task does not exist or belongs to another user.

### Delete a task

`DELETE /api/tasks/:id` — requires authentication.

Success: empty response (`204`). Returns `404` if the task does not exist or belongs to another user.

Protected endpoints return `401` when the bearer token is missing, invalid, or expired. Malformed JSON returns `400`.
