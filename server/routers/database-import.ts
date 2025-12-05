/**
 * Database Import Router
 * 
 * Permite importar dados diretamente do banco de dados legado do cliente
 * Suporta MySQL, PostgreSQL e SQL Server
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { users, tenants } from "../../drizzle/schema";
import {
  connectToDatabase,
  getTables,
  getTableColumns,
  executeQuery,
  closeConnection,
  DatabaseConfig,
} from "../external-db-connector";

export const databaseImportRouter = router({
  /**
   * Testar conexão com banco de dados externo
   */
  testConnection: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mysql", "postgresql", "mssql"]),
        host: z.string().min(1),
        port: z.number().min(1).max(65535),
        username: z.string().min(1),
        password: z.string(),
        database: z.string().min(1),
        ssl: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let connection;
      try {
        const config: DatabaseConfig = {
          type: input.type,
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          database: input.database,
          ssl: input.ssl,
        };

        connection = await connectToDatabase(config);
        
        // Tentar obter lista de tabelas para validar conexão
        const tables = await getTables(connection, input.type);

        return {
          success: true,
          message: "Conexão estabelecida com sucesso!",
          tableCount: tables.length,
          tables: tables.slice(0, 10), // Primeiras 10 tabelas
        };
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message,
          tableCount: 0,
          tables: [],
        };
      } finally {
        if (connection) {
          await closeConnection(connection, input.type);
        }
      }
    }),

  /**
   * Obter lista de tabelas do banco de dados externo
   */
  getTables: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mysql", "postgresql", "mssql"]),
        host: z.string(),
        port: z.number(),
        username: z.string(),
        password: z.string(),
        database: z.string(),
        ssl: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let connection;
      try {
        const config: DatabaseConfig = {
          type: input.type,
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          database: input.database,
          ssl: input.ssl,
        };

        connection = await connectToDatabase(config);
        const tables = await getTables(connection, input.type);

        return {
          success: true,
          tables,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          tables: [],
        };
      } finally {
        if (connection) {
          await closeConnection(connection, input.type);
        }
      }
    }),

  /**
   * Obter colunas de uma tabela específica
   */
  getTableColumns: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mysql", "postgresql", "mssql"]),
        host: z.string(),
        port: z.number(),
        username: z.string(),
        password: z.string(),
        database: z.string(),
        tableName: z.string(),
        ssl: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let connection;
      try {
        const config: DatabaseConfig = {
          type: input.type,
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          database: input.database,
          ssl: input.ssl,
        };

        connection = await connectToDatabase(config);
        const columns = await getTableColumns(connection, input.tableName, input.type);

        return {
          success: true,
          columns,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          columns: [],
        };
      } finally {
        if (connection) {
          await closeConnection(connection, input.type);
        }
      }
    }),

  /**
   * Executar query SELECT e obter preview dos dados
   */
  previewData: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mysql", "postgresql", "mssql"]),
        host: z.string(),
        port: z.number(),
        username: z.string(),
        password: z.string(),
        database: z.string(),
        query: z.string().min(1),
        ssl: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      let connection;
      try {
        const config: DatabaseConfig = {
          type: input.type,
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          database: input.database,
          ssl: input.ssl,
        };

        connection = await connectToDatabase(config);
        const result = await executeQuery(connection, input.query, input.type, 100);

        return {
          success: true,
          data: result.rows,
          columns: result.columns,
          rowCount: result.rowCount,
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          data: [],
          columns: [],
          rowCount: 0,
        };
      } finally {
        if (connection) {
          await closeConnection(connection, input.type);
        }
      }
    }),

  /**
   * Importar dados de tabela específica para CellSync
   */
  importTable: protectedProcedure
    .input(
      z.object({
        type: z.enum(["mysql", "postgresql", "mssql"]),
        host: z.string(),
        port: z.number(),
        username: z.string(),
        password: z.string(),
        database: z.string(),
        tableName: z.string(),
        targetModule: z.enum(["products", "customers", "sales", "stock"]),
        columnMapping: z.record(z.string()), // { sourceColumn: targetField }
        ssl: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let connection;
      try {
        // Verificar se usuário tem permissão
        if (!ctx.user) {
          throw new Error("Usuário não autenticado");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Conexão com banco de dados falhou");
        }

        // Obter tenant do usuário
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id));

        if (!user || !user.tenantId) {
          throw new Error("Usuário não associado a um tenant");
        }

        const config: DatabaseConfig = {
          type: input.type,
          host: input.host,
          port: input.port,
          username: input.username,
          password: input.password,
          database: input.database,
          ssl: input.ssl,
        };

        connection = await connectToDatabase(config);
        const result = await executeQuery(connection, `SELECT * FROM ${input.tableName}`, input.type, 10000);

        // Transformar dados de acordo com o mapeamento
        const transformedData = result.rows.map(row => {
          const transformed: Record<string, any> = {};
          for (const [sourceCol, targetField] of Object.entries(input.columnMapping)) {
            transformed[targetField] = row[sourceCol];
          }
          return transformed;
        });

        // Aqui você implementaria a lógica de importação específica para cada módulo
        // Por enquanto, retornamos um resumo
        return {
          success: true,
          message: `${transformedData.length} registros prontos para importar`,
          importedCount: transformedData.length,
          targetModule: input.targetModule,
          preview: transformedData.slice(0, 5),
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          importedCount: 0,
          targetModule: input.targetModule,
          preview: [],
        };
      } finally {
        if (connection) {
          await closeConnection(connection, input.type);
        }
      }
    }),
});
