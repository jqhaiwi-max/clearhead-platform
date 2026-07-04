import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable, testimonialsTable } from "@workspace/db";

const router = Router();

router.get("/platform", async (req, res) => {
  try {
    const providers = await db.select().from(providersTable);
    const testimonials = await db.select().from(testimonialsTable);

    const totalProviders = providers.length;
    const avgRating =
      testimonials.length > 0
        ? Math.round((testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length) * 10) / 10
        : 4.9;

    res.json({
      totalProviders,
      totalPatients: 12847,
      totalSessions: 58312,
      avgRating,
      countriesServed: 47,
      satisfactionRate: 97.3,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch platform stats" });
  }
});

export default router;
