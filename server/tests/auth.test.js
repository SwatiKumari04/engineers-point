import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { startTestServer } from "./helpers.js";

// Tests run without SMTP configured, so the API returns devPassword.
describe("student auth", () => {
  let server, api;

  before(async () => ({ server, api } = await startTestServer()));
  after(() => server.close());

  const details = { name: "Asha", email: "asha@nitjsr.ac.in", phone: "9111111111" };

  const requestPassword = (body) =>
    api("/auth/student/password", { method: "POST", body: { ...details, ...body } });

  it("issues a password and logs the student in", async () => {
    const issued = await requestPassword();
    assert.equal(issued.status, 200);
    assert.ok(issued.body.devPassword);

    const login = await api("/auth/student/login", {
      method: "POST",
      body: { email: details.email, phone: details.phone, password: issued.body.devPassword },
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.role, "student");
    assert.equal(login.body.name, "Asha");
  });

  it("rejects the same email with a different phone", async () => {
    const res = await requestPassword({ phone: "9222222222" });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, "EMAIL_PHONE_MISMATCH");
  });

  it("rejects the same phone with a different email", async () => {
    const res = await requestPassword({ email: "someoneelse@nitjsr.ac.in" });
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, "EMAIL_PHONE_MISMATCH");
  });

  it("rejects a wrong password", async () => {
    await requestPassword();
    const res = await api("/auth/student/login", {
      method: "POST",
      body: { email: details.email, phone: details.phone, password: "000000" },
    });
    assert.equal(res.status, 401);
  });

  it("rejects login with a mismatched pair even with a valid password", async () => {
    const issued = await requestPassword();
    const res = await api("/auth/student/login", {
      method: "POST",
      body: { email: details.email, phone: "9333333333", password: issued.body.devPassword },
    });
    assert.equal(res.status, 401);
  });
});
