import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id"),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"),
  patientEmail: text("patient_email"),
  providerName: text("provider_name").notNull(),
  providerId: integer("provider_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("JOD"),
  method: text("method").notNull().default("credit"),
  status: text("status").notNull().default("pending"),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("payments_appointment_id_idx").on(t.appointmentId),
]);

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
