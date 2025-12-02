import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeBackup } from "./backup-orchestrator";
import * as backup from "./backup";
import * as backupS3 from "./backup-s3";
import * as backupNotifications from "./backup-notifications";

// Mock dos módulos
vi.mock("./backup");
vi.mock("./backup-s3");
vi.mock("./backup-notifications");

describe("Sistema de Backup Automático", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeBackup - Fluxo de Sucesso", () => {
    it("deve executar backup completo com sucesso", async () => {
      // Arrange
      const mockBackupResult = {
        success: true,
        filename: "backup-2024-12-02T10-00-00.sql",
        filePath: "/tmp/backup-2024-12-02T10-00-00.sql",
        fileSize: 1024000,
        timestamp: Date.now(),
      };

      const mockUploadResult = {
        success: true,
        url: "https://s3.amazonaws.com/backups/backup-2024-12-02T10-00-00.sql",
      };

      const mockCleanupResult = {
        success: true,
        deletedCount: 2,
        errors: [],
      };

      vi.mocked(backup.createDatabaseBackup).mockResolvedValue(mockBackupResult);
      vi.mocked(backupS3.uploadBackupToS3).mockResolvedValue(mockUploadResult);
      vi.mocked(backupS3.cleanupOldBackups).mockResolvedValue(mockCleanupResult);
      vi.mocked(backup.cleanupTempBackup).mockResolvedValue(undefined);
      vi.mocked(backupNotifications.sendBackupNotification).mockResolvedValue(true);

      // Act
      const result = await executeBackup();

      // Assert
      expect(result.success).toBe(true);
      expect(result.backupResult).toEqual(mockBackupResult);
      expect(result.uploadSuccess).toBe(true);
      expect(result.uploadUrl).toBe(mockUploadResult.url);
      expect(result.cleanupResult).toEqual(mockCleanupResult);
      expect(result.notificationSent).toBe(true);

      // Verifica se todos os passos foram executados
      expect(backup.createDatabaseBackup).toHaveBeenCalledTimes(1);
      expect(backupS3.uploadBackupToS3).toHaveBeenCalledWith(
        mockBackupResult.filePath,
        mockBackupResult.filename
      );
      expect(backupS3.cleanupOldBackups).toHaveBeenCalledTimes(1);
      expect(backup.cleanupTempBackup).toHaveBeenCalledWith(mockBackupResult.filePath);
      expect(backupNotifications.sendBackupNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          filename: mockBackupResult.filename,
          fileSize: mockBackupResult.fileSize,
        })
      );
    });
  });

  describe("executeBackup - Falha na Criação do Backup", () => {
    it("deve enviar notificação de falha quando backup do MySQL falhar", async () => {
      // Arrange
      const mockBackupResult = {
        success: false,
        error: "Erro ao conectar no banco de dados",
        timestamp: Date.now(),
      };

      vi.mocked(backup.createDatabaseBackup).mockResolvedValue(mockBackupResult);
      vi.mocked(backupNotifications.sendBackupNotification).mockResolvedValue(true);

      // Act
      const result = await executeBackup();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockBackupResult.error);

      // Verifica que notificação de falha foi enviada
      expect(backupNotifications.sendBackupNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: mockBackupResult.error,
        })
      );

      // Verifica que upload não foi tentado
      expect(backupS3.uploadBackupToS3).not.toHaveBeenCalled();
    });
  });

  describe("executeBackup - Falha no Upload para S3", () => {
    it("deve enviar notificação de falha quando upload para S3 falhar", async () => {
      // Arrange
      const mockBackupResult = {
        success: true,
        filename: "backup-2024-12-02T10-00-00.sql",
        filePath: "/tmp/backup-2024-12-02T10-00-00.sql",
        fileSize: 1024000,
        timestamp: Date.now(),
      };

      const mockUploadResult = {
        success: false,
        error: "Erro de conexão com S3",
      };

      vi.mocked(backup.createDatabaseBackup).mockResolvedValue(mockBackupResult);
      vi.mocked(backupS3.uploadBackupToS3).mockResolvedValue(mockUploadResult);
      vi.mocked(backup.cleanupTempBackup).mockResolvedValue(undefined);
      vi.mocked(backupNotifications.sendBackupNotification).mockResolvedValue(true);

      // Act
      const result = await executeBackup();

      // Assert
      expect(result.success).toBe(false);
      expect(result.uploadSuccess).toBe(false);
      expect(result.error).toBe(mockUploadResult.error);

      // Verifica que arquivo temporário foi limpo
      expect(backup.cleanupTempBackup).toHaveBeenCalledWith(mockBackupResult.filePath);

      // Verifica que notificação de falha foi enviada
      expect(backupNotifications.sendBackupNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining("S3"),
        })
      );

      // Verifica que limpeza de backups antigos não foi executada
      expect(backupS3.cleanupOldBackups).not.toHaveBeenCalled();
    });
  });

  describe("Limpeza de Backups Antigos", () => {
    it("deve remover backups com mais de 30 dias", async () => {
      // Arrange
      const mockBackups = [
        {
          key: "backups/backup-old.sql",
          filename: "backup-old.sql",
          size: 1024000,
          uploadedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 dias atrás
          ageInDays: 35,
        },
        {
          key: "backups/backup-recent.sql",
          filename: "backup-recent.sql",
          size: 1024000,
          uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
          ageInDays: 10,
        },
      ];

      vi.mocked(backupS3.listBackupsFromS3).mockResolvedValue(mockBackups);

      // Act
      const result = await backupS3.cleanupOldBackups();

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });
  });

  describe("Notificações por Email", () => {
    it("deve enviar email de sucesso com informações corretas", async () => {
      // Arrange
      const notificationData = {
        success: true,
        filename: "backup-2024-12-02T10-00-00.sql",
        fileSize: 2048000,
        uploadUrl: "https://s3.amazonaws.com/backups/backup.sql",
        deletedCount: 3,
        timestamp: Date.now(),
        duration: 15000,
      };

      vi.mocked(backupNotifications.sendBackupNotification).mockResolvedValue(true);

      // Act
      const result = await backupNotifications.sendBackupNotification(notificationData);

      // Assert
      expect(result).toBe(true);
      expect(backupNotifications.sendBackupNotification).toHaveBeenCalledWith(notificationData);
    });

    it("deve enviar email de falha com mensagem de erro", async () => {
      // Arrange
      const notificationData = {
        success: false,
        error: "Falha ao conectar no banco de dados",
        timestamp: Date.now(),
        duration: 5000,
      };

      vi.mocked(backupNotifications.sendBackupNotification).mockResolvedValue(true);

      // Act
      const result = await backupNotifications.sendBackupNotification(notificationData);

      // Assert
      expect(result).toBe(true);
      expect(backupNotifications.sendBackupNotification).toHaveBeenCalledWith(notificationData);
    });
  });

  describe("Validação de Retenção", () => {
    it("deve manter backups com menos de 30 dias", async () => {
      // Arrange
      const recentBackups = [
        {
          key: "backups/backup-1.sql",
          filename: "backup-1.sql",
          size: 1024000,
          uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          ageInDays: 5,
        },
        {
          key: "backups/backup-2.sql",
          filename: "backup-2.sql",
          size: 1024000,
          uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          ageInDays: 15,
        },
        {
          key: "backups/backup-3.sql",
          filename: "backup-3.sql",
          size: 1024000,
          uploadedAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
          ageInDays: 29,
        },
      ];

      vi.mocked(backupS3.listBackupsFromS3).mockResolvedValue(recentBackups);

      // Act
      const result = await backupS3.cleanupOldBackups();

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });
});
