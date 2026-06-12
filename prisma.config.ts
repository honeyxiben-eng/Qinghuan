import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL! || "postgresql://postgres:EnOptsomnlWueCDJ@db.uepcthzkvxxvhpmvdtkx.supabase.co:5432/postgres",
  },
})
