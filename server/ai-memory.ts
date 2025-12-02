import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { tenantAIMemory, type InsertTenantAIMemory } from "../drizzle/schema";

/**
 * Gerenciamento de Memória da IA por Tenant
 * Salva e recupera aprendizados da IA
 */

export type MemoryType = "mapping_rule" | "preference" | "pattern" | "correction" | "business_rule";

/**
 * Salvar nova memória da IA
 */
export async function saveAIMemory(
  tenantId: number,
  memoryType: MemoryType,
  key: string,
  value: any,
  confidence: number = 50
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se já existe memória com essa chave
  const existing = await db
    .select()
    .from(tenantAIMemory)
    .where(and(eq(tenantAIMemory.tenantId, tenantId), eq(tenantAIMemory.key, key)))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar existente
    await db
      .update(tenantAIMemory)
      .set({
        value: JSON.stringify(value),
        confidence,
        usageCount: existing[0].usageCount + 1,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenantAIMemory.id, existing[0].id));
  } else {
    // Criar nova
    await db.insert(tenantAIMemory).values({
      tenantId,
      memoryType,
      key,
      value: JSON.stringify(value),
      confidence,
      usageCount: 1,
      lastUsedAt: new Date(),
    });
  }
}

/**
 * Recuperar memória específica
 */
export async function getAIMemory(tenantId: number, key: string): Promise<any | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(tenantAIMemory)
    .where(and(eq(tenantAIMemory.tenantId, tenantId), eq(tenantAIMemory.key, key)))
    .limit(1);

  if (result.length === 0) return null;

  // Atualizar lastUsedAt
  await db
    .update(tenantAIMemory)
    .set({ lastUsedAt: new Date() })
    .where(eq(tenantAIMemory.id, result[0].id));

  return JSON.parse(result[0].value as string);
}

/**
 * Recuperar todas as memórias de um tipo
 */
export async function getAIMemoriesByType(
  tenantId: number,
  memoryType: MemoryType
): Promise<Array<{ key: string; value: any; confidence: number }>> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(tenantAIMemory)
    .where(and(eq(tenantAIMemory.tenantId, tenantId), eq(tenantAIMemory.memoryType, memoryType)));

  return results.map((r) => ({
    key: r.key,
    value: JSON.parse(r.value as string),
    confidence: r.confidence,
  }));
}

/**
 * Atualizar confiança de uma memória
 */
export async function updateMemoryConfidence(
  tenantId: number,
  key: string,
  feedback: "positive" | "negative"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const result = await db
    .select()
    .from(tenantAIMemory)
    .where(and(eq(tenantAIMemory.tenantId, tenantId), eq(tenantAIMemory.key, key)))
    .limit(1);

  if (result.length === 0) return;

  const current = result[0];
  let newConfidence = current.confidence;

  if (feedback === "positive") {
    // Aumentar confiança (máximo 100)
    newConfidence = Math.min(100, current.confidence + 10);
  } else {
    // Diminuir confiança (mínimo 0)
    newConfidence = Math.max(0, current.confidence - 15);
  }

  await db
    .update(tenantAIMemory)
    .set({
      confidence: newConfidence,
      updatedAt: new Date(),
    })
    .where(eq(tenantAIMemory.id, current.id));
}

/**
 * Deletar memória específica
 */
export async function deleteAIMemory(tenantId: number, key: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(tenantAIMemory)
    .where(and(eq(tenantAIMemory.tenantId, tenantId), eq(tenantAIMemory.key, key)));
}

/**
 * Listar todas as memórias do tenant
 */
export async function listAllAIMemories(tenantId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(tenantAIMemory)
    .where(eq(tenantAIMemory.tenantId, tenantId));

  return results.map((r) => ({
    id: r.id,
    memoryType: r.memoryType,
    key: r.key,
    value: JSON.parse(r.value as string),
    confidence: r.confidence,
    usageCount: r.usageCount,
    lastUsedAt: r.lastUsedAt,
    createdAt: r.createdAt,
  }));
}
