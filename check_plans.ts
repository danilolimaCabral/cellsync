import { getDb } from "./server/db";
import { plans } from "./drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  const allPlans = await db.select().from(plans);
  console.log("Plans found:", allPlans);
}

main().catch(console.error);
