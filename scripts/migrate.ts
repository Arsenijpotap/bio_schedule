import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = neon(url);
const schema = fs.readFileSync(path.join(process.cwd(), "db/schema.sql"), "utf8");

for (const statement of schema.split(";").map(s => s.trim()).filter(Boolean)) {
  await sql.query(statement);
}

console.log("Database migrated.");