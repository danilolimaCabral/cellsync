/**
 * Procedures tRPC para importação de CSV/Excel
 * Suporta produtos e clientes
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { products, customers } from '../drizzle/schema';
import Papa from 'papaparse';
import { eq, and } from 'drizzle-orm';

/**
 * Schema de validação para produtos
 */
const ProductCSVSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().optional(),
  codigo_barras: z.string().optional(),
  categoria: z.string().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  preco_custo: z.string().regex(/^\d+([.,]\d{1,2})?$/, 'Preço de custo inválido'),
  preco_venda: z.string().regex(/^\d+([.,]\d{1,2})?$/, 'Preço de venda inválido'),
  estoque_minimo: z.string().regex(/^\d+$/, 'Estoque mínimo deve ser número inteiro').optional(),
  estoque_atual: z.string().regex(/^\d+$/, 'Estoque atual deve ser número inteiro').optional(),
  requer_imei: z.string().regex(/^(sim|não|s|n|true|false|1|0)$/i, 'Requer IMEI deve ser sim/não').optional(),
});

/**
 * Schema de validação para clientes
 */
const CustomerCSVSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf_cnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().min(10, 'Telefone inválido').optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 letras').optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
});

/**
 * Converter string de preço para centavos
 */
function parsePriceToCents(priceStr: string): number {
  const normalized = priceStr.replace(',', '.');
  const value = parseFloat(normalized);
  return Math.round(value * 100);
}

/**
 * Converter string de boolean
 */
function parseBoolean(value?: string): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return ['sim', 's', 'true', '1', 'yes', 'y'].includes(normalized);
}

/**
 * Router de importação CSV
 */
