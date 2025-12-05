import mysql from "mysql2/promise";
import { Pool as PgPool } from "pg";
import sql from "mssql";

/**
 * External Database Connector
 * 
 * Suporta conexão a bancos de dados legados:
 * - MySQL/MariaDB
 * - PostgreSQL
 * - SQL Server
 */

export interface DatabaseConfig {
  type: "mysql" | "postgresql" | "mssql";
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

export interface QueryResult {
  rows: Record<string, any>[];
  columns: string[];
  rowCount: number;
}

/**
 * Conectar a um banco de dados externo
 */
export async function connectToDatabase(config: DatabaseConfig): Promise<any> {
  try {
    switch (config.type) {
      case "mysql":
        return await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          ssl: config.ssl ? "Amazon RDS" : undefined,
        });

      case "postgresql":
        const pgPool = new PgPool({
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          ssl: config.ssl ? { rejectUnauthorized: false } : false,
        });
        return pgPool;

      case "mssql":
        const mssqlPool = new sql.ConnectionPool({
          server: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          options: {
            encrypt: config.ssl,
            trustServerCertificate: true,
          },
        });
        return await mssqlPool.connect();

      default:
        throw new Error(`Tipo de banco de dados não suportado: ${config.type}`);
    }
  } catch (error) {
    throw new Error(`Falha ao conectar ao banco de dados: ${(error as Error).message}`);
  }
}

/**
 * Obter lista de tabelas do banco de dados
 */
export async function getTables(connection: any, dbType: "mysql" | "postgresql" | "mssql"): Promise<string[]> {
  try {
    switch (dbType) {
      case "mysql":
        const [tables] = await connection.execute(
          "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()"
        );
        return (tables as any[]).map(t => t.TABLE_NAME);

      case "postgresql":
        const pgResult = await connection.query(
          "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        return pgResult.rows.map(r => r.table_name);

      case "mssql":
        const mssqlResult = await connection.request().query(
          "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
        );
        return mssqlResult.recordset.map(r => r.TABLE_NAME);

      default:
        throw new Error(`Tipo de banco de dados não suportado: ${dbType}`);
    }
  } catch (error) {
    throw new Error(`Falha ao obter tabelas: ${(error as Error).message}`);
  }
}

/**
 * Obter informações sobre as colunas de uma tabela
 */
export async function getTableColumns(
  connection: any,
  tableName: string,
  dbType: "mysql" | "postgresql" | "mssql"
): Promise<ColumnInfo[]> {
  try {
    switch (dbType) {
      case "mysql":
        const [columns] = await connection.execute(
          `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
          [tableName]
        );
        return (columns as any[]).map(col => ({
          name: col.COLUMN_NAME,
          type: col.COLUMN_TYPE,
          nullable: col.IS_NULLABLE === "YES",
          isPrimaryKey: col.COLUMN_KEY === "PRI",
        }));

      case "postgresql":
        const pgResult = await connection.query(
          `SELECT column_name, data_type, is_nullable
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          [tableName]
        );
        return pgResult.rows.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === "YES",
          isPrimaryKey: false,
        }));

      case "mssql":
        const mssqlResult = await connection.request().query(
          `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
           FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = '${tableName}'`
        );
        return mssqlResult.recordset.map(col => ({
          name: col.COLUMN_NAME,
          type: col.DATA_TYPE,
          nullable: col.IS_NULLABLE === "YES",
          isPrimaryKey: false,
        }));

      default:
        throw new Error(`Tipo de banco de dados não suportado: ${dbType}`);
    }
  } catch (error) {
    throw new Error(`Falha ao obter colunas: ${(error as Error).message}`);
  }
}

/**
 * Executar query SELECT em banco de dados externo
 */
export async function executeQuery(
  connection: any,
  query: string,
  dbType: "mysql" | "postgresql" | "mssql",
  limit: number = 1000
): Promise<QueryResult> {
  try {
    // Adicionar LIMIT se não existir
    let finalQuery = query.trim();
    if (!finalQuery.toUpperCase().includes("LIMIT")) {
      finalQuery += ` LIMIT ${limit}`;
    }

    let rows: Record<string, any>[] = [];
    let columns: string[] = [];

    switch (dbType) {
      case "mysql":
        const [mysqlRows, fields] = await connection.execute(finalQuery);
        rows = mysqlRows as Record<string, any>[];
        columns = (fields as any[]).map(f => f.name);
        break;

      case "postgresql":
        const pgResult = await connection.query(finalQuery);
        rows = pgResult.rows;
        columns = pgResult.fields.map(f => f.name);
        break;

      case "mssql":
        const mssqlResult = await connection.request().query(finalQuery);
        rows = mssqlResult.recordset;
        columns = Object.keys(rows[0] || {});
        break;

      default:
        throw new Error(`Tipo de banco de dados não suportado: ${dbType}`);
    }

    return {
      rows,
      columns,
      rowCount: rows.length,
    };
  } catch (error) {
    throw new Error(`Falha ao executar query: ${(error as Error).message}`);
  }
}

/**
 * Fechar conexão com banco de dados externo
 */
export async function closeConnection(connection: any, dbType: "mysql" | "postgresql" | "mssql"): Promise<void> {
  try {
    switch (dbType) {
      case "mysql":
        await connection.end();
        break;

      case "postgresql":
        await connection.end();
        break;

      case "mssql":
        await connection.close();
        break;
    }
  } catch (error) {
    console.error("Erro ao fechar conexão:", error);
  }
}
