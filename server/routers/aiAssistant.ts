import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../_core/trpc";
import { publicProcedure } from "../_core/trpc";
import { parseFile, validateData } from "../file-parser";
import { analyzeImportData, chatWithImportAssistant, applyTransformations } from "../ai-import-assistant";
import { checkAIImportLimit, incrementAIImportUsage, getUpgradeOptions } from "../ai-limits";
import {
  saveAIMemory,
  getAIMemory,
  getAIMemoriesByType,
  updateMemoryConfidence,
  deleteAIMemory,
  listAllAIMemories,
} from "../ai-memory";
import { getDb } from "../db";
import { importSessions, products, customers } from "../../drizzle/schema";

// Helper para criar procedimentos protegidos
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const aiAssistantRouter = router({
  // Verificar limites de importação
  checkLimits: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;
    return await checkAIImportLimit(tenantId);
  }),

  // Analisar arquivo enviado
  analyzeImportFile: protectedProcedure
    .input(
      z.object({
        fileContent: z.string(), // Base64 ou texto
        fileName: z.string(),
        moduleType: z.string().optional().default("products"), // Opcional para evitar erro se frontend falhar
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.user.tenantId;

      // Verificar limites
      const limitStatus = await checkAIImportLimit(tenantId);
      if (!limitStatus.canImport) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: limitStatus.message || "Limite de importações atingido",
        });
      }

      try {
        // Decodificar se for base64
        let fileData: string | Buffer = input.fileContent;
        if (input.fileContent.startsWith("data:")) {
          const base64Data = input.fileContent.split(",")[1];
          fileData = Buffer.from(base64Data, "base64");
        }

        // Se for CSV e estiver em Buffer, converter para string UTF-8
        // Isso é necessário porque o parseCSV espera string, mas o Base64 decode gera Buffer
        if (input.fileName.toLowerCase().endsWith(".csv") && Buffer.isBuffer(fileData)) {
          fileData = fileData.toString("utf-8");
        }

        // Parse do arquivo
        const parsed = parseFile(fileData, input.fileName);

        // Validar dados
        const validation = validateData(parsed.data);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Erro na validação: ${validation.errors.join(", ")}`,
          });
        }

        // Buscar memória da IA para este tenant
        const tenantMemory = await getAIMemoriesByType(tenantId, "mapping_rule");

        // Analisar com IA
        const analysis = await analyzeImportData(parsed.data, input.moduleType, tenantMemory);

        // Criar sessão de importação
        const db = await getDb();
        if (db) {
          await db.insert(importSessions).values({
            tenantId,
            userId: ctx.user.id,
            moduleType: input.moduleType,
            status: "mapping" as const,
            fileName: input.fileName,
            totalRows: parsed.totalRows,
            columnMapping: analysis.suggestedMapping as any,
          });
        }

        return {
          success: true,
          analysis,
          limitStatus,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao analisar arquivo",
        });
      }
    }),

  // Chat com o assistente
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          })
        ),
        currentData: z.array(z.record(z.any())),
        currentMapping: z.array(
          z.object({
            sourceColumn: z.string(),
            targetField: z.string(),
            confidence: z.number(),
            transformation: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await chatWithImportAssistant(input.messages as any, input.currentData, input.currentMapping);
        return { success: true, message: response };
      } catch (error: any) {
        console.error("[Chatbot Error]", error);
        // Retornar mensagem amigável em vez de erro fatal
        return { 
          success: false, 
          message: "Desculpe, estou enfrentando uma instabilidade temporária na minha conexão com a IA. Por favor, tente novamente em alguns instantes." 
        };
      }
    }),

  // Confirmar e executar importação
  executeImport: protectedProcedure
    .input(
      z.object({
        moduleType: z.string().optional().default("products"), // Opcional para evitar erro se frontend falhar
        data: z.array(z.record(z.any())),
        mapping: z.array(
          z.object({
            sourceColumn: z.string(),
            targetField: z.string(),
            confidence: z.number(),
            transformation: z.string().optional(),
          })
        ),
        saveMapping: z.boolean().default(false), // Salvar mapeamento na memória da IA
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.user.tenantId;

      // Verificar limites novamente
      const limitStatus = await checkAIImportLimit(tenantId);
      if (!limitStatus.canImport) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: limitStatus.message || "Limite de importações atingido",
        });
      }

      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Aplicar transformações
        const transformedData = applyTransformations(input.data, input.mapping);

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Importar baseado no módulo
        if (input.moduleType === "products") {
          for (const row of transformedData) {
            try {
              await db.insert(products).values({
                name: row.name,
                description: row.description || null,
                sku: row.sku || null,
                category: row.category || null,
                brand: row.brand || null,
                model: row.model || null,
                costPrice: row.costPrice ? parseInt(row.costPrice) : 0,
                salePrice: row.retailPrice ? parseInt(row.retailPrice) : 0,
                wholesalePrice: row.wholesalePrice ? parseInt(row.wholesalePrice) : undefined,
                minWholesaleQty: row.minWholesaleQty ? parseInt(row.minWholesaleQty) : undefined,
                currentStock: row.currentStock ? parseInt(row.currentStock) : 0,
                minStock: row.minStock ? parseInt(row.minStock) : 10,
                supplier: row.supplier || undefined,
                barcode: row.barcode || undefined,
                active: true,
              });
              successCount++;
            } catch (error: any) {
              errorCount++;
              errors.push(`Linha ${successCount + errorCount}: ${error.message}`);
            }
          }
        } else if (input.moduleType === "customers") {
          for (const row of transformedData) {
            try {
              await db.insert(customers).values({
                name: row.name,
                fantasyName: row.fantasyName || undefined,
                email: row.email || undefined,
                phone: row.phone || undefined,
                cpf: row.cpf || undefined,
                cnpj: row.cnpj || undefined,
                address: row.address || undefined,
                city: row.city || undefined,
                state: row.state || undefined,
                zipCode: row.zipCode || undefined,
              });
              successCount++;
            } catch (error: any) {
              errorCount++;
              errors.push(`Linha ${successCount + errorCount}: ${error.message}`);
            }
          }
        }

        // Salvar mapeamento na memória da IA se solicitado
        if (input.saveMapping) {
          const mappingKey = `${input.moduleType}_mapping`;
          const mappingValue = input.mapping.reduce((acc, m) => {
            acc[m.sourceColumn] = m.targetField;
            return acc;
          }, {} as Record<string, string>);

          await saveAIMemory(tenantId, "mapping_rule", mappingKey, mappingValue, 80);
        }

        // Incrementar contador de uso
        await incrementAIImportUsage(tenantId);

        return {
          success: true,
          successCount,
          errorCount,
          errors: errors.slice(0, 10), // Retornar apenas primeiros 10 erros
          message: `Importação concluída! ${successCount} registros importados, ${errorCount} erros.`,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Erro ao importar dados",
        });
      }
    }),

  // Listar memórias da IA
  listMemories: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;
    return await listAllAIMemories(tenantId);
  }),

  // Deletar memória específica
  deleteMemory: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.user.tenantId;
      await deleteAIMemory(tenantId, input.key);
      return { success: true };
    }),

  // Feedback sobre sugestão da IA
  giveFeedback: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        feedback: z.enum(["positive", "negative"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.user.tenantId;
      await updateMemoryConfidence(tenantId, input.key, input.feedback);
      return { success: true };
    }),

  // Opções de upgrade
  getUpgradeOptions: protectedProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.user.tenantId;
    return await getUpgradeOptions(tenantId);
  }),
});