export const csvImportRouter = router({
  /**
   * Preview de CSV - valida e retorna dados parseados
   */
  previewCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      type: z.enum(['products', 'customers']),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Parse CSV
        const parsed = Papa.parse(input.csvContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.toLowerCase().trim(),
        });

        if (parsed.errors.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Erro ao processar CSV: ${parsed.errors[0].message}`,
          });
        }

        const rows = parsed.data as any[];
        
        if (rows.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'CSV está vazio',
          });
        }

        // Validar cada linha
        const validRows: any[] = [];
        const errors: Array<{ line: number; errors: string[] }> = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const lineNumber = i + 2; // +2 porque linha 1 é header e array começa em 0

          try {
            if (input.type === 'products') {
              const validated = ProductCSVSchema.parse(row);
              validRows.push({
                ...validated,
                lineNumber,
                isValid: true,
              });
            } else {
              const validated = CustomerCSVSchema.parse(row);
              validRows.push({
                ...validated,
                lineNumber,
                isValid: true,
              });
            }
          } catch (error: any) {
            const fieldErrors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || [error.message];
            errors.push({
              line: lineNumber,
              errors: fieldErrors,
            });
          }
        }

        return {
          success: true,
          totalRows: rows.length,
          validRows: validRows.length,
          invalidRows: errors.length,
          rows: validRows,
          errors,
          summary: {
            total: rows.length,
            valid: validRows.length,
            invalid: errors.length,
            successRate: ((validRows.length / rows.length) * 100).toFixed(1),
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Erro ao processar CSV: ${error.message}`,
        });
      }
    }),

  /**
   * Importar produtos do CSV
   */
  importProducts: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      updateExisting: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Parse CSV
      const parsed = Papa.parse(input.csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
      });

      const rows = parsed.data as any[];
      const imported: any[] = [];
      const errors: Array<{ line: number; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 2;

        try {
          // Validar linha
          const validated = ProductCSVSchema.parse(row);

          // Verificar se produto já existe (por SKU)
          let existingProduct = null;
          if (validated.sku) {
            [existingProduct] = await db
              .select()
              .from(products)
              .where(
                and(
                  eq(products.tenantId, ctx.user.tenantId),
                  eq(products.sku, validated.sku)
                )
              )
              .limit(1);
          }

          if (existingProduct && !input.updateExisting) {
            errors.push({
              line: lineNumber,
              error: `Produto com SKU ${validated.sku} já existe`,
            });
            continue;
          }

          const productData = {
            tenantId: ctx.user.tenantId,
            name: validated.nome,
            sku: validated.sku || undefined,
            barcode: validated.codigo_barras || undefined,
            category: validated.categoria || undefined,
            brand: validated.marca || undefined,
            model: validated.modelo || undefined,
            costPrice: parsePriceToCents(validated.preco_custo),
            salePrice: parsePriceToCents(validated.preco_venda),
            minStock: validated.estoque_minimo ? parseInt(validated.estoque_minimo) : 10,
            currentStock: validated.estoque_atual ? parseInt(validated.estoque_atual) : 0,
            requiresImei: parseBoolean(validated.requer_imei),
            active: true,
            updatedAt: new Date(),
          };

          if (existingProduct) {
            // Atualizar produto existente
            await db
              .update(products)
              .set(productData)
              .where(eq(products.id, existingProduct.id));

            imported.push({
              line: lineNumber,
              name: validated.nome,
              action: 'updated',
            });
          } else {
            // Criar novo produto
            await db.insert(products).values({
              ...productData,
              createdAt: new Date(),
            });

            imported.push({
              line: lineNumber,
              name: validated.nome,
              action: 'created',
            });
          }
        } catch (error: any) {
          errors.push({
            line: lineNumber,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        message: `${imported.length} produtos importados com sucesso`,
        imported,
        totalRows: rows.length,
        successCount: imported.length,
        errorCount: errors.length,
        errors,
        summary: {
          created: imported.filter((p) => p.action === 'created').length,
          updated: imported.filter((p) => p.action === 'updated').length,
        },
      };
    }),

  /**
   * Importar clientes do CSV
   */
  importCustomers: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      updateExisting: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Parse CSV
      const parsed = Papa.parse(input.csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.toLowerCase().trim(),
      });

      const rows = parsed.data as any[];
      const imported: any[] = [];
      const errors: Array<{ line: number; error: string }> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const lineNumber = i + 2;

        try {
          // Validar linha
          const validated = CustomerCSVSchema.parse(row);

          // Verificar se cliente já existe (por CPF/CNPJ)
          let existingCustomer = null;
          if (validated.cpf_cnpj) {
            // Determinar se é CPF ou CNPJ pelo tamanho
            const cleanDoc = validated.cpf_cnpj.replace(/\D/g, '');
            const isCPF = cleanDoc.length === 11;
            
            [existingCustomer] = await db
              .select()
              .from(customers)
              .where(
                and(
                  eq(customers.tenantId, ctx.user.tenantId),
                  isCPF ? eq(customers.cpf, validated.cpf_cnpj) : eq(customers.cnpj, validated.cpf_cnpj)
                )
              )
              .limit(1);
          }

          if (existingCustomer && !input.updateExisting) {
            errors.push({
              line: lineNumber,
              error: `Cliente com CPF/CNPJ ${validated.cpf_cnpj} já existe`,
            });
            continue;
          }

          // Determinar se é CPF ou CNPJ
          const cleanDoc = validated.cpf_cnpj?.replace(/\D/g, '') || '';
          const isCPF = cleanDoc.length === 11;
          
          const customerData = {
            tenantId: ctx.user.tenantId,
            name: validated.nome,
            cpf: (validated.cpf_cnpj && isCPF) ? validated.cpf_cnpj : undefined,
            cnpj: (validated.cpf_cnpj && !isCPF) ? validated.cpf_cnpj : undefined,
            email: validated.email || undefined,
            phone: validated.telefone || undefined,
            address: validated.endereco || undefined,
            city: validated.cidade || undefined,
            state: validated.estado || undefined,
            zipCode: validated.cep || undefined,
            active: true,
            updatedAt: new Date(),
          };

          if (existingCustomer) {
            // Atualizar cliente existente
            await db
              .update(customers)
              .set(customerData)
              .where(eq(customers.id, existingCustomer.id));

            imported.push({
              line: lineNumber,
              name: validated.nome,
              action: 'updated',
            });
          } else {
            // Criar novo cliente
            await db.insert(customers).values({
              ...customerData,
              createdAt: new Date(),
            });

            imported.push({
              line: lineNumber,
              name: validated.nome,
              action: 'created',
            });
          }
        } catch (error: any) {
          errors.push({
            line: lineNumber,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        message: `${imported.length} clientes importados com sucesso`,
        imported,
        totalRows: rows.length,
        successCount: imported.length,
        errorCount: errors.length,
        errors,
        summary: {
          created: imported.filter((c) => c.action === 'created').length,
          updated: imported.filter((c) => c.action === 'updated').length,
        },
      };
    }),
});
