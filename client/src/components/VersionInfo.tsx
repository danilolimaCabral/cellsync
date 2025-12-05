import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { GitCommit, Clock } from 'lucide-react';

export function VersionInfo() {
  const { data: versionInfo, isLoading } = trpc.version.info.useQuery();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || !versionInfo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <GitCommit className="w-3 h-3" />
        <span>Versão: <Badge variant="outline" className="ml-1">{versionInfo.commit}</Badge></span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3" />
        <span>Última atualização: <Badge variant="outline" className="ml-1">{versionInfo.formattedDate}</Badge></span>
      </div>
      {versionInfo.message && (
        <div className="text-xs text-muted-foreground italic">
          "{versionInfo.message}"
        </div>
      )}
    </div>
  );
}
