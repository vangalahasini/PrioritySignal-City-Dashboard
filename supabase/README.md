# PrioritySignal — Supabase Database Setup Guide

This guide explains how to connect PrioritySignal to your Supabase PostgreSQL database and apply the database schema.

---

## 1. Apply Migration in Supabase SQL Editor

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left navigation menu, click on **SQL Editor**.
3. Click **+ New Query**.
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it into the query editor.
5. Click **Run** (or press `Cmd + Enter` / `Ctrl + Enter`).
6. You should see `Success. No rows returned` confirming all 8 tables, indexes, and Row Level Security policies were created.

---

## 2. Configure Environment Variables

In your environment configuration (or `.env`):

```bash
SUPABASE_URL="https://<your-project-ref>.supabase.co"
SUPABASE_SECRET_KEY="<your-service-role-secret-key>"
# Optional:
SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
```

> **Security Note:**
> `SUPABASE_SECRET_KEY` is the `service_role` key found under **Project Settings > API** in your Supabase dashboard. It is strictly accessed server-side in `server.ts` / server modules and is NEVER exposed to the frontend browser bundle.

---

## 3. Seed Demo Data

Once your database schema is created and environment variables are set:
- In the PrioritySignal UI, visit **GTFS & Demo Data** or **Overview** and click **Seed Demo Data**.
- Alternatively, make an authenticated POST request to `/api/seed`.
- The seed script uses deterministic primary keys (`INT001`–`INT006`, `R10`, `R15`, `R20`, etc.) and `upsert` queries to prevent duplicate records.
