import express from "express";
import cors from "cors";
import path from "node:path";

import { config } from "./config.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

// Builds the app without calling listen(), so tests can mount it on a random port.
export function createApp() {
  const app = express();

  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());

  app.use("/api/v1", apiRouter);

  if (config.serveClient) {
    const clientDist = path.resolve(import.meta.dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api")) return next(); // unknown API routes stay JSON 404s
      res.sendFile(path.join(clientDist, "index.html")); // SPA fallback
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
