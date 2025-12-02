import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { ENV } from "./_core/env";

const execAsync = promisify(exec);

export interface BackupResult {
  success: boolean;
  filename?: string;
  filePath?: string;
  fileSize?: number;
  error?: string;
  timestamp: number;
}

/**
 * Extrai informações de conexão da DATABASE_URL
 * Formato: mysql://user:password@host:port/database?ssl={"rejectUnauthorized":true}
 */
function parseDatabaseUrl(url: string) {
  try {
    const urlObj = new URL(url);
    return {
      host: urlObj.hostname,
      port: urlObj.port || "3306",
      user: urlObj.username,
      password: urlObj.password,
      database: urlObj.pathname.slice(1), // Remove leading /
    };
  } catch (error) {
    throw new Error(`Erro ao parsear DATABASE_URL: ${error}`);
  }
}

/**
 * Cria backup do banco de dados MySQL usando mysqldump
 * Retorna informações sobre o arquivo gerado
 */
export async function createDatabaseBackup(): Promise<BackupResult> {
  const timestamp = Date.now();
  const filename = `backup-${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}.sql`;
  const tempPath = path.join("/tmp", filename);

  try {
    // Parse da URL de conexão
    const dbConfig = parseDatabaseUrl(ENV.databaseUrl);

    // Comando mysqldump com SSL habilitado
    const dumpCommand = [
      "mysqldump",
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--password=${dbConfig.password}`,
      "--single-transaction", // Garante consistência
      "--quick", // Otimiza para grandes bancos
      "--lock-tables=false", // Não bloqueia tabelas
      "--ssl-mode=REQUIRED", // Força SSL
      "--set-gtid-purged=OFF", // Compatibilidade
      dbConfig.database,
    ].join(" ");

    console.log(`[Backup] Iniciando backup do banco ${dbConfig.database}...`);

    // Executa mysqldump e salva em arquivo temporário
    const { stdout, stderr } = await execAsync(`${dumpCommand} > ${tempPath}`);

    if (stderr && !stderr.includes("Warning")) {
      console.error(`[Backup] Erro no mysqldump: ${stderr}`);
      throw new Error(stderr);
    }

    // Verifica tamanho do arquivo
    const { size } = await import("fs").then((fs) =>
      fs.promises.stat(tempPath)
    );

    console.log(
      `[Backup] Backup criado com sucesso: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`
    );

    return {
      success: true,
      filename,
      filePath: tempPath,
      fileSize: size,
      timestamp,
    };
  } catch (error: any) {
    console.error(`[Backup] Erro ao criar backup:`, error);

    // Limpa arquivo temporário em caso de erro
    try {
      await unlink(tempPath);
    } catch {}

    return {
      success: false,
      error: error.message || "Erro desconhecido ao criar backup",
      timestamp,
    };
  }
}

/**
 * Limpa arquivo temporário de backup
 */
export async function cleanupTempBackup(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
    console.log(`[Backup] Arquivo temporário removido: ${filePath}`);
  } catch (error: any) {
    console.error(`[Backup] Erro ao remover arquivo temporário:`, error);
  }
}
