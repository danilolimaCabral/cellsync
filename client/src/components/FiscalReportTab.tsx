import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface FiscalReportTabProps {
  startDate: Date;
  endDate: Date;
}

export default function FiscalReportTab({ startDate, endDate }: FiscalReportTabProps) {
  const { data: logs, isLoading } = trpc.fiscal.getEmissionReport.useQuery({
    startDate,
    endDate,
  });

  const exportToPDF = () => {
    if (!logs || logs.length === 0) {
      toast.error("Sem dados para exportar");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório de Notas Fiscais Emitidas", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Período: ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}`, 14, 30);

    const tableData = logs.map(log => [
      format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
      log.type.toUpperCase(),
      `${log.series}/${log.number}`,
      log.sale?.customer?.name || "Consumidor Final",
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((log.sale?.total || 0) / 100),
      log.accessKey || "-"
    ]);

    autoTable(doc, {
      head: [["Data/Hora", "Tipo", "Série/Número", "Cliente", "Valor", "Chave de Acesso"]],
      body: tableData,
      startY: 40,
    });

    doc.save(`notas-fiscais-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const exportToExcel = () => {
    if (!logs || logs.length === 0) {
      toast.error("Sem dados para exportar");
      return;
    }

    const data = logs.map(log => ({
      "Data Emissão": format(new Date(log.createdAt), "dd/MM/yyyy HH:mm"),
      "Tipo": log.type.toUpperCase(),
      "Série": log.series,
      "Número": log.number,
      "Cliente": log.sale?.customer?.name || "Consumidor Final",
      "Valor Total": (log.sale?.total || 0) / 100,
      "Chave de Acesso": log.accessKey || "",
      "URL XML": log.xmlUrl || ""
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notas Fiscais");
    XLSX.writeFile(wb, `notas-fiscais-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel exportado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-2" />
          Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Emissões</CardTitle>
          <CardDescription>
            Lista de documentos fiscais emitidos no período selecionado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Chave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell className="uppercase font-medium">{log.type}</TableCell>
                    <TableCell>{log.series}/{log.number}</TableCell>
                    <TableCell>{log.sale?.customer?.name || "Consumidor Final"}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((log.sale?.total || 0) / 100)}
                    </TableCell>
                    <TableCell className="font-mono text-xs truncate max-w-[150px]" title={log.accessKey || ""}>
                      {log.accessKey || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma nota fiscal encontrada neste período.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
