import { createApp } from "../src/app.js";
import { config } from "../src/config.js";
import { connectDb, resetDatabase, closeDb } from "../src/db.js";
import { signToken } from "../src/utils/jwt.js";

const TEST_DB = `${config.dbName}_test`;

export const adminToken = () => signToken({ name: "Owner", role: "owner" });
export const studentToken = (customer) => signToken({ ...customer, role: "student" });

export async function startTestServer() {
  await connectDb(TEST_DB);
  await resetDatabase();
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  const api = async (path, { method = "GET", body, admin = false, token } = {}) => {
    const auth = admin ? adminToken() : token;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body && { "content-type": "application/json" }),
        ...(auth && { authorization: `Bearer ${auth}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, ok: res.ok, body: await res.json() };
  };

  return { server, api };
}

export async function stopTestServer(server) {
  await new Promise((resolve) => server.close(resolve));
  await closeDb();
}

export const testCustomer = (n) => ({
  name: `Student ${n}`,
  phone: `9${String(n).padStart(9, "0")}`,
  email: `student${n}@nitjsr.ac.in`,
});