import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("Testing database connection...");
  console.log("URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

  try {
    const connection = await createConnection(process.env.DATABASE_URL || "");
    console.log("Successfully connected to database!");
    await connection.end();
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();
