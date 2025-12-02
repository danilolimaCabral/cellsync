/**
 * Módulo de gerenciamento de histórico de backups no banco de dados
 * Registra todos os backups realizados para rastreamento e auditoria
 */

import { getDb } from "./db";
import { backupHistory } from "../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";

export interface BackupHistoryRecord {
  tenantId: number;
  filename: string;
  s3Key: string;
  s3Url?: string;
  fileSize: number;
  status: "success" | "failed" | "in_progress";
  errorMessage?: string;
  duration?: number;
  backupType: "manual" | "scheduled";
  deletedCount?: number;
  triggeredBy?: number;
}

/**
 * Cria um novo registro de backup no histórico
 */
export async function createBackupRecord(data: BackupHistoryRecord) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const result = await db.insert(backupHistory).values({
      ...data,
      createdAt: new Date(),
    });
    
    console.log(`[Backup DB] ✅ Registro criado: ${data.filename}`);
    return result;
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao criar registro:", error);
    throw error;
  }
}

/**
 * Atualiza o status de um backup
 */
export async function updateBackupStatus(
  id: number,
  status: "success" | "failed",
  data?: {
    s3Url?: string;
    duration?: number;
    errorMessage?: string;
    deletedCount?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db
      .update(backupHistory)
      .set({
        status,
        completedAt: new Date(),
        ...data,
      })
      .where(eq(backupHistory.id, id));
    
    console.log(`[Backup DB] ✅ Status atualizado para: ${status}`);
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao atualizar status:", error);
    throw error;
  }
}

/**
 * Lista backups de um tenant específico
 */
export async function listBackupsByTenant(
  tenantId: number,
  options?: {
    limit?: number;
    daysAgo?: number;
  }
) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { limit = 100, daysAgo = 90 } = options || {};
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const records = await db
      .select()
      .from(backupHistory)
      .where(
        and(
          eq(backupHistory.tenantId, tenantId),
          gte(backupHistory.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(backupHistory.createdAt))
      .limit(limit);
    
    console.log(`[Backup DB] 📋 Encontrados ${records.length} backups para tenant ${tenantId}`);
    return records;
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao listar backups:", error);
    throw error;
  }
}

/**
 * Lista todos os backups (apenas para master_admin)
 */
export async function listAllBackups(options?: {
  limit?: number;
  daysAgo?: number;
}) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const { limit = 100, daysAgo = 90 } = options || {};
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const records = await db
      .select()
      .from(backupHistory)
      .where(gte(backupHistory.createdAt, cutoffDate))
      .orderBy(desc(backupHistory.createdAt))
      .limit(limit);
    
    console.log(`[Backup DB] 📋 Encontrados ${records.length} backups totais`);
    return records;
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao listar todos os backups:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas de backups para um tenant
 */
export async function getBackupStats(tenantId: number, daysAgo: number = 30) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    const records = await db
      .select()
      .from(backupHistory)
      .where(
        and(
          eq(backupHistory.tenantId, tenantId),
          gte(backupHistory.createdAt, cutoffDate)
        )
      );
    
    const total = records.length;
    const successful = records.filter((r: any) => r.status === "success").length;
    const failed = records.filter((r: any) => r.status === "failed").length;
    const totalSize = records
      .filter((r: any) => r.status === "success")
      .reduce((sum: number, r: any) => sum + (r.fileSize || 0), 0);
    const avgSize = successful > 0 ? totalSize / successful : 0;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    
    return {
      total,
      successful,
      failed,
      totalSize,
      avgSize,
      successRate,
      period: daysAgo,
    };
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao calcular estatísticas:", error);
    throw error;
  }
}

/**
 * Remove registros de backups antigos (apenas registros, não os arquivos S3)
 */
export async function cleanupOldBackupRecords(daysToKeep: number = 90) {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await db
      .delete(backupHistory)
      .where(gte(backupHistory.createdAt, cutoffDate));
    
    console.log(`[Backup DB] 🧹 Registros antigos removidos`);
    return result;
  } catch (error) {
    console.error("[Backup DB] ❌ Erro ao limpar registros antigos:", error);
    throw error;
  }
}
