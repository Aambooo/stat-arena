// lib/db.ts

// Reuse the Prisma client from lib/prisma
import { prisma } from './prisma';

// Cast as any to avoid "property X does not exist" TS errors on Vercel,
// while still using the real PrismaClient at runtime.
export const db = prisma as any;
