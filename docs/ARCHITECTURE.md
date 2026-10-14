# Architecture

## Backend: layered design

Every request flows through the same layers, each with one responsibility:

```
routes/        which URL maps to which handler, and which guards apply
middleware/    cross-cutting checks (Zod validation, JWT auth, rate limiting, error shape)
controllers/   translate HTTP to service calls and back; no business logic
services/      all business rules (pricing, status transitions, flash-sale claims)
stores/        data access to MongoDB, behind a DB-adapter-shaped interface
```

Rules I follow to keep the codebase predictable:

- Only `config.js` reads environment variables.
- Only `stores/` touch data. Nothing above them knows whether it lives in MongoDB or memory.
- Only the error middleware writes error responses. Everything else throws `ApiError`, which
  gives every failure the same JSON shape and a machine-readable `code` the client can branch on.
- Prices are never trusted from the client. `orderService.place()` recomputes every line from
  the menu, so a tampered `total` in the request body is simply ignored.
- Identity is never trusted from the client. The server issues a signed JWT at login; middleware
  verifies it and reads the role/phone from the token, not from the request.

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

### Solution: an atomic conditional update in the database

Make "check stock and decrement" one indivisible step that the database performs atomically:

```js
// flashSaleStore.tryClaim — a single atomic operation
findOneAndUpdate(
  { id, status: { $ne: "ENDED" }, endsAt: { $gt: now },
    stock: { $gt: 0 }, [`claimedBy.${phone}`]: { $exists: false } },
  { $inc: { stock: -1 },
    $set: { [`claimedBy.${phone}`]: { state: "PENDING", at: now } } },
)
```

MongoDB applies writes to a single document one at a time, so the `stock > 0` check and the
decrement can never interleave. Exactly the stocked quantity wins; the next claim matches
nothing and `flashSaleService.claim()` returns `409 SOLD_OUT`. Claiming only reserves a unit;
the order is created when the student pays. `confirm()` (PAID → order) and `release()`
(CANCEL → unit back) are atomic updates too, so a double-PAID cannot create two orders, and a
reservation that is never paid is swept back to stock after a short TTL.

Consequences:

- Stock can never go below zero; the (stock+1)-th click gets `409 SOLD_OUT`.
- Each phone number can win at most once per sale (`409 ALREADY_CLAIMED`).
- Sales on different items never block each other.

[The stress test](../server/tests/flash-sale.test.js) fires 25 concurrent claims at 5 units and
asserts that exactly 5 reservations succeed, stock is exactly 0, and the other 20 get `SOLD_OUT`.
The 5 winners then confirm, producing exactly 5 orders. It runs in CI on every push.

### How this evolved — the key point

The first version solved the same race with a per-sale in-process **FIFO mutex** (a promise chain
that serialised claims). That is correct for a single Node process, but a lock in memory only
guards that one process. Moving the invariant into the database's atomic update makes it hold even
across many server instances behind a load balancer — same guarantee, stronger mechanism.

| Deployment | Mechanism |
| --- | --- |
| Single Node process | an in-process per-sale mutex (the first version) |
| MongoDB (this repo) | `findOneAndUpdate({ _id, stock: { $gt: 0 } }, { $inc: { stock: -1 } })`, an atomic conditional decrement |
| SQL | `UPDATE sales SET stock = stock - 1 WHERE id = ? AND stock > 0` inside a transaction |
| Multi-instance / distributed | Redis decrement-with-check via a Lua script, or a single-consumer queue |

The service layer is where that mechanism lives; routes, controllers, and the client do not change.

## Frontend: separation of concerns

- `api/` is the only place `fetch` appears, one file per backend resource; a shared `http.js`
  attaches the JWT to every request.
- `hooks/` hold all state and effects. `usePolling` centralizes the refresh loop, `useCart`
  owns the cart math, `useFlashSales` owns claim-plus-refresh behaviour.
- `components/` are presentational and grouped by feature (`menu/`, `flash/`, `orders/`, `owner/`).
- `pages/` compose screens; `App.jsx` just picks a page based on the logged-in role.
- The dev server proxies `/api` to the backend, so no URL is hardcoded in application code.

Live updates use short-interval polling. It is simple, stateless, and fine at canteen scale
(tens of clients). The endpoints are shaped so an upgrade to Server-Sent Events would only
touch the hooks layer.

## Trade-offs made deliberately

- Data lives in MongoDB (Atlas); the store interface is the adapter seam, so swapping databases
  touches only `stores/`.
- Auth uses signed JWTs: the server issues a token at login carrying the user's role, and
  middleware verifies it on protected routes (owner-only and per-student).
- Rate limiting is applied to the auth endpoints, and only in production; the flash-sale claim is
  left unthrottled on purpose, since hostel students share one NAT IP during the rush.
- Polling instead of WebSockets: at this scale simplicity wins, and the upgrade path is isolated
  to the hooks.
