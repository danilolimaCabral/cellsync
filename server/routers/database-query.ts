/**
 * Database Query Router
 * 
 * Provides direct database access for master admins to execute SQL queries.
 * SECURITY: Only accessible to master_admin role
 */

import { router, masterProcedure } from "../_core/trpc";
import { z } from "zod";
import mysql from "mysql2/promise";

// Get database connection from environment
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }

  // Parse MySQL URL: mysql://user:password@host:port/database
  const urlMatch = databaseUrl.match(
    /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
  );

  if (!urlMatch) {
    throw new Error("Invalid DATABASE_URL format");
  }

  return {
    user: urlMatch[1],
    password: urlMatch[2],
    host: urlMatch[3],
    port: parseInt(urlMatch[4]),
    database: urlMatch[5]
  };
}

export const databaseQueryRouter = router({
  /**
   * Execute a SELECT query on the database
   * Returns the query results
   */
  executeQuery: masterProcedure
    .input(z.object({
      query: z.string().min(1, "Query cannot be empty"),
      limit: z.number().default(100).max(1000)
    }))
    .query(async ({ input }) => {
      let connection;
      try {
        const config = getDatabaseConfig();
        connection = await mysql.createConnection(config);
        
        // Only allow SELECT queries for safety
        const trimmedQuery = input.query.trim().toUpperCase();
        if (!trimmedQuery.startsWith("SELECT")) {
          throw new Error("Only SELECT queries are allowed in query mode");
        }

        // Add LIMIT if not present
        let finalQuery = input.query;
        if (!trimmedQuery.includes("LIMIT")) {
          finalQuery += ` LIMIT ${input.limit}`;
        }

        const [rows] = await connection.execute(finalQuery);
        
        return {
          success: true,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          data: rows,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        };
      } finally {
        if (connection) {
          await connection.end();
        }
      }
    }),

  /**
   * Execute a mutation query (INSERT, UPDATE, DELETE)
   * Requires explicit confirmation
   */
  executeMutation: masterProcedure
    .input(z.object({
      query: z.string().min(1, "Query cannot be empty"),
      confirm: z.boolean().refine(v => v === true, "Must confirm mutation")
    }))
    .mutation(async ({ input, ctx }) => {
      let connection;
      try {
        const config = getDatabaseConfig();
        connection = await mysql.createConnection(config);
        
        const trimmedQuery = input.query.trim().toUpperCase();
        
        // Only allow INSERT, UPDATE, DELETE
        const allowedCommands = ["INSERT", "UPDATE", "DELETE"];
        const isAllowed = allowedCommands.some(cmd => trimmedQuery.startsWith(cmd));
        
        if (!isAllowed) {
          throw new Error("Only INSERT, UPDATE, DELETE queries are allowed");
        }

        const [result] = await connection.execute(input.query);
        
        console.log(`[ADMIN MUTATION] User: ${ctx.user.email} | Query: ${input.query.substring(0, 100)}...`);
        
        return {
          success: true,
          affectedRows: result instanceof Object && "affectedRows" in result ? result.affectedRows : 0,
          message: `Query executed successfully`,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error(`[ADMIN MUTATION ERROR] User: ${ctx.user.email} | Error: ${error}`);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        };
      } finally {
        if (connection) {
          await connection.end();
        }
      }
    }),

  /**
   * Get database info and table list
   */
  getDatabaseInfo: masterProcedure.query(async () => {
    let connection;
    try {
      const config = getDatabaseConfig();
      connection = await mysql.createConnection(config);
      
      // Get database version
      const [[versionResult]] = await connection.execute("SELECT VERSION() as version");
      
      // Get tables
      const [tables] = await connection.execute(
        `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = ? 
         ORDER BY TABLE_ROWS DESC`,
        [config.database]
      );

      return {
        success: true,
        database: config.database,
        version: versionResult?.version || "Unknown",
        tables: tables,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  })
});
