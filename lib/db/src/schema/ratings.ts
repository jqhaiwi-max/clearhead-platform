import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ratingsTable = pgTable("ratings", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id"),
  providerId: integer("provider_id").notNull(),
  patientName: text("patient_name").notNull(),
  rating: integer("rating").notNull(),
  mood: text("mood"),
  notes: text("notes"),
  sessionDate: text("session_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRatingSchema = createInsertSchema(ratingsTable).omit({ id: true, createdAt: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingsTable.$inferSelect;
