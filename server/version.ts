import fs from 'fs';
import path from 'path';

export interface VersionInfo {
  commit: string;
  timestamp: string;
  message: string;
  formattedDate: string;
}

export function getVersionInfo(): VersionInfo {
  try {
    const versionFile = path.join(process.cwd(), '.version');
    const content = fs.readFileSync(versionFile, 'utf-8').trim();
    const lines = content.split('\n');
    
    const commit = lines[0] || 'unknown';
    const timestamp = lines[1] || new Date().toISOString();
    const message = lines[2] || 'No message';
    
    // Format timestamp to Brazilian locale
    const date = new Date(timestamp);
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
    
    return {
      commit: commit.substring(0, 7),
      timestamp,
      message,
      formattedDate,
    };
  } catch (error) {
    console.error('Error reading version info:', error);
    return {
      commit: 'unknown',
      timestamp: new Date().toISOString(),
      message: 'Development version',
      formattedDate: new Date().toLocaleDateString('pt-BR'),
    };
  }
}
