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
}

/**
 * Executa o processo completo de backup:
 * 1. Cria backup do MySQL
 * 2. Faz upload para S3
 * 3. Remove backups antigos (>30 dias)
 * 4. Envia notificação por email
 * 5. Limpa arquivo temporário
 */
export async function executeBackup(): Promise<BackupExecutionResult> {
  const startTime = Date.now();
  console.log(`[Backup Orchestrator] Iniciando processo de backup...`);

  try {
    // Passo 1: Criar backup do MySQL
    console.log(`[Backup Orchestrator] Passo 1: Criando backup do MySQL...`);
    const backupResult = await createDatabaseBackup();

    if (!backupResult.success || !backupResult.filePath) {
      console.error(
        `[Backup Orchestrator] Falha ao criar backup: ${backupResult.error}`
      );

      // Envia notificação de falha
      const notificationData: BackupNotificationData = {
        success: false,
        error: backupResult.error,
        timestamp: backupResult.timestamp,
        duration: Date.now() - startTime,
      };
      await sendBackupNotification(notificationData);

      return {
        success: false,
        backupResult,
        error: backupResult.error,
        duration: Date.now() - startTime,
      };
    }

    console.log(
      `[Backup Orchestrator] Backup criado: ${backupResult.filename}`
    );

    // Passo 2: Upload para S3
    console.log(`[Backup Orchestrator] Passo 2: Fazendo upload para S3...`);
    const uploadResult = await uploadBackupToS3(
      backupResult.filePath,
      backupResult.filename!
    );

    if (!uploadResult.success) {
      console.error(
        `[Backup Orchestrator] Falha no upload: ${uploadResult.error}`
      );

      // Limpa arquivo temporário
      await cleanupTempBackup(backupResult.filePath);

      // Envia notificação de falha
      const notificationData: BackupNotificationData = {
        success: false,
        error: `Falha no upload para S3: ${uploadResult.error}`,
        timestamp: backupResult.timestamp,
        duration: Date.now() - startTime,
      };
      await sendBackupNotification(notificationData);

      return {
        success: false,
        backupResult,
        uploadSuccess: false,
        error: uploadResult.error,
        duration: Date.now() - startTime,
      };
    }

    console.log(`[Backup Orchestrator] Upload concluído: ${uploadResult.url}`);

    // Passo 3: Limpar backups antigos
    console.log(
      `[Backup Orchestrator] Passo 3: Removendo backups antigos (>30 dias)...`
    );
    const cleanupResult = await cleanupOldBackups();
    console.log(
      `[Backup Orchestrator] Limpeza concluída: ${cleanupResult.deletedCount} backups removidos`
    );

    // Passo 4: Limpar arquivo temporário
    console.log(
      `[Backup Orchestrator] Passo 4: Removendo arquivo temporário...`
    );
    await cleanupTempBackup(backupResult.filePath);

    // Passo 5: Enviar notificação de sucesso
    console.log(
      `[Backup Orchestrator] Passo 5: Enviando notificação de sucesso...`
    );
    const notificationData: BackupNotificationData = {
      success: true,
      filename: backupResult.filename,
      fileSize: backupResult.fileSize,
      uploadUrl: uploadResult.url,
      deletedCount: cleanupResult.deletedCount,
      timestamp: backupResult.timestamp,
      duration: Date.now() - startTime,
    };
    const notificationSent = await sendBackupNotification(notificationData);

    const duration = Date.now() - startTime;
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
    };
  } catch (error: any) {
    console.error(`[Backup Orchestrator] Erro inesperado:`, error);

    // Envia notificação de falha
    const notificationData: BackupNotificationData = {
      success: false,
      error: error.message || "Erro inesperado durante o backup",
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    };
    await sendBackupNotification(notificationData);

    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Lista todos os backups disponíveis no S3
 */
export async function listAvailableBackups() {
  return await listBackupsFromS3();
}
