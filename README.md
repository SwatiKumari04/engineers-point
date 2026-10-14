# Engineers Point

Night canteen ordering app — students order from their hostel rooms, pay by UPI QR,
and pick up when the owner marks the order READY. Built with React, Node/Express, and MongoDB.

**Live:** https://engineers-point-4zxa.onrender.com

- **Flash sale system** — concurrent "grab" clicks are made safe by an atomic
  conditional stock update in MongoDB, so limited stock can never oversell. Proven by a
  test firing 25 simultaneous requests at 5 units: exactly 5 succeed. (It began as an
  in-process FIFO mutex, then moved to a storage-layer guarantee that scales across instances.)
- **Auth** — email-OTP login with scrypt-hashed passwords; the server issues a signed
  **JWT** carrying the user's role, verified on protected routes (owner and per-student).
- **Owner dashboard** — live orders, out-of-stock control, flash sale launcher.
  Try it: Admin Login with `admin@nitjsr`.