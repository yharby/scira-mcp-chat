import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    console.log("Testing connection...");
    const result = await db.execute(sql`SELECT NOW()`);
    console.log("Connection successful:", result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  }
}

testConnection();
