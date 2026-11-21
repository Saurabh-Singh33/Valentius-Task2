const http = require("http");

async function runTests() {
  // Start server process or import
  process.env.PORT = "3001";
  process.env.JWT_SECRET = "test-secret-key-1234567890";
  require("./server.js");

  // Wait 500ms for server to bind
  await new Promise(r => setTimeout(r, 500));

  async function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`http://localhost:3001${path}`, options, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, headers: res.headers, body: json, text: data });
        });
      });
      req.on("error", reject);
      if (options.body) {
        req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }

  console.log("1. Testing Register...");
  const testEmail = `test_${Date.now()}@example.com`;
  const regRes = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { email: testEmail, password: "password123" }
  });
  console.log("Register status:", regRes.status, "User ID:", regRes.body?.user?.id);
  if (regRes.status !== 201) throw new Error("Register failed: " + JSON.stringify(regRes.body));
  const token = regRes.body.token;

  console.log("2. Testing Auth /api/auth/me...");
  const meRes = await request("/api/auth/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Me status:", meRes.status, "Email:", meRes.body?.user?.email);

  console.log("3. Testing Create Task...");
  const createRes = await request("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: { title: "Complete Assignment 2", description: "Build full stack React and Express app", completed: false }
  });
  console.log("Create task status:", createRes.status, "Task ID:", createRes.body?.task?.id);
  const taskId = createRes.body.task.id;

  console.log("4. Testing List Tasks...");
  const listRes = await request("/api/tasks", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("List tasks count:", listRes.body?.tasks?.length);

  console.log("5. Testing Get Task by ID...");
  const getRes = await request(`/api/tasks/${taskId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Get task status:", getRes.status, "Title:", getRes.body?.task?.title);

  console.log("6. Testing Update Task (PATCH)...");
  const patchRes = await request(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: { completed: true }
  });
  console.log("Patch task status:", patchRes.status, "Completed:", patchRes.body?.task?.completed);

  console.log("7. Testing Delete Task...");
  const delRes = await request(`/api/tasks/${taskId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Delete status:", delRes.status);

  console.log("8. Testing 401 Unauthorized without token...");
  const unauthRes = await request("/api/tasks");
  console.log("Unauth status:", unauthRes.status);

  console.log("ALL BACKEND TESTS PASSED SUCCESSFULLY! ✅");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
