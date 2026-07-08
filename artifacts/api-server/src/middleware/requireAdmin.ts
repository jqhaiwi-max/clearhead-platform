import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_NOTIFICATION_EMAIL || "jamal_alqhaiwi@yahoo.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!supabase) {
    res.status(500).json({ error: "Auth is not configured on the server" });
    return;
  }
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    const email = data.user.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Failed to verify session" });
  }
}
