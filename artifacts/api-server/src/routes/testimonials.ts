import { Router } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db";
import { CreateTestimonialBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const testimonials = await db
      .select()
      .from(testimonialsTable)
      .orderBy(testimonialsTable.createdAt);
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = CreateTestimonialBody.parse(req.body);
    const initials = data.patientName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const [testimonial] = await db
      .insert(testimonialsTable)
      .values({ ...data, avatarInitials: initials })
      .returning();
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(400).json({ error: "Invalid testimonial data" });
  }
});

export default router;
