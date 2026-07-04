import { Router } from "express";
import { db } from "@workspace/db";
import { specialtiesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const specialties = await db.select().from(specialtiesTable);
    res.json(specialties);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch specialties" });
  }
});

export default router;
