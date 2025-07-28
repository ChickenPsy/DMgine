import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const dmGenerations = pgTable("dm_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  target: text("target").notNull(),
  tone: text("tone").notNull(),
  generatedMessage: text("generated_message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDmGenerationSchema = createInsertSchema(dmGenerations).pick({
  target: true,
  tone: true,
  generatedMessage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type DmGeneration = typeof dmGenerations.$inferSelect;
export type InsertDmGeneration = z.infer<typeof insertDmGenerationSchema>;

export const generateDmRequestSchema = z.object({
  target: z.string().min(1, "Please tell us who you're messaging"),
  tone: z.enum(["professional", "casual", "chaos"], {
    required_error: "Please select a tone",
  }),
});

export type GenerateDmRequest = z.infer<typeof generateDmRequestSchema>;
