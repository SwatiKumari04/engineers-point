import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, testCustomer } from "./helpers.js";

describe("orders API", () => {
  let server, api;

  before(async () => ({ server, api } = await startTestServer()));
  after(() => server.close());

  it("serves the menu with availability flags", async () => {
    const res = await api("/menu");
    assert.equal(res.status, 200);
    assert.ok(res.body.length >= 20);
    assert.ok(res.body.every((item) => item.available === true));
  });

  it("computes the total server-side and never trusts the client", async () => {
    const res = await api("/orders", {
      method: "POST",
      body: {
        customer: testCustomer(1),
        items: [{ itemId: "m1", qty: 2 }, { itemId: "d1", qty: 1 }], // 2x30 + 10
        total: 1, // the server must ignore this and compute its own total
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.order.total, 70);
    assert.equal(res.body.order.status, "PREPARING");
    assert.ok(res.body.order.orderNo.startsWith("EP-"));
    assert.deepEqual(res.body.droppedItems, []);
  });

  it("rejects an invalid phone number", async () => {
    const res = await api("/orders", {
      method: "POST",
      body: { customer: { ...testCustomer(2), phone: "123" }, items: [{ itemId: "m1", qty: 1 }] },
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("rejects an unknown menu item", async () => {
    const res = await api("/orders", {
      method: "POST",
      body: { customer: testCustomer(3), items: [{ itemId: "nope", qty: 1 }] },
    });
    assert.equal(res.status, 400);
  });

  it("blocks availability changes without the admin header", async () => {
    const res = await api("/menu/m1/availability", { method: "PATCH", body: { available: false } });
    assert.equal(res.status, 401);
  });

  it("drops out-of-stock items and prepares the rest", async () => {
    const marked = await api("/menu/mo3/availability", {
      method: "PATCH",
      admin: true,
      body: { available: false },
    });
    assert.equal(marked.status, 200);
    assert.equal(marked.body.available, false);

    const res = await api("/orders", {
      method: "POST",
      body: {
        customer: testCustomer(4),
        items: [{ itemId: "mo3", qty: 1 }, { itemId: "m1", qty: 1 }],
      },
    });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body.droppedItems, ["Fried Momos"]);
    assert.equal(res.body.order.total, 30); // only the Plain Maggi
  });

  it("rejects the order when every item is out of stock", async () => {
    const res = await api("/orders", {
      method: "POST",
      body: { customer: testCustomer(5), items: [{ itemId: "mo3", qty: 2 }] },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "OUT_OF_STOCK");
  });

  it("lets a student see only their own orders", async () => {
    const mine = await api(`/orders?phone=${testCustomer(1).phone}`);
    assert.equal(mine.status, 200);
    assert.ok(mine.body.length >= 1);
    assert.ok(mine.body.every((o) => o.customer.phone === testCustomer(1).phone));
  });

  it("blocks the owner order list without the admin header", async () => {
    const res = await api("/orders/all");
    assert.equal(res.status, 401);
  });

  it("lets the owner mark an order ready, once", async () => {
    const all = await api("/orders/all", { admin: true });
    const orderId = all.body[0].id;

    const ready = await api(`/orders/${orderId}/ready`, { method: "PATCH", admin: true });
    assert.equal(ready.status, 200);
    assert.equal(ready.body.status, "READY");

    const again = await api(`/orders/${orderId}/ready`, { method: "PATCH", admin: true });
    assert.equal(again.status, 409);
  });
});
