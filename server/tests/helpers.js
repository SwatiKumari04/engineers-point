import { createApp } from "../src/app.js";
import { config } from "../src/config.js";

// Starts the real app on a random free port and returns a small fetch helper,
// so tests exercise actual HTTP instead of calling functions directly.
export async function startTestServer() {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  const api = async (path, { method = "GET", body, admin = false } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body && { "content-type": "application/json" }),
        ...(admin && { "x-admin-id": config.adminId }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, ok: res.ok, body: await res.json() };
  };

  return { server, api };
}

export const testCustomer = (n) => ({
  name: `Student ${n}`,
  phone: `9${String(n).padStart(9, "0")}`,
  email: `student${n}@nitjsr.ac.in`,
});
