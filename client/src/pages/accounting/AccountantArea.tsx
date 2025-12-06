import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Briefcase, FileSpreadsheet, FileText, Download, Archive } from "lucide-react";

export default function AccountantArea() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );

  const journalMutation = trpc.accountant.exportJournalCsv.useMutation({
    onSuccess: (data) => {
      downloadFile(data.csv, data.filename, 'text/csv');
      toast.success("Diário exportado com sucesso!");
    },
    onError: (error) => toast.error(`Erro ao exportar: ${error.message}`)
  });

  const trialBalanceMutation = trpc.accountant.exportTrialBalanceCsv.useMutation({
    onSuccess: (data) => {
      downloadFile(data.csv, data.filename, 'text/csv');
      toast.success("Balancete exportado com sucesso!");
    },
    onError: (error) => toast.error(`Erro ao exportar: ${error.message}`)
  });

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Área do Contador"
        description="Exporte os arquivos de fechamento mensal para sua contabilidade."
        icon={Briefcase}
      />

      <Card>
        <CardHeader>
          <CardTitle>Período de Fechamento</CardTitle>
          <CardDescription>Selecione o intervalo de datas para gerar os arquivos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Diário Contábil
            </CardTitle>
            <CardDescription>
              Lista completa de todos os lançamentos contábeis (débito e crédito) do período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => journalMutation.mutate({ startDate, endDate })}
              disabled={journalMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {journalMutation.isPending ? "Gerando..." : "Baixar CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Balancete de Verificação
            </CardTitle>
            <CardDescription>
              Resumo dos saldos de todas as contas (Ativo, Passivo, Receita, Despesa).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => trialBalanceMutation.mutate({ startDate, endDate })}
              disabled={trialBalanceMutation.isPending}
            >
              <Download className="mr-2 h-4 w-4" />
              {trialBalanceMutation.isPending ? "Gerando..." : "Baixar CSV"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Pacote de XMLs (NF-e)
            </CardTitle>
            <CardDescription>
              Arquivo ZIP contendo todos os XMLs de notas fiscais emitidas no período.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" disabled title="Em breve">
              <Download className="mr-2 h-4 w-4" />
              Baixar ZIP
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Funcionalidade em desenvolvimento.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
