import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Production schema (Postgres via Drizzle) ─────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // uuid (app-generated)
    phone: text("phone").notNull(),
    name: text("name"),
    plan: text("plan").notNull().default("free"), // free | basic | pro
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ phoneIdx: uniqueIndex("users_phone_idx").on(t.phone) }),
);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  plan: text("plan").notNull(),
  amount: integer("amount").notNull(), // paise
  status: text("status").notNull(), // created | paid | failed
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(), // reel | avatar
  title: text("title").notNull(),
  lang: text("lang").notNull(),
  status: text("status").notNull().default("ready"), // queued | rendering | ready | failed
  mediaUrl: text("media_url"), // R2/CDN URL once rendered
  thumbUrl: text("thumb_url"),
  meta: jsonb("meta"), // template/format, brand, cost metadata
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Per-user monthly quota (e.g. "2026-05" -> count).
export const usageCounters = pgTable(
  "usage_counters",
  {
    userId: text("user_id").notNull(),
    period: text("period").notNull(), // YYYY-MM
    count: integer("count").notNull().default(0),
  },
  (t) => ({ pk: uniqueIndex("usage_pk").on(t.userId, t.period) }),
);

export type User = typeof users.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Video = typeof videos.$inferSelect;
