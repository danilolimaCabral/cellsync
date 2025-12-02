import { router, masterAdminProcedure } from "../_core/trpc";
import { executeBackup, listAvailableBackups } from "../backup-orchestrator";

export const backupRouter = router({
  /**
   * Executa backup manualmente (apenas master_admin)
   */
  runNow: masterAdminProcedure.mutation(async () => {
    console.log(`[Backup Router] Executando backup manual...`);
    const result = await executeBackup();
    return result;
  }),

  /**
   * Lista todos os backups disponíveis no S3 (apenas master_admin)
   */
  list: masterAdminProcedure.query(async () => {
    console.log(`[Backup Router] Listando backups disponíveis...`);
    const backups = await listAvailableBackups();
    return backups;
  }),
});
