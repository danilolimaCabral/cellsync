import mysql from 'mysql2/promise';
import { TRPCError } from '@trpc/server';

/**
 * Execute a query on a specific tenant's database
 * This is for admin/maintenance purposes only
 */
export async function executeAdminQuery(
  tenantId: number,
  query: string,
  params?: any[]
): Promise<any> {
  try {
    // Get tenant database connection info
    const { getDb } = await import('./db');
    const database = await getDb();
    
    if (!database) {
      throw new Error('Failed to connect to master database');
    }

    // Fetch tenant's database credentials from master database
    const { tenants } = await import('../drizzle/schema');
    const tenantRecord = await database
      .select()
      .from(tenants)
      .where((t: any) => t.id === tenantId)
      .limit(1);

    if (!tenantRecord || tenantRecord.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    const tenant = tenantRecord[0];

    // Parse database connection info from tenant record
    // Assuming the tenant has dbHost, dbPort, dbName, dbUser, dbPassword fields
    // If not stored, use environment variables as fallback
    const dbConfig = {
      host: tenant.dbHost || process.env.DB_HOST || 'localhost',
      port: tenant.dbPort || parseInt(process.env.DB_PORT || '3306'),
      database: tenant.dbName || `cellsync_tenant_${tenantId}`,
      user: tenant.dbUser || process.env.DB_USER || 'root',
      password: tenant.dbPassword || process.env.DB_PASSWORD || '',
    };

    // Create connection to tenant's database
    const connection = await mysql.createConnection(dbConfig);

    try {
      // Execute the query
      const [results] = await connection.execute(query, params || []);
      return results;
    } finally {
      await connection.end();
    }
  } catch (error: any) {
    console.error('[DB Admin] Error executing query:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Database error: ${error.message}`,
    });
  }
}

/**
 * Get table structure for a tenant's database
 */
export async function getTableStructure(
  tenantId: number,
  tableName: string
): Promise<any> {
  const query = `DESCRIBE ${tableName}`;
  return executeAdminQuery(tenantId, query);
}

/**
 * Get list of tables in a tenant's database
 */
export async function listTables(tenantId: number): Promise<any> {
  const query = 'SHOW TABLES';
  return executeAdminQuery(tenantId, query);
}

/**
 * Get row count for a table
 */
export async function getTableRowCount(
  tenantId: number,
  tableName: string
): Promise<number> {
  const query = `SELECT COUNT(*) as count FROM ${tableName}`;
  const results = await executeAdminQuery(tenantId, query);
  return results[0]?.count || 0;
}

/**
 * Get sample data from a table
 */
export async function getTableData(
  tenantId: number,
  tableName: string,
  limit: number = 100,
  offset: number = 0
): Promise<any> {
  const query = `SELECT * FROM ${tableName} LIMIT ? OFFSET ?`;
  return executeAdminQuery(tenantId, query, [limit, offset]);
}

/**
 * Execute a safe SELECT query (read-only)
 */
export async function executeSafeQuery(
  tenantId: number,
  query: string,
  params?: any[]
): Promise<any> {
  // Only allow SELECT queries for safety
  const trimmedQuery = query.trim().toUpperCase();
  if (!trimmedQuery.startsWith('SELECT')) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Only SELECT queries are allowed for safety',
    });
  }

  return executeAdminQuery(tenantId, query, params);
}
