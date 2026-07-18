import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, testCustomer } from "./helpers.js";

describe("flash sale API", () => {
  let server, api;

  before(async () => ({ server, api } = await startTestServer()));
  after(() => server.close());

  const launchSale = (overrides = {}) =>
    api("/flash-sales", {
      method: "POST",
      admin: true,
      body: { itemId: "mo2", salePrice: 50, stock: 5, durationMinutes: 10, ...overrides },
    });

  it("only the owner can launch a sale", async () => {
    const res = await api("/flash-sales", {
      method: "POST",
      body: { itemId: "m1", salePrice: 20, stock: 5, durationMinutes: 10 },
    });
    assert.equal(res.status, 401);
  });

  it("rejects a sale price above the regular price", async () => {
    const res = await launchSale({ itemId: "d1", salePrice: 999 });
    assert.equal(res.status, 400);
  });

  it("never oversells: 25 simultaneous clicks, 5 in stock → exactly 5 orders", async () => {
    const launched = await launchSale();
    assert.equal(launched.status, 201);
    const saleId = launched.body.id;

    // 25 different students fire claims at the same time
    const claims = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: testCustomer(100 + i) } }),
      ),
    );

    const won = claims.filter((r) => r.status === 201);
    const soldOut = claims.filter((r) => r.status === 409 && r.body.error.code === "SOLD_OUT");

    assert.equal(won.length, 5, "exactly the stocked quantity must be reserved");
    assert.equal(soldOut.length, 20, "everyone else must get a clean SOLD_OUT");

    // stock must be exactly zero (not negative) and the sale marked SOLD_OUT
    const current = await api("/flash-sales/current");
    const sale = current.body.find((s) => s.id === saleId);
    assert.equal(sale.stock, 0);
    assert.equal(sale.status, "SOLD_OUT");

    // every winner pays at the QR screen; each reservation becomes an order
    const confirms = await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        api(`/flash-sales/${saleId}/confirm`, { method: "POST", body: { customer: testCustomer(100 + i) } }),
      ),
    );
    const orders = confirms.filter((r) => r.status === 201);
    assert.equal(orders.length, 5, "only reserved students can confirm");
    assert.ok(orders.every((r) => r.body.order.total === 50), "winners pay the sale price");

    // and exactly 5 flash orders exist in the system
    const all = await api("/orders/all", { admin: true });
    const flashOrders = all.body.filter((o) => o.flashSaleId === saleId);
    assert.equal(flashOrders.length, 5);
  });

  it("returns a cancelled claim to stock so someone else can grab it", async () => {
    const launched = await launchSale({ itemId: "d2", salePrice: 30, stock: 1 });
    const saleId = launched.body.id;
    const [alice, bob] = [testCustomer(700), testCustomer(701)];

    // Alice reserves the only unit; the sale reads sold out for everyone else
    assert.equal((await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: alice } })).status, 201);
    const blocked = await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: bob } });
    assert.equal(blocked.body.error.code, "SOLD_OUT");

    // Alice cancels at the QR screen: the unit is back on sale and Bob wins it
    const released = await api(`/flash-sales/${saleId}/release`, { method: "POST", body: { customer: alice } });
    assert.equal(released.status, 200);
    assert.equal(released.body.stockLeft, 1);
    assert.equal((await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: bob } })).status, 201);

    // Alice gave up her unit, so she has nothing to confirm
    const confirm = await api(`/flash-sales/${saleId}/confirm`, { method: "POST", body: { customer: alice } });
    assert.equal(confirm.status, 409);
    assert.equal(confirm.body.error.code, "NO_PENDING_CLAIM");
  });

  it("honors a reservation even if the owner ends the sale before PAID", async () => {
    const launched = await launchSale({ itemId: "s1", salePrice: 10, stock: 3 });
    const saleId = launched.body.id;
    const student = testCustomer(800);

    await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: student } });
    await api(`/flash-sales/${saleId}/end`, { method: "PATCH", admin: true });

    const confirmed = await api(`/flash-sales/${saleId}/confirm`, { method: "POST", body: { customer: student } });
    assert.equal(confirmed.status, 201);
    assert.equal(confirmed.body.order.total, 10);

    // paying once is final: a second PAID cannot create a second order
    const again = await api(`/flash-sales/${saleId}/confirm`, { method: "POST", body: { customer: student } });
    assert.equal(again.status, 409);
  });

  it("caps each student at one claim per sale", async () => {
    const launched = await launchSale({ itemId: "b3", salePrice: 40, stock: 10 });
    const saleId = launched.body.id;
    const student = testCustomer(500);

    const [first, second] = [
      await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: student } }),
      await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: student } }),
    ];

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.equal(second.body.error.code, "ALREADY_CLAIMED");
  });

  it("stops claims once the owner ends the sale", async () => {
    const launched = await launchSale({ itemId: "p1", salePrice: 60, stock: 10 });
    const saleId = launched.body.id;

    await api(`/flash-sales/${saleId}/end`, { method: "PATCH", admin: true });

    const res = await api(`/flash-sales/${saleId}/claim`, { method: "POST", body: { customer: testCustomer(600) } });
    assert.equal(res.status, 410);
    assert.equal(res.body.error.code, "SALE_ENDED");
  });
});
