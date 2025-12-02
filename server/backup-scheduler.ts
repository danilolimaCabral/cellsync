import * as cron from "node-cron";
import { executeBackup } from "./backup-orchestrator";

/**
 * Configura agendamento de backup diário às 3h AM
 * Cron expression: "0 3 * * *" = minuto 0, hora 3, todos os dias
 */
export function setupBackupScheduler() {
  // Valida a expressão cron antes de agendar
  if (!cron.validate("0 3 * * *")) {
    console.error(
      "[Backup Scheduler] Expressão cron inválida! Backup não será agendado."
    );
    return;
  }

  // Agenda backup diário às 3h AM (horário do servidor)
  const task = cron.schedule(
    "0 3 * * *",
    async () => {
      console.log(
        `[Backup Scheduler] Iniciando backup agendado às ${new Date().toLocaleString("pt-BR")}`
      );

      try {
        // Backup do tenant master (id=1) - contém todos os dados
        const result = await executeBackup({
          tenantId: 1,
          backupType: "scheduled",
        });

        if (result.success) {
          console.log(
            `[Backup Scheduler] Backup agendado concluído com sucesso em ${(result.duration / 1000).toFixed(1)}s`
          );
        } else {
          console.error(
            `[Backup Scheduler] Backup agendado falhou: ${result.error}`
          );
        }
      } catch (error: any) {
        console.error(
          `[Backup Scheduler] Erro inesperado no backup agendado:`,
          error
        );
      }
    }
  );

  console.log(
    `[Backup Scheduler] ✅ Backup agendado para executar diariamente às 3h AM (horário de Brasília)`
  );

  return task;
}

/**
 * Para o agendamento de backup (útil para testes ou manutenção)
 */
export function stopBackupScheduler(task: any) {
  if (task) {
    task.stop();
    console.log(`[Backup Scheduler] ⏸️ Agendamento de backup pausado`);
  }
}
