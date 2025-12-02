/**
 * Procedures tRPC para importação de XML de NF-e
 * Versão simplificada usando campos existentes do schema
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { products, stockMovements } from '../drizzle/schema';
import { parseNFeXML, isValidNFeXML, extractNFeKey, type ParsedNFe } from './xml-parser';
import { eq, and } from 'drizzle-orm';

/**
 * Router de importação de XML
 */
export const xmlImportRouter = router({
  /**
   * Preview de XML - valida e retorna dados parseados sem salvar
   */
  previewXML: protectedProcedure
    .input(z.object({
      xmlContent: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validar XML
      if (!isValidNFeXML(input.xmlContent)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'XML inválido ou não é uma NF-e',
        });
      }

      try {
        // Parse do XML
        const parsed = parseNFeXML(input.xmlContent);

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

        // Verificar se já existe movimentação com essa chave de NF-e
        const existingMovements = await db
          .select()
          .from(stockMovements)
          .where(eq(stockMovements.tenantId, ctx.user.tenantId));

        const isDuplicate = existingMovements.some(
          (m) => m.reason?.includes(parsed.nfeKey)
        );

        // Verificar quais produtos já existem
        const existingProducts = await db
          .select()
          .from(products)
          .where(eq(products.tenantId, ctx.user.tenantId));

        const productsWithStatus = parsed.products.map((product) => {
          const exists = existingProducts.find(
            (p) => p.sku === product.code || p.name.toLowerCase() === product.name.toLowerCase()
          );

          return {
            ...product,
            exists: !!exists,
            existingId: exists?.id,
            existingName: exists?.name,
            existingPrice: exists ? exists.salePrice / 100 : 0,
          };
        });

        return {
          nfe: {
            key: parsed.nfeKey,
            number: parsed.number,
            series: parsed.series,
            issueDate: parsed.issueDate,
            totalValue: parsed.totalValue,
          },
          supplier: parsed.supplier,
          products: productsWithStatus,
          isDuplicate,
          summary: {
            totalProducts: parsed.products.length,
            newProducts: productsWithStatus.filter((p) => !p.exists).length,
            existingProducts: productsWithStatus.filter((p) => p.exists).length,
            totalValue: parsed.totalValue,
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Erro ao processar XML: ${error.message}`,
        });
      }
    }),

  /**
   * Importar XML - salva produtos e movimentação de estoque
   */
  importXML: protectedProcedure
    .input(z.object({
      xmlContent: z.string(),
      createNewProducts: z.boolean().default(true),
      updatePrices: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Parse do XML
      const parsed = parseNFeXML(input.xmlContent);

      // Verificar duplicatas
      const existingMovements = await db
        .select()
        .from(stockMovements)
        .where(eq(stockMovements.tenantId, ctx.user.tenantId));

      const isDuplicate = existingMovements.some(
        (m) => m.reason?.includes(parsed.nfeKey)
      );

      if (isDuplicate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NF-e já foi importada anteriormente',
        });
      }

      // Processar produtos
      const importedProducts: Array<{ id: number; name: string; quantity: number; isNew: boolean }> = [];
      const errors: string[] = [];

      for (const productData of parsed.products) {
        try {
          // Buscar produto existente por SKU
          const [existingProduct] = await db
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, ctx.user.tenantId),
                eq(products.sku, productData.code)
              )
            )
            .limit(1);

          let productId: number;
          let isNew = false;

          if (existingProduct) {
            productId = existingProduct.id;

            // Atualizar preço se solicitado
            if (input.updatePrices) {
              await db
                .update(products)
                .set({
                  salePrice: Math.round(productData.unitPrice * 100), // Converter para centavos
                  costPrice: Math.round(productData.unitPrice * 100),
                  updatedAt: new Date(),
                })
                .where(eq(products.id, existingProduct.id));
            }

            // Atualizar estoque
            await db
              .update(products)
              .set({
                currentStock: existingProduct.currentStock + productData.quantity,
                updatedAt: new Date(),
              })
              .where(eq(products.id, existingProduct.id));
          } else if (input.createNewProducts) {
            // Criar novo produto
            const [newProduct] = await db
              .insert(products)
              .values({
                tenantId: ctx.user.tenantId,
                sku: productData.code,
                name: productData.name,
                salePrice: Math.round(productData.unitPrice * 100), // Converter para centavos
                costPrice: Math.round(productData.unitPrice * 100),
                currentStock: productData.quantity,
                minStock: 5,
                category: 'Importado',
                supplier: parsed.supplier.name,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .$returningId();

            productId = newProduct.id;
            isNew = true;
          } else {
            errors.push(`Produto ${productData.name} não encontrado e criação desabilitada`);
            continue;
          }

          // Criar movimentação de entrada
          await db.insert(stockMovements).values({
            tenantId: ctx.user.tenantId,
            productId,
            type: 'entrada',
            quantity: productData.quantity,
            userId: ctx.user.id,
            reason: `Importação NF-e ${parsed.number} - Chave: ${parsed.nfeKey} - Fornecedor: ${parsed.supplier.name}`,
            referenceType: 'nfe',
            createdAt: parsed.issueDate,
          });

          importedProducts.push({
            id: productId,
            name: productData.name,
            quantity: productData.quantity,
            isNew,
          });
        } catch (error: any) {
          errors.push(`Erro ao importar ${productData.name}: ${error.message}`);
        }
      }

      return {
        success: true,
        message: `NF-e ${parsed.number} importada com sucesso`,
        nfeKey: parsed.nfeKey,
        nfeNumber: parsed.number,
        supplierName: parsed.supplier.name,
        importedProducts,
        totalProducts: parsed.products.length,
        successCount: importedProducts.length,
        errorCount: errors.length,
        errors,
        summary: {
          newProducts: importedProducts.filter((p) => p.isNew).length,
          updatedProducts: importedProducts.filter((p) => !p.isNew).length,
          totalValue: parsed.totalValue,
        },
      };
    }),

  /**
   * Importar múltiplos XMLs em lote
   */
  importBatch: protectedProcedure
    .input(z.object({
      xmlFiles: z.array(z.object({
        filename: z.string(),
        content: z.string(),
      })),
      createNewProducts: z.boolean().default(true),
      updatePrices: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const results: Array<{
        filename: string;
        success: boolean;
        nfeNumber?: string;
        error?: string;
        productsImported?: number;
      }> = [];

      for (const file of input.xmlFiles) {
        try {
          // Validar XML
          if (!isValidNFeXML(file.content)) {
            results.push({
              filename: file.filename,
              success: false,
              error: 'XML inválido ou não é uma NF-e',
            });
            continue;
          }

          // Verificar duplicata antes de importar
          const nfeKey = extractNFeKey(file.content);
          if (nfeKey) {
            const db = await getDb();
            if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

            const existingMovements = await db
              .select()
              .from(stockMovements)
              .where(eq(stockMovements.tenantId, ctx.user.tenantId));

            const isDuplicate = existingMovements.some(
              (m) => m.reason?.includes(nfeKey)
            );

            if (isDuplicate) {
              results.push({
                filename: file.filename,
                success: false,
                error: 'NF-e já foi importada anteriormente',
              });
              continue;
            }
          }

          // Importar XML (reutilizar procedure existente)
          const result = await xmlImportRouter.createCaller(ctx).importXML({
            xmlContent: file.content,
            createNewProducts: input.createNewProducts,
            updatePrices: input.updatePrices,
          });

          results.push({
            filename: file.filename,
            success: true,
            nfeNumber: result.nfeNumber,
            productsImported: result.successCount,
          });
        } catch (error: any) {
          results.push({
            filename: file.filename,
            success: false,
            error: error.message,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      return {
        success: true,
        message: `Importação em lote concluída: ${successCount} sucesso, ${errorCount} erros`,
        results,
        totalFiles: input.xmlFiles.length,
        successCount,
        errorCount,
      };
    }),
});
