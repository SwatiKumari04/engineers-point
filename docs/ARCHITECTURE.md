# Architecture

## Backend: layered design

Every request flows through the same four layers, each with one responsibility:

```
routes/        which URL maps to which handler, and which guards apply
middleware/    cross-cutting checks (Zod validation, admin auth, error shape)
controllers/   translate HTTP to service calls and back; no business logic
services/      all business rules (pricing, status transitions, flash-sale claims)
stores/        data access; in-memory today, but shaped like a DB adapter
```

Rules I follow to keep the codebase predictable:

- Only `config.js` reads environment variables.
- Only `stores/` touch data. Services never reach into raw arrays owned by another module.
- Only the error middleware writes error responses. Everything else throws `ApiError`, which
  gives every failure the same JSON shape and a machine-readable `code` the client can branch on.
- Prices are never trusted from the client. `orderService.place()` recomputes every line from
  the menu, so a tampered `total` in the request body is simply ignored.

## The flash-sale concurrency problem

A flash sale is a classic limited-inventory race. The naive implementation is broken:

```js
// BROKEN: check-then-act with an await in between
const sale = await db.getSale(id);
if (sale.stock > 0) {          // requests A and B both read stock = 1
  await db.createOrder(...);   // both suspend here...
  sale.stock -= 1;             // ...both decrement: stock = -1, oversold
}
```

Node being single-threaded does not save you: the event loop interleaves requests at every
`await`, so two claims can both pass the stock check before either decrements.

### Solution: a per-sale FIFO mutex

[`Mutex`](../server/src/utils/mutex.js) is a promise chain. Each task starts only after the
previous one settles:

```js
runExclusive(task) {
  const result = this.#tail.then(task);
  this.#tail = result.catch(() => {});  // a failing task must not jam the queue
  return result;
}
```
[`flashSaleService.claim()`](../server/src/services/flashSale.service.js) wraps the whole
critical section (validate sale, check per-user limit, check stock, decrement, mark the
claim PENDING) in `runExclusive`. Claiming only reserves the unit; the order is created
when the student pays. `confirm()` (PAID) turns the reservation into a kitchen order and
`release()` (CANCEL) returns the unit to stock - both also run through the same mutex,
so every stock movement for a sale is serialized. The consequences:

- Claims for one sale execute strictly one at a time, in arrival order, which is exactly the
  fair-queue behaviour a flash sale should have.
- Stock can never go below zero; the (stock+1)-th click gets `409 SOLD_OUT`.
- Each phone number can win at most once per sale (`409 ALREADY_CLAIMED`).
- Sales on different items do not block each other, because there is one lock per sale id.

[The stress test](../server/tests/flash-sale.test.js) fires 25 concurrent claims at 5 units
and asserts that exactly 5 reservations succeed, stock is exactly 0, and the other 20 get
`SOLD_OUT`. The 5 winners then confirm at the QR screen, producing exactly 5 orders. A
separate test proves a cancelled reservation goes back on sale for the next student.

### Scaling this beyond one process

The in-process mutex is correct for a single Node instance. The same invariant ports to bigger
deployments like this:

| Deployment | Mechanism |
| --- | --- |
| Single Node process | per-sale mutex (this repo) |
| MongoDB | `findOneAndUpdate({ _id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })`, an atomic conditional decrement |
| SQL | `UPDATE sales SET stock = stock - 1 WHERE id = ? AND stock > 0` inside a transaction |
| Multi-instance / distributed | Redis decrement-with-check via a Lua script, a distributed lock, or a single-consumer queue |

The service layer is where that swap happens; routes, controllers, and the client do not change.

## Frontend: separation of concerns

- `api/` is the only place `fetch` appears, one file per backend resource.
- `hooks/` hold all state and effects. `usePolling` centralizes the refresh loop, `useCart`
  owns the cart math, `useFlashSales` owns claim-plus-refresh behaviour.
- `components/` are presentational and grouped by feature (`menu/`, `flash/`, `orders/`, `owner/`).
- `pages/` compose screens; `App.jsx` just picks a page based on the logged-in role.
- The dev server proxies `/api` to the backend, so no URL is hardcoded in application code.

Live updates use short-interval polling. It is simple, stateless, and fine at canteen scale
(tens of clients). The endpoints are shaped so an upgrade to Server-Sent Events would only
touch the hooks layer.

## Trade-offs made deliberately

- In-memory stores keep the demo dependency-free; the store interface is the seam where a real
  database plugs in.
- The header-based admin guard (`x-admin-id`) demonstrates authorization layering without a full
  JWT setup; the README roadmap lists the production path.
- Polling instead of WebSockets: at this scale simplicity wins, and the upgrade path is isolated
  to the hooks.
