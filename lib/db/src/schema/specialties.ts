import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const specialtiesTable = pgTable("specialties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconName: text("icon_name").notNull(),
  providerCount: integer("provider_count").notNull().default(0),
});

export const insertSpecialtySchema = createInsertSchema(specialtiesTable).omit({ id: true });
export type InsertSpecialty = z.infer<typeof insertSpecialtySchema>;
export type Specialty = typeof specialtiesTable.$inferSelect;
