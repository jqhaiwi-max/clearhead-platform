import { Router } from "express";
import { db } from "@workspace/db";
import { providersTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import {
  ListProvidersQueryParams,
  CreateProviderBody,
} from "@workspace/api-zod";

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
    const id = parseInt(req.params.id);
    const [provider] = await db
      .select()
      .from(providersTable)
      .where(eq(providersTable.id, id));
    if (!provider) return res.status(404).json({ error: "Provider not found" });
    res.json(provider);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch provider" });
  }
});

router.post("/", async (req, res) => {
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

export default router;
