import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, providersTable } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { CreateAppointmentBody, UpdateAppointmentBody } from "@workspace/api-zod";
import { sendApprovalRequestEmail, sendDoctorAssignmentEmail } from "../lib/email.js";
import { writeRateLimiter } from "../middleware/rateLimit.js";
import { isAdminRequest } from "../middleware/requireAdmin.js";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "jamal_alqhaiwi@yahoo.com";

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

    return res.json({ bookedSlots: booked.map((r) => r.time) });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch slots" });
  }
});

router.get("/", async (req, res) => {
  try {
    const isAdmin = await isAdminRequest(req);
    if (isAdmin) {
      const appointments = await db.select().from(appointmentsTable).orderBy(appointmentsTable.createdAt);
      return res.json(appointments);
    }

    const { email, phone } = req.query as { email?: string; phone?: string };
    if (!email || !phone) {
      return res.status(400).json({ error: "email and phone are required to look up appointments" });
    }

    const appointments = await db
      .select()
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.patientEmail, email.toLowerCase().trim()),
          or(isNull(appointmentsTable.patientPhone), eq(appointmentsTable.patientPhone, phone.trim())),
        )
      )
      .orderBy(appointmentsTable.createdAt);
    return res.json(appointments);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch appointments" });
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
    return res.json(appointment);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch appointment" });
  }
});

router.post("/", writeRateLimiter, async (req, res) => {
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

    sendApprovalRequestEmail(appointment, provider, ADMIN_EMAIL).catch((err) =>
      console.error("[appointments] Failed to send approval request email:", err)
    );

    return res.status(201).json(appointment);
  } catch (err) {
    return res.status(400).json({ error: "Invalid appointment data" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = UpdateAppointmentBody.parse(req.body);

    const [existing] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
    if (!existing) return res.status(404).json({ error: "Appointment not found" });

    const becomingConfirmed = data.status === "confirmed" && existing.status !== "confirmed";

    const [appointment] = await db
      .update(appointmentsTable)
      .set({
        ...data,
        ...(becomingConfirmed ? { approvedAt: new Date(), approvedBy: data.approvedBy ?? "Admin" } : {}),
      })
      .where(eq(appointmentsTable.id, id))
      .returning();
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (becomingConfirmed) {
      const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, appointment.providerId));
      sendDoctorAssignmentEmail(appointment, provider).catch((err) =>
        console.error("[appointments] Failed to send doctor assignment email:", err)
      );
    }

    return res.json(appointment);
  } catch (err) {
    return res.status(400).json({ error: "Invalid appointment data" });
  }
});

export default router;
