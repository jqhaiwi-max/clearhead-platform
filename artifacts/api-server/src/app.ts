import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Cache-Control headers for GET requests ── */
app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    const p = req.path;
    if (
      p.startsWith("/providers") ||
      p.startsWith("/specialties") ||
      p.startsWith("/testimonials") ||
      p.startsWith("/stats")
    ) {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    } else {
      res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    }
  }
  next();
});

app.use("/api", router);

export default app;
