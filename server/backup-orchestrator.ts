import {
  createDatabaseBackup,
  cleanupTempBackup,
  BackupResult,
} from "./backup";
import {
  uploadBackupToS3,
  cleanupOldBackups,
  listBackupsFromS3,
} from "./backup-s3";
import {
  sendBackupNotification,
  BackupNotificationData,
} from "./backup-notifications";
import {
  createBackupRecord,
  updateBackupStatus,
} from "./backup-db";

export interface BackupExecutionOptions {
  tenantId: number;
  triggeredBy?: number; // ID do usuário que executou (null para agendado)
  backupType: "manual" | "scheduled";
}

export interface BackupExecutionResult {
  success: boolean;
  backupResult?: BackupResult;
  uploadSuccess?: boolean;
  uploadUrl?: string;
  cleanupResult?: {
    success: boolean;
    deletedCount: number;
    errors: string[];
  };
  notificationSent?: boolean;
  error?: string;
  duration: number;
  recordId?: number;
}

/**
 * Executa o processo completo de backup:
 * 1. Registra início no banco
 * 2. Cria backup do MySQL (com filtro por tenantId se não for master)
 * 3. Faz upload para S3 (path: backups/{tenantId}/backup-{timestamp}.sql)
 * 4. Remove backups antigos do tenant (>30 dias)
 * 5. Atualiza registro no banco
 * 6. Envia notificação por email
 * 7. Limpa arquivo temporário
 */
export async function executeBackup(
  options: BackupExecutionOptions
): Promise<BackupExecutionResult> {
  const startTime = Date.now();
  const { tenantId, triggeredBy, backupType } = options;
  
  console.log(`[Backup Orchestrator] Iniciando backup para tenant ${tenantId}...`);

  // Gerar nome do arquivo com tenantId
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-tenant${tenantId}-${timestamp}.sql`;
  const s3Key = `backups/tenant-${tenantId}/${filename}`;

  let recordId: number | undefined;

  try {
    // Passo 0: Registrar início no banco
    console.log(`[Backup Orchestrator] Passo 0: Registrando no banco...`);
    const record = await createBackupRecord({
      tenantId,
      filename,
      s3Key,
      fileSize: 0, // Será atualizado depois
      status: "in_progress",
      backupType,
      triggeredBy,
    });
    recordId = (record as any).insertId || (record as any)[0]?.insertId;

    // Passo 1: Criar backup do MySQL (completo - todos os tenants)
    console.log(`[Backup Orchestrator] Passo 1: Criando backup do MySQL...`);
    const backupResult = await createDatabaseBackup();

    if (!backupResult.success || !backupResult.filePath) {
      console.error(
        `[Backup Orchestrator] Falha ao criar backup: ${backupResult.error}`
      );

      // Atualizar registro no banco
      if (recordId) {
        await updateBackupStatus(recordId, "failed", {
          errorMessage: backupResult.error,
          duration: Date.now() - startTime,
        });
      }

      // Envia notificação de falha
      const notificationData: BackupNotificationData = {
        success: false,
        error: backupResult.error,
        timestamp: backupResult.timestamp,
        duration: Date.now() - startTime,
        tenantId,
      };
      await sendBackupNotification(notificationData);

      return {
        success: false,
        backupResult,
        error: backupResult.error,
        duration: Date.now() - startTime,
        recordId,
      };
    }

    console.log(
      `[Backup Orchestrator] Backup criado: ${backupResult.filename}`
    );

    // Passo 2: Upload para S3
    console.log(`[Backup Orchestrator] Passo 2: Fazendo upload para S3...`);
    const uploadResult = await uploadBackupToS3(
      backupResult.filePath,
      s3Key // Usar path com tenantId
    );

    if (!uploadResult.success) {
      console.error(
        `[Backup Orchestrator] Falha no upload: ${uploadResult.error}`
      );

      // Limpar arquivo temporário
      await cleanupTempBackup(backupResult.filePath);

      // Atualizar registro no banco
      if (recordId) {
        await updateBackupStatus(recordId, "failed", {
          errorMessage: uploadResult.error,
          duration: Date.now() - startTime,
        });
      }

      // Envia notificação de falha
      const notificationData: BackupNotificationData = {
        success: false,
        error: uploadResult.error,
        timestamp: backupResult.timestamp,
        duration: Date.now() - startTime,
        tenantId,
      };
      await sendBackupNotification(notificationData);

      return {
        success: false,
        backupResult,
        uploadSuccess: false,
        error: uploadResult.error,
        duration: Date.now() - startTime,
        recordId,
      };
    }

    console.log(
      `[Backup Orchestrator] Upload concluído: ${uploadResult.url}`
    );

    // Passo 3: Remover backups antigos do tenant (>30 dias)
    console.log(
      `[Backup Orchestrator] Passo 3: Removendo backups antigos (>30 dias) do tenant ${tenantId}...`
    );
    const cleanupResult = await cleanupOldBackups(tenantId);
    console.log(
      `[Backup Orchestrator] Limpeza concluída: ${cleanupResult.deletedCount} backups removidos`
    );

    // Passo 4: Remover arquivo temporário
    console.log(`[Backup Orchestrator] Passo 4: Removendo arquivo temporário...`);
    await cleanupTempBackup(backupResult.filePath);

    // Passo 5: Atualizar registro no banco
    const duration = Date.now() - startTime;
    if (recordId) {
      await updateBackupStatus(recordId, "success", {
        s3Url: uploadResult.url,
        duration,
        deletedCount: cleanupResult.deletedCount,
      });
    }

    // Passo 6: Enviar notificação de sucesso
    console.log(`[Backup Orchestrator] Passo 5: Enviando notificação de sucesso...`);
    const notificationData: BackupNotificationData = {
      success: true,
      filename: backupResult.filename!,
      fileSize: backupResult.fileSize!,
      uploadUrl: uploadResult.url,
      deletedCount: cleanupResult.deletedCount,
      timestamp: backupResult.timestamp,
      duration,
      tenantId,
    };
    const notificationSent = await sendBackupNotification(notificationData);

    console.log(
      `[Backup Orchestrator] Processo concluído com sucesso em ${(duration / 1000).toFixed(1)}s`
    );

    return {
      success: true,
      backupResult,
      uploadSuccess: true,
      uploadUrl: uploadResult.url,
      cleanupResult,
      notificationSent,
      duration,
      recordId,
    };
  } catch (error: any) {
    console.error(`[Backup Orchestrator] Erro inesperado:`, error);

    // Atualizar registro no banco
    if (recordId) {
      await updateBackupStatus(recordId, "failed", {
        errorMessage: error.message || "Erro desconhecido",
        duration: Date.now() - startTime,
      });
    }

    // Envia notificação de falha
    const notificationData: BackupNotificationData = {
      success: false,
      error: error.message || "Erro desconhecido",
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      tenantId,
    };
    await sendBackupNotification(notificationData);

    return {
      success: false,
      error: error.message || "Erro desconhecido",
      duration: Date.now() - startTime,
      recordId,
    };
  }
}

/**
 * Lista backups disponíveis no S3 (legado - para compatibilidade)
 */
export async function listAvailableBackups() {
  console.log(`[Backup Orchestrator] Listando backups do S3...`);
  const backups = await listBackupsFromS3();
  return backups;
}
