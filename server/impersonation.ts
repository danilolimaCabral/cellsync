import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

/**
 * Create an impersonation token for a master admin to assume a client's identity
 * This allows admins to perform maintenance operations as if they were a client user
 */
export async function createImpersonationToken(
  masterAdminId: number,
  targetTenantId: number,
  targetUserId?: number
): Promise<{ token: string; expiresIn: number }> {
  try {
    // Get tenant and user info from database
    const { getDb } = await import('./db');
    const database = await getDb();
    
    if (!database) {
      throw new Error('Failed to connect to database');
    }

    // Verify tenant exists
    const { tenants, users } = await import('../drizzle/schema');
    const tenantRecord = await database
      .select()
      .from(tenants)
      .where((t: any) => t.id === targetTenantId)
      .limit(1);

    if (!tenantRecord || tenantRecord.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    const tenant = tenantRecord[0];

    // If no specific user provided, get the first admin of the tenant
    let userRecord = null;
    if (targetUserId) {
      const userResult = await database
        .select()
        .from(users)
        .where((u: any) => u.id === targetUserId && u.tenantId === targetTenantId)
        .limit(1);
      userRecord = userResult[0];
    } else {
      // Get first admin user of the tenant
      const adminResult = await database
        .select()
        .from(users)
        .where((u: any) => u.tenantId === targetTenantId && u.role === 'admin')
        .limit(1);
      userRecord = adminResult[0];
    }

    if (!userRecord) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No user found for this tenant',
      });
    }

    // Create impersonation token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = 3600; // 1 hour
    
    const token = jwt.sign(
      {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        tenantId: targetTenantId,
        role: userRecord.role,
        impersonatedBy: masterAdminId, // Track who created this impersonation
        impersonationToken: true, // Mark as impersonation token
      },
      jwtSecret,
      { expiresIn }
    );

    // Log the impersonation for audit purposes
    console.log('[Impersonation] Master admin', masterAdminId, 'impersonating user', userRecord.id, 'of tenant', targetTenantId);

    return {
      token,
      expiresIn,
    };
  } catch (error: any) {
    console.error('[Impersonation] Error creating token:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to create impersonation token: ${error.message}`,
    });
  }
}

/**
 * Verify that a token is an impersonation token
 */
export function isImpersonationToken(decodedToken: any): boolean {
  return decodedToken?.impersonationToken === true;
}

/**
 * Get the master admin who created this impersonation
 */
export function getImpersonatorId(decodedToken: any): number | null {
  return decodedToken?.impersonatedBy || null;
}
