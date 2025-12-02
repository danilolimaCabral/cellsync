import { readFile } from "fs/promises";
import { storagePut, storageList, storageDelete } from "./storage";

const BACKUP_PREFIX = "backups/";
const RETENTION_DAYS = 30;

export interface BackupInfo {
  key: string;
  filename: string;
  size: number;
  uploadedAt: Date;
  ageInDays: number;
}

/**
 * Faz upload de arquivo de backup para S3
 */
export async function uploadBackupToS3(
  filePath: string,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log(`[Backup S3] Fazendo upload de ${filename} para S3...`);

    // Lê o arquivo de backup
    const fileBuffer = await readFile(filePath);

    // Upload para S3 com prefixo "backups/"
    const s3Key = `${BACKUP_PREFIX}${filename}`;
    const result = await storagePut(s3Key, fileBuffer, "application/sql");

    console.log(
      `[Backup S3] Upload concluído: ${result.url} (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB)`
    );

    return {
      success: true,
      url: result.url,
    };
  } catch (error: any) {
    console.error(`[Backup S3] Erro ao fazer upload:`, error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao fazer upload",
    };
  }
}

/**
 * Lista todos os backups no S3
 */
export async function listBackupsFromS3(): Promise<BackupInfo[]> {
  try {
    console.log(`[Backup S3] Listando backups no S3...`);

    // Lista objetos com prefixo "backups/"
    const objects = await storageList(BACKUP_PREFIX);

    const now = Date.now();
    const backups: BackupInfo[] = objects.map((obj) => {
      const filename = obj.key.replace(BACKUP_PREFIX, "");
      const uploadedAt = obj.lastModified || new Date();
      const ageInDays = Math.floor(
        (now - uploadedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        key: obj.key,
        filename,
        size: obj.size || 0,
        uploadedAt,
        ageInDays,
      };
    });

    console.log(`[Backup S3] Encontrados ${backups.length} backups`);

    return backups.sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  } catch (error: any) {
    console.error(`[Backup S3] Erro ao listar backups:`, error);
    return [];
  }
}

/**
 * Remove backups com mais de 30 dias
 */
export async function cleanupOldBackups(tenantId?: number): Promise<{
  success: boolean;
  deletedCount: number;
  errors: string[];
}> {
  try {
    console.log(
      `[Backup S3] Iniciando limpeza de backups com mais de ${RETENTION_DAYS} dias...`
    );

    const backups = await listBackupsFromS3();
    const oldBackups = backups.filter(
      (backup) => backup.ageInDays > RETENTION_DAYS
    );

    if (oldBackups.length === 0) {
      console.log(`[Backup S3] Nenhum backup antigo para remover`);
      return {
        success: true,
        deletedCount: 0,
        errors: [],
      };
    }

    console.log(
      `[Backup S3] Encontrados ${oldBackups.length} backups para remover`
    );

    const errors: string[] = [];
    let deletedCount = 0;

    for (const backup of oldBackups) {
      try {
        await storageDelete(backup.key);
        console.log(
          `[Backup S3] Removido: ${backup.filename} (${backup.ageInDays} dias)`
        );
        deletedCount++;
      } catch (error: any) {
        const errorMsg = `Erro ao remover ${backup.filename}: ${error.message}`;
        console.error(`[Backup S3] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(
      `[Backup S3] Limpeza concluída: ${deletedCount} backups removidos`
    );

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  } catch (error: any) {
    console.error(`[Backup S3] Erro na limpeza de backups:`, error);
    return {
      success: false,
      deletedCount: 0,
      errors: [error.message || "Erro desconhecido"],
    };
  }
}

/**
 * Remove um backup específico do S3
 */
export async function deleteBackupFromS3(
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `${BACKUP_PREFIX}${filename}`;
    await storageDelete(key);
    console.log(`[Backup S3] Backup removido: ${filename}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[Backup S3] Erro ao remover backup:`, error);
    return {
      success: false,
      error: error.message || "Erro desconhecido",
    };
  }
}
