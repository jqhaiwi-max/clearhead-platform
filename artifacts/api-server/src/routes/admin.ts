import { Router } from "express";
import { db } from "@workspace/db";
import {
  appointmentsTable,
  providersTable,
  paymentsTable,
  ratingsTable,
} from "@workspace/db";
import { eq, desc, count, sql, inArray } from "drizzle-orm";
import { sendDoctorAssignmentEmail } from "../lib/email.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const [totalProviders] = await db.select({ count: count() }).from(providersTable);
    const [totalAppointments] = await db.select({ count: count() }).from(appointmentsTable);
    const [totalPayments] = await db.select({ count: count() }).from(paymentsTable);
    const [totalRevenue] = await db
      .select({ sum: sql<number>`coalesce(sum(amount),0)` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "completed"));

    const today = new Date().toISOString().split("T")[0];
    const [todayAppts] = await db
      .select({ count: count() })
      .from(appointmentsTable)
      .where(eq(appointmentsTable.date, today));

    const [confirmedAppts] = await db
      .select({ count: count() })
      .from(appointmentsTable)
      .where(eq(appointmentsTable.status, "confirmed"));

    const [pendingAppts] = await db
      .select({ count: count() })
      .from(appointmentsTable)
      .where(eq(appointmentsTable.status, "pending"));

    const recentAppointments = await db
      .select()
      .from(appointmentsTable)
      .orderBy(desc(appointmentsTable.createdAt))
      .limit(5);

    res.json({
      totalProviders: totalProviders.count,
      totalAppointments: totalAppointments.count,
      totalPayments: totalPayments.count,
      totalRevenue: totalRevenue.sum ?? 0,
      todayAppointments: todayAppts.count,
      confirmedAppointments: confirmedAppts.count,
      pendingAppointments: pendingAppts.count,
      recentAppointments,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

router.get("/payments", async (_req, res) => {
  try {
    const payments = await db
      .select()
      .from(paymentsTable)
      .orderBy(desc(paymentsTable.createdAt));
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

router.post("/payments", async (req, res) => {
  try {
    const { patientName, patientPhone, patientEmail, providerName, providerId,
            appointmentId, amount, currency, method, status, reference, notes } = req.body;
    if (!patientName || !providerName || !amount) {
      return res.status(400).json({ error: "patientName, providerName, amount required" });
    }
    const [payment] = await db
      .insert(paymentsTable)
      .values({ patientName, patientPhone, patientEmail, providerName,
                 providerId: providerId ? parseInt(providerId) : null,
                 appointmentId: appointmentId ? parseInt(appointmentId) : null,
                 amount: parseInt(amount), currency: currency ?? "JOD",
                 method: method ?? "credit", status: status ?? "pending",
                 reference, notes })
      .returning();
    return res.status(201).json(payment);
  } catch (err) {
    return res.status(400).json({ error: "Invalid payment data" });
  }
});

router.patch("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reference, notes } = req.body;
    const [payment] = await db
      .update(paymentsTable)
      .set({ ...(status && { status }), ...(reference && { reference }), ...(notes && { notes }) })
      .where(eq(paymentsTable.id, id))
      .returning();
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    return res.json(payment);
  } catch (err) {
    return res.status(400).json({ error: "Failed to update payment" });
  }
});

router.delete("/payments/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

/* ── Bulk status update for appointments ── */
router.patch("/appointments/bulk", async (req, res) => {
  try {
    const { ids, status } = req.body as { ids: unknown; status: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }
    const valid = ["pending", "confirmed", "cancelled", "completed"];
    if (typeof status !== "string" || !valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(", ")}` });
    }
    const numIds = ids.map(Number).filter(n => !isNaN(n));

    const before = status === "confirmed"
      ? await db.select().from(appointmentsTable).where(inArray(appointmentsTable.id, numIds))
      : [];
    const newlyConfirmedIds = new Set(before.filter(a => a.status !== "confirmed").map(a => a.id));

    const updated = await db
      .update(appointmentsTable)
      .set({
        status,
        ...(status === "confirmed" ? { approvedAt: new Date(), approvedBy: "Admin" } : {}),
      })
      .where(inArray(appointmentsTable.id, numIds))
      .returning();

    if (newlyConfirmedIds.size > 0) {
      const providers = await db
        .select()
        .from(providersTable)
        .where(inArray(providersTable.id, updated.filter(a => newlyConfirmedIds.has(a.id)).map(a => a.providerId)));
      const providerById = new Map(providers.map(p => [p.id, p]));
      for (const appt of updated) {
        if (!newlyConfirmedIds.has(appt.id)) continue;
        sendDoctorAssignmentEmail(appt, providerById.get(appt.providerId)).catch((err) =>
          console.error("[admin] Failed to send doctor assignment email:", err)
        );
      }
    }

    return res.json({ updated: updated.length, appointments: updated });
  } catch (err) {
    return res.status(500).json({ error: "Failed to bulk update appointments" });
  }
});

router.get("/ratings", async (_req, res) => {
  try {
    const ratings = await db
      .select()
      .from(ratingsTable)
      .orderBy(desc(ratingsTable.createdAt))
      .limit(50);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

export default router;
