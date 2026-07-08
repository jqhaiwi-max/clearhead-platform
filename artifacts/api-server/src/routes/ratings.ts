import { Router } from "express";
import { db, ratingsTable, providersTable } from "@workspace/db";
import { eq, avg, count } from "drizzle-orm";
import { writeRateLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/", writeRateLimiter, async (req, res) => {
  try {
    const { appointmentId, providerId, patientName, rating, mood, notes, sessionDate } = req.body;
    if (!providerId || !patientName || !rating || !sessionDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    const [newRating] = await db.insert(ratingsTable).values({
      appointmentId: appointmentId ?? null,
      providerId,
      patientName,
      rating,
      mood: mood ?? null,
      notes: notes ?? null,
      sessionDate,
    }).returning();

    const stats = await db
      .select({ avg: avg(ratingsTable.rating), count: count() })
      .from(ratingsTable)
      .where(eq(ratingsTable.providerId, providerId));

    const newAvg = Number(stats[0]?.avg ?? rating);
    const newCount = Number(stats[0]?.count ?? 1);

    await db
      .update(providersTable)
      .set({ rating: Math.round(newAvg * 10) / 10, reviewCount: newCount })
      .where(eq(providersTable.id, providerId));

    return res.status(201).json(newRating);
  } catch (err) {
    return res.status(500).json({ error: "Failed to submit rating" });
  }
});

router.get("/provider/:providerId", async (req, res) => {
  try {
    const providerId = parseInt(req.params.providerId);
    const ratings = await db
      .select()
      .from(ratingsTable)
      .where(eq(ratingsTable.providerId, providerId))
      .orderBy(ratingsTable.createdAt);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

export default router;
