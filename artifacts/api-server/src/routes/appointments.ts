import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, providersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateAppointmentBody, UpdateAppointmentBody } from "@workspace/api-zod";

const router = Router();

router.get("/slots", async (req, res) => {
  try {
    const { providerId, date } = req.query as { providerId?: string; date?: string };
    if (!providerId || !date) return res.status(400).json({ error: "providerId and date are required" });
    const pid = parseInt(providerId);
    if (isNaN(pid)) return res.status(400).json({ error: "Invalid providerId" });

    const booked = await db
      .select({ time: appointmentsTable.time })
      .from(appointmentsTable)
      .where(and(eq(appointmentsTable.providerId, pid), eq(appointmentsTable.date, date)));

    res.json({ bookedSlots: booked.map((r) => r.time) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

router.get("/", async (req, res) => {
  try {
    const appointments = await db.select().from(appointmentsTable).orderBy(appointmentsTable.createdAt);
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [appointment] = await db
      .select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, id));
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = CreateAppointmentBody.parse(req.body);
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, data.providerId));

    const providerName = provider ? provider.name : "Unknown Provider";

    const [existing] = await db
      .select({ id: appointmentsTable.id })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.providerId, data.providerId),
          eq(appointmentsTable.date, data.date),
          eq(appointmentsTable.time, data.time),
        )
      );

    if (existing) {
      return res.status(409).json({ error: "This slot is already booked. Please choose another time." });
    }

    const [appointment] = await db
      .insert(appointmentsTable)
      .values({
        ...data,
        providerName,
        status: "pending",
      })
      .returning();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = UpdateAppointmentBody.parse(req.body);
    const [appointment] = await db
      .update(appointmentsTable)
      .set(data)
      .where(eq(appointmentsTable.id, id))
      .returning();
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: "Invalid appointment data" });
  }
});

export default router;
