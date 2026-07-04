import { pgTable, serial, text, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const providersTable = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  specialty: text("specialty").notNull(),
  bio: text("bio").notNull(),
  rating: real("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  yearsExperience: integer("years_experience").notNull(),
  imageUrl: text("image_url").notNull(),
  available: boolean("available").notNull().default(true),
  sessionPrice: integer("session_price").notNull(),
  languages: text("languages").array(),
  acceptsInsurance: boolean("accepts_insurance").notNull().default(false),
  nextAvailable: text("next_available"),
});

export const insertProviderSchema = createInsertSchema(providersTable).omit({ id: true });
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providersTable.$inferSelect;
