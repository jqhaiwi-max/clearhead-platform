import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListProvidersQueryParams,
  CreateProviderBody,
} from "@workspace/api-zod";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parsed = ListProvidersQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : {};

    let query = db.select().from(providersTable);

    const conditions: ReturnType<typeof eq>[] = [];

    if (params.specialty) {
      conditions.push(ilike(providersTable.specialty, `%${params.specialty}%`));
    }
    if (params.available !== undefined) {
      conditions.push(eq(providersTable.available, params.available));
    }
    if (params.search) {
      conditions.push(ilike(providersTable.name, `%${params.search}%`));
    }

    const providers = conditions.length
      ? await db.select().from(providersTable).where(and(...conditions))
      : await query;

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});

router.get("/featured", async (req, res) => {
  try {
    const providers = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.available, true))
      .limit(6);
    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch featured providers" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id));
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    return res.json(provider);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch provider" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const data = CreateProviderBody.parse(req.body);
    const [provider] = await db
      .insert(providersTable)
      .values(data)
      .returning();
    res.status(201).json(provider);
  } catch (err) {
    res.status(400).json({ error: "Invalid provider data" });
  }
});

router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body as Record<string, unknown>;
    const allowed = [
      "name","title","specialty","bio","yearsExperience","imageUrl","available",
      "sessionPrice","languages","acceptsInsurance","nextAvailable",
      "email","phone","qualifications","doxyLink","rating","reviewCount",
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    const [provider] = await db
      .update(providersTable)
      .set(update as unknown as typeof providersTable.$inferInsert)
      .where(eq(providersTable.id, id))
      .returning();
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    return res.json(provider);
  } catch (err) {
    return res.status(400).json({ error: "Failed to update provider" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(providersTable).where(eq(providersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete provider" });
  }
});

export default router;
