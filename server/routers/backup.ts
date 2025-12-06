
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { backups, sales, products, customers, users, stockItems, serviceOrders } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";

// Ensure backup directory exists
const BACKUP_DIR = path.join(process.cwd(), "client/public/backups");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const backupRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Return list of backups from database
    // In a real multi-tenant app, we would filter by tenantId
    // const tenantId = ctx.user.tenantId;
    
        const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const backupList = await db.select().from(backups).orderBy(desc(backups.createdAt));
    
    return backupList.map(backup => ({
      ...backup,
      // If s3Url is null, construct a local URL
      downloadUrl: backup.s3Url || `/backups/${backup.filename}`
    }));
  }),

  runNow: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `backup-${timestamp}.json`;
      const filepath = path.join(BACKUP_DIR, filename);

      // Fetch data from main tables
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [
        allSales,
        allProducts,
        allCustomers,
        allUsers,
        allStock,
        allServiceOrders
      ] = await Promise.all([
        db.select().from(sales),
        db.select().from(products),
        db.select().from(customers),
        db.select().from(users),
        db.select().from(stockItems),
        db.select().from(serviceOrders)
      ]);

      const backupData = {
        metadata: {
          createdAt: new Date(),
          version: "1.0",
          system: "CellSync"
        },
        data: {
          sales: allSales,
          products: allProducts,
          customers: allCustomers,
          users: allUsers,
          stockItems: allStock,
          serviceOrders: allServiceOrders
        }
      };

      // Write file to disk
      const fileContent = JSON.stringify(backupData, null, 2);
      fs.writeFileSync(filepath, fileContent);
      
      const stats = fs.statSync(filepath);

      // Record in database
      await db.insert(backups).values({
        tenantId: 1, // Default tenant for now
        filename: filename,
        size: stats.size,
        status: "completed",
        s3Url: null, // Local file
        createdAt: new Date()
      });

      return { success: true, message: "Backup realizado com sucesso" };
    } catch (error) {
      console.error("Backup failed:", error);
      
      // Log failure
      const db = await getDb();
      if (db) {
        await db.insert(backups).values({
          tenantId: 1,
          filename: `failed-backup-${Date.now()}`,
          size: 0,
          status: "failed",
          createdAt: new Date()
        });
      }

      throw new Error("Falha ao realizar backup: " + (error as Error).message);
    }
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const backup = await db.query.backups.findFirst({
        where: eq(backups.id, input.id)
      });

      if (!backup) {
        throw new Error("Backup não encontrado");
      }

      // Delete file if it exists locally
      if (!backup.s3Url) {
        const filepath = path.join(BACKUP_DIR, backup.filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }

      // Delete from DB
      await db.delete(backups).where(eq(backups.id, input.id));

      return { success: true };
    }),
    
  restore: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
        // Mock restore functionality
        // In a real scenario, this would read the JSON and upsert records
        return { success: true, message: "Funcionalidade de restauração em desenvolvimento. Por favor, contate o suporte para restaurar um backup." };
    })
});
