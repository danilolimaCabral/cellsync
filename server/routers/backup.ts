import { router, masterAdminProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { executeBackup, listAvailableBackups } from "../backup-orchestrator";
import { 
  listBackupsByTenant, 
  listAllBackups, 
  getBackupStats 
} from "../backup-db";

export const backupRouter = router({
  /**
   * Executa backup manualmente
   * - master_admin: backup completo do sistema
   * - outros usuários: backup apenas do seu tenant
   */
  runNow: protectedProcedure
    .input(z.object({
      tenantId: z.number().optional(), // Opcional: master_admin pode especificar tenant
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const isMasterAdmin = user.role === "master_admin";
      
      // Determinar qual tenant fazer backup
      let targetTenantId = user.tenantId;
      if (isMasterAdmin && input?.tenantId) {
        targetTenantId = input.tenantId;
      }
      
      console.log(`[Backup Router] Executando backup manual para tenant ${targetTenantId}...`);
      
      const result = await executeBackup({
        tenantId: targetTenantId,
        triggeredBy: user.id,
        backupType: "manual",
      });
      
      return result;
    }),

  /**
   * Lista backups do tenant atual
   * - master_admin pode ver todos os backups
   * - outros usuários veem apenas backups do seu tenant
   */
  list: protectedProcedure
    .input(z.object({
      tenantId: z.number().optional(),
      daysAgo: z.number().default(90),
      limit: z.number().default(100),
    }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      const isMasterAdmin = user.role === "master_admin";
      
      // Se master_admin e não especificou tenant, lista todos
      if (isMasterAdmin && !input?.tenantId) {
        console.log(`[Backup Router] Master admin listando todos os backups...`);
        const backups = await listAllBackups({
          daysAgo: input?.daysAgo,
          limit: input?.limit,
        });
        return backups;
      }
      
      // Determinar qual tenant listar
      const targetTenantId = (isMasterAdmin && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;
      
      console.log(`[Backup Router] Listando backups do tenant ${targetTenantId}...`);
      const backups = await listBackupsByTenant(targetTenantId, {
        daysAgo: input?.daysAgo,
        limit: input?.limit,
      });
      
      return backups;
    }),

  /**
   * Lista backups disponíveis no S3 (legado - apenas master_admin)
   */
  listS3: masterAdminProcedure.query(async () => {
    console.log(`[Backup Router] Listando backups do S3...`);
    const backups = await listAvailableBackups();
    return backups;
  }),

  /**
   * Obtém estatísticas de backups
   */
  stats: protectedProcedure
    .input(z.object({
      tenantId: z.number().optional(),
      daysAgo: z.number().default(30),
    }).optional())
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      const isMasterAdmin = user.role === "master_admin";
      
      // Determinar qual tenant obter stats
      const targetTenantId = (isMasterAdmin && input?.tenantId) 
        ? input.tenantId 
        : user.tenantId;
      
      console.log(`[Backup Router] Obtendo estatísticas do tenant ${targetTenantId}...`);
      const stats = await getBackupStats(targetTenantId, input?.daysAgo);
      
      return stats;
    }),
});
