import type { PrismaClient } from "@/generated/prisma";
import { db } from "@/lib/db";

// Legacy compatibility layer:
// Older public/API read paths still import `@/lib/prisma`.
// Route all of them through the newer db runtime so local dev honors
// DIRECT_URL opt-in and shared connectivity handling.
export const prisma = db as PrismaClient | null;
